import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  Printer,
  ReceiptText,
  RotateCcw,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useAuthStore } from '../../../store/auth.store';
import AccessDenied from '../../../components/common/AccessDenied';
import TableContextMenu from '../../../components/common/TableContextMenu';
import ComprobanteFicha from '../components/ComprobanteFicha';
import type { IComprobanteAux } from '../types/pos-aux.type';
import { useGetEmpleados } from '../../Empleados/hooks/useEmpleados';
import { useConfiguracionPos, usePosAuxMutation, useVentasPosPaginadasAux } from '../hooks/usePosAux';
import { dateTime, money } from '../utils/format';
import { imprimirComprobante } from '../utils/printComprobante';
import { hasAnyPermission, POS_PERMISSIONS } from '../utils/posPermissions';

const todayInput = () => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
};

const VentasPosAuxPage = () => {
  const permisos = useAuthStore((state) => state.permisos);
  const puedeVerVentas = hasAnyPermission(permisos, POS_PERMISSIONS.ventasVer, POS_PERMISSIONS.reportesVer, POS_PERMISSIONS.reportesVentas);
  const puedeEmitirFiscal = hasAnyPermission(permisos, POS_PERMISSIONS.cajaCobrar, POS_PERMISSIONS.configPos);
  const puedeDevolver = permisos.includes(POS_PERMISSIONS.ventasCancelarPagada);
  const puedeFiltrarEmpleado =
    permisos.includes('reportes.ver') || permisos.includes('reportes.ventas') || permisos.includes('config.pos');
  const [page, setPage] = useState(1);
  const [desde, setDesde] = useState(todayInput());
  const [hasta, setHasta] = useState(todayInput());
  const [empleadoId, setEmpleadoId] = useState('');
  const [selectedVentaId, setSelectedVentaId] = useState<string | null>(null);
  const [rowMenu, setRowMenu] = useState<{ x: number; y: number; venta: IComprobanteAux } | null>(null);
  const ventasQuery = useVentasPosPaginadasAux(
    {
      page,
      limit: 50,
      desde,
      hasta,
      empleado_id: puedeFiltrarEmpleado ? empleadoId : undefined,
    },
    puedeVerVentas,
  );
  const configQuery = useConfiguracionPos();
  const empleadosQuery = useGetEmpleados(1, 200, puedeFiltrarEmpleado);
  const mutations = usePosAuxMutation();
  const ventas = useMemo(() => ventasQuery.data?.data ?? [], [ventasQuery.data]);
  const meta = ventasQuery.data?.meta;
  const totalPages = meta?.totalPages ?? 1;
  const empleados = empleadosQuery.data?.data ?? [];
  const selectedVenta = useMemo(
    () => ventas.find((venta) => venta.id === selectedVentaId) ?? ventas[0] ?? null,
    [selectedVentaId, ventas],
  );
  const printVenta = (venta: IComprobanteAux) =>
    imprimirComprobante(venta, { titulo: 'Venta POS', config: configQuery.data });

  const emitir = (tipo: 'TICKET' | 'FACTURA_A' | 'FACTURA_B' | 'FACTURA_C') => {
    if (!puedeEmitirFiscal) return;
    if (!selectedVenta) return;
    mutations.emitirComprobanteVenta.mutate({ ventaId: selectedVenta.id, tipo });
  };

  const resetToday = () => {
    const today = todayInput();
    setDesde(today);
    setHasta(today);
    setPage(1);
  };

  if (!puedeVerVentas) {
    return (
      <AccessDenied
        title="Sin permisos para ventas POS"
        message="Necesitas ventas.ver o permisos de reportes para consultar ventas."
      />
    );
  }

  return (
    <div className="min-h-[calc(100vh-52px)] bg-[#f3f4f6] px-4 py-4">
      <div className="mx-auto grid max-w-[1500px] gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-lg border border-[#c4c6cd] bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-[#c4c6cd] px-4 py-3">
            <div className="flex items-center gap-2 text-[15px] font-bold text-[#041627]">
              <ReceiptText size={17} className="text-[#075E54]" />
              Ventas POS
            </div>
            <span className="rounded border border-[#cfe2de] bg-[#f3fbf9] px-2.5 py-1 text-[11px] font-semibold text-[#075E54]">
              {meta?.total ?? ventas.length} ventas
            </span>
          </div>

          <div className="grid gap-3 border-b border-[#c4c6cd] bg-[#fbfbfc] px-4 py-3 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1.25fr_auto]">
            <label className="text-[12px] font-semibold text-[#041627]">
              Desde
              <div className="mt-1 flex h-9 items-center gap-2 rounded border border-[#c4c6cd] bg-white px-2">
                <CalendarDays size={14} className="text-[#075E54]" />
                <input
                  type="date"
                  value={desde}
                  onChange={(event) => {
                    setDesde(event.target.value);
                    setPage(1);
                  }}
                  className="h-full min-w-0 flex-1 bg-transparent text-[13px] outline-none"
                />
              </div>
            </label>
            <label className="text-[12px] font-semibold text-[#041627]">
              Hasta
              <div className="mt-1 flex h-9 items-center gap-2 rounded border border-[#c4c6cd] bg-white px-2">
                <CalendarDays size={14} className="text-[#075E54]" />
                <input
                  type="date"
                  value={hasta}
                  onChange={(event) => {
                    setHasta(event.target.value);
                    setPage(1);
                  }}
                  className="h-full min-w-0 flex-1 bg-transparent text-[13px] outline-none"
                />
              </div>
            </label>
            {puedeFiltrarEmpleado ? (
              <label className="text-[12px] font-semibold text-[#041627]">
                Empleado
                <select
                  value={empleadoId}
                  onChange={(event) => {
                    setEmpleadoId(event.target.value);
                    setPage(1);
                  }}
                  className="mt-1 h-9 w-full rounded border border-[#c4c6cd] bg-white px-2 text-[13px] outline-none"
                >
                  <option value="">Todos</option>
                  {empleados.map((empleado) => (
                    <option key={empleado.id} value={empleado.id}>
                      {empleado.nombreCompleto}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <button
              type="button"
              onClick={resetToday}
              className="mt-auto h-9 rounded border border-[#c4c6cd] bg-white px-3 text-[12px] font-semibold text-[#041627] hover:bg-[#f4f5f6]"
            >
              Hoy
            </button>
          </div>

          <div className="max-h-[620px] overflow-auto">
            {ventas.map((venta) => (
              <button
                key={venta.id}
                type="button"
                onClick={() => setSelectedVentaId(venta.id)}
                onContextMenu={(event) => {
                  event.preventDefault();
                  setSelectedVentaId(venta.id);
                  setRowMenu({ x: event.clientX, y: event.clientY, venta });
                }}
                className={`flex w-full items-center justify-between gap-3 border-b border-[#e5e7eb] px-4 py-3 text-left hover:bg-[#f8fafc] ${
                  selectedVenta?.id === venta.id ? 'bg-[#eef8f6]' : ''
                }`}
              >
                <div className="min-w-0">
                  <div className="truncate text-[14px] font-bold text-[#041627]">
                    {venta.numero}
                  </div>
                  <div className="text-[12px] text-[#44474c]">
                    {venta.estado} | {dateTime(venta.created_at)}
                  </div>
                </div>
                <div className="text-right text-[15px] font-bold text-[#041627]">
                  {money(venta.total)}
                </div>
              </button>
            ))}
            {!ventas.length && !ventasQuery.isLoading ? (
              <div className="px-4 py-10 text-center text-[14px] text-[#44474c]">
                Sin ventas para los filtros seleccionados.
              </div>
            ) : null}
          </div>
          {rowMenu ? (
            <TableContextMenu
              x={rowMenu.x}
              y={rowMenu.y}
              onClose={() => setRowMenu(null)}
              actions={[
                {
                  label: 'Ver detalles',
                  icon: <Eye size={14} />,
                  onClick: () => setSelectedVentaId(rowMenu.venta.id),
                },
                {
                  label: 'Imprimir',
                  icon: <Printer size={14} />,
                  onClick: () => printVenta(rowMenu.venta),
                },
                {
                  label: 'Emitir ticket',
                  icon: <FileText size={14} />,
                  disabled: rowMenu.venta.estado !== 'COBRADA' || !puedeEmitirFiscal,
                  onClick: () => mutations.emitirComprobanteVenta.mutate({ ventaId: rowMenu.venta.id, tipo: 'TICKET' }),
                },
                {
                  label: 'Nota credito / devolucion',
                  icon: <RotateCcw size={14} />,
                  dividerBefore: true,
                  disabled: !puedeDevolver || !['COBRADA', 'ENTREGADO_PARCIAL', 'ENTREGADO'].includes(rowMenu.venta.estado),
                },
              ]}
            />
          ) : null}

          <div className="flex items-center justify-between border-t border-[#c4c6cd] px-4 py-3">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page <= 1 || ventasQuery.isFetching}
              className="flex h-9 items-center gap-2 rounded border border-[#c4c6cd] bg-white px-3 text-[12px] font-semibold text-[#041627] hover:bg-[#f4f5f6] disabled:opacity-50"
            >
              <ChevronLeft size={15} />
              Anterior
            </button>
            <div className="text-[12px] font-semibold text-[#44474c]">
              Pagina {meta?.page ?? page} / {totalPages}
            </div>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={page >= totalPages || ventasQuery.isFetching}
              className="flex h-9 items-center gap-2 rounded border border-[#c4c6cd] bg-white px-3 text-[12px] font-semibold text-[#041627] hover:bg-[#f4f5f6] disabled:opacity-50"
            >
              Siguiente
              <ChevronRight size={15} />
            </button>
          </div>
        </section>

        <ComprobanteFicha
          comprobante={selectedVenta}
          title="Ficha de venta POS"
          emptyTitle="Seleccione una venta"
          emptyDescription="Aca se vera la ficha completa de la venta."
          onPrint={printVenta}
          actions={
            selectedVenta ? (
              <>
                {(['TICKET', 'FACTURA_A', 'FACTURA_B', 'FACTURA_C'] as const).map((tipo) => (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => emitir(tipo)}
                    disabled={!puedeEmitirFiscal || selectedVenta.estado !== 'COBRADA' || mutations.emitirComprobanteVenta.isPending}
                    className="flex h-9 items-center gap-2 rounded border border-[#c4c6cd] bg-white px-3 text-[12px] font-semibold text-[#041627] hover:bg-[#f4f5f6] disabled:opacity-50"
                  >
                    <FileText size={14} />
                    {tipo}
                  </button>
                ))}
              </>
            ) : null
          }
        />
      </div>
    </div>
  );
};

export default VentasPosAuxPage;
