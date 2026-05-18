import { useMutation, useQuery } from "@tanstack/react-query";
import { getProductosFn, postProductoFn } from "../api/productoApi";
import type { AxiosError } from "axios";
import type { IErrorResponse } from "../../../type/api.response.type";
import { toast } from "sonner";
import { subirImagen } from "../api/productoApi";
import type { IImagenLocal } from "../types/productos.type";


//hook para crear un nuevo producto
export const usePostProducts = () => {

  return useMutation({
    mutationFn: postProductoFn,
    onSuccess: () => {
      toast.success("Producto creado exitosamente");
    },
    onError: (error: AxiosError<IErrorResponse>) => {
      const data = error.response?.data as any;
      const mensaje =
        data?.message ||
        data?.mensaje ||
        (Array.isArray(data?.errores) ? data.errores.join(', ') : undefined) ||
        'Error al crear el producto';

      toast.error(mensaje);
      console.error('[ProductoDebug] Error al crear el producto');
      console.error('[ProductoDebug] Status:', error.response?.status);
      console.error('[ProductoDebug] Response data:', data);
      console.error('[ProductoDebug] Axios error completo:', error);
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
};

//hook para subir imagen standalone
export const useUploadImage = () => {
  return useMutation({
    mutationFn: ({ productoId, imagen }: { productoId: string; imagen: IImagenLocal }) => 
      subirImagen(productoId, imagen),
    onSuccess: () => {
      toast.success("Imagen subida exitosamente");
    },
    onError: (error: AxiosError<IErrorResponse>) => {
      const data = error.response?.data as any;
      toast.error(data?.message || data?.mensaje || 'Error al subir la imagen');
      console.error('[ProductoDebug] Error al subir la imagen');
      console.error('[ProductoDebug] Status:', error.response?.status);
      console.error('[ProductoDebug] Response data:', data);
      console.error('[ProductoDebug] Axios error completo:', error);
    },
  });
};

