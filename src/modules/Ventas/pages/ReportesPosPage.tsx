import { AlertTriangle, BarChart2, ChevronLeft, ChevronRight, Package, TrendingUp, Wallet, X } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '../../../store/auth.store';
import AccessDenied from '../../../components/common/AccessDenied';
import DataTable from '../../../components/common/DataTable';
import type { DataTableColumn } from '../../../components/common/DataTable';
import { useReporteCajas, useReporteDiferenciasCaja, useReporteProductosCaja, useReportesAux } from '../../POSAuxiliares/hooks/usePosAux';
import type { IReporteCaja, IReporteDiferenciaCaja, IReporteProducto } from '../../POSAuxiliares/types/pos-aux.type';
import { dateTime, money } from '../../POSAuxiliares/utils/format';
import { hasAnyPermission, POS_PERMISSIONS } from '../../POSAuxiliares/utils/posPermissions';

const today = () => new Date().toISOString().slice(0, 10);

const primerDiaMes = () => {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().slice(0, 10);
};

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

const diferenciasColumns: DataTableColumn<IReporteDiferenciaCaja>[] = [
  {
    key: 'empleado',
    header: 'Empleado',
    render: (row) => <span className="font-semibold text-[#041627]">{row.empleado}</span>,
  },
  { key: 'cierre', header: 'Cierre', render: (row) => row.fecha_cierre ? dateTime(row.fecha_cierre) : '—' },
  { key: 'calculado', header: 'Calculado', align: 'right', render: (row) => money(row.monto_final_calculado) },
  { key: 'declarado', header: 'Declarado', align: 'right', render: (row) => money(row.monto_final_declarado) },
  {
    key: 'diferencia',
    header: 'Diferencia',
    align: 'right',
    render: (row) => {
      const dif = row.diferencia ?? 0;
      const color = dif > 0 ? 'text-[#027a48] font-bold' : 'text-[#b42318] font-bold';
      return <span className={color}>{money(dif)}</span>;
    },
  },
];

const CAJAS_LIMIT = 20;
const DIFERENCIAS_LIMIT = 20;

