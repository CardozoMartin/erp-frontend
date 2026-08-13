import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { toast } from 'sonner';
import { useAuthStore } from '../../../store/auth.store';
import type { IErrorResponse } from '../../../type/api.response.type';
import {
  abrirCajaAuxFn,
  actualizarConfiguracionPosFn,
  actualizarComprobanteAuxFn,
  actualizarListaPrecioAuxFn,
  anularDespachoFn,
  anularFiscalFn,
  calcularRecargosCuentaCorrienteFn,
  cambiarCotizacionFn,
  cerrarCajaFn,
  crearConfiguracionPosFn,
  crearDespachoFn,
  crearListaPrecioAuxFn,
  crearNotaCreditoSimpleFn,
  eliminarListaPrecioAuxFn,
  entregarDespachoFn,
  enviarComprobanteEmailFn,
  enviarResumenCuentaCorrienteEmailFn,
  emitirComprobanteVentaAuxFn,
  getCajaAbiertaAuxFn,
  getAuditoriaFn,
  getCajasFn,
  getClientesCuentaCorrienteFn,
  getConfiguracionCloudinaryFn,
  getConfiguracionEmailFn,
  getConfiguracionPosFn,
  getEstadoServiciosSucursalFn,
  getCotizacionesFn,
  getDespachosFn,
  getFacturacionFn,
  getListasPrecioAuxFn,
  getMovimientosCuentaCorrienteFn,
  getNotasCreditoFn,
  getReporteCajasFn,
  getReporteCobrosPendientesFn,
  exportarCobrosPendientesFn,
  getReporteDiferenciasCajaFn,
  getReporteNotasCreditoFn,
  getReporteProductosFn,
  getReporteResumenFn,
  getReporteVentasPorDiaFn,
  getReporteMediosPagoFn,
  getReporteEmpleadosFn,
  exportarNotasCreditoFn,
  getResumenCajaFn,
  getVentasPosAuxFn,
  getVentasGeneralFn,
  getVentasPosPaginadasAuxFn,
  guardarConfiguracionCloudinaryFn,
  guardarConfiguracionEmailFn,
  omitirRecargoCuentaCorrienteFn,
  probarConfiguracionCloudinaryFn,
  probarConfiguracionEmailFn,
  registrarAjusteCuentaCorrienteFn,
  registrarCargoCuentaCorrienteFn,
  registrarConsumoInternoFn,
  registrarPagoCuentaCorrienteFn,
  registrarMovimientoCajaFn,
  vencerCotizacionesFn,
  type ReporteQuery,
  type AuditoriaQuery,
  type VentasPosQuery,
} from '../api/posAux.api';

const message = (error: AxiosError<IErrorResponse>) => {
  const data = error.response?.data;
  return data?.message || data?.mensaje || 'No se pudo completar la operacion';
};

const useSucursalEnabled = () => !!useAuthStore((state) => state.sucursalActiva?.id);

export const useCajasAux = (enabledExtra = true) => {
  const enabled = useSucursalEnabled();
  return useQuery({ queryKey: ['pos-aux', 'cajas'], queryFn: getCajasFn, enabled: enabled && enabledExtra });
};

export const useCajaAbiertaAux = (enabledExtra = true) => {
  const enabled = useSucursalEnabled();
  return useQuery({ queryKey: ['pos-aux', 'caja-abierta'], queryFn: getCajaAbiertaAuxFn, enabled: enabled && enabledExtra });
};

export const useResumenCaja = (cajaId?: string | null, enabledExtra = true) => {
  const enabled = useSucursalEnabled();
  return useQuery({
    queryKey: ['pos-aux', 'caja-resumen', cajaId],
    queryFn: () => getResumenCajaFn(cajaId!),
    enabled: enabled && enabledExtra && !!cajaId,
  });
};

export const useCotizacionesAux = () => {
  const enabled = useSucursalEnabled();
  return useQuery({ queryKey: ['pos-aux', 'cotizaciones'], queryFn: getCotizacionesFn, enabled });
};

export const useFacturacionAux = (enabledExtra = true) => {
  const enabled = useSucursalEnabled();
  return useQuery({ queryKey: ['pos-aux', 'facturacion'], queryFn: getFacturacionFn, enabled: enabled && enabledExtra });
};

export const useVentasPosAux = (enabledExtra = true) => {
  const enabled = useSucursalEnabled();
  return useQuery({ queryKey: ['pos-aux', 'ventas-pos'], queryFn: getVentasPosAuxFn, enabled: enabled && enabledExtra });
};

