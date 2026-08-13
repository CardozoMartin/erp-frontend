import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';
import type { IErrorResponse } from '../../../type/api.response.type';
import {
  cambiarArcaAmbienteFn,
  getArcaResumenFn,
  guardarArcaCredencialesFn,
  probarArcaConexionFn,
} from '../api/arca.api';

export const ARCA_KEYS = {
  todos: ['arca'] as const,
  resumen: (sucursalId: string) => ['arca', 'resumen', sucursalId] as const,
};

const errMsg = (e: AxiosError<IErrorResponse>) =>
  e.response?.data?.mensaje || 'No se pudo completar la operación';

/** Resumen de configuración ARCA de la sucursal — sin cert ni clave */
export const useArcaResumen = (sucursalId?: string) =>
  useQuery({
    queryKey: ARCA_KEYS.resumen(sucursalId ?? ''),
    queryFn: () => getArcaResumenFn(sucursalId!),
    enabled: !!sucursalId,
    retry: false,
    staleTime: 30_000,
  });

export const useArcaMutations = () => {
  const queryClient = useQueryClient();
  const invalidar = () => {
    queryClient.invalidateQueries({ queryKey: ARCA_KEYS.todos });
  };

  return {
    guardarCredenciales: useMutation({
      mutationFn: guardarArcaCredencialesFn,
      onSuccess: () => {
        invalidar();
        toast.success('Credenciales guardadas — probá la conexión para activar');
      },
      onError: (e: AxiosError<IErrorResponse>) => toast.error(errMsg(e)),
    }),

    probarConexion: useMutation({
      mutationFn: probarArcaConexionFn,
      onSuccess: (data) => {
        if (data.ok) toast.success(data.mensaje);
        else toast.error(data.mensaje);
        invalidar();
      },
      onError: (e: AxiosError<IErrorResponse>) => toast.error(errMsg(e)),
    }),

    cambiarAmbiente: useMutation({
      mutationFn: cambiarArcaAmbienteFn,
      onSuccess: () => {
        invalidar();
        toast.success('Ambiente actualizado — hay que volver a probar la conexión');
      },
      onError: (e: AxiosError<IErrorResponse>) => toast.error(errMsg(e)),
    }),
  };
};
