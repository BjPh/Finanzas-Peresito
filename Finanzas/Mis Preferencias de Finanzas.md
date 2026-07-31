# Mis Preferencias de Finanzas

## Ubicación de la carpeta de finanzas
`Finanzas-Peresito/Finanzas/`

- CSVs guardados en: `Finanzas-Peresito/Finanzas/csvs/`
- Overrides (marcas de estado + categorías editadas): `Finanzas-Peresito/Finanzas/overrides.json`
- Dashboard standalone: `Finanzas-Peresito/Finanzas/Dashboard de Finanzas.html`

## Tipo de dashboard
Personal y de Negocio combinados en un mismo dashboard (no separados).

## Estado de los datos
Todavía no se cargó ningún CSV. El dashboard arranca vacío/plantilla, listo para recibir transacciones reales más adelante. Cuando se agreguen CSVs a la carpeta `csvs/`, pedirle a Claude que reconstruya el dashboard con esos datos.

## Categorías (con subcategorías)

- **Vivienda**: Servicios, Alquiler, Limpieza, Reparaciones
- **Comida**: (sin subcategorías)
- **Salud**: (sin subcategorías)
- **Mascotas**: (sin subcategorías)
- **Transferencias**: Padres, Amigos, Otros (transferencias recibidas, personal)
- **Negocio-Ingresos**: Transferencia (Cliente y Peya), Propinas, Adelantos
- **Negocio-Gastos**: Servicios, Reparaciones, Combustible, Viático, Transferencia Pago46

## Metas

- **Impuestos**: NO es un porcentaje fijo. Es un **monto fijo en pesos, definido mes a mes** por el usuario (se carga manualmente cada mes en la pestaña Metas del dashboard).
- **Diezmo / donación**: Sin usar — eliminado del dashboard a pedido del usuario.
- **Ahorro**: 20% por defecto, pero configurable en el dashboard (pestaña Metas) como **porcentaje de ingresos** o como **monto fijo en pesos**, según lo que el usuario elija cada mes.

## Formato de `overrides.json`

No hay CSVs cargados todavía, así que este archivo aún no existe. Cuando el usuario lo exporte desde la pestaña Transacciones, va a tener esta forma:

```json
{
  "statusMarks": {
    "<idTransacción>": "cancelled" | "could cancel"
  },
  "categoryOverrides": {
    "<idTransacción>": { "category": "Vivienda", "subcategory": "Alquiler" }
  }
}
```

Las claves internas (`statusMarks`, `categoryOverrides`, `cancelled`, `could cancel`) quedan en inglés por ser un contrato técnico de datos, pero el dashboard siempre las muestra en español ("Cancelada" / "Se podría cancelar").

## Bot de Telegram (carga de movimientos por chat/audio)

- Código en `Finanzas-Peresito/bot/` (proyecto Vercel aparte, mismo repo).
- Arquitectura: Telegram → webhook en Vercel → si es audio, se transcribe con **Groq (Whisper)**; el texto se interpreta con **Groq (Llama 3.3, tool calling)** para sacar tipo/cuenta/categoría/monto/descripción. Si falta un dato, el bot **repregunta por Telegram** hasta completarlo (no se decidió usar Anthropic para esto — un solo proveedor de IA, Groq, para todo).
- Se guarda en Postgres (**Supabase**, conectado vía integración de Vercel — se eligió sobre Neon por más espacio en el plan gratis).
- El dashboard va a consumir `/api/movimientos` para mostrar datos en vivo (pendiente de conectar).
- Variables de entorno en Vercel: `TELEGRAM_BOT_TOKEN`, `GROQ_API_KEY`, `DATABASE_URL` — nunca en el repo.
- El proyecto de Vercel se está desplegando en la cuenta de un tercero (amigo del usuario), usando este repo público como fuente.
- Pendiente: separar el dashboard en pestañas **Personal** y **Trabajo**, con un **Resumen** que tenga un selector Total/Personal/Trabajo para ver el neto de cada área (pedido explícito del usuario, todavía no implementado en el HTML).

## Historial
- 2026-07-31: Configuración inicial. Carpeta creada, categorías y metas definidas. Dashboard construido en estado vacío/plantilla (sin transacciones reales).
- 2026-07-31: Se arrancó el desarrollo del bot de Telegram (scaffold en `bot/`), con Groq como único proveedor de IA (transcripción + interpretación). Deploy en curso en Vercel (cuenta de un tercero). Se cambió Neon por Supabase como base de datos (más espacio en el plan gratis).
