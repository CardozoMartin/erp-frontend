import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';
import { useAuthStore } from '../../../store/auth.store';
import type { IErrorResponse } from '../../../type/api.response.type';
import {
  adjustProductStockFn,
  getProductosFn,
  postProductoFn,
  subirImagen,
  updateProductoFn,
  type IAdjustProductStockPayload,
  type ProductoSavePayload,
} from '../api/productoApi';
import {
  crearOfertaFn,
  actualizarOfertaFn,
  eliminarOfertaFn,
  type ICrearOfertaPayload,
} from '../api/oferta.api';
import type { IImagenLocal } from '../types/productos.type';

export const PRODUCTOS_KEYS = {
  todos: ['productos'] as const,
  lista: (page: number, limit: number) => ['productos', 'lista', page, limit] as const,
  detalle: (id: string) => ['productos', 'detalle', id] as const,
};

const extraerMensajeError = (error: AxiosError<IErrorResponse>, fallback: string) => {
  const data = error.response?.data as { message?: string; mensaje?: string; errores?: string[] } | undefined;
  return (
    data?.message ||
    data?.mensaje ||
    (Array.isArray(data?.errores) ? data.errores.join(', ') : undefined) ||
    fallback
  );
};

// 1.- Obtener lista paginada de productos de la sucursal activa
export const useObtenerProductos = (pagina: number = 1, limite: number = 30) => {
  const sucursalActivaId = useAuthStore((state) => state.sucursalActiva?.id);
  return useQuery({
    queryKey: PRODUCTOS_KEYS.lista(pagina, limite),
    queryFn: () => getProductosFn(pagina, limite),
    enabled: !!sucursalActivaId,
  });
};

// 2.- Crear un nuevo producto
export const useCrearProducto = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (datos: ProductoSavePayload) => postProductoFn(datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTOS_KEYS.todos });
      toast.success('Producto creado exitosamente');
    },
    onError: (error: AxiosError<IErrorResponse>) => {
      toast.error(extraerMensajeError(error, 'Error al crear el producto'));
    },
  });
};

// 3.- Actualizar un producto existente
export const useActualizarProducto = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (datos: ProductoSavePayload) => updateProductoFn(datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTOS_KEYS.todos });
      toast.success('Producto actualizado correctamente');
    },
    onError: (error: AxiosError<IErrorResponse>) => {
      toast.error(extraerMensajeError(error, 'Error al actualizar el producto'));
    },
  });
};

// 4.- Ajustar stock de un producto (aumentar o restar)
export const useAjustarStockProducto = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: IAdjustProductStockPayload) => adjustProductStockFn(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTOS_KEYS.todos });
      toast.success('Stock ajustado correctamente');
    },
    onError: (error: AxiosError<IErrorResponse>) => {
      toast.error(extraerMensajeError(error, 'Error al ajustar el stock'));
    },
  });
};

// 5.- Crear oferta para un producto
export const useCrearOferta = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ICrearOfertaPayload) => crearOfertaFn(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTOS_KEYS.todos });
      toast.success('Oferta creada correctamente');
    },
    onError: (error: AxiosError<IErrorResponse>) => {
      toast.error(extraerMensajeError(error, 'Error al crear la oferta'));
    },
  });
};

// 6.- Actualizar oferta existente
export const useActualizarOferta = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<ICrearOfertaPayload> }) =>
      actualizarOfertaFn(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTOS_KEYS.todos });
      toast.success('Oferta actualizada');
    },
    onError: (error: AxiosError<IErrorResponse>) => {
      toast.error(extraerMensajeError(error, 'Error al actualizar la oferta'));
    },
  });
};

// 7.- Eliminar oferta
export const useEliminarOferta = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => eliminarOfertaFn(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTOS_KEYS.todos });
      toast.success('Oferta eliminada');
    },
    onError: (error: AxiosError<IErrorResponse>) => {
      toast.error(extraerMensajeError(error, 'Error al eliminar la oferta'));
    },
  });
};

// 8.- Subir imagen standalone para un producto o variante
export const useSubirImagenProducto = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productoId, imagen }: { productoId: string; imagen: IImagenLocal }) =>
      subirImagen(productoId, imagen),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTOS_KEYS.todos });
      toast.success('Imagen subida exitosamente');
    },
    onError: (error: AxiosError<IErrorResponse>) => {
      const data = error.response?.data as { message?: string; mensaje?: string } | undefined;
      toast.error(data?.message || data?.mensaje || 'Error al subir la imagen');
    },
  });
};
