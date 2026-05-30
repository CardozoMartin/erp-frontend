import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';
import type { IErrorResponse } from '../../../type/api.response.type';
import type { INewSucursalPayload } from '../api/sucursalApi';
import { getSucursalesFn, postSucursalFn } from '../api/sucursalApi';

export const useGetSucursales = (page: number = 1, limit: number = 30) => {
  return useQuery({
    queryKey: ['sucursales', page, limit],
    queryFn: () => getSucursalesFn(page, limit),
    enabled: true,
  });
};

export const usePostSucursal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: INewSucursalPayload) => postSucursalFn(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sucursales'] });
      toast.success('Sucursal creada correctamente');
    },
    // Sin onError acá — el componente lo maneja con setError('root.serverError')
  });
};
