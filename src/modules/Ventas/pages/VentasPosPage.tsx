import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  Filter,
  Printer,
  ReceiptText,
  RotateCcw,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useAuthStore } from '../../../store/auth.store';
import AccessDenied from '../../../components/common/AccessDenied';
import TableContextMenu from '../../../components/common/TableContextMenu';
import ComprobanteFicha from '../../POSAuxiliares/components/ComprobanteFicha';
import type { IComprobanteAux } from '../../POSAuxiliares/types/pos-aux.type';
import { useGetEmpleados } from '../../Empleados/hooks/useEmpleados';
import { useConfiguracionPos, usePosAuxMutation, useVentasPosPaginadasAux } from '../../POSAuxiliares/hooks/usePosAux';
import { dateTime, money } from '../../POSAuxiliares/utils/format';
import { imprimirComprobante } from '../../POSAuxiliares/utils/printComprobante';
import { obtenerQrFiscalFn } from '../../POSAuxiliares/api/posAux.api';
import { hasAnyPermission, POS_PERMISSIONS } from '../../POSAuxiliares/utils/posPermissions';

const todayInput = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

const isoDate = (d: Date) => {
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

const TIPOS_OPERACION = [
  { value: '',              label: 'Todos los tipos' },
  { value: 'VENTA',        label: 'Venta' },
  { value: 'TICKET',       label: 'Ticket' },
  { value: 'COTIZACION',   label: 'Cotización' },
  { value: 'FACTURA_A',    label: 'Factura A' },
  { value: 'FACTURA_B',    label: 'Factura B' },
  { value: 'FACTURA_C',    label: 'Factura C' },
  { value: 'REMITO',       label: 'Remito' },
  { value: 'NOTA_CREDITO', label: 'Nota de crédito' },
];

const ESTADOS_OPERACION = [
  { value: '',                label: 'Todos los estados' },
  { value: 'BORRADOR',        label: 'Borrador' },
  { value: 'PENDIENTE_COBRO', label: 'Pendiente de cobro' },
  { value: 'COBRADA',         label: 'Cobrada' },
  { value: 'ENTREGADO',       label: 'Entregado' },
  { value: 'ENTREGADO_PARCIAL', label: 'Entregado parcial' },
  { value: 'ANULADO',         label: 'Anulado' },
  { value: 'CANCELADA',       label: 'Cancelada' },
  { value: 'DEVUELTA',        label: 'Devuelta' },
];

type Preset = 'hoy' | 'semana' | 'mes' | 'anio' | 'personalizado';

const PRESETS: { value: Preset; label: string }[] = [
  { value: 'hoy',          label: 'Hoy' },
  { value: 'semana',       label: 'Esta semana' },
  { value: 'mes',          label: 'Este mes' },
  { value: 'anio',         label: 'Este año' },
  { value: 'personalizado', label: 'Personalizado' },
];

const calcPreset = (preset: Preset): { desde: string; hasta: string } => {
  const hoy = new Date();
  const hasta = isoDate(new Date(hoy));
  if (preset === 'hoy') return { desde: hasta, hasta };
  if (preset === 'semana') {
    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() - hoy.getDay() + (hoy.getDay() === 0 ? -6 : 1));
    return { desde: isoDate(lunes), hasta };
  }
  if (preset === 'mes') {
    return { desde: isoDate(new Date(hoy.getFullYear(), hoy.getMonth(), 1)), hasta };
  }
  if (preset === 'anio') {
    return { desde: isoDate(new Date(hoy.getFullYear(), 0, 1)), hasta };
  }
  return { desde: hasta, hasta };
};

