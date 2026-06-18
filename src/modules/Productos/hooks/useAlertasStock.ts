import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../store/auth.store';
import { getConteoAlertasStockFn, getAlertasStockFn, getStockOtrasSucursalesFn } from '../api/stock.api';

// Conteo para badge en header — polling cada 60s
export const useConteoAlertasStock = () => {
  const sucursalActiva = useAuthStore((s) => s.sucursalActiva);
  const tienePermiso = useAuthStore((s) => s.tienePermiso);

  return useQuery({
    queryKey: ['stock-alertas-conteo', sucursalActiva?.id],
    queryFn: getConteoAlertasStockFn,
    enabled: !!sucursalActiva?.id && tienePermiso('stock.ver'),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
};

// Lista completa para la página/modal de alertas
export const useAlertasStock = () => {
  const sucursalActiva = useAuthStore((s) => s.sucursalActiva);
  const tienePermiso = useAuthStore((s) => s.tienePermiso);

  return useQuery({
    queryKey: ['stock-alertas', sucursalActiva?.id],
    queryFn: getAlertasStockFn,
    enabled: !!sucursalActiva?.id && tienePermiso('stock.ver'),
    staleTime: 30_000,
  });
};

// Consulta stock de un producto en otras sucursales (solo si la config lo habilita)
export const useStockOtrasSucursales = (productoId: string | null | undefined, enabled = true) => {
  const sucursalActiva = useAuthStore((s) => s.sucursalActiva);
  const tienePermiso = useAuthStore((s) => s.tienePermiso);

  return useQuery({
    queryKey: ['stock-otras-sucursales', sucursalActiva?.id, productoId],
    queryFn: () => getStockOtrasSucursalesFn(productoId!),
    enabled: !!sucursalActiva?.id && !!productoId && tienePermiso('stock.ver') && enabled,
    staleTime: 30_000,
    retry: false,
  });
};
