import {
  BarChart2,
  CreditCard,
  Download,
  Package,
  TrendingUp,
  Users,
  Wallet,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Loader2,
} from 'lucide-react';
import { useState } from 'react';
import AccessDenied from '../../../components/common/AccessDenied';
import DataTable from '../../../components/common/DataTable';
import type { DataTableColumn } from '../../../components/common/DataTable';
import { useAuthStore } from '../../../store/auth.store';
import {
  useReportesAux,
  useReporteMediosPago,
  useReporteVentasPorDia,
  useReporteEmpleados,
  useReporteCobrosPendientes,
} from '../../POSAuxiliares/hooks/usePosAux';
import { exportarReporteContableFn } from '../../POSAuxiliares/api/posAux.api';
import type {
  IReporteCobrosPendientes,
  IReporteMedioPago,
  IReporteProducto,
  IReporteVentaDia,
  IReporteEmpleado,
} from '../../POSAuxiliares/types/pos-aux.type';
import { money, dateTime } from '../../POSAuxiliares/utils/format';
import { hasAnyPermission, POS_PERMISSIONS } from '../../POSAuxiliares/utils/posPermissions';

const today = () => new Date().toISOString().slice(0, 10);
const primerDiaMes = () => {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().slice(0, 10);
};

const pct = (valor: number, total: number) =>
  total > 0 ? ((valor / total) * 100).toFixed(1) + '%' : '—';

const Card = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
  <div className="rounded-lg border border-[#c4c6cd] bg-white p-4 shadow-sm">
    <div className="text-[11px] font-bold uppercase tracking-wider text-[#44474c]">{label}</div>
    <div className="mt-1.5 text-[22px] font-bold text-[#041627]">{value}</div>
    {sub && <div className="mt-0.5 text-[12px] text-[#44474c]">{sub}</div>}
  </div>
);

const SectionHeader = ({ icon: Icon, title, sub }: { icon: React.ElementType; title: string; sub?: string }) => (
  <div className="flex items-center gap-2 border-b border-[#c4c6cd] px-4 py-3">
    <Icon size={16} className="shrink-0 text-[#075E54]" />
    <div>
      <div className="text-[14px] font-bold text-[#041627]">{title}</div>
      {sub && <div className="text-[11px] text-[#44474c]">{sub}</div>}
    </div>
  </div>
);

const ventasDiaColumns: DataTableColumn<IReporteVentaDia>[] = [
  { key: 'fecha', header: 'Fecha', render: (r) => <span className="font-semibold">{r.fecha}</span> },
  { key: 'cantidad', header: 'Ventas', align: 'right', render: (r) => r.cantidad },
  { key: 'total', header: 'Total', align: 'right', render: (r) => money(r.total) },
  {
    key: 'promedio',
    header: 'Ticket prom.',
    align: 'right',
    render: (r) => money(r.cantidad > 0 ? r.total / r.cantidad : 0),
  },
];

const mediosPagoColumns: DataTableColumn<IReporteMedioPago>[] = [
  { key: 'medio', header: 'Medio de pago', render: (r) => <span className="font-semibold">{r.medio_pago}</span> },
  { key: 'cantidad', header: 'Operaciones', align: 'right', render: (r) => r.cantidad },
  { key: 'monto', header: 'Monto', align: 'right', render: (r) => money(r.monto) },
  { key: 'recargos', header: 'Recargos', align: 'right', render: (r) => money(r.recargos) },
  { key: 'total', header: 'Total cobrado', align: 'right', render: (r) => <span className="font-bold">{money(r.total)}</span> },
];

const productosColumns: DataTableColumn<IReporteProducto>[] = [
  { key: 'producto', header: 'Producto', render: (r) => <span className="font-semibold">{r.producto}</span> },
  { key: 'cantidad', header: 'Cant.', align: 'right', render: (r) => r.cantidad },
  { key: 'total', header: 'Vendido', align: 'right', render: (r) => money(r.total) },
  { key: 'costo', header: 'Costo est.', align: 'right', render: (r) => money(r.costo) },
  { key: 'margen', header: 'Ganancia', align: 'right', render: (r) => <span className="font-bold text-[#027a48]">{money(r.margen)}</span> },
  {
    key: 'margen_pct',
    header: 'Margen %',
    align: 'right',
    render: (r) => {
      const color = r.margen_porcentaje >= 30 ? 'text-[#027a48]' : r.margen_porcentaje >= 10 ? 'text-[#b45309]' : 'text-[#b42318]';
      return <span className={`font-bold ${color}`}>{r.margen_porcentaje.toFixed(1)}%</span>;
    },
  },
];

