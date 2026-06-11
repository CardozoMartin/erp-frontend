import { BarChart2, Package, Wallet } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '../../../store/auth.store';
import AccessDenied from '../../../components/common/AccessDenied';
import DataTable from '../../../components/common/DataTable';
import type { DataTableColumn } from '../../../components/common/DataTable';
import { useReportesAux } from '../hooks/usePosAux';
import type { IReporteCaja, IReporteProducto } from '../types/pos-aux.type';
import { dateTime, money } from '../utils/format';
import { hasAnyPermission, POS_PERMISSIONS } from '../utils/posPermissions';

const today = () => new Date().toISOString().slice(0, 10);

const productosColumns: DataTableColumn<IReporteProducto>[] = [
  {
    key: 'producto',
    header: 'Producto',
    render: (producto) => <span className="font-semibold text-[#041627]">{producto.producto}</span>,
  },
  { key: 'cantidad', header: 'Cant.', align: 'right', render: (producto) => producto.cantidad },
  { key: 'total', header: 'Total', align: 'right', render: (producto) => money(producto.total) },
  { key: 'margen', header: 'Margen', align: 'right', render: (producto) => money(producto.margen) },
];

const cajasColumns: DataTableColumn<IReporteCaja>[] = [
  {
    key: 'empleado',
    header: 'Empleado',
    render: (caja) => <span className="font-semibold text-[#041627]">{caja.empleado}</span>,
  },
  { key: 'apertura', header: 'Apertura', render: (caja) => dateTime(caja.fecha_apertura) },
  { key: 'ventas', header: 'Ventas', align: 'right', render: (caja) => caja.ventas },
  { key: 'vendido', header: 'Vendido', align: 'right', render: (caja) => money(caja.total_vendido) },
  { key: 'cobros', header: 'Cobros', align: 'right', render: (caja) => money(caja.cobros) },
  { key: 'egresos', header: 'Egresos', align: 'right', render: (caja) => money(caja.egresos) },
  { key: 'esperado', header: 'Esperado', align: 'right', render: (caja) => money(caja.dinero_esperado) },
  { key: 'declarado', header: 'Declarado', align: 'right', render: (caja) => money(caja.monto_final_declarado ?? caja.monto_final_calculado ?? caja.dinero_esperado) },
  { key: 'diferencia', header: 'Dif.', align: 'right', render: (caja) => money(caja.diferencia) },
  { key: 'ganancia', header: 'Ganancia', align: 'right', render: (caja) => money(caja.ganancia_estimada) },
  { key: 'reposicion', header: 'Reposicion', align: 'right', render: (caja) => money(caja.reposicion_estimada) },
  { key: 'stock', header: 'Stock', align: 'right', render: (caja) => caja.stock_salidas },
];

