import {
  ShoppingCart,
  Wallet,
  TrendingUp,
  Package,
  RefreshCw,
  BarChart2,
  CreditCard,
  ArrowUpRight,
} from 'lucide-react';
import { useAuthStore } from '../../../store/auth.store';
import AccessDenied from '../../../components/common/AccessDenied';
import { MetricCard } from '../components/MetricCard';
import { VentasAreaChart } from '../components/VentasAreaChart';
import { MediosPagoChart } from '../components/MediosPagoChart';
import { TopProductosChart } from '../components/TopProductosChart';
import { useDashboardHoy } from '../hooks/useDashboard';
import { money, toNumber } from '../../POSAuxiliares/utils/format';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

const hoyLabel = () =>
  new Date().toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

const DashboardPage = () => {
  const tienePermiso = useAuthStore((s) => s.tienePermiso);
  const sucursalActiva = useAuthStore((s) => s.sucursalActiva);
  const queryClient = useQueryClient();
  const { resumen, ventasPorHora, mediosPago, topProductos } = useDashboardHoy();

  if (!tienePermiso('reportes.ver')) return <AccessDenied />;

  const r = resumen.data;
  const isLoading = resumen.isLoading;

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['dashboard-resumen'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-ventas-dia'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-medios-pago'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-productos'] });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* ── Encabezado ── */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-gray-900">Dashboard</h1>
          <p className="mt-0.5 text-[13px] capitalize text-gray-500">
            {hoyLabel()} · {sucursalActiva?.nombre ?? 'Sin sucursal'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-[12px] font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
            Actualizar
          </button>
          <Link
            to="/reportes-pos"
            className="flex items-center gap-1.5 rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 text-[12px] font-medium text-blue-700 hover:bg-blue-100"
          >
            <BarChart2 size={13} />
            Ver reportes
            <ArrowUpRight size={12} />
          </Link>
        </div>
      </div>

      {/* ── Métricas principales ── */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard
          label="Ventas del día"
          value={r ? money(r.ventas.total) : '—'}
          subValue={r ? `${r.ventas.cantidad} comprobantes` : undefined}
          icon={ShoppingCart}
          color="green"
          loading={isLoading}
        />
        <MetricCard
          label="Cobros"
          value={r ? money(r.cobros.total) : '—'}
          subValue={r ? `Subtotal: ${money(r.ventas.subtotal)}` : undefined}
          icon={Wallet}
          color="blue"
          loading={isLoading}
        />
        <MetricCard
          label="Ganancia estimada"
          value={r ? money(r.rentabilidad.ganancia_estimada) : '—'}
          subValue={r ? `Margen: ${toNumber(r.rentabilidad.margen_porcentaje).toFixed(1)}%` : undefined}
          icon={TrendingUp}
          color="purple"
          loading={isLoading}
        />
        <MetricCard
          label="Unidades en stock"
          value={r ? String(r.stock.unidades_salidas) : '—'}
          subValue={r ? `NC: ${r.notas_credito.cantidad} · ${money(r.notas_credito.total)}` : undefined}
          icon={Package}
          color="amber"
          loading={isLoading}
        />
      </div>

      {/* ── Gráficos ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Ventas por día — columna ancha */}
        <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-[14px] font-semibold text-gray-800">Ventas del mes</h2>
              <p className="text-[11px] text-gray-400">Acumulado hasta hoy</p>
            </div>
            <TrendingUp size={16} className="text-emerald-500" />
          </div>
          <VentasAreaChart
            data={ventasPorHora.data ?? []}
            loading={ventasPorHora.isLoading}
          />
        </div>

        {/* Medios de pago */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-[14px] font-semibold text-gray-800">Medios de pago</h2>
              <p className="text-[11px] text-gray-400">Distribución del día</p>
            </div>
            <CreditCard size={16} className="text-blue-500" />
          </div>
          <MediosPagoChart
            data={mediosPago.data ?? []}
            loading={mediosPago.isLoading}
          />
        </div>

        {/* Top productos */}
        <div className="lg:col-span-3 rounded-xl border border-gray-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-[14px] font-semibold text-gray-800">Top 5 productos</h2>
              <p className="text-[11px] text-gray-400">Por total vendido hoy</p>
            </div>
            <Package size={16} className="text-purple-500" />
          </div>
          <TopProductosChart
            data={topProductos.data ?? []}
            loading={topProductos.isLoading}
          />
        </div>
      </div>

      {/* ── Resumen de rentabilidad ── */}
      {r && (
        <div className="mt-4 rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-3 text-[14px] font-semibold text-gray-800">Rentabilidad del día</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-[11px] text-gray-400">Costo estimado</p>
              <p className="text-[16px] font-bold text-gray-700">{money(r.rentabilidad.costo_estimado)}</p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400">Ganancia estimada</p>
              <p className="text-[16px] font-bold text-emerald-600">{money(r.rentabilidad.ganancia_estimada)}</p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400">Margen</p>
              <p className="text-[16px] font-bold text-purple-600">{toNumber(r.rentabilidad.margen_porcentaje).toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400">Reposición estimada</p>
              <p className="text-[16px] font-bold text-amber-600">{money(r.rentabilidad.reposicion_estimada)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
