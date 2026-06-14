// Helpers de normalización para el payload de producto al guardar

const toNumber = (value: unknown, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const toNullableId = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const toNullableText = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export const cleanAtributos = (atributos: { tipo?: string; nombre?: string; valor?: string }[] = []) =>
  atributos
    .map((attr) => ({
      tipo: (attr.tipo ?? attr.nombre ?? '').toString().trim(),
      valor: (attr.valor ?? '').toString().trim(),
    }))
    .filter((attr) => attr.tipo && attr.valor);

export const cleanStock = (stock: {
  sucursal_id?: unknown;
  cantidad?: unknown;
  cantidad_minima?: unknown;
  deposito?: unknown;
  pasillo?: unknown;
  estante?: unknown;
  sector?: unknown;
  codigo_ubicacion?: unknown;
  ubicacion_referencia?: unknown;
}[] = []) =>
  stock.map((item) => ({
    sucursal_id: toNullableId(item.sucursal_id),
    cantidad: toNumber(item.cantidad),
    cantidad_minima: toNumber(item.cantidad_minima),
    deposito: toNullableText(item.deposito),
    pasillo: toNullableText(item.pasillo),
    estante: toNullableText(item.estante),
    sector: toNullableText(item.sector),
    codigo_ubicacion: toNullableText(item.codigo_ubicacion),
    ubicacion_referencia: toNullableText(item.ubicacion_referencia),
  }));

export const cleanLotes = (lotes: {
  sucursal_id?: unknown;
  numero_lote?: string;
  fecha_vencimiento?: string;
  cantidad?: unknown;
  cantidad_total?: unknown;
  cantidad_disponible?: unknown;
}[] = []) =>
  lotes
    .map((lote) => ({
      sucursal_id: toNullableId(lote.sucursal_id),
      numero_lote: lote.numero_lote?.trim() || undefined,
      fecha_vencimiento: lote.fecha_vencimiento,
      cantidad: toNumber(lote.cantidad ?? lote.cantidad_total ?? lote.cantidad_disponible),
    }))
    .filter((lote) => lote.fecha_vencimiento);

export const cleanImagenes = (imagenes: {
  url?: string;
  rol?: string;
  alt_text?: string;
  orden?: unknown;
  ancho_px?: unknown;
  alto_px?: unknown;
}[] = []) =>
  imagenes
    .filter((imagen) => imagen?.url)
    .map((imagen) => ({
      rol: imagen.rol,
      url: imagen.url,
      alt_text: imagen.alt_text ?? undefined,
      orden: toNumber(imagen.orden),
      ancho_px: imagen.ancho_px === undefined ? undefined : toNumber(imagen.ancho_px),
      alto_px: imagen.alto_px === undefined ? undefined : toNumber(imagen.alto_px),
    }));

export const cleanOfertas = (ofertas: {
  precio_oferta?: unknown;
  precio?: unknown;
  fecha_inicio?: string;
  fecha_fin?: string;
  activo?: boolean;
}[] = []) =>
  ofertas
    .map((oferta) => ({
      precio_oferta: toNumber(oferta.precio_oferta ?? oferta.precio),
      fecha_inicio: oferta.fecha_inicio,
      fecha_fin: oferta.fecha_fin,
      activo: oferta.activo ?? true,
    }))
    .filter((oferta) => oferta.fecha_inicio && oferta.fecha_fin);

export const cleanVariantes = (variantes: {
  sku?: string;
  precio_extra?: unknown;
  activo?: boolean;
  atributos?: Parameters<typeof cleanAtributos>[0];
  stock?: Parameters<typeof cleanStock>[0];
  lotes?: Parameters<typeof cleanLotes>[0];
  imagenes?: Parameters<typeof cleanImagenes>[0];
  ofertas?: Parameters<typeof cleanOfertas>[0];
}[] = []) =>
  variantes.map((variante) => ({
    sku: variante.sku?.trim() || undefined,
    precio_extra: toNumber(variante.precio_extra),
    activo: variante.activo ?? true,
    atributos: cleanAtributos(variante.atributos),
    stock: cleanStock(variante.stock),
    lotes: cleanLotes(variante.lotes),
    imagenes: cleanImagenes(variante.imagenes),
    ofertas: cleanOfertas(variante.ofertas),
  }));

// Formato de moneda para la tabla
export const formatMoneda = (valor: number | null | undefined) =>
  valor != null
    ? valor.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })
    : '-';

// Calcula el estado de stock para mostrar en la tabla
export const calcularEstadoStock = (cantidad: number, minima: number): 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' => {
  if (cantidad <= 0) return 'OUT_OF_STOCK';
  if (cantidad <= minima) return 'LOW_STOCK';
  return 'IN_STOCK';
};

// Calcula días hasta vencimiento desde la fecha de vencimiento más próxima de los lotes
export const calcularDiasVencimiento = (lotes: { fecha_vencimiento?: string }[]) => {
  const fechas = lotes
    .map((lote) => lote.fecha_vencimiento)
    .filter(Boolean)
    .map((fecha) => new Date(fecha as string))
    .filter((fecha) => Number.isFinite(fecha.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());

  if (fechas.length === 0) return null;
  return Math.ceil((fechas[0].getTime() - Date.now()) / 86_400_000);
};

export { toNumber, toNullableId };
