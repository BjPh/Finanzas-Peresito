-- Ejecutar contra la base Neon conectada al proyecto de Vercel.

CREATE TABLE IF NOT EXISTS movimientos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha TIMESTAMPTZ NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('ingreso', 'gasto')),
  cuenta TEXT NOT NULL CHECK (cuenta IN ('Personal', 'Negocio')),
  categoria TEXT NOT NULL,
  subcategoria TEXT,
  monto NUMERIC NOT NULL CHECK (monto > 0),
  descripcion TEXT NOT NULL,
  fuente TEXT NOT NULL CHECK (fuente IN ('telegram_texto', 'telegram_audio')),
  estado TEXT CHECK (estado IN ('cancelled', 'could cancel')),
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_movimientos_fecha ON movimientos (fecha);
CREATE INDEX IF NOT EXISTS idx_movimientos_cuenta ON movimientos (cuenta);

CREATE TABLE IF NOT EXISTS conversaciones_pendientes (
  chat_id TEXT PRIMARY KEY,
  borrador JSONB NOT NULL DEFAULT '{}'::jsonb,
  pregunta_pendiente TEXT NOT NULL,
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);