export const useVentasGeneralAux = (enabledExtra = true) => {
  const enabled = useSucursalEnabled();
  return useQuery({
    queryKey: ['pos-aux', 'ventas-general'],
    queryFn: getVentasGeneralFn,
    enabled: enabled && enabledExtra,
    staleTime: 0,
    refetchOnMount: 'always',
  });
};

export const useVentasPosPaginadasAux = (params: VentasPosQuery, enabledExtra = true) => {
  const enabled = useSucursalEnabled();
  return useQuery({
    queryKey: ['pos-aux', 'ventas-pos-paginadas', params],
    queryFn: () => getVentasPosPaginadasAuxFn(params),
    enabled: enabled && enabledExtra,
  });
};

export const useDespachosAux = (enabledExtra = true) => {
  const enabled = useSucursalEnabled();
  return useQuery({ queryKey: ['pos-aux', 'despachos'], queryFn: getDespachosFn, enabled: enabled && enabledExtra });
};

export const useNotasCreditoAux = (enabledExtra = true) => {
  const enabled = useSucursalEnabled();
  return useQuery({ queryKey: ['pos-aux', 'notas-credito'], queryFn: getNotasCreditoFn, enabled: enabled && enabledExtra });
};

export const useReportesAux = (params: ReporteQuery, enabledExtra = true) => {
  const enabled = useSucursalEnabled();
  const queryKey = ['pos-aux', 'reportes', params];
  const resumen = useQuery({ queryKey: [...queryKey, 'resumen'], queryFn: () => getReporteResumenFn(params), enabled: enabled && enabledExtra });
  const productos = useQuery({ queryKey: [...queryKey, 'productos'], queryFn: () => getReporteProductosFn(params), enabled: enabled && enabledExtra });
  const notasCredito = useQuery({ queryKey: [...queryKey, 'notas-credito'], queryFn: () => getReporteNotasCreditoFn(params), enabled: enabled && enabledExtra });
  return { resumen, productos, notasCredito };
};

export const useReporteCajas = (params: ReporteQuery, enabledExtra = true) => {
  const enabled = useSucursalEnabled();
  return useQuery({
    queryKey: ['pos-aux', 'reportes', 'cajas', params],
    queryFn: () => getReporteCajasFn(params),
    enabled: enabled && enabledExtra,
    placeholderData: (prev) => prev,
  });
};

export const useReporteVentasPorDia = (params: ReporteQuery, enabledExtra = true) => {
  const enabled = useSucursalEnabled();
  return useQuery({
    queryKey: ['pos-aux', 'reportes', 'ventas-por-dia', params],
    queryFn: () => getReporteVentasPorDiaFn(params),
    enabled: enabled && enabledExtra,
  });
};

export const useReporteMediosPago = (params: ReporteQuery, enabledExtra = true) => {
  const enabled = useSucursalEnabled();
  return useQuery({
    queryKey: ['pos-aux', 'reportes', 'medios-pago', params],
    queryFn: () => getReporteMediosPagoFn(params),
    enabled: enabled && enabledExtra,
  });
};

export const useReporteEmpleados = (params: ReporteQuery, enabledExtra = true) => {
  const enabled = useSucursalEnabled();
  return useQuery({
    queryKey: ['pos-aux', 'reportes', 'empleados', params],
    queryFn: () => getReporteEmpleadosFn(params),
    enabled: enabled && enabledExtra,
  });
};

export const useReporteProductosCaja = (cajaId: string | null, params: ReporteQuery) => {
  const enabled = useSucursalEnabled();
  return useQuery({
    queryKey: ['pos-aux', 'reportes', 'productos-caja', cajaId, params],
    queryFn: () => getReporteProductosFn({ ...params, caja_id: cajaId! }),
    enabled: enabled && !!cajaId,
    placeholderData: (prev) => prev,
  });
};

export const useReporteDiferenciasCaja = (params: ReporteQuery, enabledExtra = true) => {
  const enabled = useSucursalEnabled();
  return useQuery({
    queryKey: ['pos-aux', 'reportes', 'diferencias-caja', params],
    queryFn: () => getReporteDiferenciasCajaFn(params),
    enabled: enabled && enabledExtra,
    placeholderData: (prev) => prev,
  });
};

export const useReporteCobrosPendientes = (enabledExtra = true) => {
  const enabled = useSucursalEnabled();
  return useQuery({
    queryKey: ['pos-aux', 'reportes', 'cobros-pendientes'],
    queryFn: getReporteCobrosPendientesFn,
    enabled: enabled && enabledExtra,
  });
};

export const useExportarCobrosPendientes = () => {
  return useMutation({
    mutationFn: exportarCobrosPendientesFn,
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'cobros-pendientes.xlsx';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Exportación descargada');
    },
    onError: () => toast.error('No se pudo exportar el reporte'),
  });
};

