export interface Categoria {
  nombre: string;
  tipo: "personal" | "negocio";
  subs: string[];
}

// Misma estructura que Finanzas/Dashboard de Finanzas.html — mantener sincronizadas.
export const CATEGORIAS: Categoria[] = [
  { nombre: "Vivienda", tipo: "personal", subs: ["Servicios", "Alquiler", "Limpieza", "Reparaciones"] },
  { nombre: "Comida", tipo: "personal", subs: [] },
  { nombre: "Salud", tipo: "personal", subs: [] },
  { nombre: "Mascotas", tipo: "personal", subs: [] },
  { nombre: "Negocio-Ingresos", tipo: "negocio", subs: ["Transferencia (Cliente y Peya)", "Propinas", "Adelantos"] },
  { nombre: "Negocio-Gastos", tipo: "negocio", subs: ["Servicios", "Reparaciones", "Combustible", "Viático", "Transferencia Pago46"] },
];

export function categoriaValida(nombre: string): Categoria | undefined {
  return CATEGORIAS.find((c) => c.nombre.toLowerCase() === nombre.toLowerCase());
}

export function subcategoriaValida(categoria: string, sub: string): boolean {
  const c = categoriaValida(categoria);
  if (!c) return false;
  if (c.subs.length === 0) return sub === "" || sub == null;
  return c.subs.some((s) => s.toLowerCase() === sub.toLowerCase());
}
