import { api } from '../../../api/ApiBase';
import type { IPedidoEnvio } from '../../PedidosEnvio/types/pedido-envio.type';
import type {
  AuditoriaCajaQuery,
  CajaQuery,
  IAuditoriaCajaPagination,
  ICaja,
  IResumenCaja,
} from '../types/caja.type';

const unwrap = <T>(response: { data: T | { data: T } }): T => {
  if (response.data && typeof response.data === 'object' && 'data' in response.data) {
    return response.data.data;
  }
  return response.data as T;
};

export const getCajasFn = async (params: CajaQuery = {}) =>
  unwrap<ICaja[]>(
    await api.get('/caja', {
      params: {
        desde: params.desde || undefined,
        hasta: params.hasta || undefined,
        estado: params.estado || undefined,
      },
    }),
  );

export const getCajaAbiertaFn = async () =>
  unwrap<ICaja | null>(await api.get('/caja/abierta'));

export const getResumenCajaFn = async (cajaId: string) =>
  unwrap<IResumenCaja>(await api.get(`/caja/${cajaId}/resumen`));

export const getPedidosCajaFn = async (cajaId: string) =>
  unwrap<IPedidoEnvio[]>(await api.get(`/pedidos-envio/caja/${cajaId}`));

export const getCajasAbiertasFn = async () =>
  unwrap<ICaja[]>(await api.get('/caja/abiertas'));

export const abrirCajaFn = async (payload: { monto_inicial: number; descripcion?: string }) =>
  unwrap<ICaja>(await api.post('/caja/abrir', payload));

export const cerrarCajaFn = async (payload: {
  cajaId: string;
  monto_final_declarado: number;
  descripcion?: string;
}) =>
  unwrap<ICaja>(
    await api.patch(`/caja/${payload.cajaId}/cerrar`, {
      monto_final_declarado: payload.monto_final_declarado,
      descripcion: payload.descripcion,
    }),
  );

export const registrarMovimientoCajaFn = async (payload: {
  cajaId: string;
  tipo: 'INGRESO_MANUAL' | 'EGRESO' | 'AJUSTE';
  monto: number;
  categoria_egreso?:
    | 'RETIRO_DINERO'
    | 'PAGO_PROVEEDOR'
    | 'PAGO_EMPLEADO'
    | 'COMPRA_LOCAL'
    | 'CONSUMO_INTERNO'
    | 'OTRO'
    | null;
  entidad_nombre?: string | null;
  referencia?: string | null;
  descripcion?: string;
}) => {
  const { cajaId, ...data } = payload;
  return unwrap(await api.post(`/caja/${cajaId}/movimientos`, data));
};

export const registrarConsumoInternoFn = async (payload: {
  cajaId: string;
  producto_id: string;
  variante_id?: string | null;
  cantidad: number;
  monto?: number;
  descripcion?: string | null;
}) => {
  const { cajaId, ...body } = payload;
  return unwrap(await api.post(`/caja/${cajaId}/consumo-interno`, body));
};

export const getAuditoriaCajaFn = async (params: AuditoriaCajaQuery) => {
  const response = await api.get<IAuditoriaCajaPagination | { data: IAuditoriaCajaPagination }>(
    '/auditoria',
    {
      params: {
        page: params.page ?? 1,
        limit: params.limit ?? 50,
        desde: params.desde || undefined,
        hasta: params.hasta || undefined,
        modulo: params.modulo || undefined,
        accion: params.accion || undefined,
        empleado_id: params.empleado_id || undefined,
        entidad: params.entidad || undefined,
        entidad_id: params.entidad_id || undefined,
        q: params.q || undefined,
      },
    },
  );
  return 'meta' in response.data ? response.data : response.data.data;
};