const VentasPosPage = () => {
  const permisos = useAuthStore((state) => state.permisos);
  const puedeVerVentas = hasAnyPermission(permisos, POS_PERMISSIONS.ventasVer, POS_PERMISSIONS.reportesVer, POS_PERMISSIONS.reportesVentas);
  const puedeEmitirFiscal = hasAnyPermission(permisos, POS_PERMISSIONS.cajaCobrar, POS_PERMISSIONS.configPos);
  const puedeDevolver = permisos.includes(POS_PERMISSIONS.ventasCancelarPagada);
  const puedeFiltrarEmpleado =
    permisos.includes('reportes.ver') || permisos.includes('reportes.ventas') || permisos.includes('config.pos');

  const [page, setPage] = useState(1);
  const [preset, setPreset] = useState<Preset>('hoy');
  const [desde, setDesde] = useState(todayInput());
  const [hasta, setHasta] = useState(todayInput());
  const [empleadoId, setEmpleadoId] = useState('');
  const [tipo, setTipo] = useState('');
  const [estado, setEstado] = useState('');
  const [numero, setNumero] = useState('');
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);

  const [selectedVentaId, setSelectedVentaId] = useState<string | null>(null);
  const [rowMenu, setRowMenu] = useState<{ x: number; y: number; venta: IComprobanteAux } | null>(null);

  const hayFiltrosExtra = !!(empleadoId || tipo || estado || numero);

  const ventasQuery = useVentasPosPaginadasAux(
    {
      page,
      limit: 50,
      desde,
      hasta,
      empleado_id: puedeFiltrarEmpleado ? empleadoId || undefined : undefined,
      tipo: tipo || undefined,
      estado: estado || undefined,
      numero: numero || undefined,
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

  const printVenta = async (venta: IComprobanteAux) => {
    const qrDataUri = venta.cae ? await obtenerQrFiscalFn(venta.id) : null;
    imprimirComprobante(venta, { titulo: 'Venta POS', config: configQuery.data, qrDataUri });
  };

  const emitir = (tipo: 'TICKET' | 'FACTURA_A' | 'FACTURA_B' | 'FACTURA_C') => {
    if (!puedeEmitirFiscal || !selectedVenta) return;
    mutations.emitirComprobanteVenta.mutate({ ventaId: selectedVenta.id, tipo });
  };

  const aplicarPreset = (p: Preset) => {
    setPreset(p);
    if (p !== 'personalizado') {
      const rango = calcPreset(p);
      setDesde(rango.desde);
      setHasta(rango.hasta);
    }
    setPage(1);
  };

  const limpiarFiltros = () => {
    setEmpleadoId('');
    setTipo('');
    setEstado('');
    setNumero('');
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

          {/* ── Presets de período ── */}
          <div className="flex items-center gap-1 border-b border-[#c4c6cd] bg-[#fbfbfc] px-4 py-2 overflow-x-auto">
            {PRESETS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => aplicarPreset(p.value)}
                className={`whitespace-nowrap rounded-md px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                  preset === p.value
                    ? 'bg-[#041627] text-white'
                    : 'border border-[#c4c6cd] bg-white text-[#44474c] hover:bg-[#efedef]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* ── Fechas + botón filtros avanzados ── */}
          <div className="flex flex-wrap items-end gap-3 border-b border-[#c4c6cd] bg-[#fbfbfc] px-4 py-3">
            <label className="text-[12px] font-semibold text-[#041627]">
              Desde
              <div className="mt-1 flex h-9 items-center gap-2 rounded border border-[#c4c6cd] bg-white px-2">
                <CalendarDays size={14} className="text-[#075E54]" />
                <input
                  type="date"
                  value={desde}
                  onChange={(e) => { setDesde(e.target.value); setPreset('personalizado'); setPage(1); }}
                  className="h-full min-w-0 bg-transparent text-[13px] outline-none"
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
                  onChange={(e) => { setHasta(e.target.value); setPreset('personalizado'); setPage(1); }}
                  className="h-full min-w-0 bg-transparent text-[13px] outline-none"
                />
              </div>
            </label>

            <div className="ml-auto flex items-center gap-2">
              {hayFiltrosExtra && (
                <button
                  type="button"
                  onClick={limpiarFiltros}
                  className="flex h-9 items-center gap-1.5 rounded border border-[#c4c6cd] bg-white px-3 text-[12px] font-semibold text-[#44474c] hover:bg-[#fce8e8] hover:text-[#ba1a1a]"
                >
                  <X size={13} /> Limpiar
                </button>
              )}
              <button
                type="button"
                onClick={() => setFiltrosAbiertos((v) => !v)}
                className={`flex h-9 items-center gap-1.5 rounded border px-3 text-[12px] font-semibold transition-colors ${
                  filtrosAbiertos || hayFiltrosExtra
                    ? 'border-[#075E54] bg-[#f0faf8] text-[#075E54]'
                    : 'border-[#c4c6cd] bg-white text-[#44474c] hover:bg-[#efedef]'
                }`}
              >
                <Filter size={13} />
                Filtros avanzados
                {hayFiltrosExtra && (
                  <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#075E54] text-[10px] font-bold text-white">
                    {[empleadoId, tipo, estado, numero].filter(Boolean).length}
                  </span>
                )}
                <ChevronDown size={13} className={`transition-transform ${filtrosAbiertos ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {/* ── Panel filtros avanzados ── */}
          {filtrosAbiertos && (
            <div className="grid gap-3 border-b border-[#c4c6cd] bg-[#f8fafc] px-4 py-3 sm:grid-cols-2 xl:grid-cols-4">
              {puedeFiltrarEmpleado && (
                <label className="text-[12px] font-semibold text-[#041627]">
                  Empleado
                  <select
                    value={empleadoId}
                    onChange={(e) => { setEmpleadoId(e.target.value); setPage(1); }}
                    className="mt-1 h-9 w-full rounded border border-[#c4c6cd] bg-white px-2 text-[13px] outline-none focus:border-[#075E54]"
                  >
                    <option value="">Todos los empleados</option>
                    {empleados.map((emp) => (
                      <option key={emp.id} value={emp.id}>{emp.nombreCompleto}</option>
                    ))}
                  </select>
                </label>
              )}
              <label className="text-[12px] font-semibold text-[#041627]">
                Tipo de operación
                <select
                  value={tipo}
                  onChange={(e) => { setTipo(e.target.value); setPage(1); }}
                  className="mt-1 h-9 w-full rounded border border-[#c4c6cd] bg-white px-2 text-[13px] outline-none focus:border-[#075E54]"
                >
                  {TIPOS_OPERACION.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </label>
              <label className="text-[12px] font-semibold text-[#041627]">
                Estado
                <select
                  value={estado}
                  onChange={(e) => { setEstado(e.target.value); setPage(1); }}
                  className="mt-1 h-9 w-full rounded border border-[#c4c6cd] bg-white px-2 text-[13px] outline-none focus:border-[#075E54]"
                >
                  {ESTADOS_OPERACION.map((e) => (
                    <option key={e.value} value={e.value}>{e.label}</option>
                  ))}
                </select>
              </label>
              <label className="text-[12px] font-semibold text-[#041627]">
                N° de comprobante
                <input
                  type="text"
                  value={numero}
                  onChange={(e) => { setNumero(e.target.value); setPage(1); }}
                  placeholder="Ej: 00001-00000042"
                  className="mt-1 h-9 w-full rounded border border-[#c4c6cd] bg-white px-2 text-[13px] outline-none focus:border-[#075E54]"
                />
              </label>
            </div>
          )}

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

export default VentasPosPage;
