import { api } from '../../../api/ApiBase';
import type { ISuccessResponse } from '../../../type/api.response.type';
import type { ISucursal } from '../types/sucursal.type';

export type INewSucursalPayload = Omit<ISucursal, 'id' | 'creado_en'>;

export const getSucursalesFn = async (page: number = 1, limit: number = 30) => {
  const response = await api.get<ISuccessResponse<ISucursal[]>>('/sucursales', {
    params: { page, limit },
  });
  return response.data;
};

export const postSucursalFn = async (data: INewSucursalPayload) => {
  const response = await api.post<ISuccessResponse<ISucursal>>('/sucursales', data);
  return response.data;
};
