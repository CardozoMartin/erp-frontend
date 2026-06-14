import { ChevronLeft, ChevronRight, Eye, ReceiptText, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AccessDenied from '../../../components/common/AccessDenied';
import DataTable from '../../../components/common/DataTable';
import type { DataTableColumn } from '../../../components/common/DataTable';
import { useAuthStore } from '../../../store/auth.store';
import { useVentasGeneralAux } from '../../POSAuxiliares/hooks/usePosAux';
import type { IVentaGeneralAux } from '../../POSAuxiliares/types/pos-aux.type';
import { dateTime, money } from '../../POSAuxiliares/utils/format';
import { hasAnyPermission, POS_PERMISSIONS } from '../../POSAuxiliares/utils/posPermissions';

type TipoFiltro = 'TODOS' | 'VENTA' | 'COTIZACION';

const PAGE_SIZE = 25;

const tipoLabel: Record<string, string> = {
  VENTA: 'Venta',
  COTIZACION: 'Cotizacion',
};

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
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState<TipoFiltro>('TODOS');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const ventas = useMemo(() => ventasQuery.data ?? [], [ventasQuery.data]);
  const ventasFiltradas = useMemo(() => {
    const term = search.trim().toLowerCase();
    return ventas.filter((venta) => {
      const comprobante = venta.comprobante;
      if (tipoFiltro !== 'TODOS' && comprobante.tipo !== tipoFiltro) return false;
      if (!term) return true;
      return (
        comprobante.numero.toLowerCase().includes(term) ||
        comprobante.estado.toLowerCase().includes(term) ||
        comprobante.tipo.toLowerCase().includes(term) ||
        (venta.vendedor?.nombreCompleto ?? '').toLowerCase().includes(term) ||
        (venta.listaPrecio?.nombre ?? '').toLowerCase().includes(term)
      );
    });
  }, [search, tipoFiltro, ventas]);

  const totalPages = Math.max(1, Math.ceil(ventasFiltradas.length / PAGE_SIZE));
  const pageRows = ventasFiltradas.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const selectedVenta =
    ventas.find((venta) => venta.comprobante.id === selectedId) ?? null;
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
      render: (venta) => tipoLabel[venta.comprobante.tipo] ?? venta.comprobante.tipo,
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

  const changeTipo = (value: TipoFiltro) => {
    setTipoFiltro(value);
    setPage(1);
  };

  const changeSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

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

        <div className="grid gap-3 border-b border-[#c4c6cd] bg-[#fbfbfc] px-4 py-3 md:grid-cols-[180px_1fr]">
          <label className="text-[12px] font-semibold text-[#041627]">
            Tipo
            <select
              value={tipoFiltro}
              onChange={(event) => changeTipo(event.target.value as TipoFiltro)}
              className="mt-1 h-9 w-full rounded border border-[#c4c6cd] bg-white px-2 text-[13px] outline-none focus:border-[#075E54]"
            >
              <option value="TODOS">Todos</option>
              <option value="VENTA">Ventas</option>
              <option value="COTIZACION">Cotizaciones</option>
            </select>
          </label>
          <label className="text-[12px] font-semibold text-[#041627]">
            Buscar
            <div className="mt-1 flex h-9 items-center gap-2 rounded border border-[#c4c6cd] bg-white px-2">
              <Search size={14} className="text-[#075E54]" />
              <input
                value={search}
                onChange={(event) => changeSearch(event.target.value)}
                placeholder="Numero, estado, vendedor o lista"
                className="h-full min-w-0 flex-1 bg-transparent text-[13px] outline-none"
              />
            </div>
          </label>
        </div>

        <DataTable
          rows={pageRows}
          columns={columns}
          getRowKey={(venta) => venta.comprobante.id}
          isLoading={ventasQuery.isLoading}
          loadingMessage="Cargando ventas..."
          emptyMessage="Sin ventas ni cotizaciones"
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
