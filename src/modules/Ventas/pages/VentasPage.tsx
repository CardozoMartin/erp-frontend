import { ChevronDown, ChevronLeft, ChevronRight, Eye, Filter, ReceiptText, Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AccessDenied from '../../../components/common/AccessDenied';
import DataTable from '../../../components/common/DataTable';
import type { DataTableColumn } from '../../../components/common/DataTable';
import { useGetEmpleados } from '../../Empleados/hooks/useEmpleados';
import { useAuthStore } from '../../../store/auth.store';
import { useVentasGeneralAux } from '../../POSAuxiliares/hooks/usePosAux';
import type { IVentaGeneralAux } from '../../POSAuxiliares/types/pos-aux.type';
import { dateTime, money } from '../../POSAuxiliares/utils/format';
import { hasAnyPermission, POS_PERMISSIONS } from '../../POSAuxiliares/utils/posPermissions';

type Preset = 'hoy' | 'semana' | 'mes' | 'anio' | 'personalizado';

const PRESETS: { value: Preset; label: string }[] = [
  { value: 'hoy', label: 'Hoy' },
  { value: 'semana', label: 'Esta semana' },
  { value: 'mes', label: 'Este mes' },
  { value: 'anio', label: 'Este año' },
  { value: 'personalizado', label: 'Personalizado' },
];

const TIPOS_OPERACION = [
  { value: '', label: 'Todos los tipos' },
  { value: 'VENTA', label: 'Venta' },
  { value: 'COTIZACION', label: 'Cotización' },
  { value: 'TICKET', label: 'Ticket' },
  { value: 'FACTURA_A', label: 'Factura A' },
  { value: 'FACTURA_B', label: 'Factura B' },
  { value: 'FACTURA_C', label: 'Factura C' },
  { value: 'REMITO', label: 'Remito' },
  { value: 'NOTA_CREDITO', label: 'Nota de crédito' },
];

const ESTADOS_OPERACION = [
  { value: '', label: 'Todos los estados' },
  { value: 'BORRADOR', label: 'Borrador' },
  { value: 'PENDIENTE_COBRO', label: 'Pendiente cobro' },
  { value: 'PAGADO', label: 'Pagado' },
  { value: 'FACTURADO', label: 'Facturado' },
  { value: 'CANCELADO', label: 'Cancelado' },
  { value: 'RETIRADO', label: 'Retirado' },
];

const PAGE_SIZE = 25;

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function calcPreset(preset: Preset): { desde: string; hasta: string } {
  const hoy = new Date();
  const hasta = isoDate(hoy);
  if (preset === 'hoy') return { desde: hasta, hasta };
  if (preset === 'semana') {
    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() - hoy.getDay() + (hoy.getDay() === 0 ? -6 : 1));
    return { desde: isoDate(lunes), hasta };
  }
  if (preset === 'mes') {
    const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    return { desde: isoDate(inicio), hasta };
  }
  if (preset === 'anio') {
    const inicio = new Date(hoy.getFullYear(), 0, 1);
    return { desde: isoDate(inicio), hasta };
  }
  return { desde: '', hasta: '' };
}