const ReportesPosPage = () => {
  const [desde, setDesde] = useState(primerDiaMes());
  const [hasta, setHasta] = useState(today());
  const [cajasPage, setCajasPage] = useState(1);
  const [diferenciasPage, setDiferenciasPage] = useState(1);
  const [cajaSeleccionada, setCajaSeleccionada] = useState<IReporteCaja | null>(null);
  const permisos = useAuthStore((state) => state.permisos);
  const puedeVerReportes = hasAnyPermission(permisos, POS_PERMISSIONS.reportesVer, POS_PERMISSIONS.reportesVentas, POS_PERMISSIONS.reportesCaja);

  const reportes = useReportesAux({ desde, hasta }, puedeVerReportes);
  const cajasQuery = useReporteCajas({ desde, hasta, page: cajasPage, limit: CAJAS_LIMIT }, puedeVerReportes);
  const diferenciasQuery = useReporteDiferenciasCaja({ desde, hasta, page: diferenciasPage, limit: DIFERENCIAS_LIMIT }, puedeVerReportes);
  const productosCajaQuery = useReporteProductosCaja(cajaSeleccionada?.caja_id ?? null, {});

  const resumen = reportes.resumen.data;
  const productos = reportes.productos.data ?? [];
  const cajas = cajasQuery.data?.data ?? [];
  const cajasMeta = cajasQuery.data?.meta;
  const diferencias = diferenciasQuery.data?.data ?? [];
  const diferenciasMeta = diferenciasQuery.data?.meta;
  const resumenDiferencias = diferenciasQuery.data?.resumen;

  const manejarCambioFecha = (setter: (v: string) => void) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setter(event.target.value);
    setCajasPage(1);
    setDiferenciasPage(1);
  };

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
                onChange={manejarCambioFecha(setDesde)}
                className="h-9 rounded border border-[#c4c6cd] px-3 text-[14px] outline-none focus:border-[#075E54]"
              />
              <input
                type="date"
                value={hasta}
                onChange={manejarCambioFecha(setHasta)}
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
            <div className="flex items-center justify-between border-b border-[#c4c6cd] px-4 py-3">
              <div className="flex items-center gap-2 text-[14px] font-bold text-[#041627]">
                <Wallet size={16} className="text-[#075E54]" />
                Cajas
                {cajasMeta && (
                  <span className="text-[12px] font-normal text-[#44474c]">
                    ({cajasMeta.total} total)
                  </span>
                )}
              </div>
              {cajasMeta && cajasMeta.totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCajasPage((p) => Math.max(1, p - 1))}
                    disabled={cajasPage <= 1 || cajasQuery.isFetching}
                    className="flex h-7 w-7 items-center justify-center rounded border border-[#c4c6cd] text-[#44474c] hover:bg-[#f3f4f6] disabled:opacity-40"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className="px-2 text-[13px] text-[#44474c]">
                    {cajasPage} / {cajasMeta.totalPages}
                  </span>
                  <button
                    onClick={() => setCajasPage((p) => Math.min(cajasMeta.totalPages, p + 1))}
                    disabled={cajasPage >= cajasMeta.totalPages || cajasQuery.isFetching}
                    className="flex h-7 w-7 items-center justify-center rounded border border-[#c4c6cd] text-[#44474c] hover:bg-[#f3f4f6] disabled:opacity-40"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>
            <div className="max-h-[520px] overflow-auto">
              <DataTable
                rows={cajas}
                columns={cajasColumns}
                getRowKey={(caja) => caja.caja_id}
                isLoading={cajasQuery.isLoading}
                loadingMessage="Cargando cajas..."
                emptyMessage="Sin cajas en el periodo."
                onRowClick={(caja) => setCajaSeleccionada((prev) => prev?.caja_id === caja.caja_id ? null : caja)}
                rowClassName={(caja) => cajaSeleccionada?.caja_id === caja.caja_id ? 'bg-[#f0faf8] ring-1 ring-inset ring-[#075E54]' : ''}
              />
            </div>
            <div className="border-t border-[#c4c6cd] px-3 py-2 text-[11px] text-[#44474c]">
              Hacé click en una caja para ver sus productos vendidos
            </div>
          </div>
        </section>

        {cajaSeleccionada && (
          <section className="rounded-lg border border-[#c4c6cd] bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-[#c4c6cd] px-4 py-3">
              <div>
                <div className="flex items-center gap-2 text-[14px] font-bold text-[#041627]">
                  <TrendingUp size={16} className="text-[#075E54]" />
                  Productos vendidos — {cajaSeleccionada.empleado}
                </div>
                <div className="text-[12px] text-[#44474c]">
                  {dateTime(cajaSeleccionada.fecha_apertura)}
                  {cajaSeleccionada.fecha_cierre ? ` → ${dateTime(cajaSeleccionada.fecha_cierre)}` : ' (abierta)'}
                  {' · '}{cajaSeleccionada.ventas} ventas · vendido {money(cajaSeleccionada.total_vendido)} · ganancia {money(cajaSeleccionada.ganancia_estimada)}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCajaSeleccionada(null)}
                className="flex h-8 w-8 items-center justify-center rounded border border-[#c4c6cd] text-[#44474c] hover:bg-[#f3f4f6]"
              >
                <X size={14} />
              </button>
            </div>
            <div className="max-h-105 overflow-auto">
              <DataTable
                rows={productosCajaQuery.data ?? []}
                columns={productosColumns}
                getRowKey={(p) => p.producto_id}
                isLoading={productosCajaQuery.isLoading}
                loadingMessage="Cargando productos..."
                emptyMessage="Sin productos vendidos en esta caja."
              />
            </div>
            {(productosCajaQuery.data?.length ?? 0) > 0 && (
              <div className="flex flex-wrap gap-6 border-t border-[#c4c6cd] px-4 py-3 text-[13px]">
                <span className="text-[#44474c]">
                  Total productos: <span className="font-bold text-[#041627]">
                    {productosCajaQuery.data!.reduce((s, p) => s + p.cantidad, 0)} unidades
                  </span>
                </span>
                <span className="text-[#44474c]">
                  Total vendido: <span className="font-bold text-[#041627]">
                    {money(productosCajaQuery.data!.reduce((s, p) => s + p.total, 0))}
                  </span>
                </span>
                <span className="text-[#44474c]">
                  Ganancia estimada: <span className="font-bold text-[#027a48]">
                    {money(productosCajaQuery.data!.reduce((s, p) => s + p.margen, 0))}
                  </span>
                </span>
              </div>
            )}
          </section>
        )}

        <section className="rounded-lg border border-[#c4c6cd] bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-[#c4c6cd] px-4 py-3">
            <div className="flex items-center gap-2 text-[14px] font-bold text-[#041627]">
              <AlertTriangle size={16} className="text-[#b42318]" />
              Diferencias históricas de caja
              {diferenciasMeta && (
                <span className="text-[12px] font-normal text-[#44474c]">
                  ({diferenciasMeta.total} cajas con diferencia)
                </span>
              )}
            </div>
            {diferenciasMeta && diferenciasMeta.totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setDiferenciasPage((p) => Math.max(1, p - 1))}
                  disabled={diferenciasPage <= 1 || diferenciasQuery.isFetching}
                  className="flex h-7 w-7 items-center justify-center rounded border border-[#c4c6cd] text-[#44474c] hover:bg-[#f3f4f6] disabled:opacity-40"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="px-2 text-[13px] text-[#44474c]">
                  {diferenciasPage} / {diferenciasMeta.totalPages}
                </span>
                <button
                  onClick={() => setDiferenciasPage((p) => Math.min(diferenciasMeta.totalPages, p + 1))}
                  disabled={diferenciasPage >= diferenciasMeta.totalPages || diferenciasQuery.isFetching}
                  className="flex h-7 w-7 items-center justify-center rounded border border-[#c4c6cd] text-[#44474c] hover:bg-[#f3f4f6] disabled:opacity-40"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>

          {resumenDiferencias && diferenciasMeta && diferenciasMeta.total > 0 && (
            <div className="flex flex-wrap gap-4 border-b border-[#c4c6cd] px-4 py-3">
              <div className="flex items-center gap-2 text-[13px]">
                <span className="text-[#44474c]">Total diferencias:</span>
                <span className="font-bold text-[#041627]">{money(resumenDiferencias.total_diferencias)}</span>
              </div>
              <div className="flex items-center gap-2 text-[13px]">
                <span className="text-[#44474c]">Sobrantes:</span>
                <span className="font-bold text-[#027a48]">{resumenDiferencias.diferencias_positivas}</span>
              </div>
              <div className="flex items-center gap-2 text-[13px]">
                <span className="text-[#44474c]">Faltantes:</span>
                <span className="font-bold text-[#b42318]">{resumenDiferencias.diferencias_negativas}</span>
              </div>
            </div>
          )}

          <div className="max-h-105 overflow-auto">
            <DataTable
              rows={diferencias}
              columns={diferenciasColumns}
              getRowKey={(row) => row.caja_id}
              isLoading={diferenciasQuery.isLoading}
              loadingMessage="Cargando diferencias..."
              emptyMessage="Sin diferencias de caja en el periodo."
            />
          </div>
        </section>
      </div>
    </div>
  );
};

export default ReportesPosPage;
