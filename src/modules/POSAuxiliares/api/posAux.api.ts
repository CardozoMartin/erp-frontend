import { api } from '../../../api/ApiBase';
import type {
  ICajaAux,
  ConfiguracionCloudinaryPayload,
  ConfiguracionEmailPayload,
  IConfiguracionCloudinarySucursal,
  ConfiguracionPosPayload,
  IConfiguracionEmailSucursal,
  IConfiguracionPosSucursal,
  IComprobanteAux,
  IDespachoAux,
  IAuditoriaPaginationAux,
  IReporteCaja,
  IReporteProducto,
  IReporteResumen,
  IMovimientoCuentaCorrienteAux,
  IRecargosCuentaCorrienteAux,
  IResumenCajaAux,
  IVentaGeneralAux,
  IVentasPosPaginationAux,
} from '../types/pos-aux.type';
import type { IClientePos } from '../../PuntoDeVenta/types/pos.type';
import type { IListaPrecioPos } from '../../PuntoDeVenta/types/pos.type';

const unwrap = <T>(response: { data: T | { data: T } }): T => {
  if (response.data && typeof response.data === 'object' && 'data' in response.data) {
    return response.data.data;
  }
  return response.data as T;
};

export const getCajasFn = async () => unwrap<ICajaAux[]>(await api.get('/caja'));
export const getCajaAbiertaAuxFn = async () => unwrap<ICajaAux | null>(await api.get('/caja/abierta'));
export const getResumenCajaFn = async (cajaId: string) =>
  unwrap<IResumenCajaAux>(await api.get(`/caja/${cajaId}/resumen`));
export const abrirCajaAuxFn = async (payload: { monto_inicial: number; descripcion?: string }) =>
  unwrap<ICajaAux>(await api.post('/caja/abrir', payload));
export const cerrarCajaFn = async (payload: { cajaId: string; monto_final_declarado: number; descripcion?: string }) =>
  unwrap<ICajaAux>(await api.patch(`/caja/${payload.cajaId}/cerrar`, {
    monto_final_declarado: payload.monto_final_declarado,
    descripcion: payload.descripcion,
  }));
export const registrarMovimientoCajaFn = async (payload: {
  cajaId: string;
  tipo: 'INGRESO_MANUAL' | 'EGRESO' | 'AJUSTE';
  monto: number;
  categoria_egreso?: 'RETIRO_DINERO' | 'PAGO_PROVEEDOR' | 'PAGO_EMPLEADO' | 'COMPRA_LOCAL' | 'CONSUMO_INTERNO' | 'OTRO' | null;
  entidad_nombre?: string | null;
  referencia?: string | null;
  descripcion?: string;
}) => {
  const { cajaId, ...data } = payload;
  return unwrap(await api.post(`/caja/${cajaId}/movimientos`, data));
};

export const registrarConsumoInternoFn = async (payload: {
  producto_id: string;
  variante_id?: string | null;
  cantidad: number;
  descripcion?: string | null;
}) =>
  unwrap(
    await api.post('/stock-movimientos/ajuste', {
      producto_id: payload.producto_id,
      variante_id: payload.variante_id ?? null,
      operacion: 'RESTAR',
      cantidad: payload.cantidad,
      tipo: 'SALIDA',
      descripcion: payload.descripcion ?? 'Consumo interno del local',
    }),
  );

export const getCotizacionesFn = async () => unwrap<IComprobanteAux[]>(await api.get('/cotizaciones'));
export const cambiarCotizacionFn = async (payload: {
  id: string;
  accion: 'enviar' | 'aceptar' | 'rechazar' | 'convertir-venta';
  observaciones?: string;
}) => unwrap<IComprobanteAux>(await api.patch(`/cotizaciones/${payload.id}/${payload.accion}`, {
  observaciones: payload.observaciones,
}));
export const vencerCotizacionesFn = async () => unwrap(await api.post('/cotizaciones/vencer-expiradas'));

