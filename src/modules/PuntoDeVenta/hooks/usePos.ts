import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { toast } from 'sonner';
import type { IErrorResponse } from '../../../type/api.response.type';
import { useAuthStore } from '../../../store/auth.store';
import {
  abrirCajaFn,
  asignarCajaPendienteFn,
  cancelarVentaPendienteFn,
  cancelarOrdenMercadoPagoQrFn,
  consultarEstadoMercadoPagoQrFn,
  cobrarVentaPendienteFn,
  crearOrdenMercadoPagoQrFn,
  crearCotizacionFn,
  crearVentaCuentaCorrienteFn,
  crearVentaPendienteFn,
  crearVentaQrFn,
  editarVentaPendienteFn,
  getCajaAbiertaFn,
  getClientesPosFn,
  getListasPrecioPosFn,
  getMediosPagoActivosFn,
  getVentasCajaFn,
  getVentasPendientesCobroFn,
  getVentaPosFn,
  ventaCompletaFn,
  tomarVentaFn,
  liberarVentaFn,
} from '../api/pos.api';

const getErrorMessage = (error: AxiosError<IErrorResponse>) => {
  const data = error.response?.data as IErrorResponse | undefined;
  return (
    data?.message ||
    data?.mensaje ||
    (Array.isArray(data?.errores) ? data.errores.join(', ') : undefined) ||
    'No se pudo completar la operacion'
  );
};

export const useCajaAbierta = () => {
  const sucursalActivaId = useAuthStore((state) => state.sucursalActiva?.id);
  return useQuery({
    queryKey: ['pos', 'caja-abierta', sucursalActivaId],
    queryFn: getCajaAbiertaFn,
    enabled: !!sucursalActivaId,
  });
};

export const useMediosPagoActivos = () => {
  return useQuery({
    queryKey: ['pos', 'medios-pago'],
    queryFn: getMediosPagoActivosFn,
  });
};

export const useClientesPos = () => {
  const sucursalActivaId = useAuthStore((state) => state.sucursalActiva?.id);
  return useQuery({
    queryKey: ['pos', 'clientes', sucursalActivaId],
    queryFn: getClientesPosFn,
    enabled: !!sucursalActivaId,
  });
};

export const useListasPrecioPos = () => {
  const sucursalActivaId = useAuthStore((state) => state.sucursalActiva?.id);
  return useQuery({
    queryKey: ['pos', 'listas-precio', sucursalActivaId],
    queryFn: getListasPrecioPosFn,
    enabled: !!sucursalActivaId,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });
};

export const useVentasPendientesCobro = (enabledByPermission = true) => {
  const sucursalActivaId = useAuthStore((state) => state.sucursalActiva?.id);
  return useQuery({
    queryKey: ['pos', 'ventas-pendientes', sucursalActivaId],
    queryFn: getVentasPendientesCobroFn,
    enabled: !!sucursalActivaId && enabledByPermission,
    refetchInterval: 8000,
    staleTime: 0,
  });
};

export const useVentasCaja = (cajaId?: string | null) => {
  const sucursalActivaId = useAuthStore((state) => state.sucursalActiva?.id);
  return useQuery({
    queryKey: ['pos', 'ventas-caja', sucursalActivaId, cajaId],
    queryFn: () => getVentasCajaFn(cajaId!),
    enabled: !!sucursalActivaId && !!cajaId,
  });
};

export const useAbrirCaja = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: abrirCajaFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pos', 'caja-abierta'] });
      queryClient.invalidateQueries({ queryKey: ['pos', 'ventas-pendientes'] });
      toast.success('Caja abierta correctamente');
    },
    onError: (error: AxiosError<IErrorResponse>) => toast.error(getErrorMessage(error)),
  });
};

export const useCrearVentaPendiente = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: crearVentaPendienteFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pos', 'ventas-pendientes'] });
      toast.success('Venta enviada a caja');
    },
    onError: (error: AxiosError<IErrorResponse>) => toast.error(getErrorMessage(error)),
  });
};

export const useCrearVentaQr = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: crearVentaQrFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pos', 'ventas-pendientes'] });
      toast.success('Venta QR creada');
    },
    onError: (error: AxiosError<IErrorResponse>) => toast.error(getErrorMessage(error)),
  });
};

