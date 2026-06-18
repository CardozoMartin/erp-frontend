import type { AxiosError } from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { IErrorResponse } from '../../../type/api.response.type';
import { getErrorMessage } from '../../../api/ApiError';
import {
  asignarEmpleadoSucursalFn,
  desasignarEmpleadoSucursalFn,
  getEmpleadosFn,
  getRolesFn,
  getSucursalesActivasFn,
  postEmpleadoFn,
  putEmpleadoFn,
  setEmpleadoSucursalPrincipalFn,
  getPermisosFn,
  asignarPermisoFn,
  removerPermisoFn,
  resetPasswordFn,
} from '../api/empleadosApi';
import type { ICreateEmpleadoPayload } from '../types/empleado.type';

export const useGetRoles = () =>
  useQuery({
    queryKey: ['empleados', 'roles'],
    queryFn: getRolesFn,
  });

export const useGetPermisos = () =>
  useQuery({
    queryKey: ['empleados', 'permisos'],
    queryFn: getPermisosFn,
  });

export const useGetEmpleados = (page: number = 1, limit: number = 10, enabled: boolean = true) =>
  useQuery({
    queryKey: ['empleados', 'list', page, limit],
    queryFn: () => getEmpleadosFn(page, limit),
    enabled,
  });

export const useGetSucursalesActivas = () =>
  useQuery({
    queryKey: ['empleados', 'sucursales'],
    queryFn: () => getSucursalesActivasFn(),
  });

export const usePostEmpleado = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ICreateEmpleadoPayload) => postEmpleadoFn(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empleados'] });
      toast.success('Empleado creado correctamente');
    },
    onError: (error: AxiosError<IErrorResponse>) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const usePutEmpleado = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Partial<ICreateEmpleadoPayload>) => putEmpleadoFn(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empleados'] });
      toast.success('Empleado actualizado correctamente');
    },
    onError: (error: AxiosError<IErrorResponse>) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useAsignarEmpleadoSucursal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      empleadoId,
      sucursalId,
      esPrincipal = false,
    }: {
      empleadoId: string;
      sucursalId: string;
      esPrincipal?: boolean;
    }) => asignarEmpleadoSucursalFn(empleadoId, sucursalId, esPrincipal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["empleados"] });
      toast.success("Sucursal asignada correctamente");
    },
    onError: (error: AxiosError<IErrorResponse>) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useSetEmpleadoSucursalPrincipal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      empleadoId,
      sucursalId,
    }: {
      empleadoId: string;
      sucursalId: string;
    }) => setEmpleadoSucursalPrincipalFn(empleadoId, sucursalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["empleados"] });
      toast.success("Sucursal principal actualizada");
    },
    onError: (error: AxiosError<IErrorResponse>) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useDesasignarEmpleadoSucursal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      empleadoId,
      sucursalId,
    }: {
      empleadoId: string;
      sucursalId: string;
    }) => desasignarEmpleadoSucursalFn(empleadoId, sucursalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["empleados"] });
      toast.success("Acceso a sucursal quitado");
    },
    onError: (error: AxiosError<IErrorResponse>) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useAsignarPermiso = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      empleadoId,
      permisoId,
      tipo = 'grant',
    }: {
      empleadoId: string;
      permisoId: string;
      tipo?: 'grant' | 'revoke';
    }) => asignarPermisoFn(empleadoId, permisoId, tipo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["empleados"] });
      toast.success("Permiso asignado correctamente");
    },
    onError: (error: AxiosError<IErrorResponse>) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useRemoverPermiso = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      empleadoId,
      permisoId,
    }: {
      empleadoId: string;
      permisoId: string;
    }) => removerPermisoFn(empleadoId, permisoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["empleados"] });
      toast.success("Permiso removido correctamente");
    },
    onError: (error: AxiosError<IErrorResponse>) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useResetPassword = (id: string) => {
  return useMutation({
    mutationFn: () => resetPasswordFn(id),
    onError: (error: AxiosError<IErrorResponse>) => {
      toast.error(getErrorMessage(error));
    },
  });
};