export const getFacturacionFn = async () => unwrap<IComprobanteAux[]>(await api.get('/facturacion'));
export const getVentasPosAuxFn = async () => unwrap<IComprobanteAux[]>(await api.get('/pos-ventas'));
export const getVentasGeneralFn = async () => unwrap<IVentaGeneralAux[]>(await api.get('/pos-ventas/general'));

export type VentasPosQuery = {
  page?: number;
  limit?: number;
  desde?: string;
  hasta?: string;
  empleado_id?: string;
};

export const getVentasPosPaginadasAuxFn = async (params: VentasPosQuery) => {
  const response = await api.get<IVentasPosPaginationAux | { data: IVentasPosPaginationAux }>('/pos-ventas', {
    params: {
      page: params.page ?? 1,
      limit: params.limit ?? 50,
      desde: params.desde || undefined,
      hasta: params.hasta || undefined,
      empleado_id: params.empleado_id || undefined,
    },
  });
  return 'meta' in response.data ? response.data : response.data.data;
};

export const emitirComprobanteVentaAuxFn = async (payload: {
  ventaId: string;
  tipo: 'TICKET' | 'FACTURA_A' | 'FACTURA_B' | 'FACTURA_C';
}) =>
  unwrap<IComprobanteAux>(
    await api.post(`/pos-ventas/${payload.ventaId}/emitir-comprobante`, {
      venta_id: payload.ventaId,
      comprobante_fiscal: { tipo: payload.tipo },
    }),
  );

export const actualizarComprobanteAuxFn = async (payload: {
  id: string;
  observaciones?: string | null;
  fecha_vencimiento?: string | null;
}) => unwrap<IComprobanteAux>(await api.patch(`/comprobantes/${payload.id}`, {
  observaciones: payload.observaciones ?? null,
  fecha_vencimiento: payload.fecha_vencimiento ?? null,
}));
export const enviarComprobanteEmailFn = async (payload: {
  id: string;
  destino: string;
  asunto?: string;
  mensaje?: string;
}) =>
  unwrap<{ ok: boolean; message: string }>(
    await api.post(`/comprobantes/${payload.id}/enviar-email`, {
      destino: payload.destino,
      asunto: payload.asunto || undefined,
      mensaje: payload.mensaje || undefined,
    }),
  );
export const anularFiscalFn = async (payload: { id: string; motivo?: string }) =>
  unwrap<IComprobanteAux>(await api.patch(`/facturacion/${payload.id}/anular`, { motivo: payload.motivo }));

export const getDespachosFn = async () => unwrap<IDespachoAux[]>(await api.get('/despachos'));
export const crearDespachoFn = async (payload: { comprobante_id: string; observaciones?: string }) =>
  unwrap<IDespachoAux>(await api.post('/despachos', payload));
export const anularDespachoFn = async (payload: { id: string; motivo?: string }) =>
  unwrap<IDespachoAux>(await api.patch(`/despachos/${payload.id}/anular`, { motivo: payload.motivo }));
export const entregarDespachoFn = async (payload: {
  despacho: IDespachoAux;
  generar_remito: boolean;
  observaciones?: string | null;
  items?: {
    despacho_item_id: string;
    cantidad_despachada: number;
    motivo_pendiente?: 'RETIRA_LUEGO' | 'SIN_STOCK' | 'EN_GARANTIA' | null;
  }[];
}) =>
  unwrap<IDespachoAux>(await api.patch(`/despachos/${payload.despacho.id}/entregar`, {
    generar_remito: payload.generar_remito,
    observaciones: payload.observaciones ?? 'Entrega registrada desde front',
    items: payload.items ?? payload.despacho.items.map((item) => ({
      despacho_item_id: item.id,
      cantidad_despachada: Number(item.cantidad_pendiente ?? 0),
    })),
  }));

