import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { toast } from 'sonner';
import { useAuthStore } from '../../../store/auth.store';
import type { IErrorResponse } from '../../../type/api.response.type';
import {
  cambiarEstadoPedidoEnvioFn,
  crearPedidoEnvioFn,
  editarPedidoEnvioFn,
  getHistorialPedidoEnvioFn,
  getPedidosEnvioFn,
  rendirPedidoEnvioFn,
} from '../api/pedidosEnvio.api';

const message = (error: AxiosError<IErrorResponse>) => {
  const data = error.response?.data;
  return data?.message || data?.mensaje || 'No se pudo completar la operacion';
};

const useSucursalEnabled = () => !!useAuthStore((state) => state.sucursalActiva?.id);

export const usePedidosEnvio = () => {
  const enabled = useSucursalEnabled();
  return useQuery({
    queryKey: ['pedidos-envio'],
    queryFn: getPedidosEnvioFn,
    enabled,
  });
};

export const useHistorialPedidoEnvio = (pedidoId?: string | null) => {
  const enabled = useSucursalEnabled();
  return useQuery({
    queryKey: ['pedidos-envio', 'historial', pedidoId],
    queryFn: () => getHistorialPedidoEnvioFn(pedidoId!),
    enabled: enabled && !!pedidoId,
  });
};

export const usePedidosEnvioMutations = () => {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['pedidos-envio'] });
    queryClient.invalidateQueries({ queryKey: ['pedidos-envio', 'historial'] });
    queryClient.invalidateQueries({ queryKey: ['cajas'] });
    queryClient.invalidateQueries({ queryKey: ['pos-aux'] });
    queryClient.invalidateQueries({ queryKey: ['pos'] });
  };
  const common = {
    onSuccess: () => {
      invalidate();
      toast.success('Pedido actualizado correctamente');
    },
    onError: (error: AxiosError<IErrorResponse>) => toast.error(message(error)),
  };

  return {
    crear: useMutation({ mutationFn: crearPedidoEnvioFn, ...common }),
    editar: useMutation({ mutationFn: editarPedidoEnvioFn, ...common }),
    cambiarEstado: useMutation({ mutationFn: cambiarEstadoPedidoEnvioFn, ...common }),
    rendir: useMutation({ mutationFn: rendirPedidoEnvioFn, ...common }),
  };
};
