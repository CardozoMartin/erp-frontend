const INTEGER_UNITS = new Set(['UNIDAD']);

export const formatStockQuantity = (
  value: unknown,
  unidadVenta?: string,
  esFraccionable?: boolean
) => {
  const quantity = Number(value ?? 0);
  if (!Number.isFinite(quantity)) return '0';

  if (unidadVenta && INTEGER_UNITS.has(unidadVenta) && !esFraccionable) {
    return Math.round(quantity).toLocaleString('es-AR', {
      maximumFractionDigits: 0,
    });
  }

  return quantity.toLocaleString('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  });
};