export const getNotasCreditoFn = async () => unwrap<IComprobanteAux[]>(await api.get('/notas-credito'));
export const crearNotaCreditoSimpleFn = async (payload: {
  comprobante_origen_id: string;
  items?: {
    comprobante_item_id: string;
    cantidad: number;
  }[];
  destino: 'SALDO_CUENTA' | 'REEMBOLSO' | 'SOLO_EMITIR';
  reingresar_stock: boolean;
  caja_id?: string;
  medio_pago_id?: string;
  referencia?: string;
  observaciones?: string;
}) => unwrap<IComprobanteAux>(await api.post('/notas-credito', payload));

export type ReporteQuery = { desde?: string; hasta?: string; caja_id?: string; empleado_id?: string };

export type AuditoriaQuery = {
  page?: number;
  limit?: number;
  desde?: string;
  hasta?: string;
  modulo?: string;
  accion?: string;
  empleado_id?: string;
  entidad?: string;
  entidad_id?: string;
  q?: string;
};

export const getAuditoriaFn = async (params: AuditoriaQuery) => {
  const response = await api.get<IAuditoriaPaginationAux | { data: IAuditoriaPaginationAux }>('/auditoria', {
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
  });
  return 'meta' in response.data ? response.data : response.data.data;
};

export const getReporteResumenFn = async (params: ReporteQuery) =>
  unwrap<IReporteResumen>(await api.get('/reportes-pos/resumen', { params }));
export const getReporteProductosFn = async (params: ReporteQuery) =>
  unwrap<IReporteProducto[]>(await api.get('/reportes-pos/productos', { params }));
export const getReporteCajasFn = async (params: ReporteQuery) =>
  unwrap<IReporteCaja[]>(await api.get('/reportes-pos/cajas', { params }));

export const getClientesCuentaCorrienteFn = async () =>
  unwrap<IClientePos[]>(await api.get('/clientes'));
export const getMovimientosCuentaCorrienteFn = async (clienteId: string) =>
  unwrap<IMovimientoCuentaCorrienteAux[]>(await api.get(`/clientes/${clienteId}/movimientos`));
export const enviarResumenCuentaCorrienteEmailFn = async (payload: {
  clienteId: string;
  destino: string;
  asunto?: string;
  mensaje?: string;
  desde?: string;
  hasta?: string;
  tipo_resumen?: 'CARGOS' | 'COMPRAS' | 'CARGOS_Y_RECARGOS' | 'TODOS';
  adjuntar_pdf?: boolean;
}) =>
  unwrap<{ ok: boolean; message: string }>(
    await api.post(`/clientes/${payload.clienteId}/cuenta-corriente/enviar-resumen`, {
      destino: payload.destino,
      asunto: payload.asunto || undefined,
      mensaje: payload.mensaje || undefined,
      desde: payload.desde || undefined,
      hasta: payload.hasta || undefined,
      tipo_resumen: payload.tipo_resumen || undefined,
      adjuntar_pdf: payload.adjuntar_pdf,
    }),
  );
export const registrarPagoCuentaCorrienteFn = async (payload: {
  clienteId: string;
  monto: number;
  descripcion?: string;
  caja_id: string;
  medio_pago_id?: string | null;
  referencia?: string | null;
}) =>
  unwrap<IMovimientoCuentaCorrienteAux>(
    await api.post(`/clientes/${payload.clienteId}/pago`, {
      monto: payload.monto,
      descripcion: payload.descripcion,
      caja_id: payload.caja_id,
      medio_pago_id: payload.medio_pago_id ?? undefined,
      referencia: payload.referencia ?? undefined,
    }),
  );
export const registrarCargoCuentaCorrienteFn = async (payload: {
  clienteId: string;
  monto: number;
  descripcion?: string;
  fecha_vencimiento?: string;
}) =>
  unwrap<IMovimientoCuentaCorrienteAux>(
    await api.post(`/clientes/${payload.clienteId}/cargo`, {
      monto: payload.monto,
      descripcion: payload.descripcion,
      fecha_vencimiento: payload.fecha_vencimiento || undefined,
    }),
  );