export const useExportarNotasCredito = () => {
  return useMutation({
    mutationFn: exportarNotasCreditoFn,
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'notas-credito.xlsx';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Exportación descargada');
    },
    onError: () => toast.error('No se pudo exportar el reporte'),
  });
};

export const useAuditoriaAux = (params: AuditoriaQuery, enabledExtra: boolean = true) => {
  const enabled = useSucursalEnabled();
  return useQuery({
    queryKey: ['pos-aux', 'auditoria', params],
    queryFn: () => getAuditoriaFn(params),
    enabled: enabled && enabledExtra,
  });
};

export const useClientesCuentaCorrienteAux = () => {
  const enabled = useSucursalEnabled();
  return useQuery({
    queryKey: ['pos-aux', 'cuenta-corriente', 'clientes'],
    queryFn: getClientesCuentaCorrienteFn,
    enabled,
  });
};

export const useMovimientosCuentaCorrienteAux = (clienteId?: string | null) => {
  const enabled = useSucursalEnabled();
  return useQuery({
    queryKey: ['pos-aux', 'cuenta-corriente', 'movimientos', clienteId],
    queryFn: () => getMovimientosCuentaCorrienteFn(clienteId!),
    enabled: enabled && !!clienteId,
  });
};

export const useListasPrecioAux = () => {
  const enabled = useSucursalEnabled();
  return useQuery({
    queryKey: ['pos-aux', 'listas-precio'],
    queryFn: getListasPrecioAuxFn,
    enabled,
  });
};

export const useConfiguracionPos = () => {
  const sucursalId = useAuthStore((state) => state.sucursalActiva?.id);
  return useQuery({
    queryKey: ['pos-aux', 'configuracion-pos', sucursalId],
    queryFn: () => getConfiguracionPosFn(sucursalId!),
    enabled: !!sucursalId,
    retry: false,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });
};

export const useConfiguracionEmail = () => {
  const sucursalId = useAuthStore((state) => state.sucursalActiva?.id);
  return useQuery({
    queryKey: ['pos-aux', 'configuracion-email', sucursalId],
    queryFn: () => getConfiguracionEmailFn(sucursalId!),
    enabled: !!sucursalId,
    retry: false,
    staleTime: 0,
    refetchOnMount: 'always',
  });
};

export const useConfiguracionCloudinary = () => {
  const sucursalId = useAuthStore((state) => state.sucursalActiva?.id);
  return useQuery({
    queryKey: ['pos-aux', 'configuracion-cloudinary', sucursalId],
    queryFn: () => getConfiguracionCloudinaryFn(sucursalId!),
    enabled: !!sucursalId,
    retry: false,
    staleTime: 0,
    refetchOnMount: 'always',
  });
};

export const useServiciosSucursal = (enabledExtra = true) => {
  const sucursalId = useAuthStore((state) => state.sucursalActiva?.id);
  return useQuery({
    queryKey: ['pos-aux', 'servicios-sucursal', sucursalId],
    queryFn: getEstadoServiciosSucursalFn,
    enabled: !!sucursalId && enabledExtra,
    staleTime: 0,
    refetchOnMount: 'always',
  });
};

