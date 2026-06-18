import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { toast } from 'sonner';
import type { IErrorResponse } from '../../../type/api.response.type';
import {
  createClienteFn,
  getClientesFn,
  setAccionLegalClienteFn,
  setBloqueoClienteFn,
  toggleActivoClienteFn,
  toggleCuentaCorrienteFn,
  updateClienteFn,
} from '../api/clientes.api';

const message = (error: AxiosError<IErrorResponse>) => {
  const data = error.response?.data as any;
  return data?.message || data?.mensaje || 'No se pudo completar la operacion';
};

export const useClientes = () =>
  useQuery({
    queryKey: ['clientes'],
    queryFn: getClientesFn,
  });

export const useClienteMutations = () => {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['clientes'] });
    queryClient.invalidateQueries({ queryKey: ['pos', 'clientes'] });
    queryClient.invalidateQueries({ queryKey: ['pos-aux', 'cuenta-corriente'] });
  };
  const common = {
    onSuccess: () => { invalidate(); toast.success('Cliente guardado correctamente'); },
    onError: (error: AxiosError<IErrorResponse>) => toast.error(message(error)),
  };

  return {
    create: useMutation({ mutationFn: createClienteFn, ...common }),
    update: useMutation({ mutationFn: updateClienteFn, ...common }),
    toggleActivo: useMutation({
      mutationFn: toggleActivoClienteFn,
      onSuccess: () => { invalidate(); },
      onError: (error: AxiosError<IErrorResponse>) => toast.error(message(error)),
    }),
    toggleCuentaCorriente: useMutation({
      mutationFn: toggleCuentaCorrienteFn,
      onSuccess: () => { invalidate(); toast.success('Cuenta corriente actualizada'); },
      onError: (error: AxiosError<IErrorResponse>) => toast.error(message(error)),
    }),
    setBloqueo: useMutation({
      mutationFn: setBloqueoClienteFn,
      onSuccess: () => { invalidate(); },
      onError: (error: AxiosError<IErrorResponse>) => toast.error(message(error)),
    }),
    setAccionLegal: useMutation({
      mutationFn: setAccionLegalClienteFn,
      onSuccess: () => { invalidate(); },
      onError: (error: AxiosError<IErrorResponse>) => toast.error(message(error)),
    }),
  };
};
