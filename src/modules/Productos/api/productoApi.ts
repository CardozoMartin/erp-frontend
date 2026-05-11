import { api } from '../../../api/ApiBase';
import type { ISuccessResponse } from '../../../type/api.response.type';
import type { IProducto } from '../types/productos.type';

// Funcion para crear un nuevo producto
export const postProductoFn = async (productoData: IProducto) => {
  const { data } = await api.post<ISuccessResponse<IProducto>>('/producto', productoData);
  return data;
};

//funcion para obtener todos los productos con paginacion
export const getProductosFn = async (page: number = 1, limit: number = 30) => {
  const response = await api.get<ISuccessResponse<IProducto[]>>('/producto', {
    params: {
      page,
      limit,
    },
  });
  console.log('Respuesta del servidor:', response.data);
  return response.data;
};
