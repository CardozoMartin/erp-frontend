import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getAllProductCategoriesActivesFn, postCreateProductCategoryFn, putUpdateProductCategoryFn, toggleProductCategoryStatusFn } from '../api/product.category.api';
import type { IProductoCategory } from '../types/producto.category.type';
import { toast } from 'sonner';

//hook para crear una nueva categoria de producto
export const usePostCategoryProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: postCreateProductCategoryFn,
    onSuccess: () => {

      queryClient.invalidateQueries({ queryKey: ['productCategoriesActives'] });
      toast.success('Categoría creada correctamente');
    },
    onError: () => {
      toast.error('Error al crear la categoría');
    },
  });
};

//hook para actualizar una categoria de producto
export const usePutProductCategory = (id: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: IProductoCategory) => putUpdateProductCategoryFn(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productCategoriesActives'] });
      toast.success('Categoría actualizada correctamente');
    },
    onError: () => {
      toast.error('Error al actualizar la categoría');
    },
  });
}

//Hook para obtener todas las categorias de productos activas
export const useGetAllProductCategoriesActives = (page:number=1, limit:number=10) => {
  return useQuery({
    queryKey: ['productCategoriesActives'],
    queryFn: () => getAllProductCategoriesActivesFn(page, limit),
    enabled: true
  })
}

//hook para cambiar el estado de una categoria (activar/desactivar)
export const useToggleProductCategoryStatus = (id: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => toggleProductCategoryStatusFn(String(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productCategoriesActives'] });
      toast.success('Estado de categoría actualizado correctamente');
    },
    onError: () => {
      toast.error('Error al actualizar el estado de la categoría');
    }
  });
};
