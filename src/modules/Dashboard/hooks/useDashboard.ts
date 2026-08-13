import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../store/auth.store';
import {
  getReporteResumenFn,
  getReporteVentasPorDiaFn,
  getReporteMediosPagoFn,
  getReporteProductosFn,
} from '../../POSAuxiliares/api/posAux.api';

const hoy = () => new Date().toISOString().slice(0, 10);

export const useDashboardHoy = () => {
  const sucursalActiva = useAuthStore((s) => s.sucursalActiva);
  const tienePermiso = useAuthStore((s) => s.tienePermiso);
  const enabled = !!sucursalActiva?.id && tienePermiso('reportes.ver');
  const params = { desde: hoy(), hasta: hoy() };

  const resumen = useQuery({
    queryKey: ['dashboard-resumen', sucursalActiva?.id, hoy()],
    queryFn: () => getReporteResumenFn(params),
    enabled,
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  const ventasPorHora = useQuery({
    queryKey: ['dashboard-ventas-dia', sucursalActiva?.id, hoy()],
    queryFn: () => getReporteVentasPorDiaFn(params),
    enabled,
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  const mediosPago = useQuery({
    queryKey: ['dashboard-medios-pago', sucursalActiva?.id, hoy()],
    queryFn: () => getReporteMediosPagoFn(params),
    enabled,
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  const topProductos = useQuery({
    queryKey: ['dashboard-productos', sucursalActiva?.id, hoy()],
    queryFn: () => getReporteProductosFn(params),
    enabled,
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  return { resumen, ventasPorHora, mediosPago, topProductos };
};
