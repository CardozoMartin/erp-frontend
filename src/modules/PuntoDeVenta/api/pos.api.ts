import { api } from '../../../api/ApiBase';
import type {
  ICajaPos,
  IClientePos,
  IComprobantePos,
  IListaPrecioPos,
  IMercadoPagoQrOrdenResponse,
  IMedioPago,
  IPagoPosPayload,
  TipoEmisionFiscal,
  IVentaCajaPos,
  IVentaCompletaResponse,
  IVentaPosPayload,
} from '../types/pos.type';

const unwrap = <T>(response: { data: T | { data: T } }): T => {
  if (response.data && typeof response.data === 'object' && 'data' in response.data) {
    return response.data.data;
  }
  return response.data as T;
};

export const getCajaAbiertaFn = async () => {
  const response = await api.get<ICajaPos | null>('/caja/abierta');
  return unwrap<ICajaPos | null>(response);
};

export const abrirCajaFn = async (payload: { monto_inicial: number; descripcion?: string }) => {
  const response = await api.post<ICajaPos>('/caja/abrir', {
    monto_inicial: payload.monto_inicial,
    descripcion: payload.descripcion ?? 'Apertura desde punto de venta',
  });
  return unwrap<ICajaPos>(response);
};

export const getMediosPagoActivosFn = async () => {
  const response = await api.get<IMedioPago[]>('/pagos/activos');
  return unwrap<IMedioPago[]>(response);
};

export const getClientesPosFn = async () => {
  const response = await api.get<IClientePos[]>('/clientes');
  return unwrap<IClientePos[]>(response);
};

export const getListasPrecioPosFn = async () => {
  const response = await api.get<IListaPrecioPos[]>('/listas-precio');
  return unwrap<IListaPrecioPos[]>(response);
};

export const getVentasPendientesCobroFn = async () => {
  const response = await api.get<IComprobantePos[]>('/pos-ventas/pendientes-cobro');
  return unwrap<IComprobantePos[]>(response);
};

export const getVentasCajaFn = async (cajaId: string) => {
  const response = await api.get<IVentaCajaPos[]>(`/pos-ventas/caja/${cajaId}`);
  return unwrap<IVentaCajaPos[]>(response);
};

export const crearVentaPendienteFn = async (payload: IVentaPosPayload) => {
  const response = await api.post<IComprobantePos>('/pos-ventas', payload);
  return unwrap<IComprobantePos>(response);
};

export const crearVentaQrFn = async (payload: IVentaPosPayload) => {
  const response = await api.post<IComprobantePos>('/pos-ventas/qr', payload);
  return unwrap<IComprobantePos>(response);
};

export const crearVentaCuentaCorrienteFn = async (payload: IVentaPosPayload) => {
  const response = await api.post<IVentaCompletaResponse>('/pos-ventas/cuenta-corriente', payload);
  return unwrap<IVentaCompletaResponse>(response);
};

export const crearCotizacionFn = async (payload: IVentaPosPayload) => {
  const response = await api.post<IComprobantePos>('/cotizaciones', payload);
  return unwrap<IComprobantePos>(response);
};

export const ventaCompletaFn = async (payload: {
  venta: IVentaPosPayload;
  cajaId: string;
  pagos: IPagoPosPayload[];
  emitirComprobante: boolean;
  tipoFiscal: TipoEmisionFiscal;
}) => {
  const response = await api.post<IVentaCompletaResponse>('/pos-ventas/completa', {
    ...payload.venta,
    cobro: {
      caja_id: payload.cajaId,
      pagos: payload.pagos,
    },
    emitir_comprobante: payload.emitirComprobante,
    comprobante_fiscal: payload.emitirComprobante
      ? {
          tipo: payload.tipoFiscal,
        }
      : undefined,
  });
  return unwrap<IVentaCompletaResponse>(response);
};

export const cobrarVentaPendienteFn = async (payload: {
  ventaId: string;
  cajaId: string;
  pagos: IPagoPosPayload[];
  emitirComprobante: boolean;
  tipoFiscal: TipoEmisionFiscal;
}) => {
  const response = await api.post<IVentaCompletaResponse>(`/pos-ventas/${payload.ventaId}/cobrar`, {
    caja_id: payload.cajaId,
    pagos: payload.pagos,
    emitir_comprobante: payload.emitirComprobante,
    comprobante_fiscal: payload.emitirComprobante
      ? {
          tipo: payload.tipoFiscal,
        }
      : undefined,
  });
  return unwrap<IVentaCompletaResponse>(response);
};

export const cancelarVentaPendienteFn = async (payload: { ventaId: string; motivo?: string }) => {
  const response = await api.patch<IComprobantePos>(`/pos-ventas/${payload.ventaId}/cancelar`, {
    motivo: payload.motivo ?? 'Venta pendiente cancelada desde punto de venta',
  });
  return unwrap<IComprobantePos>(response);
};

export const tomarVentaFn = async (ventaId: string) => {
  const response = await api.patch<IComprobantePos>(`/pos-ventas/${ventaId}/tomar`, {});
  return unwrap<IComprobantePos>(response);
};

export const liberarVentaFn = async (ventaId: string) => {
  const response = await api.patch<void>(`/pos-ventas/${ventaId}/liberar`, {});
  return unwrap<void>(response);
};

export const asignarCajaPendienteFn = async (payload: { ventaId: string; cajaId: string }) => {
  const response = await api.patch<IComprobantePos>(`/pos-ventas/${payload.ventaId}/asignar-caja`, {
    caja_id: payload.cajaId,
  });
  return unwrap<IComprobantePos>(response);
};

export const crearOrdenMercadoPagoQrFn = async (payload: {
  sucursalId: string;
  ventaId: string;
  cajaId: string;
  total: number;
  items: {
    titulo: string;
    cantidad: number;
    precioUnitario: number;
  }[];
}) => {
  const response = await api.post<IMercadoPagoQrOrdenResponse>('/mp/qr/orden', payload);
  return unwrap<IMercadoPagoQrOrdenResponse>(response);
};

export const cancelarOrdenMercadoPagoQrFn = async (payload: { sucursalId: string }) => {
  const response = await api.post<{ ok: boolean }>('/mp/qr/cancelar', payload);
  return unwrap<{ ok: boolean }>(response);
};

export const consultarEstadoMercadoPagoQrFn = async (payload: {
  sucursalId: string;
  ventaId: string;
}) => {
  const response = await api.get<{
    ok: boolean;
    estado: 'pendiente' | 'aprobado' | 'error';
    mpPaymentId?: string;
    monto?: number;
    medioPago?: string;
    error?: string;
  }>(`/mp/qr/estado/${payload.sucursalId}/${payload.ventaId}`);
  return unwrap<{
    ok: boolean;
    estado: 'pendiente' | 'aprobado' | 'error';
    mpPaymentId?: string;
    monto?: number;
    medioPago?: string;
    error?: string;
  }>(response);
};

export const getVentaPosFn = async (ventaId: string) => {
  const response = await api.get<IComprobantePos>(`/pos-ventas/${ventaId}`);
  return unwrap<IComprobantePos>(response);
};

export const editarVentaPendienteFn = async (payload: {
  ventaId: string;
  items: IVentaPosPayload['items'];
  cliente_id?: string | null;
  lista_precio_id?: string | null;
  observaciones?: string | null;
}) => {
  const { ventaId, ...body } = payload;
  const response = await api.patch<IComprobantePos>(`/pos-ventas/${ventaId}`, body);
  return unwrap<IComprobantePos>(response);
};
