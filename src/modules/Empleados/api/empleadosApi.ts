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

export const getEmpleadosFn = async (
  page: number = 1,
  limit: number = 10,
): Promise<IEmpleadosPaginationResponse> => {
  const { data } = await api.get<IEmpleadosPaginationResponse>('/empleados', {
    params: { page, limit },
  });
  return data;
};