const empleadosColumns: DataTableColumn<IReporteEmpleado>[] = [
  { key: 'empleado', header: 'Vendedor', render: (r) => <span className="font-semibold">{r.empleado}</span> },
  { key: 'cantidad', header: 'Ventas', align: 'right', render: (r) => r.cantidad },
  { key: 'total', header: 'Total vendido', align: 'right', render: (r) => <span className="font-bold">{money(r.total)}</span> },
  { key: 'promedio', header: 'Ticket prom.', align: 'right', render: (r) => money(r.cantidad > 0 ? r.total / r.cantidad : 0) },
];

const deudoresColumns: DataTableColumn<IReporteCobrosPendientes['clientes'][number]>[] = [
  { key: 'cliente', header: 'Cliente', render: (r) => <span className="font-semibold">{r.cliente}</span> },
  { key: 'saldo', header: 'Saldo deudor', align: 'right', render: (r) => <span className="font-bold text-[#b42318]">{money(r.saldo)}</span> },
  { key: 'limite', header: 'Límite', align: 'right', render: (r) => money(r.limite_credito) },
  { key: 'disponible', header: 'Disponible', align: 'right', render: (r) => money(r.limite_disponible ?? 0) },
  { key: 'cargos', header: 'Operaciones', align: 'right', render: (r) => r.cantidad_cargos },
  { key: 'ultimo_pago', header: 'Último pago', render: (r) => r.ultimo_pago ? dateTime(r.ultimo_pago) : '—' },
  { key: 'vencimiento', header: 'Próx. venc.', render: (r) => r.proximo_vencimiento ? dateTime(r.proximo_vencimiento) : '—' },
];

const Collapsible = ({ title, icon: Icon, children, defaultOpen = true }: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="overflow-hidden rounded-lg border border-[#c4c6cd] bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 border-b border-[#c4c6cd] px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <Icon size={16} className="shrink-0 text-[#075E54]" />
          <span className="text-[14px] font-bold text-[#041627]">{title}</span>
        </div>
        {open ? <ChevronUp size={16} className="text-[#44474c]" /> : <ChevronDown size={16} className="text-[#44474c]" />}
      </button>
      {open && children}
    </section>
  );
};

