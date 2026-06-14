import type {
  ICartItem,
  IListaPrecioPos,
  IMedioPago,
  IMercadoPagoQrOrdenResponse,
  IVentaPosPayload,
  TipoPagoPos,
} from '../types/pos.type';
import type { IProducto, IStock } from '../../Productos/types/productos.type';

// ─── Tipos locales ────────────────────────────────────────────────────────────

export type PaymentDraft = {
  id: string;
  medioPagoId: string;
  monto: string;
  referencia: string;
};

export type QrOrderState = {
  ventaId: string;
  numero: string;
  total: number;
  orden: IMercadoPagoQrOrdenResponse;
  status: 'waiting' | 'confirmed';
};

// ─── Formatters ───────────────────────────────────────────────────────────────

export const formatCurrency = (value: number) =>
  value.toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  });

export const toNumber = (value: unknown, fallback = 0) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
};

// ─── Producto helpers ─────────────────────────────────────────────────────────

export const getProductPrice = (product: IProducto) =>
  toNumber(product.precio_venta ?? product.precio_base);

export const applyPriceList = (price: number, list?: IListaPrecioPos) => {
  if (!list) return price;
  const factor = toNumber(list.porcentaje) / 100;
  const adjustedPrice =
    list.tipo_ajuste === 'DESCUENTO' ? price * (1 - factor) : price * (1 + factor);
  const ivaFactor = toNumber(list.porcentaje_iva) / 100;
  const finalPrice =
    list.modo_iva === 'AGREGAR_IVA' ? adjustedPrice * (1 + ivaFactor) : adjustedPrice;
  return Number(finalPrice.toFixed(2));
};

export const describePriceList = (list?: IListaPrecioPos) => {
  if (!list) return 'Precio base';
  const porcentaje = toNumber(list.porcentaje);
  const parts =
    porcentaje > 0
      ? [
          list.tipo_ajuste === 'DESCUENTO'
            ? `${porcentaje}% desc.`
            : `${porcentaje}% recargo`,
        ]
      : ['Sin desc./recargo'];
  if (list.cuotas) parts.push(`${list.cuotas} cuotas`);
  if (list.modo_iva === 'AGREGAR_IVA') parts.push(`+ IVA ${toNumber(list.porcentaje_iva)}%`);
  if (list.modo_iva === 'IVA_INCLUIDO') parts.push('IVA incluido');
  return parts.join(' | ');
};

export const getProductCode = (product: IProducto) => product.codigo_barras || product.id || '-';

export const getStockForBranch = (product: IProducto, sucursalId?: string | null) => {
  if (!product.stock?.length) return 0;
  const stocks = product.stock.filter((item: IStock) => {
    if (!sucursalId) return true;
    return !item.sucursal_id || item.sucursal_id === sucursalId;
  });
  return stocks.reduce((sum, item) => sum + toNumber(item.cantidad), 0);
};

export const getStockLocationForBranch = (product: IProducto, sucursalId?: string | null) => {
  const stocks = product.stock ?? [];
  const selectedStock =
    stocks.find((item) => sucursalId && item.sucursal_id === sucursalId) ??
    stocks.find((item) => !item.sucursal_id) ??
    stocks[0];

  const parts = [
    selectedStock?.deposito,
    selectedStock?.pasillo,
    selectedStock?.estante,
    selectedStock?.sector,
    selectedStock?.codigo_ubicacion ? `Cod. ${selectedStock.codigo_ubicacion}` : null,
    selectedStock?.ubicacion_referencia,
  ]
    .map((part) => part?.toString?.().trim())
    .filter(Boolean);

  return parts.length ? parts.join(' | ') : 'Sin ubicacion';
};

// ─── Pago helpers ─────────────────────────────────────────────────────────────

export const mapMedioPagoToTipo = (medio?: IMedioPago): TipoPagoPos => {
  if (!medio) return 'EFECTIVO';
  const nombre = medio.nombre.toLowerCase();
  if (medio.tipo === 'efectivo') return 'EFECTIVO';
  if (medio.tipo === 'transferencia') return 'TRANSFERENCIA';
  if (medio.tipo === 'qr') return 'QR';
  if (medio.tipo === 'tarjeta' && nombre.includes('deb')) return 'TARJETA_DEBITO';
  if (medio.tipo === 'tarjeta') return 'TARJETA_CREDITO';
  return 'OTRO';
};

export const modoPosLabel: Record<string, string> = {
  SIMPLE: 'Simple',
  MULTICAJA: 'Multicaja',
  CAJA_CENTRALIZADA: 'Caja centralizada',
  CON_DESPACHO: 'Con despacho',
};

export const buildVentaPayload = (
  cartItems: ICartItem[],
  empleadoId?: string,
  clienteId?: string | null,
  listaPrecioId?: string | null,
): IVentaPosPayload => ({
  cliente_id: clienteId || null,
  empleado_vendedor_id: empleadoId ?? null,
  lista_precio_id: listaPrecioId || null,
  observaciones: 'Venta creada desde punto de venta',
  items: cartItems.map((item) => ({
    producto_id: item.producto.id!,
    variante_id: null,
    descripcion: item.producto.nombre,
    cantidad: item.cantidad,
    precio_unitario: item.precioUnitario,
  })),
});
