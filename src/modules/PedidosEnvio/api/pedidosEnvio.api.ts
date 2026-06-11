import { api } from '../../../api/ApiBase';
import type {
  CrearPedidoEnvioPayload,
  EstadoPedidoEnvio,
  IAuditoriaEvento,
  IPedidoEnvio,
} from '../types/pedido-envio.type';

const unwrap = <T>(response: { data: T | { data: T } }): T => {
  if (response.data && typeof response.data === 'object' && 'data' in response.data) {
    return response.data.data;
  }
  return response.data as T;
};

export const getPedidosEnvioFn = async () =>
  unwrap<IPedidoEnvio[]>(await api.get('/pedidos-envio'));

export const getHistorialPedidoEnvioFn = async (pedidoId: string) =>
  unwrap<IAuditoriaEvento[]>(
    await api.get(`/auditoria/historial/pedido_envio/${pedidoId}`, {
      params: { limit: 100 },
    }),
  );

export const crearPedidoEnvioFn = async (payload: CrearPedidoEnvioPayload) =>
  unwrap<IPedidoEnvio>(await api.post('/pedidos-envio', payload));

export const editarPedidoEnvioFn = async (payload: CrearPedidoEnvioPayload & { id: string }) => {
  const { id, caja_id: _cajaId, cliente_id: _clienteId, cliente_nuevo: _clienteNuevo, ...data } = payload;
  return unwrap<IPedidoEnvio>(await api.patch(`/pedidos-envio/${id}`, data));
};

export const cambiarEstadoPedidoEnvioFn = async (payload: {
  id: string;
  estado: EstadoPedidoEnvio;
  empleado_repartidor_id?: string | null;
  observaciones?: string | null;
}) =>
  unwrap<IPedidoEnvio>(
    await api.patch(`/pedidos-envio/${payload.id}/estado`, {
      estado: payload.estado,
      empleado_repartidor_id: payload.empleado_repartidor_id ?? null,
      observaciones: payload.observaciones ?? null,
    }),
  );

export const rendirPedidoEnvioFn = async (payload: {
  id: string;
  caja_id: string;
  medio_pago_id: string;
  monto_rendido?: number;
  referencia_pago?: string | null;
  observaciones?: string | null;
}) =>
  unwrap<IPedidoEnvio>(
    await api.patch(`/pedidos-envio/${payload.id}/rendir`, {
      caja_id: payload.caja_id,
      medio_pago_id: payload.medio_pago_id,
      monto_rendido: payload.monto_rendido,
      referencia_pago: payload.referencia_pago ?? null,
      observaciones: payload.observaciones ?? null,
    }),
  );
