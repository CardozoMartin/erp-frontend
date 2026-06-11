import type { IComprobanteAux } from '../../POSAuxiliares/types/pos-aux.type';
import type { IClientePayload } from '../../Clientes/types/cliente.type';

export type EstadoPedidoEnvio =
  | 'PENDIENTE'
  | 'PREPARANDO'
  | 'EN_CAMINO'
  | 'ENTREGADO'
  | 'CANCELADO';

export type EstadoPagoPedidoEnvio =
  | 'PENDIENTE_PAGO'
  | 'PAGADO'
  | 'PENDIENTE_RENDICION'
  | 'RENDIDO';

export type MedioPagoPedidoEnvio = 'EFECTIVO' | 'TRANSFERENCIA' | 'OTRO';

export interface IPedidoEnvio {
  id: string;
  estado: EstadoPedidoEnvio;
  estado_pago: EstadoPagoPedidoEnvio;
  medio_pago_previsto: MedioPagoPedidoEnvio;
  comprobante_id: string;
  sucursal_id: string;
  cliente_id: string;
  empleado_repartidor_id?: string | null;
  empleado_rendicion_id?: string | null;
  direccion_entrega: string;
  localidad_entrega?: string | null;
  barrio_entrega?: string | null;
  codigo_postal_entrega?: string | null;
  telefono_contacto?: string | null;
  referencia_entrega?: string | null;
  fecha_programada?: string | null;
  fecha_entrega?: string | null;
  fecha_rendicion?: string | null;
  monto_rendido?: number | string | null;
  referencia_pago?: string | null;
  observaciones?: string | null;
  created_at: string;
  updated_at: string;
  comprobante: IComprobanteAux;
}

export interface CrearPedidoEnvioPayload {
  caja_id: string;
  cliente_id?: string;
  cliente_nuevo?: IClientePayload;
  empleado_repartidor_id?: string | null;
  medio_pago_previsto: MedioPagoPedidoEnvio;
  estado_pago?: EstadoPagoPedidoEnvio;
  direccion_entrega: string;
  localidad_entrega?: string | null;
  barrio_entrega?: string | null;
  codigo_postal_entrega?: string | null;
  telefono_contacto?: string | null;
  referencia_entrega?: string | null;
  fecha_programada?: string | null;
  observaciones?: string | null;
  items: {
    producto_id: string;
    variante_id?: string | null;
    cantidad: number;
    precio_unitario?: number;
  }[];
}

export interface IAuditoriaEvento {
  id: string;
  modulo: string;
  accion: string;
  entidad?: string | null;
  entidad_id?: string | null;
  empleado_id?: string | null;
  sucursal_id?: string | null;
  descripcion?: string | null;
  antes?: Record<string, any> | null;
  despues?: Record<string, any> | null;
  metadata?: Record<string, any> | null;
  created_at: string;
}
