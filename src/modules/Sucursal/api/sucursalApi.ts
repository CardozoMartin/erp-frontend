import { api } from '../../../api/ApiBase';
import type { ISuccessResponse } from '../../../type/api.response.type';
import type { ISucursal } from '../types/sucursal.type';

export type INewSucursalPayload = Omit<ISucursal, 'id' | 'creado_en'>;

export const getSucursalesFn = async (page: number = 1, limit: number = 30) => {
  const response = await api.get<ISuccessResponse<ISucursal[]> | ISucursal[]>('/sucursales', {
    params: { page, limit },
  });
  if (Array.isArray(response.data)) {
    return {
      ok: true,
      mensaje: 'Sucursales obtenidas correctamente',
      data: response.data,
      meta: {
        total: response.data.length,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(response.data.length / limit)),
      },
    } satisfies ISuccessResponse<ISucursal[]>;
  }
  return response.data;
};

export const postSucursalFn = async (data: INewSucursalPayload) => {
  const response = await api.post<ISuccessResponse<ISucursal>>('/sucursales', data);
  return response.data;
};