export const usePosAuxMutation = () => {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['pos-aux'] });
    queryClient.invalidateQueries({ queryKey: ['pos'] });
  };
  const common = {
    onSuccess: () => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: ['pos-aux', 'caja-resumen'] });
      toast.success('Operacion realizada correctamente');
    },
    onError: (error: AxiosError<IErrorResponse>) => toast.error(message(error)),
  };

  return {
    abrirCaja: useMutation({ mutationFn: abrirCajaAuxFn, ...common }),
    cerrarCaja: useMutation({ mutationFn: cerrarCajaFn, ...common }),
    movimientoCaja: useMutation({ mutationFn: registrarMovimientoCajaFn, ...common }),
    consumoInterno: useMutation({
      mutationFn: registrarConsumoInternoFn,
      onSuccess: () => {
        invalidate();
        queryClient.invalidateQueries({ queryKey: ['products'] });
        toast.success('Consumo interno registrado correctamente');
      },
      onError: (error: AxiosError<IErrorResponse>) => toast.error(message(error)),
    }),
    cambiarCotizacion: useMutation({ mutationFn: cambiarCotizacionFn, ...common }),
    vencerCotizaciones: useMutation({ mutationFn: vencerCotizacionesFn, ...common }),
    anularFiscal: useMutation({ mutationFn: anularFiscalFn, ...common }),
    emitirComprobanteVenta: useMutation({ mutationFn: emitirComprobanteVentaAuxFn, ...common }),
    actualizarComprobante: useMutation({ mutationFn: actualizarComprobanteAuxFn, ...common }),
    enviarComprobanteEmail: useMutation({
      mutationFn: enviarComprobanteEmailFn,
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['pos-aux', 'auditoria'] });
        toast.success(data.message || 'Comprobante enviado por email');
      },
      onError: (error: AxiosError<IErrorResponse>) => toast.error(message(error)),
    }),
    crearDespacho: useMutation({ mutationFn: crearDespachoFn, ...common }),
    anularDespacho: useMutation({ mutationFn: anularDespachoFn, ...common }),
    entregarDespacho: useMutation({ mutationFn: entregarDespachoFn, ...common }),
    crearNotaCredito: useMutation({ mutationFn: crearNotaCreditoSimpleFn, ...common }),
    registrarPagoCuentaCorriente: useMutation({ mutationFn: registrarPagoCuentaCorrienteFn, ...common }),
    registrarCargoCuentaCorriente: useMutation({ mutationFn: registrarCargoCuentaCorrienteFn, ...common }),
    registrarAjusteCuentaCorriente: useMutation({ mutationFn: registrarAjusteCuentaCorrienteFn, ...common }),
    calcularRecargosCuentaCorriente: useMutation({ mutationFn: calcularRecargosCuentaCorrienteFn, ...common }),
    omitirRecargoCuentaCorriente: useMutation({ mutationFn: omitirRecargoCuentaCorrienteFn, ...common }),
    enviarResumenCuentaCorrienteEmail: useMutation({
      mutationFn: enviarResumenCuentaCorrienteEmailFn,
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['pos-aux', 'auditoria'] });
        toast.success(data.message || 'Resumen enviado por email');
      },
      onError: (error: AxiosError<IErrorResponse>) => toast.error(message(error)),
    }),
    crearListaPrecio: useMutation({ mutationFn: crearListaPrecioAuxFn, ...common }),
    actualizarListaPrecio: useMutation({ mutationFn: actualizarListaPrecioAuxFn, ...common }),
    eliminarListaPrecio: useMutation({ mutationFn: eliminarListaPrecioAuxFn, ...common }),
    crearConfiguracionPos: useMutation({
      mutationFn: crearConfiguracionPosFn,
      onSuccess: (data) => {
        queryClient.setQueryData(
          ['pos-aux', 'configuracion-pos', data.sucursal_id],
          data,
        );
        toast.success('Configuracion guardada correctamente');
      },
      onError: (error: AxiosError<IErrorResponse>) => {
        toast.error(message(error));
      },
    }),
    actualizarConfiguracionPos: useMutation({
      mutationFn: actualizarConfiguracionPosFn,
      onSuccess: (data) => {
        queryClient.setQueryData(
          ['pos-aux', 'configuracion-pos', data.sucursal_id],
          data,
        );
        toast.success('Configuracion actualizada correctamente');
      },
      onError: (error: AxiosError<IErrorResponse>) => {
        toast.error(message(error));
      },
    }),
    guardarConfiguracionEmail: useMutation({
      mutationFn: guardarConfiguracionEmailFn,
      onSuccess: (data) => {
        queryClient.setQueryData(
          ['pos-aux', 'configuracion-email', data.sucursal_id],
          data,
        );
        invalidate();
        toast.success('Configuracion de email guardada correctamente');
      },
      onError: (error: AxiosError<IErrorResponse>) => toast.error(message(error)),
    }),
    probarConfiguracionEmail: useMutation({
      mutationFn: probarConfiguracionEmailFn,
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['pos-aux', 'configuracion-email'] });
        toast.success(data.message || 'Correo de prueba enviado correctamente');
      },
      onError: (error: AxiosError<IErrorResponse>) => toast.error(message(error)),
    }),
    guardarConfiguracionCloudinary: useMutation({
      mutationFn: guardarConfiguracionCloudinaryFn,
      onSuccess: (data) => {
        queryClient.setQueryData(
          ['pos-aux', 'configuracion-cloudinary', data.sucursal_id],
          data,
        );
        invalidate();
        toast.success('Configuracion de Cloudinary guardada correctamente');
      },
      onError: (error: AxiosError<IErrorResponse>) => toast.error(message(error)),
    }),
    probarConfiguracionCloudinary: useMutation({
      mutationFn: probarConfiguracionCloudinaryFn,
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['pos-aux', 'configuracion-cloudinary'] });
        toast.success(data.message || 'Cloudinary verificado correctamente');
      },
      onError: (error: AxiosError<IErrorResponse>) => toast.error(message(error)),
    }),
  };
};