export const registrarAjusteCuentaCorrienteFn = async (payload: {
  clienteId: string;
  monto: number;
  descripcion?: string;
}) =>
  unwrap<IMovimientoCuentaCorrienteAux>(
    await api.post(`/clientes/${payload.clienteId}/ajuste`, {
      monto: payload.monto,
      descripcion: payload.descripcion,
    }),
  );
export const calcularRecargosCuentaCorrienteFn = async (payload: {
  clienteId: string;
  hasta?: string;
  solo_simular?: boolean;
}) =>
  unwrap<IRecargosCuentaCorrienteAux>(
    await api.post(`/clientes/${payload.clienteId}/recargos`, {
      hasta: payload.hasta || undefined,
      solo_simular: payload.solo_simular ?? false,
    }),
  );
export const omitirRecargoCuentaCorrienteFn = async (movimientoId: string) =>
  unwrap<IMovimientoCuentaCorrienteAux>(
    await api.patch(`/clientes/movimientos/${movimientoId}/omitir-recargo`),
  );

export type ListaPrecioPayload = {
  nombre: string;
  sucursal_id?: string | null;
  tipo_lista?: 'CONTADO' | 'TARJETA' | 'MAYORISTA' | 'PROMOCION' | 'PERSONALIZADA';
  tipo_ajuste: 'DESCUENTO' | 'RECARGO';
  porcentaje: number;
  cuotas?: number | null;
  modo_iva?: 'NO_APLICA' | 'IVA_INCLUIDO' | 'AGREGAR_IVA';
  porcentaje_iva?: number;
  descripcion?: string | null;
  activa?: boolean;
};

export const getListasPrecioAuxFn = async () =>
  unwrap<IListaPrecioPos[]>(await api.get('/listas-precio?includeInactive=true'));
export const crearListaPrecioAuxFn = async (payload: ListaPrecioPayload) =>
  unwrap<IListaPrecioPos>(await api.post('/listas-precio', payload));
export const actualizarListaPrecioAuxFn = async (payload: { id: string; data: ListaPrecioPayload }) =>
  unwrap<IListaPrecioPos>(await api.patch(`/listas-precio/${payload.id}`, payload.data));
export const eliminarListaPrecioAuxFn = async (id: string) =>
  unwrap<void>(await api.delete(`/listas-precio/${id}`));

export const getConfiguracionPosFn = async (sucursalId: string) =>
  {
    console.log('[ConfigPOSDebug][front-api] GET configuracion sucursal', sucursalId);
    const response = await api.get(`/configuracion/${sucursalId}`);
    console.log('[ConfigPOSDebug][front-api] GET response', response.data);
    return unwrap<IConfiguracionPosSucursal>(response);
  };

export const crearConfiguracionPosFn = async (payload: ConfiguracionPosPayload) =>
  {
    console.log('[ConfigPOSDebug][front-api] POST payload', payload);
    const response = await api.post('/configuracion', payload);
    console.log('[ConfigPOSDebug][front-api] POST response', response.data);
    return unwrap<IConfiguracionPosSucursal>(response);
  };

export const actualizarConfiguracionPosFn = async (payload: ConfiguracionPosPayload) =>
  {
    const { sucursal_id, ...data } = payload;
    console.log('[ConfigPOSDebug][front-api] PATCH sucursal', sucursal_id);
    console.log('[ConfigPOSDebug][front-api] PATCH payload', data);
    const response = await api.patch(`/configuracion/${sucursal_id}`, data);
    console.log('[ConfigPOSDebug][front-api] PATCH response', response.data);
    return unwrap<IConfiguracionPosSucursal>(
      response,
    );
  };

export const getConfiguracionEmailFn = async (sucursalId: string) =>
  unwrap<IConfiguracionEmailSucursal>(await api.get(`/configuracion/email/${sucursalId}`));

export const guardarConfiguracionEmailFn = async (payload: ConfiguracionEmailPayload) =>
  unwrap<IConfiguracionEmailSucursal>(
    await api.post(`/configuracion/email/${payload.sucursal_id}`, payload),
  );

