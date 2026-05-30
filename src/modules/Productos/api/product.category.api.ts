import { api } from "../../../api/ApiBase";
import type { IProductoCategory } from "../types/producto.category.type";


//Funcion para crear una categoria de producto
export const postCreateProductCategoryFn = async (data: IProductoCategory) => {
  const response = await api.post('/producto-categoria', data);
  return response.data;
}
//Funcion para actualizar una categoria de producto
export const putUpdateProductCategoryFn = async (id: number, data: IProductoCategory) => {
  const response = await api.patch(`/producto-categoria/${id}`, data);
  return response.data;
}

//Funcion para obtener todas las categorias
export const getAllProductCategoriesActivesFn = async (page:number = 1, limit:number = 10) => {
  const response = await api.get('/producto-categoria/activas', {
    params: {
      page,
      limit
    }
  });
  return response.data;
}

//funcion para cambiar el estado de una categoria (activar/desactivar)
export const toggleProductCategoryStatusFn = async (id: string) => {
  const response = await api.patch(`/producto-categoria/${id}/toggle-activo`);
  return response.data;
}
