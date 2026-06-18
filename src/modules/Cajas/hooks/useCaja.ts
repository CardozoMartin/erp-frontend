import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { toast } from 'sonner';
import { useAuthStore } from '../../../store/auth.store';
import type { IErrorResponse } from '../../../type/api.response.type';
import {
  abrirCajaFn,
  cerrarCajaFn,
  getAuditoriaCajaFn,
  getCajaAbiertaFn,
  getCajasAbiertasFn,
  getCajasFn,
  getPedidosCajaFn,
  getResumenCajaFn,
  registrarConsumoInternoFn,
  registrarMovimientoCajaFn,
} from '../api/caja.api';
import type { AuditoriaCajaQuery, CajaQuery } from '../types/caja.type';

const message = (error: AxiosError<IErrorResponse>) => {
  const data = error.response?.data;
  return data?.message || data?.mensaje || 'No se pudo completar la operacion';
};

const useSucursalEnabled = () => !!useAuthStore((state) => state.sucursalActiva?.id);

export const useCajas = (params: CajaQuery = {}, enabledExtra = true) => {
  const enabled = useSucursalEnabled();
  return useQuery({
    queryKey: ['cajas', params],
    queryFn: () => getCajasFn(params),
    enabled: enabled && enabledExtra,
  });
};

export const useCajasAbiertas = (enabledExtra = true) => {
  const enabled = useSucursalEnabled();
  return useQuery({
    queryKey: ['cajas', 'abiertas'],
    queryFn: getCajasAbiertasFn,
    enabled: enabled && enabledExtra,
  });
};

export const useCajaAbierta = (enabledExtra = true) => {
  const enabled = useSucursalEnabled();
  return useQuery({
    queryKey: ['cajas', 'abierta'],
    queryFn: getCajaAbiertaFn,
    enabled: enabled && enabledExtra,
  });
};

export const useResumenCaja = (cajaId?: string | null, enabledExtra = true) => {
  const enabled = useSucursalEnabled();
  return useQuery({
    queryKey: ['cajas', 'resumen', cajaId],
    queryFn: () => getResumenCajaFn(cajaId!),
    enabled: enabled && enabledExtra && !!cajaId,
  });
};

export const usePedidosCaja = (cajaId?: string | null, enabledExtra = true) => {
  const enabled = useSucursalEnabled();
  return useQuery({
    queryKey: ['cajas', 'pedidos', cajaId],
    queryFn: () => getPedidosCajaFn(cajaId!),
    enabled: enabled && enabledExtra && !!cajaId,
  });
};

export const useAuditoriaCaja = (params: AuditoriaCajaQuery, enabledExtra = true) => {
  const enabled = useSucursalEnabled();
  return useQuery({
    queryKey: ['cajas', 'auditoria', params],
    queryFn: () => getAuditoriaCajaFn(params),
    enabled: enabled && enabledExtra,
  });
};

export const useCajaMutations = () => {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['cajas'] });
    queryClient.invalidateQueries({ queryKey: ['pos'] });
    queryClient.invalidateQueries({ queryKey: ['pos-aux'] });
  };
  const common = {
    onSuccess: () => {
      invalidate();
      toast.success('Operacion realizada correctamente');
    },
    onError: (error: AxiosError<IErrorResponse>) => toast.error(message(error)),
  };

  return {
    abrirCaja: useMutation({ mutationFn: abrirCajaFn, ...common }),
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
  };
};
