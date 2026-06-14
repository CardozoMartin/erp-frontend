import { api } from '../../../api/ApiBase';
import type { ISuccessResponse } from '../../../type/api.response.type';

export type IAlertaStock = {
  id: string;
  producto_id: string;
  variante_id: string | null;
  sucursal_id: string | null;
  cantidad: number;
  cantidad_minima: number;
  producto: { id: string; nombre: string; codigo_barras: string | null };
  variante: { id: string; nombre: string } | null;
};

export const getAlertasStockFn = async (): Promise<IAlertaStock[]> => {
  const { data } = await api.get<ISuccessResponse<IAlertaStock[]>>('/stock/alertas');
  return data.data;
};

export const getConteoAlertasStockFn = async (): Promise<number> => {
  const { data } = await api.get<ISuccessResponse<number>>('/stock/alertas/conteo');
  return data.data;
};
