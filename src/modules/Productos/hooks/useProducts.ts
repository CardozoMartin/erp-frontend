import { useMutation, useQuery } from "@tanstack/react-query";
import { getProductosFn, postProductoFn } from "../api/productoApi";
import type { AxiosError } from "axios";
import type { IErrorResponse } from "../../../type/api.response.type";


//hook para crear un nuevo producto
export const usePostProducts = () => {

  return useMutation({
    mutationFn: postProductoFn,
    onSuccess: (data) => {
      console.log('Producto creado con éxito:', data);
    },
    onError: (error: AxiosError<IErrorResponse>) => {
      console.error('Error al crear el producto:', error);
    },
  });
};

//hooks para obtener todos los productos con paginacion
export const useGetProducts = (page: number = 1, limit: number = 30) => {
  return useQuery({
    queryKey: ['products'],
    queryFn: () => getProductosFn(page, limit),
    enabled: true
  })
}

