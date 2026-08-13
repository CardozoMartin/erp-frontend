import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';
import type { IErrorResponse } from '../../../type/api.response.type';
import {
  ejecutarBackupFn,
  getBackupConfigFn,
  getBackupHistorialFn,
  guardarBackupConfigFn,
  probarBackupConexionFn,
} from '../api/backup.api';

const errMsg = (e: AxiosError<IErrorResponse>) =>
  e.response?.data?.mensaje || 'No se pudo completar la operación';

export const useBackupConfig = () =>
  useQuery({
    queryKey: ['backup', 'config'],
    queryFn: getBackupConfigFn,
    retry: false,
    staleTime: 30_000,
  });

export const useBackupHistorial = (limit = 20) =>
  useQuery({
    queryKey: ['backup', 'historial', limit],
    queryFn: () => getBackupHistorialFn(limit),
    refetchInterval: 8_000, // refresca cada 8s para ver el estado EN_PROCESO
  });

export const useBackupMutations = () => {
  const queryClient = useQueryClient();
  const invalidar = () => {
    queryClient.invalidateQueries({ queryKey: ['backup'] });
  };

  return {
    guardarConfig: useMutation({
      mutationFn: guardarBackupConfigFn,
      onSuccess: () => {
        invalidar();
        toast.success('Configuración de backup guardada');
      },
      onError: (e: AxiosError<IErrorResponse>) => toast.error(errMsg(e)),
    }),

    probarConexion: useMutation({
      mutationFn: probarBackupConexionFn,
      onSuccess: (data) => {
        if (data.ok) toast.success(data.mensaje);
        else toast.error(data.mensaje);
        invalidar();
      },
      onError: (e: AxiosError<IErrorResponse>) => toast.error(errMsg(e)),
    }),

    ejecutarBackup: useMutation({
      mutationFn: ejecutarBackupFn,
      onSuccess: () => {
        toast.success('Backup iniciado — puede tardar unos segundos');
        invalidar();
      },
      onError: (e: AxiosError<IErrorResponse>) => toast.error(errMsg(e)),
    }),
  };
};
