import { api } from '../../../api/ApiBase';
import type { ISuccessResponse } from '../../../type/api.response.type';

export type IAlertaStock = {
  id: string;
  producto_id: string;
  variante_id: string | null;
  sucursal_id: string | null;
  cantidad: number;
  cantidad_minima: number;
  deposito: string | null;
  pasillo: string | null;
  estante: string | null;
  sector: string | null;
  codigo_ubicacion: string | null;
  ubicacion_referencia: string | null;
  producto: {
    id: string;
    nombre: string;
    codigo_barras: string | null;
    unidad_venta: string;
    es_fraccionable: boolean;
  };
  variante: { id: string; sku: string } | null;
};

export type IStockOtraSucursal = {
  sucursal_id: string;
  nombre: string;
  cantidad: number;
  variante: string | null;
};

export const getAlertasStockFn = async (): Promise<IAlertaStock[]> => {
  const { data } = await api.get<ISuccessResponse<IAlertaStock[]>>('/stock/alertas');
  return data.data;
};

export const getConteoAlertasStockFn = async (): Promise<number> => {
  const { data } = await api.get<ISuccessResponse<number>>('/stock/alertas/conteo');
  return data.data;
};

export const getStockOtrasSucursalesFn = async (productoId: string): Promise<IStockOtraSucursal[]> => {
  const { data } = await api.get<ISuccessResponse<IStockOtraSucursal[]>>(
    `/stock/producto/${productoId}/otras-sucursales`,
  );
  return data.data;
};
