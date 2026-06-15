import type { IProducto } from '../../Productos/types/productos.type';
import { toNumber } from '../../POSAuxiliares/utils/format';
import type { EstadoPagoPedidoEnvio, EstadoPedidoEnvio, MedioPagoPedidoEnvio } from '../types/pedido-envio.type';

export type PedidoItemDraft = {
  id: string;
  producto_id: string;
  cantidad: string;
  precio_unitario: string;
};

export const estadoClass: Record<EstadoPedidoEnvio, string> = {
  PENDIENTE:  'border-[#f6d58f] bg-[#fff8e6] text-[#8a5a00]',
  PREPARANDO: 'border-[#bfd7ff] bg-[#f2f7ff] text-[#1d4f91]',
  EN_CAMINO:  'border-[#cfe2de] bg-[#eef8f6] text-[#075E54]',
  ENTREGADO:  'border-[#cfe2de] bg-[#f3fbf9] text-[#075E54]',
  CANCELADO:  'border-[#f1c7c7] bg-[#fff5f5] text-[#b42318]',
};

export const pagoClass: Record<EstadoPagoPedidoEnvio, string> = {
  PENDIENTE_PAGO:      'border-[#f6d58f] bg-[#fff8e6] text-[#8a5a00]',
  PAGADO:              'border-[#cfe2de] bg-[#f3fbf9] text-[#075E54]',
  PENDIENTE_RENDICION: 'border-[#f6d58f] bg-[#fff8e6] text-[#8a5a00]',
  RENDIDO:             'border-[#cfe2de] bg-[#eef8f6] text-[#075E54]',
};

export const estadoLabel: Record<EstadoPedidoEnvio, string> = {
  PENDIENTE:  'Pendiente',
  PREPARANDO: 'Preparando',
  EN_CAMINO:  'En camino',
  ENTREGADO:  'Entregado',
  CANCELADO:  'Cancelado',
};

export const pagoLabel: Record<EstadoPagoPedidoEnvio, string> = {
  PENDIENTE_PAGO:      'Pendiente pago',
  PAGADO:              'Pagado',
  PENDIENTE_RENDICION: 'Pendiente rendicion',
  RENDIDO:             'Rendido',
};

export const medioPagoLabel: Record<MedioPagoPedidoEnvio, string> = {
  EFECTIVO:      'Efectivo',
  TRANSFERENCIA: 'Transferencia',
  OTRO:          'Otro',
};

export const accionHistorialLabel: Record<string, string> = {
  CREAR_PEDIDO_ENVIO:        'Pedido creado',
  EDITAR_PEDIDO_ENVIO:       'Pedido editado',
  CAMBIAR_ESTADO_PEDIDO_ENVIO: 'Cambio de estado',
  RENDIR_PEDIDO_ENVIO:       'Rendicion registrada',
};

export const newItem = (): PedidoItemDraft => ({
  id: crypto.randomUUID(),
  producto_id: '',
  cantidad: '1',
  precio_unitario: '',
});

export const clienteNombre = (
  cliente?: { nombre?: string; apellido?: string | null; razon_social?: string | null } | null,
) => cliente?.razon_social || `${cliente?.nombre ?? ''} ${cliente?.apellido ?? ''}`.trim() || 'Cliente';

export const productoPrecio = (producto?: IProducto | null) =>
  toNumber(producto?.precio_venta ?? producto?.precio_base);

export const todayKey = () => new Date().toISOString().slice(0, 10);