export const probarConfiguracionEmailFn = async (payload: {
  sucursalId: string;
  destino: string;
}) =>
  unwrap<{ ok: boolean; message: string }>(
    await api.post(`/configuracion/email/${payload.sucursalId}/probar`, {
      destino: payload.destino,
    }),
  );

export const getConfiguracionCloudinaryFn = async (sucursalId: string) =>
  unwrap<IConfiguracionCloudinarySucursal>(await api.get(`/configuracion/cloudinary/${sucursalId}`));

export const guardarConfiguracionCloudinaryFn = async (payload: ConfiguracionCloudinaryPayload) =>
  {
    const { sucursal_id, ...data } = payload;
    return unwrap<IConfiguracionCloudinarySucursal>(
      await api.post(`/configuracion/cloudinary/${sucursal_id}`, data),
    );
  };

export const probarConfiguracionCloudinaryFn = async (sucursalId: string) =>
  unwrap<{ ok: boolean; message: string }>(
    await api.post(`/configuracion/cloudinary/${sucursalId}/probar`),
  );

export type MpUsuarioResponse = {
  id: number;
  nickname?: string;
  email?: string;
  site_id?: string;
  status?: string;
};

export type MpStorePayload = {
  accessToken: string;
  userId: string;
  name: string;
  externalId: string;
  businessHours: Record<string, unknown>;
  location: Record<string, unknown>;
};

export type MpStoreResponse = {
  id: string;
  name: string;
  external_id: string;
  status?: string;
  user_id?: number;
};

export type MpPosPayload = {
  accessToken: string;
  name: string;
  fixedAmount: boolean;
  storeId: string;
  externalStoreId: string;
  externalId: string;
  category: number;
};

export type MpPosResponse = {
  id: number;
  name: string;
  external_id: string;
  status?: string;
  user_id?: number;
  qr?: {
    image?: string;
    template_document?: string;
    template_image?: string;
  };
  qr_code?: string;
};

export type MpGuardarCredencialesPayload = {
  sucursalId: string;
  accessToken: string;
  mpUserId: string;
  mpPosId: string;
  mpPosNombre?: string;
};

export type MpTestResponse = {
  ok: boolean;
  estado: string;
  mpUser?: string;
  posNombre?: string;
  error?: string;
};

export type MpConfiguracionResumen = {
  configurado: boolean;
  id?: string;
  sucursalId?: string;
  estado?: string;
  mpUserId?: string;
  mpPosId?: string;
  mpPosNombre?: string;
  ultimoTest?: string | null;
  ultimoError?: string | null;
  updatedAt?: string;
};

export const obtenerMpUsuarioFn = async (accessToken: string) =>
  unwrap<MpUsuarioResponse>(await api.post('/mp/usuario', { accessToken }));

export const crearMpStoreFn = async (payload: MpStorePayload) =>
  unwrap<MpStoreResponse>(await api.post('/mp/stores', payload));

export const buscarMpStoreFn = async (payload: {
  accessToken: string;
  userId: string;
  externalId: string;
}) => unwrap<{ results?: MpStoreResponse[] }>(await api.post('/mp/stores/buscar', payload));

export const crearMpPosFn = async (payload: MpPosPayload) =>
  unwrap<MpPosResponse>(await api.post('/mp/pos', payload));

export const buscarMpPosFn = async (payload: { accessToken: string; externalId: string }) =>
  unwrap<{ results?: MpPosResponse[] }>(await api.post('/mp/pos/buscar', payload));

export const guardarMpCredencialesFn = async (payload: MpGuardarCredencialesPayload) =>
  unwrap<{ ok: boolean; id: string }>(await api.post('/mp/credenciales', payload));

export const testMpCredencialesFn = async (sucursalId: string) =>
  unwrap<MpTestResponse>(await api.get(`/mp/test/${sucursalId}`));

export const getMpConfiguracionResumenFn = async (sucursalId: string) =>
  unwrap<MpConfiguracionResumen>(await api.get(`/mp/estado/${sucursalId}`));
