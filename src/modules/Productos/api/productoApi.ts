import { api } from "../../../api/ApiBase";
import type { IProducto } from "../types/productos.type";


// Funcion para crear un nuevo producto
export const postProductoFn = async (productoData: IProducto) => {
  const { data } = await api.post('/producto', productoData);
  return data;
}
