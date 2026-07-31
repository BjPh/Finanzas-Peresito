# Bot de Finanzas (Telegram → Vercel → Supabase)

> Proyecto de Vercel: Root Directory = `bot`, Production Branch = `claude/finance-dashboard-setup-p9eo14`.

Recibe mensajes de texto o audio por Telegram, los interpreta como movimientos financieros (ingreso/gasto, cuenta, categoría, monto, descripción) y los guarda en una base de datos Postgres (Supabase), para que el dashboard los muestre en vivo.

## Variables de entorno (configurar en Vercel, nunca commitear)

Ver `.env.example`:
- `TELEGRAM_BOT_TOKEN` — token del bot, obtenido de @BotFather.
- `GROQ_API_KEY` — un solo proveedor de IA para todo: transcribe audios con Whisper y también interpreta el texto para estructurar el movimiento (tool calling con Llama 3.3).
- `DATABASE_URL` — connection string de Supabase. La integración de Vercel puede crear la variable con otro nombre (ej. `POSTGRES_URL`); si es así, agregar manualmente `DATABASE_URL` con el mismo valor, o usar el "Connection Pooling" string de Supabase (Settings → Database → Connection string → modo "Transaction").

## Base de datos

Correr `db/migration.sql` contra la base Supabase conectada al proyecto.

## Endpoints

- `POST /api/webhook` — webhook de Telegram. Registrar con:
  `https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<tu-proyecto>.vercel.app/api/webhook`
- `GET /api/movimientos?mes=YYYY-MM&cuenta=Personal|Negocio&categoria=...` — devuelve los movimientos guardados, para que el dashboard los consuma.

## Comportamiento

- Si falta algún dato (monto, categoría, tipo, cuenta, descripción), el bot repregunta por Telegram hasta completar el movimiento antes de guardarlo (ver `conversaciones_pendientes`).
- Las categorías están sincronizadas con las del dashboard en `lib/categorias.ts` — si cambian ahí, actualizar también `Finanzas/Dashboard de Finanzas.html`.
