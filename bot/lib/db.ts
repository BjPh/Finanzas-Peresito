import postgres from "postgres";

let cliente: ReturnType<typeof postgres> | undefined;

// La integración de Supabase con Vercel nombra la connection string con un
// prefijo propio (ej. DATABASE_POSTGRES_URL) en vez de DATABASE_URL a secas.
// Se prueban los nombres más comunes en orden de preferencia (pooling primero).
function connectionString(): string {
  const candidatos = [
    "DATABASE_URL",
    "DATABASE_POSTGRES_URL",
    "POSTGRES_URL",
    "DATABASE_POSTGRES_URL_NON_POOLING",
    "POSTGRES_URL_NON_POOLING",
  ];
  for (const nombre of candidatos) {
    if (process.env[nombre]) return process.env[nombre]!;
  }
  throw new Error(
    `No se encontró la connection string de la base de datos. Probé: ${candidatos.join(", ")}`
  );
}

function sql() {
  if (!cliente) {
    cliente = postgres(connectionString(), { ssl: "require" });
  }
  return cliente;
}

export type Tipo = "ingreso" | "gasto";
export type Cuenta = "Personal" | "Negocio";
export type Estado = "cancelled" | "could cancel" | null;

export interface Movimiento {
  id?: string;
  fecha: string; // ISO
  tipo: Tipo;
  cuenta: Cuenta;
  categoria: string;
  subcategoria: string | null;
  monto: number;
  descripcion: string;
  fuente: "telegram_texto" | "telegram_audio";
  estado?: Estado;
}

export interface BorradorMovimiento {
  tipo?: Tipo;
  cuenta?: Cuenta;
  categoria?: string;
  subcategoria?: string | null;
  monto?: number;
  descripcion?: string;
  fuente?: "telegram_texto" | "telegram_audio";
}

export async function insertMovimiento(m: Movimiento) {
  const db = sql();
  const rows = await db`
    INSERT INTO movimientos (fecha, tipo, cuenta, categoria, subcategoria, monto, descripcion, fuente)
    VALUES (${m.fecha}, ${m.tipo}, ${m.cuenta}, ${m.categoria}, ${m.subcategoria}, ${m.monto}, ${m.descripcion}, ${m.fuente})
    RETURNING id, fecha, tipo, cuenta, categoria, subcategoria, monto, descripcion, fuente, estado, creado_en
  `;
  return rows[0];
}

export async function getMovimientos(filtros: { mes?: string; cuenta?: string; categoria?: string } = {}) {
  const db = sql();
  const rows = await db`
    SELECT id, fecha, tipo, cuenta, categoria, subcategoria, monto, descripcion, fuente, estado, creado_en
    FROM movimientos
    WHERE (${filtros.mes ?? null}::text IS NULL OR to_char(fecha, 'YYYY-MM') = ${filtros.mes ?? null})
      AND (${filtros.cuenta ?? null}::text IS NULL OR cuenta = ${filtros.cuenta ?? null})
      AND (${filtros.categoria ?? null}::text IS NULL OR categoria = ${filtros.categoria ?? null})
    ORDER BY fecha DESC
  `;
  return rows;
}

export async function getConversacionPendiente(chatId: string) {
  const db = sql();
  const rows = await db`
    SELECT chat_id, borrador, pregunta_pendiente, actualizado_en
    FROM conversaciones_pendientes
    WHERE chat_id = ${chatId}
  `;
  const fila = rows[0] as { chat_id: string; borrador: BorradorMovimiento | string; pregunta_pendiente: string } | undefined;
  if (!fila) return undefined;
  const borrador = typeof fila.borrador === "string" ? JSON.parse(fila.borrador) : fila.borrador;
  return { ...fila, borrador } as { chat_id: string; borrador: BorradorMovimiento; pregunta_pendiente: string };
}

export async function guardarConversacionPendiente(
  chatId: string,
  borrador: BorradorMovimiento,
  preguntaPendiente: string
) {
  const db = sql();
  await db`
    INSERT INTO conversaciones_pendientes (chat_id, borrador, pregunta_pendiente, actualizado_en)
    VALUES (${chatId}, ${JSON.stringify(borrador)}::jsonb, ${preguntaPendiente}, now())
    ON CONFLICT (chat_id)
    DO UPDATE SET borrador = ${JSON.stringify(borrador)}::jsonb, pregunta_pendiente = ${preguntaPendiente}, actualizado_en = now()
  `;
}

export async function borrarConversacionPendiente(chatId: string) {
  const db = sql();
  await db`DELETE FROM conversaciones_pendientes WHERE chat_id = ${chatId}`;
}
