import { api } from '../../../api/ApiBase';
import type { ISuccessResponse } from '../../../type/api.response.type';
import type { IOferta } from '../types/productos.type';

export interface ICrearOfertaPayload {
  producto_id: string;
  variante_id?: string | null;
  precio_oferta: number;
  fecha_inicio: string;
  fecha_fin: string;
  activo: boolean;
  cantidad_maxima?: number | null;
}

export const crearOfertaFn = async (payload: ICrearOfertaPayload): Promise<IOferta> => {
  const { data } = await api.post<ISuccessResponse<IOferta>>('/oferta', payload);
  return data.data;
};

export const actualizarOfertaFn = async (id: string, payload: Partial<ICrearOfertaPayload>): Promise<IOferta> => {
  const { data } = await api.patch<ISuccessResponse<IOferta>>(`/oferta/${id}`, payload);
  return data.data;
};

export const eliminarOfertaFn = async (id: string): Promise<void> => {
  await api.delete(`/oferta/${id}`);
};