const ReportesPosAuxPage = () => {
  const [desde, setDesde] = useState(today());
  const [hasta, setHasta] = useState(today());
  const permisos = useAuthStore((state) => state.permisos);
  const puedeVerReportes = hasAnyPermission(permisos, POS_PERMISSIONS.reportesVer, POS_PERMISSIONS.reportesVentas, POS_PERMISSIONS.reportesCaja);
  const reportes = useReportesAux({ desde, hasta }, puedeVerReportes);
  const resumen = reportes.resumen.data;
  const productos = reportes.productos.data ?? [];
  const cajas = reportes.cajas.data ?? [];

  if (!puedeVerReportes) {
    return (
      <AccessDenied
        title="Sin permisos para reportes POS"
        message="Necesitas reportes.ver, reportes.ventas o reportes.caja para consultar reportes."
      />
    );
  }

  return (
    <div className="min-h-[calc(100vh-52px)] bg-[#f3f4f6] px-4 py-4">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-4">
        <section className="rounded-lg border border-[#c4c6cd] bg-white shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#c4c6cd] px-4 py-3">
            <div>
              <div className="flex items-center gap-2 text-[15px] font-bold text-[#041627]">
                <BarChart2 size={17} className="text-[#075E54]" />
                Reportes POS
              </div>
              <div className="text-[13px] text-[#44474c]">Ventas, cobros, cajas, margen y stock</div>
            </div>
            <div className="flex gap-2">
              <input
                type="date"
                value={desde}
                onChange={(event) => setDesde(event.target.value)}
                className="h-9 rounded border border-[#c4c6cd] px-3 text-[14px] outline-none focus:border-[#075E54]"
              />
              <input
                type="date"
                value={hasta}
                onChange={(event) => setHasta(event.target.value)}
                className="h-9 rounded border border-[#c4c6cd] px-3 text-[14px] outline-none focus:border-[#075E54]"
              />
            </div>
          </div>

          <div className="grid gap-3 p-4 md:grid-cols-4 xl:grid-cols-6">
            <div className="rounded border border-[#c4c6cd] bg-[#fbf9fa] p-4">
              <div className="text-[12px] font-bold uppercase text-[#44474c]">Ventas</div>
              <div className="mt-2 text-[22px] font-bold text-[#041627]">{resumen?.ventas.cantidad ?? 0}</div>
            </div>
            <div className="rounded border border-[#c4c6cd] bg-[#fbf9fa] p-4">
              <div className="text-[12px] font-bold uppercase text-[#44474c]">Total vendido</div>
              <div className="mt-2 text-[22px] font-bold text-[#041627]">{money(resumen?.ventas.total)}</div>
            </div>
            <div className="rounded border border-[#c4c6cd] bg-[#fbf9fa] p-4">
              <div className="text-[12px] font-bold uppercase text-[#44474c]">Cobrado</div>
              <div className="mt-2 text-[22px] font-bold text-[#041627]">{money(resumen?.cobros.total)}</div>
            </div>
            <div className="rounded border border-[#c4c6cd] bg-[#fbf9fa] p-4">
              <div className="text-[12px] font-bold uppercase text-[#44474c]">Notas credito</div>
              <div className="mt-2 text-[22px] font-bold text-[#041627]">{money(resumen?.notas_credito.total)}</div>
            </div>
            <div className="rounded border border-[#c4c6cd] bg-[#fbf9fa] p-4">
              <div className="text-[12px] font-bold uppercase text-[#44474c]">Ganancia est.</div>
              <div className="mt-2 text-[22px] font-bold text-[#041627]">{money(resumen?.rentabilidad.ganancia_estimada)}</div>
            </div>
            <div className="rounded border border-[#c4c6cd] bg-[#fbf9fa] p-4">
              <div className="text-[12px] font-bold uppercase text-[#44474c]">Reposicion</div>
              <div className="mt-2 text-[22px] font-bold text-[#041627]">{money(resumen?.rentabilidad.reposicion_estimada)}</div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <div className="rounded-lg border border-[#c4c6cd] bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-[#c4c6cd] px-4 py-3 text-[14px] font-bold text-[#041627]">
              <Package size={16} className="text-[#075E54]" />
              Productos vendidos
            </div>
            <div className="max-h-[420px] overflow-auto">
              <DataTable
                rows={productos}
                columns={productosColumns}
                getRowKey={(producto) => producto.producto_id}
                isLoading={reportes.productos.isLoading}
                loadingMessage="Cargando productos vendidos..."
                emptyMessage="Sin productos vendidos en el periodo."
              />
            </div>
          </div>

          <div className="rounded-lg border border-[#c4c6cd] bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-[#c4c6cd] px-4 py-3 text-[14px] font-bold text-[#041627]">
              <Wallet size={16} className="text-[#075E54]" />
              Cajas
            </div>
            <div className="max-h-[520px] overflow-auto">
              <DataTable
                rows={cajas}
                columns={cajasColumns}
                getRowKey={(caja) => caja.caja_id}
                isLoading={reportes.cajas.isLoading}
                loadingMessage="Cargando cajas..."
                emptyMessage="Sin cajas en el periodo."
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ReportesPosAuxPage;
