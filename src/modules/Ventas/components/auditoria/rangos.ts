const iso = (fecha: Date) => fecha.toISOString().slice(0, 10);

const restarDias = (dias: number) => {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() - dias);
  return fecha;
};

/**
 * Atajos de rango. Antes habia que tipear las dos fechas a mano para cualquier
 * consulta, incluso para algo tan comun como "los ultimos 7 dias".
 */
export const ATAJOS_RANGO: { label: string; calcular: () => [string, string] }[] = [
  { label: 'Hoy', calcular: () => [iso(new Date()), iso(new Date())] },
  { label: 'Ayer', calcular: () => [iso(restarDias(1)), iso(restarDias(1))] },
  { label: '7 días', calcular: () => [iso(restarDias(6)), iso(new Date())] },
  { label: '30 días', calcular: () => [iso(restarDias(29)), iso(new Date())] },
  {
    label: 'Este mes',
    calcular: () => {
      const hoy = new Date();
      return [iso(new Date(hoy.getFullYear(), hoy.getMonth(), 1)), iso(hoy)];
    },
  },
];

/** Rango inicial: la ultima semana. Abrir en "hoy" mostraba la tabla vacia. */
export const rangoPorDefecto = (): [string, string] => [
  iso(restarDias(6)),
  iso(new Date()),
];