const VentasPage = () => {
  const permisos = useAuthStore((state) => state.permisos);
  const puedeVerVentas = hasAnyPermission(
    permisos,
    POS_PERMISSIONS.ventasVer,
    POS_PERMISSIONS.reportesVer,
    POS_PERMISSIONS.reportesVentas,
  );
  const navigate = useNavigate();
  const ventasQuery = useVentasGeneralAux(puedeVerVentas);
  const { data: empleadosResponse } = useGetEmpleados(1, 1000, puedeVerVentas);
  const empleados = useMemo(() => empleadosResponse?.data ?? [], [empleadosResponse]);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [preset, setPreset] = useState<Preset>('mes');
  const [desde, setDesde] = useState(() => calcPreset('mes').desde);
  const [hasta, setHasta] = useState(() => calcPreset('mes').hasta);
  const [empleadoId, setEmpleadoId] = useState('');
  const [tipo, setTipo] = useState('');
  const [estado, setEstado] = useState('');
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const hayFiltrosExtra = !!(empleadoId || tipo || estado || search);

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
    setSearch('');
    setEmpleadoId('');
    setTipo('');
    setEstado('');
    const rango = calcPreset('mes');
    setPreset('mes');
    setDesde(rango.desde);
    setHasta(rango.hasta);
    setPage(1);
  };

  const ventas = useMemo(() => ventasQuery.data ?? [], [ventasQuery.data]);

  const ventasFiltradas = useMemo(() => {
    const term = search.trim().toLowerCase();
    const desdeDate = desde ? new Date(`${desde}T00:00:00`) : null;
    const hastaDate = hasta ? new Date(`${hasta}T23:59:59.999`) : null;

    return ventas.filter((venta) => {
      const comprobante = venta.comprobante;
      const fecha = new Date(comprobante.created_at);
      if (desdeDate && fecha < desdeDate) return false;
      if (hastaDate && fecha > hastaDate) return false;
      if (tipo && comprobante.tipo !== tipo) return false;
      if (estado && comprobante.estado !== estado) return false;
      if (empleadoId) {
        const esVendedor = comprobante.empleado_vendedor_id === empleadoId;
        const esCajero = comprobante.empleado_cajero_id === empleadoId;
        if (!esVendedor && !esCajero) return false;
      }
      if (term) {
        return (
          comprobante.numero.toLowerCase().includes(term) ||
          comprobante.estado.toLowerCase().includes(term) ||
          comprobante.tipo.toLowerCase().includes(term) ||
          (venta.vendedor?.nombreCompleto ?? '').toLowerCase().includes(term) ||
          (venta.listaPrecio?.nombre ?? '').toLowerCase().includes(term)
        );
      }
      return true;
    });
  }, [ventas, desde, hasta, tipo, estado, empleadoId, search]);

  const totalPages = Math.max(1, Math.ceil(ventasFiltradas.length / PAGE_SIZE));
  const pageRows = ventasFiltradas.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const selectedVenta = ventas.find((venta) => venta.comprobante.id === selectedId) ?? null;

  const toggleVenta = (venta: IVentaGeneralAux) =>
    setSelectedId((current) => (current === venta.comprobante.id ? null : venta.comprobante.id));
  const goToDetalle = (venta: IVentaGeneralAux) => navigate(`/ventas/${venta.comprobante.id}`);

  const columns: DataTableColumn<IVentaGeneralAux>[] = [
    {
      key: 'seleccionar',
      header: '',
      align: 'center',
      className: 'w-[48px]',
      render: (venta) => (
        <input
          type="checkbox"
          checked={selectedId === venta.comprobante.id}
          onChange={() => toggleVenta(venta)}
          onClick={(event) => event.stopPropagation()}
          className="h-4 w-4 accent-[#075E54]"
          aria-label={`Seleccionar ${venta.comprobante.numero}`}
        />
      ),
    },
    {
      key: 'fecha',
      header: 'Fecha y hora',
      render: (venta) => dateTime(venta.comprobante.created_at),
    },
    {
      key: 'numero',
      header: 'Numero',
      render: (venta) => <span className="font-semibold text-[#041627]">{venta.comprobante.numero}</span>,
    },
    {
      key: 'tipo',
      header: 'Tipo',
      render: (venta) => {
        const found = TIPOS_OPERACION.find((t) => t.value === venta.comprobante.tipo);
        return found?.label ?? venta.comprobante.tipo;
      },
    },
    {
      key: 'vendedor',
      header: 'Vendedor',
      render: (venta) => venta.vendedor?.nombreCompleto ?? '-',
    },
    {
      key: 'lista',
      header: 'Lista precio',
      render: (venta) => venta.listaPrecio?.nombre ?? 'Precio base',
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (venta) => venta.comprobante.estado,
    },
    {
      key: 'total',
      header: 'Total',
      align: 'right',
      render: (venta) => <span className="font-semibold text-[#041627]">{money(venta.comprobante.total)}</span>,
    },
  ];

  if (!puedeVerVentas) {
    return (
      <AccessDenied
        title="Sin permisos para ventas"
        message="Necesitas ventas.ver o permisos de reportes para consultar ventas y cotizaciones."
      />
    );
  }

  return (
    <div className="min-h-[calc(100vh-52px)] bg-[#f3f4f6] px-4 py-4">
      <section className="mx-auto max-w-[1500px] rounded-lg border border-[#c4c6cd] bg-white shadow-sm">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#c4c6cd] px-4 py-3">
          <div className="flex items-center gap-2 text-[15px] font-bold text-[#041627]">
            <ReceiptText size={17} className="text-[#075E54]" />
            Ventas
          </div>
          <span className="rounded border border-[#cfe2de] bg-[#f3fbf9] px-2.5 py-1 text-[11px] font-semibold text-[#075E54]">
            {ventasFiltradas.length} registros
          </span>
          {selectedVenta ? (
            <button
              type="button"
              onClick={() => goToDetalle(selectedVenta)}
              className="inline-flex h-9 items-center gap-2 rounded bg-[#075E54] px-3 text-[12px] font-semibold text-white hover:bg-[#0b6d62]"
            >
              <Eye size={14} />
              Ver detalles
            </button>
          ) : null}
        </div>

        {/* Presets de fecha + rango + toggle filtros */}
        <div className="flex flex-wrap items-center gap-2 border-b border-[#c4c6cd] bg-[#fbfbfc] px-4 py-3">
          {PRESETS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => aplicarPreset(p.value)}
              className={`rounded px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                preset === p.value
                  ? 'bg-[#075E54] text-white'
                  : 'border border-[#c4c6cd] bg-white text-[#44474c] hover:bg-[#f4f5f6]'
              }`}
            >
              {p.label}
            </button>
          ))}

          <div className="ml-auto flex items-center gap-2">
            <input
              type="date"
              value={desde}
              onChange={(e) => { setDesde(e.target.value); setPreset('personalizado'); setPage(1); }}
              className="h-8 rounded border border-[#c4c6cd] bg-white px-2 text-[12px] outline-none focus:border-[#075E54]"
            />
            <span className="text-[12px] text-[#44474c]">—</span>
            <input
              type="date"
              value={hasta}
              onChange={(e) => { setHasta(e.target.value); setPreset('personalizado'); setPage(1); }}
              className="h-8 rounded border border-[#c4c6cd] bg-white px-2 text-[12px] outline-none focus:border-[#075E54]"
            />

            <button
              type="button"
              onClick={() => setFiltrosAbiertos((v) => !v)}
              className={`relative flex h-8 items-center gap-1.5 rounded border px-2.5 text-[12px] font-semibold transition-colors ${
                filtrosAbiertos || hayFiltrosExtra
                  ? 'border-[#075E54] bg-[#eef8f6] text-[#075E54]'
                  : 'border-[#c4c6cd] bg-white text-[#44474c] hover:bg-[#f4f5f6]'
              }`}
            >
              <Filter size={13} />
              Filtros
              {hayFiltrosExtra && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#075E54] text-[9px] font-bold text-white">
                  {[empleadoId, tipo, estado, search].filter(Boolean).length}
                </span>
              )}
              <ChevronDown size={12} className={`transition-transform ${filtrosAbiertos ? 'rotate-180' : ''}`} />
            </button>

            {hayFiltrosExtra && (
              <button
                type="button"
                onClick={limpiarFiltros}
                title="Limpiar filtros"
                className="flex h-8 w-8 items-center justify-center rounded border border-[#c4c6cd] bg-white text-[#44474c] hover:bg-[#f4f5f6]"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Panel filtros avanzados */}
        {filtrosAbiertos && (
          <div className="grid gap-3 border-b border-[#c4c6cd] bg-[#f9fafb] px-4 py-3 md:grid-cols-4">
            <label className="text-[12px] font-semibold text-[#041627]">
              Empleado
              <select
                value={empleadoId}
                onChange={(e) => { setEmpleadoId(e.target.value); setPage(1); }}
                className="mt-1 h-9 w-full rounded border border-[#c4c6cd] bg-white px-2 text-[13px] outline-none focus:border-[#075E54]"
              >
                <option value="">Todos</option>
                {empleados.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nombreCompleto}
                  </option>
                ))}
              </select>
            </label>

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
                {ESTADOS_OPERACION.map((op) => (
                  <option key={op.value} value={op.value}>{op.label}</option>
                ))}
              </select>
            </label>

            <label className="text-[12px] font-semibold text-[#041627]">
              N° comprobante / buscar
              <div className="mt-1 flex h-9 items-center gap-2 rounded border border-[#c4c6cd] bg-white px-2 focus-within:border-[#075E54]">
                <Search size={13} className="text-[#075E54]" />
                <input
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Número, vendedor, estado..."
                  className="h-full min-w-0 flex-1 bg-transparent text-[13px] outline-none"
                />
              </div>
            </label>
          </div>
        )}

        <DataTable
          rows={pageRows}
          columns={columns}
          getRowKey={(venta) => venta.comprobante.id}
          isLoading={ventasQuery.isLoading}
          loadingMessage="Cargando ventas..."
          emptyMessage="Sin ventas en el período seleccionado"
          minWidth="1040px"
          onRowClick={toggleVenta}
          rowClassName={(venta) => (selectedId === venta.comprobante.id ? 'bg-[#eef8f6]' : '')}
          getContextActions={(venta) => [
            {
              label: 'Ver detalles',
              icon: <Eye size={14} />,
              onClick: () => goToDetalle(venta),
            },
          ]}
        />

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
            Pagina {page} / {totalPages}
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
    </div>
  );
};

export default VentasPage;
