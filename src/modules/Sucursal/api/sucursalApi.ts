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
  console.log('Respuesta del servidor:', response.data);
  return response.data;
};

export const getSucursalFn = async (id: string) => {
  const response = await api.get<ISuccessResponse<ISucursal> | ISucursal>(`/sucursales/${id}`);
  return 'data' in response.data ? response.data.data : response.data;
};

export const updateSucursalFn = async (payload: { id: string; data: Partial<INewSucursalPayload> }) => {
  const response = await api.patch<ISuccessResponse<ISucursal> | ISucursal>(
    `/sucursales/${payload.id}`,
    payload.data,
  );
  return 'data' in response.data ? response.data.data : response.data;
};
