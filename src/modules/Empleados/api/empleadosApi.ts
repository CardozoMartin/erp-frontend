import { api } from '../../../api/ApiBase';
import type { ISuccessResponse } from '../../../type/api.response.type';
import type {
  ICreateEmpleadoPayload,
  IEmpleado,
  IEmpleadosPaginationResponse,
  IEmpleadoRol,
} from '../types/empleado.type';
import type { ISucursal } from '../../Sucursal/types/sucursal.type';

export const getRolesFn = async (): Promise<IEmpleadoRol[]> => {
  const { data } = await api.get<IEmpleadoRol[]>('/roles');
  return data;
};

export const getPermisosFn = async () => {
  const { data } = await api.get('/permisos');
  return data;
};

export const getSucursalesActivasFn = async (
  page: number = 1,
  limit: number = 100,
): Promise<ISucursal[]> => {
  const response = await api.get<ISuccessResponse<ISucursal[]> | ISucursal[]>(
    '/sucursales',
    {
      params: { page, limit },
    },
  );

  const sucursales = Array.isArray(response.data)
    ? response.data
    : response.data.data;

  return sucursales.filter((sucursal) => sucursal.activa);
};

export const postEmpleadoFn = async (
  payload: ICreateEmpleadoPayload,
): Promise<IEmpleado> => {
  const { data } = await api.post<IEmpleado>('/empleados', payload);
  return data;
};

export const asignarEmpleadoSucursalFn = async (
  empleadoId: string,
  sucursalId: string,
  esPrincipal: boolean = false,
) => {
  const { data } = await api.post(`/empleados/${empleadoId}/sucursales`, {
    sucursalId,
    esPrincipal,
  });
  return data;
};

export const setEmpleadoSucursalPrincipalFn = async (
  empleadoId: string,
  sucursalId: string,
) => {
  const { data } = await api.patch(
    `/empleados/${empleadoId}/sucursales/principal`,
    { sucursalId },
  );
  return data;
};

export const desasignarEmpleadoSucursalFn = async (
  empleadoId: string,
  sucursalId: string,
) => {
  const { data } = await api.delete(`/empleados/${empleadoId}/sucursales`, {
    data: { sucursalId },
  });
  return data;
};

export const getEmpleadosFn = async (
  page: number = 1,
  limit: number = 10,
): Promise<IEmpleadosPaginationResponse> => {
  const { data } = await api.get<IEmpleadosPaginationResponse>('/empleados', {
    params: { page, limit },
  });
  return data;
};

export const putEmpleadoFn = async (
  id: string,
  payload: Partial<ICreateEmpleadoPayload>,
): Promise<IEmpleado> => {
  const { data } = await api.patch<IEmpleado>(`/empleados/${id}`, payload);
  return data;
}

export const asignarPermisoFn = async (
  empleadoId: string,
  permisoId: string,
  tipo: 'grant' | 'revoke' = 'grant',
) => {
  const { data } = await api.post(`/empleados/${empleadoId}/permisos`, {
    permisoId,
    tipo,
  });
  return data;
};

export const removerPermisoFn = async (
  empleadoId: string,
  permisoId: string,
) => {
  const { data } = await api.delete(`/empleados/${empleadoId}/permisos/${permisoId}`);
  return data;
};

export const resetPasswordFn = async (
  id: string,
): Promise<{ mensaje: string; contrasenaGenerada: string }> => {
  const { data } = await api.patch<{ mensaje: string; contrasenaGenerada: string }>(
    `/empleados/${id}/reset-password`,
  );
  return data;
};
