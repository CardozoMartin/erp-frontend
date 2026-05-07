import { useMutation } from "@tanstack/react-query";
import { postProductoFn } from "../api/productoApi";
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
