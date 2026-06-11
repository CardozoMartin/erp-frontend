import type { IProducto } from '../../Productos/types/productos.type';

export type TipoPagoPos =
  | 'EFECTIVO'
  | 'TARJETA_DEBITO'
  | 'TARJETA_CREDITO'
  | 'TRANSFERENCIA'
  | 'QR'
  | 'CUENTA_CORRIENTE'
  | 'SALDO_A_FAVOR'
  | 'OTRO';

export type TipoEmisionFiscal = 'TICKET' | 'FACTURA_A' | 'FACTURA_B' | 'FACTURA_C';

export interface IMedioPago {
  id: string;
  nombre: string;
  tipo: 'efectivo' | 'tarjeta' | 'transferencia' | 'qr' | 'otro';
  requiereReferencia: boolean;
  activo: boolean;
}

export interface IClientePos {
  id: string;
  nombre: string;
  apellido?: string | null;
  razon_social?: string | null;
  tipo: 'CONSUMIDOR_FINAL' | 'RESPONSABLE_INSCRIPTO' | 'MONOTRIBUTISTA' | 'EXENTO';
  cuit?: string | null;
  dni?: string | null;
  email?: string | null;
  activo: boolean;
  cuentaCorriente?: {
    id: string;
    activa: boolean;
    saldo: number | string;
    limite_credito: number | string;
  } | null;
}

export interface IListaPrecioPos {
  id: string;
  nombre: string;
  sucursal_id?: string | null;
  tipo_lista?: 'CONTADO' | 'TARJETA' | 'MAYORISTA' | 'PROMOCION' | 'PERSONALIZADA';
  tipo_ajuste: 'DESCUENTO' | 'RECARGO';
  porcentaje: number | string;
  cuotas?: number | null;
  modo_iva?: 'NO_APLICA' | 'IVA_INCLUIDO' | 'AGREGAR_IVA';
  porcentaje_iva?: number | string;
  descripcion?: string | null;
  activa: boolean;
}

export interface ICajaPos {
  id: string;
  sucursal_id: string;
  empleado_id: string;
  estado: 'ABIERTA' | 'CERRADA';
  monto_inicial: number | string;
  monto_final_declarado?: number | string | null;
  monto_final_calculado?: number | string | null;
  diferencia?: number | string | null;
  fecha_apertura: string;
  fecha_cierre?: string | null;
}

export interface IComprobanteItemPos {
  id: string;
  producto_id?: string | null;
  variante_id?: string | null;
  descripcion: string;
  cantidad: number | string;
  precio_unitario: number | string;
  descuento_porcentaje?: number | string;
  descuento_monto?: number | string;
  subtotal: number | string;
}

export interface IComprobantePos {
  id: string;
  tipo: string;
  estado: string;
  numero: string;
  caja_id?: string | null;
  cliente_id?: string | null;
  empleado_vendedor_id?: string | null;
  empleado_cajero_id?: string | null;
  subtotal: number | string;
  descuento_total: number | string;
  recargo_total: number | string;
  total: number | string;
  observaciones?: string | null;
  created_at: string;
  items: IComprobanteItemPos[];
}

export interface IEmpleadoVentaCajaPos {
  id: string;
  nombreCompleto: string;
  email: string;
}

export interface IPagoVentaCajaPos {
  id: string;
  comprobante_id: string;
  medio_pago_id?: string | null;
  medioPago?: IMedioPago | null;
  tipo: TipoPagoPos;
  monto: number | string;
  cuotas?: number | null;
  recargo_porcentaje?: number | string;
  recargo_monto?: number | string;
  referencia?: string | null;
  caja_id?: string | null;
  empleado_id?: string | null;
  created_at: string;
}

export interface IVentaCajaPos {
  venta: IComprobantePos;
  pagos: IPagoVentaCajaPos[];
  vendedor: IEmpleadoVentaCajaPos | null;
  cajero: IEmpleadoVentaCajaPos | null;
  margen?: {
    costo_total: number;
    ganancia_total: number;
    margen_porcentaje: number;
    iva_estimado: number;
  };
}

export interface ICartItem {
  producto: IProducto;
  cantidad: number;
  precioUnitario: number;
}

export interface IVentaCompletaResponse {
  venta: IComprobantePos;
  comprobanteFiscal?: IComprobantePos;
}

export interface IMercadoPagoQrOrdenResponse {
  externalReference: string;
  posNombre?: string;
  qr?: {
    image?: string;
    template_document?: string;
    template_image?: string;
  };
  qrCode?: string;
}

export interface IPagoPosPayload {
  tipo: TipoPagoPos;
  medio_pago_id?: string | null;
  monto: number;
  cuotas?: number | null;
  recargo_porcentaje?: number;
  referencia?: string | null;
}

export interface IVentaPosPayload {
  cliente_id?: string | null;
  empleado_vendedor_id?: string | null;
  lista_precio_id?: string | null;
  observaciones?: string | null;
  items: {
    producto_id: string;
    variante_id?: string | null;
    descripcion?: string;
    cantidad: number;
    precio_unitario: number;
  }[];
}