export const useCrearVentaCuentaCorriente = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: crearVentaCuentaCorrienteFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['pos', 'ventas-pendientes'] });
      queryClient.invalidateQueries({ queryKey: ['pos', 'ventas-caja'] });
      queryClient.invalidateQueries({ queryKey: ['pos', 'caja-abierta'] });
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      toast.success('Venta cargada a cuenta corriente');
    },
    onError: (error: AxiosError<IErrorResponse>) => toast.error(getErrorMessage(error)),
  });
};

export const useCrearCotizacion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: crearCotizacionFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cotizaciones'] });
      toast.success('Cotizacion creada correctamente');
    },
    onError: (error: AxiosError<IErrorResponse>) => toast.error(getErrorMessage(error)),
  });
};

export const useVentaCompleta = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ventaCompletaFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['pos', 'ventas-pendientes'] });
      queryClient.invalidateQueries({ queryKey: ['pos', 'ventas-caja'] });
      queryClient.invalidateQueries({ queryKey: ['pos', 'caja-abierta'] });
      toast.success('Venta registrada correctamente');
    },
    onError: (error: AxiosError<IErrorResponse>) => toast.error(getErrorMessage(error)),
  });
};

export const useCobrarVentaPendiente = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cobrarVentaPendienteFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['pos', 'ventas-pendientes'] });
      queryClient.invalidateQueries({ queryKey: ['pos', 'ventas-caja'] });
      queryClient.invalidateQueries({ queryKey: ['pos', 'caja-abierta'] });
      queryClient.invalidateQueries({ queryKey: ['pos-aux'] });
      toast.success('Venta cobrada correctamente');
    },
    onError: (error: AxiosError<IErrorResponse>) => toast.error(getErrorMessage(error)),
  });
};

export const useCancelarVentaPendiente = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cancelarVentaPendienteFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pos', 'ventas-pendientes'] });
      queryClient.invalidateQueries({ queryKey: ['pos-aux', 'ventas-pos-paginadas'] });
      toast.success('Venta pendiente cancelada correctamente');
    },
    onError: (error: AxiosError<IErrorResponse>) => toast.error(getErrorMessage(error)),
  });
};

export const useTomarVenta = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tomarVentaFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pos', 'ventas-pendientes'] });
    },
    onError: (error: AxiosError<IErrorResponse>) => toast.error(getErrorMessage(error)),
  });
};

export const useLiberarVenta = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: liberarVentaFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pos', 'ventas-pendientes'] });
    },
  });
};

export const useAsignarCajaPendiente = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: asignarCajaPendienteFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pos', 'ventas-pendientes'] });
      toast.success('Venta asignada a la caja seleccionada');
    },
    onError: (error: AxiosError<IErrorResponse>) => toast.error(getErrorMessage(error)),
  });
};

export const useCrearOrdenMercadoPagoQr = () => {
  return useMutation({
    mutationFn: crearOrdenMercadoPagoQrFn,
    onSuccess: () => toast.success('Orden QR enviada a Mercado Pago'),
    onError: (error: AxiosError<IErrorResponse>) => toast.error(getErrorMessage(error)),
  });
};

export const useCancelarOrdenMercadoPagoQr = () => {
  return useMutation({
    mutationFn: cancelarOrdenMercadoPagoQrFn,
    onSuccess: () => toast.success('Orden QR cancelada'),
    onError: (error: AxiosError<IErrorResponse>) => toast.error(getErrorMessage(error)),
  });
};

export const useEditarVentaPendiente = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: editarVentaPendienteFn,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pos', 'ventas-pendientes'] });
      queryClient.invalidateQueries({ queryKey: ['pos-aux', 'venta', variables.ventaId] });
      toast.success('Venta actualizada correctamente');
    },
    onError: (error: AxiosError<IErrorResponse>) => toast.error(getErrorMessage(error)),
  });
};

export { getVentaPosFn };

export { consultarEstadoMercadoPagoQrFn };

export const usePollingEstadoQr = (params: { sucursalId: string; ventaId: string } | null) => {
  return useQuery({
    queryKey: ['pos', 'qr-estado', params?.ventaId],
    queryFn: () => consultarEstadoMercadoPagoQrFn({ sucursalId: params!.sucursalId, ventaId: params!.ventaId }),
    enabled: !!params,
    refetchInterval: (query) => {
      const estado = query.state.data?.estado;
      if (estado === 'aprobado' || estado === 'cancelado') return false;
      return 5000;
    },
    retry: false,
    staleTime: 0,
  });
};
