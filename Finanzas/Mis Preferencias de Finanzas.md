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

## Historial
- 2026-07-31: Configuración inicial. Carpeta creada, categorías y metas definidas. Dashboard construido en estado vacío/plantilla (sin transacciones reales).