const ReportesContablesPage = () => {
  const [desde, setDesde] = useState(primerDiaMes());
  const [hasta, setHasta] = useState(today());
  const [descargando, setDescargando] = useState(false);
  const permisos = useAuthStore((s) => s.permisos);
  const puedeVer = hasAnyPermission(permisos, POS_PERMISSIONS.reportesVer, POS_PERMISSIONS.reportesVentas, POS_PERMISSIONS.reportesCaja);

  const params = { desde, hasta };
  const reportes = useReportesAux(params, puedeVer);
  const ventasDiaQuery = useReporteVentasPorDia(params, puedeVer);
  const mediosPagoQuery = useReporteMediosPago(params, puedeVer);
  const empleadosQuery = useReporteEmpleados(params, puedeVer);
  const cobrosPendientesQuery = useReporteCobrosPendientes(puedeVer);

  const resumen = reportes.resumen.data;
  const productos = reportes.productos.data ?? [];
  const ventasDia = ventasDiaQuery.data ?? [];
  const mediosPago = mediosPagoQuery.data ?? [];
  const empleados = empleadosQuery.data ?? [];
  const deudores = cobrosPendientesQuery.data?.clientes ?? [];
  const totalDeuda = cobrosPendientesQuery.data?.total_deuda ?? 0;

  const totalVendido = resumen?.ventas.total ?? 0;
  const totalNC = resumen?.notas_credito.total ?? 0;
  const totalNeto = totalVendido - totalNC;
  const ganancia = resumen?.rentabilidad.ganancia_estimada ?? 0;
  const costo = resumen?.rentabilidad.costo_estimado ?? 0;
  const margenPct = totalNeto > 0 ? ((ganancia / totalNeto) * 100).toFixed(1) : '0';

  const manejarCambioFecha = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value);
  };

  const descargarExcel = async () => {
    setDescargando(true);
    try {
      const blob = await exportarReporteContableFn({ desde, hasta });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte-contable-${desde}-${hasta}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDescargando(false);
    }
  };

  if (!puedeVer) {
    return (
      <AccessDenied
        title="Sin permisos para reportes"
        message="Necesitás reportes.ver, reportes.ventas o reportes.caja."
      />
    );
  }

  return (
    <div className="min-h-[calc(100vh-52px)] bg-[#f3f4f6] px-4 py-4">
      <div className="mx-auto flex max-w-375 flex-col gap-4">

        {/* Header con rango de fechas */}
        <section className="rounded-lg border border-[#c4c6cd] bg-white shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-3 px-4 py-3">
            <div>
              <div className="flex items-center gap-2 text-[15px] font-bold text-[#041627]">
                <BarChart2 size={17} className="text-[#075E54]" />
                Reporte contable
              </div>
              <div className="text-[12px] text-[#44474c]">
                Período: {desde} → {hasta}
              </div>
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-[#44474c]">Desde</label>
                <input
                  type="date"
                  value={desde}
                  onChange={manejarCambioFecha(setDesde)}
                  className="h-9 rounded border border-[#c4c6cd] px-3 text-[13px] outline-none focus:border-[#075E54]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-[#44474c]">Hasta</label>
                <input
                  type="date"
                  value={hasta}
                  onChange={manejarCambioFecha(setHasta)}
                  className="h-9 rounded border border-[#c4c6cd] px-3 text-[13px] outline-none focus:border-[#075E54]"
                />
              </div>
              <button
                type="button"
                onClick={descargarExcel}
                disabled={descargando}
                className="flex h-9 items-center gap-2 rounded bg-[#075E54] px-4 text-[13px] font-semibold text-white hover:bg-[#0b6d62] disabled:opacity-60"
              >
                {descargando ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                {descargando ? 'Generando...' : 'Exportar Excel'}
              </button>
            </div>
          </div>
        </section>

        {/* KPIs principales */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
          <Card label="Ventas" value={String(resumen?.ventas.cantidad ?? 0)} sub={`${ventasDia.length} días con venta`} />
          <Card label="Total vendido" value={money(totalVendido)} sub={`Subtotal ${money(resumen?.ventas.subtotal)}`} />
          <Card label="Descuentos" value={money(resumen?.ventas.descuentos)} sub={pct(resumen?.ventas.descuentos ?? 0, totalVendido) + ' del total'} />
          <Card label="Notas de crédito" value={money(totalNC)} sub={`${resumen?.notas_credito.cantidad ?? 0} emitidas`} />
          <Card label="Total neto" value={money(totalNeto)} sub="Vendido menos NC" />
          <Card label="Costo estimado" value={money(costo)} sub="Basado en precio costo" />
          <Card
            label="Ganancia estimada"
            value={money(ganancia)}
            sub={`Margen ${margenPct}%`}
          />
        </div>

        {/* Ventas por día */}
        <Collapsible title="Ventas por día" icon={TrendingUp}>
          {ventasDia.length > 0 && (
            <div className="grid grid-cols-3 gap-px border-b border-[#c4c6cd] bg-[#c4c6cd]">
              {ventasDia.map((dia) => {
                const max = Math.max(...ventasDia.map((d) => d.total));
                const pctBarra = max > 0 ? (dia.total / max) * 100 : 0;
                return (
                  <div key={dia.fecha} className="bg-white px-4 py-3">
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="font-semibold text-[#041627]">{dia.fecha}</span>
                      <span className="text-[#44474c]">{dia.cantidad} vta{dia.cantidad !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full rounded-full bg-[#e5e7eb]">
                      <div
                        className="h-1.5 rounded-full bg-[#075E54]"
                        style={{ width: `${pctBarra}%` }}
                      />
                    </div>
                    <div className="mt-1 text-[13px] font-bold text-[#041627]">{money(dia.total)}</div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="max-h-72 overflow-auto">
            <DataTable
              rows={ventasDia}
              columns={ventasDiaColumns}
              getRowKey={(r) => r.fecha}
              isLoading={ventasDiaQuery.isLoading}
              emptyMessage="Sin ventas en el período."
              emptyVariant="plain"
            />
          </div>
        </Collapsible>

        {/* Medios de pago + Empleados */}
        <div className="grid gap-4 xl:grid-cols-2">
          <Collapsible title="Cobros por medio de pago" icon={CreditCard}>
            {mediosPago.length > 0 && (
              <div className="flex flex-wrap gap-3 border-b border-[#c4c6cd] px-4 py-3">
                {mediosPago.map((m) => (
                  <div key={m.medio_pago_id ?? m.tipo} className="flex items-center gap-2 rounded border border-[#e5e7eb] bg-[#f8fafc] px-3 py-2 text-[12px]">
                    <span className="font-semibold text-[#041627]">{m.medio_pago}</span>
                    <span className="text-[#44474c]">{pct(m.total, mediosPago.reduce((s, x) => s + x.total, 0))}</span>
                    <span className="font-bold text-[#075E54]">{money(m.total)}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="max-h-72 overflow-auto">
              <DataTable
                rows={mediosPago}
                columns={mediosPagoColumns}
                getRowKey={(r) => r.medio_pago_id ?? r.tipo}
                isLoading={mediosPagoQuery.isLoading}
                emptyMessage="Sin cobros en el período."
                emptyVariant="plain"
              />
            </div>
          </Collapsible>

          <Collapsible title="Ventas por vendedor" icon={Users}>
            <div className="max-h-80 overflow-auto">
              <DataTable
                rows={empleados}
                columns={empleadosColumns}
                getRowKey={(r) => r.empleado_id ?? r.empleado}
                isLoading={empleadosQuery.isLoading}
                emptyMessage="Sin datos de vendedores."
                emptyVariant="plain"
              />
            </div>
          </Collapsible>
        </div>

        {/* Productos */}
        <Collapsible title="Rentabilidad por producto" icon={Package}>
          {productos.length > 0 && (
            <div className="flex flex-wrap gap-4 border-b border-[#c4c6cd] px-4 py-3 text-[13px]">
              <span className="text-[#44474c]">
                Productos distintos: <span className="font-bold text-[#041627]">{productos.length}</span>
              </span>
              <span className="text-[#44474c]">
                Unidades vendidas: <span className="font-bold text-[#041627]">{productos.reduce((s, p) => s + p.cantidad, 0)}</span>
              </span>
              <span className="text-[#44474c]">
                Costo total: <span className="font-bold text-[#041627]">{money(productos.reduce((s, p) => s + p.costo, 0))}</span>
              </span>
              <span className="text-[#44474c]">
                Ganancia total: <span className="font-bold text-[#027a48]">{money(productos.reduce((s, p) => s + p.margen, 0))}</span>
              </span>
            </div>
          )}
          <div className="max-h-96 overflow-auto">
            <DataTable
              rows={productos}
              columns={productosColumns}
              getRowKey={(r) => r.producto_id}
              isLoading={reportes.productos.isLoading}
              emptyMessage="Sin productos vendidos en el período."
              emptyVariant="plain"
            />
          </div>
        </Collapsible>

        {/* Cuentas corrientes / Cobros pendientes */}
        <Collapsible title="Deudores — cuentas corrientes pendientes" icon={AlertTriangle} defaultOpen={false}>
          {deudores.length > 0 && (
            <div className="flex flex-wrap gap-4 border-b border-[#c4c6cd] px-4 py-3 text-[13px]">
              <span className="text-[#44474c]">
                Clientes con deuda: <span className="font-bold text-[#041627]">{deudores.length}</span>
              </span>
              <span className="text-[#44474c]">
                Deuda total: <span className="font-bold text-[#b42318]">{money(totalDeuda)}</span>
              </span>
            </div>
          )}
          <div className="max-h-96 overflow-auto">
            <DataTable
              rows={deudores}
              columns={deudoresColumns}
              getRowKey={(r) => r.cliente_id}
              isLoading={cobrosPendientesQuery.isLoading}
              emptyMessage="Sin deudores pendientes."
              emptyVariant="plain"
            />
          </div>
        </Collapsible>

      </div>
    </div>
  );
};

export default ReportesContablesPage;
