import { neon } from "@neondatabase/serverless";

function sql() {
  if (!process.env.DATABASE_URL) {
    throw new Error("Falta la variable de entorno DATABASE_URL");
  }
  return neon(process.env.DATABASE_URL);
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
  return rows[0] as { chat_id: string; borrador: BorradorMovimiento; pregunta_pendiente: string } | undefined;
}

export async function guardarConversacionPendiente(
  chatId: string,
  borrador: BorradorMovimiento,
  preguntaPendiente: string
) {
  const db = sql();
  await db`
    INSERT INTO conversaciones_pendientes (chat_id, borrador, pregunta_pendiente, actualizado_en)
    VALUES (${chatId}, ${JSON.stringify(borrador)}, ${preguntaPendiente}, now())
    ON CONFLICT (chat_id)
    DO UPDATE SET borrador = ${JSON.stringify(borrador)}, pregunta_pendiente = ${preguntaPendiente}, actualizado_en = now()
  `;
}

export async function borrarConversacionPendiente(chatId: string) {
  const db = sql();
  await db`DELETE FROM conversaciones_pendientes WHERE chat_id = ${chatId}`;
}
