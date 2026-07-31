import Anthropic from "@anthropic-ai/sdk";
import { CATEGORIAS, categoriaValida, subcategoriaValida } from "./categorias.js";
import type { BorradorMovimiento } from "./db.js";

const CAMPOS_REQUERIDOS = ["tipo", "cuenta", "categoria", "monto", "descripcion"] as const;

function anthropic() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("Falta la variable de entorno ANTHROPIC_API_KEY");
  }
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

const CATEGORIAS_DESC = CATEGORIAS.map(
  (c) => `- ${c.nombre} (${c.tipo}${c.subs.length ? `, subcategorías: ${c.subs.join(", ")}` : ""})`
).join("\n");

const TOOL = {
  name: "extraer_movimiento",
  description: "Extrae los campos de un movimiento financiero a partir de un mensaje en español, completando sobre un borrador previo si existe.",
  input_schema: {
    type: "object" as const,
    properties: {
      tipo: { type: "string", enum: ["ingreso", "gasto"], description: "Si falta o no se puede inferir, omitir." },
      cuenta: { type: "string", enum: ["Personal", "Negocio"], description: "Si falta o no se puede inferir, omitir." },
      categoria: { type: "string", description: "Debe ser una de las categorías definidas. Si falta, omitir." },
      subcategoria: { type: "string", description: "Solo si la categoría tiene subcategorías y el usuario la mencionó." },
      monto: { type: "number", description: "Monto en pesos, siempre positivo. Si falta, omitir." },
      descripcion: { type: "string", description: "Breve descripción de qué fue el movimiento." },
    },
  },
};

export interface ResultadoParse {
  completo: boolean;
  borrador: BorradorMovimiento;
  preguntaSiguiente?: string;
}

export async function parsearMovimiento(
  textoUsuario: string,
  borradorPrevio: BorradorMovimiento = {}
): Promise<ResultadoParse> {
  const client = anthropic();

  const system = `Sos un asistente que ayuda a cargar movimientos financieros (ingresos y gastos) a partir de mensajes en español informal, para una persona con finanzas personales y de negocio combinadas.

Categorías válidas (usar el nombre exacto):
${CATEGORIAS_DESC}

Ya hay datos parciales de este movimiento (puede estar vacío):
${JSON.stringify(borradorPrevio)}

El mensaje nuevo del usuario puede ser: (a) la descripción completa de un movimiento nuevo, o (b) la respuesta a un dato puntual que faltaba (ej. si preguntaste el monto, el usuario puede responder solo "3000").
Combiná el borrador previo con lo que se pueda extraer del mensaje nuevo y llamá a la herramienta extraer_movimiento con TODOS los campos que ya se conocen (los previos + los nuevos), no solo los nuevos.
Si el usuario no aclara cuenta (Personal/Negocio), inferila por la categoría (Negocio-Ingresos/Negocio-Gastos → Negocio; el resto → Personal) salvo que el texto diga explícitamente lo contrario.
No inventes montos ni categorías que no estén en el mensaje ni en el borrador.`;

  const resp = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 512,
    system,
    tools: [TOOL],
    tool_choice: { type: "tool", name: "extraer_movimiento" },
    messages: [{ role: "user", content: textoUsuario }],
  });

  const toolUse = resp.content.find((b) => b.type === "tool_use");
  const extraido = (toolUse && "input" in toolUse ? toolUse.input : {}) as BorradorMovimiento;

  const borrador: BorradorMovimiento = { ...borradorPrevio, ...extraido };

  // Validar categoría/subcategoría contra la lista real.
  if (borrador.categoria && !categoriaValida(borrador.categoria)) {
    borrador.categoria = undefined;
  }
  if (
    borrador.categoria &&
    borrador.subcategoria &&
    !subcategoriaValida(borrador.categoria, borrador.subcategoria)
  ) {
    borrador.subcategoria = undefined;
  }

  const faltante = CAMPOS_REQUERIDOS.find((campo) => !(borrador as any)[campo]);

  if (!faltante) {
    return { completo: true, borrador };
  }

  const preguntas: Record<string, string> = {
    tipo: "¿Es un ingreso o un gasto?",
    cuenta: "¿Es personal o del negocio?",
    categoria: `¿A qué categoría pertenece? Opciones: ${CATEGORIAS.map((c) => c.nombre).join(", ")}.`,
    monto: "¿De cuánto fue el monto?",
    descripcion: "¿Me contás brevemente de qué fue este movimiento?",
  };

  return { completo: false, borrador, preguntaSiguiente: preguntas[faltante] };
}
