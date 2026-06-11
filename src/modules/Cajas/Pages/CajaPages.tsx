import { ArrowDownCircle, ArrowLeft, ArrowUpCircle, Calculator, CreditCard, Lock, PackageMinus, Plus, ReceiptText, ShieldAlert, UserRound, Wallet } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../../../store/auth.store';
import AccessDenied from '../../../components/common/AccessDenied';
import DataTable from '../../../components/common/DataTable';
import type { DataTableColumn } from '../../../components/common/DataTable';
import FichaHistoryPanel from '../../../components/common/FichaHistoryPanel';
import { useAuditoriaCaja, useCajaAbierta, useCajaMutations, useCajas, usePedidosCaja, useResumenCaja } from '../hooks/useCaja';
import type { IAuditoriaCaja, ICaja, IResumenCaja } from '../types/caja.type';
import { dateTime, money, shortId, toNumber } from '../utils/format';
import { hasAnyPermission, POS_PERMISSIONS } from '../utils/cajaPermissions';
import { useGetProducts } from '../../Productos/hooks/useProducts';
import { useVentasCaja } from '../../PuntoDeVenta/hooks/usePos';
import type { IVentaCajaPos } from '../../PuntoDeVenta/types/pos.type';

const categoriasEgreso = [
  { value: 'RETIRO_DINERO', label: 'Retiro de dinero' },
  { value: 'PAGO_PROVEEDOR', label: 'Pago a proveedor' },
  { value: 'PAGO_EMPLEADO', label: 'Pago a empleado' },
  { value: 'COMPRA_LOCAL', label: 'Compra para el local' },
  { value: 'CONSUMO_INTERNO', label: 'Consumo interno' },
  { value: 'OTRO', label: 'Otro egreso' },
] as const;

type CajaPanel = 'resumen' | 'egreso' | 'consumo' | 'cierre' | 'historial' | 'movimientos' | 'auditoria';
type CobroMedio = IResumenCaja['cobros_por_medio'][number];
type CajaMovimientoEvent = {
  id: string;
  accion: string;
  descripcion?: string | null;
  created_at: string;
  monto: number | string;
  categoria_egreso?: string | null;
  entidad_nombre?: string | null;
};

const formatVentaPagos = (ventaCaja: IVentaCajaPos) => {
  if (!ventaCaja.pagos.length) return 'Sin pagos';
  return ventaCaja.pagos
    .map((pago) => `${pago.medioPago?.nombre ?? pago.tipo}: ${money(pago.monto)}`)
    .join(' | ');
};

const formatVentaProductos = (ventaCaja: IVentaCajaPos) => {
  if (!ventaCaja.venta.items.length) return 'Sin productos';
  return ventaCaja.venta.items
    .map((item) => `${Number(item.cantidad ?? 0)} x ${item.descripcion}`)
    .join(' | ');
};

const CajaPages = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cajaId } = useParams();
  const permisos = useAuthStore((state) => state.permisos);
  const puedeVerCaja = hasAnyPermission(permisos, POS_PERMISSIONS.cajaVer, POS_PERMISSIONS.reportesVer, POS_PERMISSIONS.reportesCaja, POS_PERMISSIONS.configPos);
  const puedeAbrirCaja = permisos.includes(POS_PERMISSIONS.cajaAbrir);
  const puedeCerrarCaja = permisos.includes(POS_PERMISSIONS.cajaCerrar);
  const puedeRegistrarMovimiento = permisos.includes(POS_PERMISSIONS.cajaMovimientosCrear);
  const puedeConsumirStock = hasAnyPermission(permisos, POS_PERMISSIONS.cajaMovimientosCrear, POS_PERMISSIONS.stockAjuste);
  const puedeVerTodasCajas = hasAnyPermission(permisos, POS_PERMISSIONS.reportesVer, POS_PERMISSIONS.reportesCaja, POS_PERMISSIONS.configPos);
  const cajaAbiertaQuery = useCajaAbierta(puedeVerCaja || puedeAbrirCaja || puedeCerrarCaja || puedeRegistrarMovimiento);
  const mutations = useCajaMutations();
  const [montoInicial, setMontoInicial] = useState('1000');
  const [montoMovimiento, setMontoMovimiento] = useState('');
  const [montoCierre, setMontoCierre] = useState('');
  const [descripcionCierre, setDescripcionCierre] = useState('');
  const [categoriaEgreso, setCategoriaEgreso] = useState<(typeof categoriasEgreso)[number]['value']>('RETIRO_DINERO');
  const [entidadNombre, setEntidadNombre] = useState('');
  const [referenciaEgreso, setReferenciaEgreso] = useState('');
  const [descripcionEgreso, setDescripcionEgreso] = useState('');
  const [productoConsumoId, setProductoConsumoId] = useState('');
  const [productoSearch, setProductoSearch] = useState('');
  const [cantidadConsumo, setCantidadConsumo] = useState('1');
  const [descripcionConsumo, setDescripcionConsumo] = useState('');
  const [desdeCajas, setDesdeCajas] = useState('');
  const [hastaCajas, setHastaCajas] = useState('');
  const [estadoCajas, setEstadoCajas] = useState<'TODAS' | 'ABIERTA' | 'CERRADA'>('TODAS');
  const [activePanel, setActivePanel] = useState<CajaPanel>('resumen');
  const [selectedCajaId, setSelectedCajaId] = useState<string | null>(cajaId ?? null);
  const [selectedVentaId, setSelectedVentaId] = useState<string | null>(null);

  const cajasQuery = useCajas(
    puedeVerTodasCajas
      ? {
          desde: desdeCajas || undefined,
          hasta: hastaCajas || undefined,
          estado: estadoCajas === 'TODAS' ? undefined : estadoCajas,
        }
      : {},
    puedeVerCaja,
  );
  const cajaAbierta = cajaAbiertaQuery.data;
  const routeCajaId = cajaId ?? selectedCajaId;
  const resumenCajaId = routeCajaId ?? cajaAbierta?.id;
  const resumenQuery = useResumenCaja(resumenCajaId, puedeVerCaja);
  const pedidosCajaQuery = usePedidosCaja(routeCajaId, puedeVerCaja && (!!routeCajaId));
  const auditoriaCajaQuery = useAuditoriaCaja(
    {
      page: 1,
      limit: 50,
      entidad: 'caja',
      entidad_id: resumenCajaId ?? '',
    },
    puedeVerCaja && !!resumenCajaId,
  );
  const ventasCajaQuery = useVentasCaja(routeCajaId);
  const productsQuery = useGetProducts(1, 200);
  const resumen = resumenQuery.data;
  const cajaEnDetalle = resumen?.caja ?? cajaAbierta;
  const cajas = cajasQuery.data ?? [];
  const cajasAbiertas = cajas.filter((caja) => caja.estado === 'ABIERTA');
  const cajasListado = puedeVerTodasCajas ? cajas : cajasAbiertas;
  const ventasCaja = ventasCajaQuery.data ?? [];
  const pedidosCaja = pedidosCajaQuery.data ?? [];
  const selectedVenta =
    ventasCaja.find((ventaCaja) => ventaCaja.venta.id === selectedVentaId) ??
    ventasCaja[0] ??
    null;

  useEffect(() => {
    const panel = new URLSearchParams(location.search).get('panel') as CajaPanel | null;
    if (
      panel &&
      ['resumen', 'egreso', 'consumo', 'cierre', 'historial', 'movimientos', 'auditoria'].includes(panel)
    ) {
      setActivePanel(panel);
    }
  }, [location.search]);
  const isListadoCajas = !cajaId && location.pathname === '/caja';
  const isDetalleCaja = !!cajaId && !location.pathname.endsWith('/cierre');
  const isCierreCaja = !!cajaId && location.pathname.endsWith('/cierre');
  const productosResponse = productsQuery.data;
  const productos = Array.isArray(productosResponse)
    ? productosResponse
    : productosResponse?.data ?? [];
  const productosConsumo = useMemo(() => {
    const term = productoSearch.trim().toLowerCase();
    if (!term) return productos.slice(0, 20);
    return productos
      .filter((producto) => {
        const codigo = producto.codigo_barras?.toLowerCase?.() ?? '';
        return producto.nombre.toLowerCase().includes(term) || codigo.includes(term);
      })
      .slice(0, 30);
  }, [productoSearch, productos]);
  const productoConsumo = productos.find((producto) => producto.id === productoConsumoId);
  const montoDeclarado = toNumber(montoCierre);
  const montoCalculado = toNumber(resumen?.totales.calculado);
  const montoEgreso = toNumber(montoMovimiento);
  const egresoSuperaDisponible = montoEgreso > montoCalculado;
  const diferenciaPreview = useMemo(
    () => Number((montoDeclarado - montoCalculado).toFixed(2)),
    [montoCalculado, montoDeclarado],
  );
  const cierreTieneDiferencia = Math.abs(diferenciaPreview) > 0.009;
  const movimientosCaja = useMemo<CajaMovimientoEvent[]>(
    () =>
      (cajaEnDetalle?.movimientos ?? []).map((movimiento) => ({
        id: movimiento.id,
        accion: movimiento.tipo,
        descripcion: movimiento.descripcion,
        created_at: movimiento.fecha,
        monto: movimiento.monto,
        categoria_egreso: movimiento.categoria_egreso,
        entidad_nombre: movimiento.entidad_nombre,
      })),
    [cajaEnDetalle?.movimientos],
  );
  const auditoriaCaja = auditoriaCajaQuery.data?.data ?? [];
  const cobrosColumns: DataTableColumn<CobroMedio>[] = [
    {
      key: 'medio',
      header: 'Medio',
      render: (medio) => <span className="font-semibold text-[#041627]">{medio.medio}</span>,
    },
    {
      key: 'operaciones',
      header: 'Operaciones',
      align: 'right',
      render: (medio) => medio.cantidad,
    },
    {
      key: 'total',
      header: 'Total',
      align: 'right',
      render: (medio) => <span className="font-bold text-[#041627]">{money(medio.total)}</span>,
    },
  ];
  const cajasColumns: DataTableColumn<ICaja>[] = [
    {
      key: 'caja',
      header: 'Caja',
      render: (caja) => <span className="font-semibold text-[#041627]">{shortId(caja.id)}</span>,
    },
    { key: 'estado', header: 'Estado', render: (caja) => caja.estado },
    { key: 'apertura', header: 'Apertura', render: (caja) => dateTime(caja.fecha_apertura) },
    { key: 'inicial', header: 'Inicial', align: 'right', render: (caja) => money(caja.monto_inicial) },
    { key: 'declarado', header: 'Declarado', align: 'right', render: (caja) => money(caja.monto_final_declarado) },
    { key: 'calculado', header: 'Calculado', align: 'right', render: (caja) => money(caja.monto_final_calculado) },
    { key: 'diferencia', header: 'Diferencia', align: 'right', render: (caja) => money(caja.diferencia) },
  ];
  const ventasCajaColumns: DataTableColumn<IVentaCajaPos>[] = [
    {
      key: 'venta',
      header: 'Venta',
      render: (ventaCaja) => (
        <div>
          <div className="font-semibold text-[#041627]">{ventaCaja.venta.numero}</div>
          <div className="text-[12px] text-[#44474c]">{dateTime(ventaCaja.venta.created_at)}</div>
        </div>
      ),
    },
    {
      key: 'productos',
      header: 'Productos',
      render: (ventaCaja) => (
        <span className="block max-w-[420px] whitespace-normal text-[12px] leading-snug text-[#44474c]">
          {formatVentaProductos(ventaCaja)}
        </span>
      ),
    },
    {
      key: 'pagos',
      header: 'Tipo de pago',
      render: (ventaCaja) => (
        <span className="block max-w-[260px] whitespace-normal text-[12px] leading-snug text-[#44474c]">
          {formatVentaPagos(ventaCaja)}
        </span>
      ),
    },
    {
      key: 'total',
      header: 'Total',
      align: 'right',
      render: (ventaCaja) => <span className="font-bold text-[#041627]">{money(ventaCaja.venta.total)}</span>,
    },
  ];
  const registrarEgreso = () => {
    if (!puedeRegistrarMovimiento) return;
    if (!cajaAbierta) return;
    if (egresoSuperaDisponible) return;
    mutations.movimientoCaja.mutate(
      {
        cajaId: cajaAbierta.id,
        tipo: 'EGRESO',
        monto: montoEgreso,
        categoria_egreso: categoriaEgreso,
        entidad_nombre: entidadNombre.trim() || null,
        referencia: referenciaEgreso.trim() || null,
        descripcion: descripcionEgreso.trim() || categoriasEgreso.find((item) => item.value === categoriaEgreso)?.label,
      },
      {
        onSuccess: () => {
          setMontoMovimiento('');
          setEntidadNombre('');
          setReferenciaEgreso('');
          setDescripcionEgreso('');
        },
      },
    );
  };

  const registrarConsumo = () => {
    if (!puedeConsumirStock) return;
    if (!cajaAbierta) return;
    if (!productoConsumoId) return;
    const producto = productos.find((item) => item.id === productoConsumoId);
    const descripcionFinal =
      descripcionConsumo.trim() ||
      `Consumo interno${producto?.nombre ? ` de ${producto.nombre}` : ''}`;
    mutations.consumoInterno.mutate(
      {
        producto_id: productoConsumoId,
        cantidad: toNumber(cantidadConsumo),
        descripcion: descripcionFinal,
      },
      {
        onSuccess: () => {
          mutations.movimientoCaja.mutate({
            cajaId: cajaAbierta.id,
            tipo: 'EGRESO',
            monto: 0,
            categoria_egreso: 'CONSUMO_INTERNO',
            entidad_nombre: producto?.nombre ?? null,
            descripcion: descripcionFinal,
          });
          setProductoConsumoId('');
          setCantidadConsumo('1');
          setDescripcionConsumo('');
        },
      },
    );
  };

  if (!puedeVerCaja) {
    return (
      <AccessDenied
        title="Sin permisos para caja"
        message="Necesitas caja.ver o un permiso de reportes/configuracion para ver el historial y resumen de caja."
      />
    );
  }

  if (isListadoCajas) {
    return (
      <div className="min-h-[calc(100vh-52px)] bg-[#f3f4f6] px-4 py-4">
        <section className="mx-auto max-w-[1500px] rounded-lg border border-[#c4c6cd] bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#c4c6cd] px-4 py-3">
            <div>
              <div className="flex items-center gap-2 text-[15px] font-bold text-[#041627]">
                <Wallet size={17} className="text-[#075E54]" />
                {puedeVerTodasCajas ? 'Cajas' : 'Mi caja en proceso'}
              </div>
              <div className="mt-1 text-[13px] text-[#44474c]">
                Selecciona una caja para ver ventas, pagos, egresos, consumos y rentabilidad.
              </div>
            </div>
            {!cajaAbierta ? (
              <div className="flex flex-wrap gap-2">
                <input
                  type="number"
                  min={0}
                  value={montoInicial}
                  onChange={(event) => setMontoInicial(event.target.value)}
                  className="h-9 w-36 rounded border border-[#c4c6cd] px-3 text-[14px] outline-none focus:border-[#075E54]"
                />
                <button
                  onClick={() =>
                    mutations.abrirCaja.mutate({
                      monto_inicial: toNumber(montoInicial),
                      descripcion: 'Apertura desde modulo caja',
                    })
                  }
                  disabled={!puedeAbrirCaja || mutations.abrirCaja.isPending}
                  className="flex h-9 items-center gap-2 rounded bg-[#075E54] px-3 text-[13px] font-semibold text-white hover:bg-[#0b6d62] disabled:opacity-60"
                >
                  <Plus size={15} />
                  Abrir caja
                </button>
              </div>
            ) : (
              <Link
                to="/caja/movimientos"
                className="flex h-9 items-center gap-2 rounded bg-[#075E54] px-3 text-[13px] font-semibold text-white hover:bg-[#0b6d62]"
              >
                <Wallet size={15} />
                Operar caja
              </Link>
            )}
          </div>

          {puedeVerTodasCajas ? (
            <div className="flex flex-wrap items-end gap-2 border-b border-[#c4c6cd] bg-[#fbf9fa] px-4 py-3">
              <label className="block">
                <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">Desde</span>
                <input
                  type="date"
                  value={desdeCajas}
                  onChange={(event) => setDesdeCajas(event.target.value)}
                  className="h-9 rounded border border-[#c4c6cd] px-3 text-[14px] outline-none focus:border-[#075E54]"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">Hasta</span>
                <input
                  type="date"
                  value={hastaCajas}
                  onChange={(event) => setHastaCajas(event.target.value)}
                  className="h-9 rounded border border-[#c4c6cd] px-3 text-[14px] outline-none focus:border-[#075E54]"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">Estado</span>
                <select
                  value={estadoCajas}
                  onChange={(event) => setEstadoCajas(event.target.value as typeof estadoCajas)}
                  className="h-9 rounded border border-[#c4c6cd] bg-white px-3 text-[14px] outline-none focus:border-[#075E54]"
                >
                  <option value="TODAS">Todas</option>
                  <option value="ABIERTA">Abiertas</option>
                  <option value="CERRADA">Cerradas</option>
                </select>
              </label>
              <button
                type="button"
                onClick={() => {
                  setDesdeCajas('');
                  setHastaCajas('');
                  setEstadoCajas('TODAS');
                }}
                className="h-9 rounded border border-[#c4c6cd] bg-white px-3 text-[13px] font-semibold text-[#041627] hover:bg-[#f4f5f6]"
              >
                Limpiar
              </button>
            </div>
          ) : null}

          <DataTable
            rows={cajasListado}
            columns={puedeVerTodasCajas ? cajasColumns : cajasColumns.filter((column) => !['declarado', 'calculado', 'diferencia'].includes(column.key))}
            getRowKey={(caja) => caja.id}
            isLoading={cajasQuery.isLoading}
            loadingMessage="Cargando cajas..."
            emptyMessage={puedeVerTodasCajas ? 'Sin cajas para los filtros seleccionados.' : 'No tenes una caja abierta en proceso.'}
            minWidth="900px"
            onRowClick={(caja) => navigate(`/caja/${caja.id}`)}
            getContextActions={(caja) => [
              {
                label: 'Ver ventas y pagos',
                icon: <ReceiptText size={14} />,
                onClick: () => navigate(`/caja/${caja.id}`),
              },
              {
                label: 'Cerrar caja',
                icon: <Lock size={14} />,
                danger: true,
                disabled: !puedeCerrarCaja,
                dividerBefore: true,
                onClick: () => navigate(`/caja/${caja.id}/cierre`),
              },
            ]}
          />
        </section>
      </div>
    );
  }

  if (isDetalleCaja) {
    const totalVentas = ventasCaja.reduce((sum, ventaCaja) => sum + toNumber(ventaCaja.venta.total), 0);
    const totalPagos = ventasCaja.reduce(
      (sum, ventaCaja) =>
        sum + ventaCaja.pagos.reduce((acc, pago) => acc + toNumber(pago.monto) + toNumber(pago.recargo_monto), 0),
      0,
    );
    const costoTotal = ventasCaja.reduce((sum, ventaCaja) => sum + toNumber(ventaCaja.margen?.costo_total), 0);
    const gananciaTotal = ventasCaja.reduce((sum, ventaCaja) => sum + toNumber(ventaCaja.margen?.ganancia_total), 0);
    const unidadesVendidas = ventasCaja.reduce(
      (sum, ventaCaja) =>
        sum + ventaCaja.venta.items.reduce((acc, item) => acc + toNumber(item.cantidad), 0),
      0,
    );
    const egresosDetalle = movimientosCaja.filter((movimiento) => movimiento.accion === 'EGRESO');
    const consumosDetalle = movimientosCaja.filter((movimiento) => movimiento.categoria_egreso === 'CONSUMO_INTERNO');
    const margenCaja = totalVentas > 0 ? (gananciaTotal / totalVentas) * 100 : 0;
    const totalPedidos = pedidosCaja.reduce((sum, pedido) => sum + toNumber(pedido.comprobante?.total), 0);
    const totalPedidosRendidos = pedidosCaja.reduce((sum, pedido) => sum + toNumber(pedido.monto_rendido), 0);
    const unidadesPedidos = pedidosCaja.reduce(
      (sum, pedido) =>
        sum + (pedido.comprobante?.items ?? []).reduce((acc, item) => acc + toNumber(item.cantidad), 0),
      0,
    );

    return (
      <div className="min-h-[calc(100vh-52px)] bg-[#f3f4f6] px-4 py-4">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link
                to="/caja"
                className="inline-flex h-10 w-10 items-center justify-center rounded border border-[#c4c6cd] bg-white text-[#041627] hover:bg-[#f4f5f6]"
              >
                <ArrowLeft size={18} />
              </Link>
              <div>
                <h1 className="text-[22px] font-bold text-[#041627]">Detalle de caja</h1>
                <p className="text-[13px] text-[#44474c]">Caja {cajaId?.slice(0, 8)}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="rounded border border-[#c4c6cd] bg-white px-4 py-2">
                <div className="text-[11px] font-bold uppercase text-[#44474c]">Ventas</div>
                <div className="text-[18px] font-bold text-[#041627]">{ventasCaja.length}</div>
              </div>
              <div className="rounded border border-[#c4c6cd] bg-white px-4 py-2">
                <div className="text-[11px] font-bold uppercase text-[#44474c]">Total vendido</div>
                <div className="text-[18px] font-bold text-[#041627]">{money(totalVentas)}</div>
              </div>
              <div className="rounded border border-[#c4c6cd] bg-white px-4 py-2">
                <div className="text-[11px] font-bold uppercase text-[#44474c]">Total cobrado</div>
                <div className="text-[18px] font-bold text-[#075E54]">{money(totalPagos)}</div>
              </div>
              <div className="rounded border border-[#c4c6cd] bg-white px-4 py-2">
                <div className="text-[11px] font-bold uppercase text-[#44474c]">Ganancia est.</div>
                <div className="text-[18px] font-bold text-[#075E54]">{money(gananciaTotal)}</div>
              </div>
              <div className="rounded border border-[#c4c6cd] bg-white px-4 py-2">
                <div className="text-[11px] font-bold uppercase text-[#44474c]">Reposicion</div>
                <div className="text-[18px] font-bold text-[#041627]">{money(costoTotal)}</div>
              </div>
              <div className="rounded border border-[#c4c6cd] bg-white px-4 py-2">
                <div className="text-[11px] font-bold uppercase text-[#44474c]">Pedidos</div>
                <div className="text-[18px] font-bold text-[#041627]">{pedidosCaja.length}</div>
              </div>
              {cajaEnDetalle?.estado === 'ABIERTA' && puedeCerrarCaja ? (
                <Link
                  to={`/caja/${cajaId}/cierre`}
                  className="flex h-10 items-center gap-2 rounded bg-[#b42318] px-4 text-[13px] font-semibold text-white hover:bg-[#9b1c13]"
                >
                  <Lock size={15} />
                  Cerrar caja
                </Link>
              ) : null}
              {cajaEnDetalle?.estado === 'ABIERTA' && puedeRegistrarMovimiento ? (
                <Link
                  to="/caja/movimientos?panel=egreso"
                  className="flex h-10 items-center gap-2 rounded border border-[#c4c6cd] bg-white px-4 text-[13px] font-semibold text-[#041627] hover:bg-[#f4f5f6]"
                >
                  <ArrowDownCircle size={15} />
                  Registrar egreso
                </Link>
              ) : null}
              {cajaEnDetalle?.estado === 'ABIERTA' && puedeConsumirStock ? (
                <Link
                  to="/caja/movimientos?panel=consumo"
                  className="flex h-10 items-center gap-2 rounded border border-[#c4c6cd] bg-white px-4 text-[13px] font-semibold text-[#041627] hover:bg-[#f4f5f6]"
                >
                  <PackageMinus size={15} />
                  Consumo interno
                </Link>
              ) : null}
            </div>
          </div>

          <section className="grid gap-3 md:grid-cols-4">
            <div className="rounded-lg border border-[#c4c6cd] bg-white p-4 shadow-sm">
              <div className="text-[12px] font-bold uppercase text-[#44474c]">Dinero esperado</div>
              <div className="mt-2 text-[22px] font-bold text-[#041627]">{money(resumen?.totales.calculado)}</div>
            </div>
            <div className="rounded-lg border border-[#c4c6cd] bg-white p-4 shadow-sm">
              <div className="text-[12px] font-bold uppercase text-[#44474c]">Egresos</div>
              <div className="mt-2 text-[22px] font-bold text-[#b42318]">{money(resumen?.totales.egresos)}</div>
            </div>
            <div className="rounded-lg border border-[#c4c6cd] bg-white p-4 shadow-sm">
              <div className="text-[12px] font-bold uppercase text-[#44474c]">Unidades vendidas</div>
              <div className="mt-2 text-[22px] font-bold text-[#041627]">{unidadesVendidas}</div>
            </div>
            <div className="rounded-lg border border-[#c4c6cd] bg-white p-4 shadow-sm">
              <div className="text-[12px] font-bold uppercase text-[#44474c]">Margen est.</div>
              <div className="mt-2 text-[22px] font-bold text-[#041627]">{margenCaja.toFixed(2)}%</div>
            </div>
            <div className="rounded-lg border border-[#c4c6cd] bg-white p-4 shadow-sm md:col-span-2">
              <div className="text-[12px] font-bold uppercase text-[#44474c]">Pedidos de envio</div>
              <div className="mt-2 text-[20px] font-bold text-[#041627]">
                {money(totalPedidos)} vendidos | {money(totalPedidosRendidos)} rendidos | {unidadesPedidos} unidades
              </div>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-lg border border-[#c4c6cd] bg-white shadow-sm">
              <div className="flex items-center gap-2 border-b border-[#c4c6cd] px-4 py-3 text-[14px] font-semibold text-[#041627]">
                <ReceiptText size={16} className="text-[#075E54]" />
                Ventas realizadas en esta caja
              </div>
              <DataTable
                rows={ventasCaja}
                columns={ventasCajaColumns}
                getRowKey={(ventaCaja) => ventaCaja.venta.id}
                isLoading={ventasCajaQuery.isLoading}
                loadingMessage="Cargando ventas de caja..."
                emptyMessage="Todavia no hay ventas en esta caja."
                minWidth="980px"
                onRowClick={(ventaCaja) => setSelectedVentaId(ventaCaja.venta.id)}
                rowClassName={(ventaCaja) => selectedVenta?.venta.id === ventaCaja.venta.id ? 'bg-[#eef8f6]' : ''}
              />
            </div>

            <aside className="rounded-lg border border-[#c4c6cd] bg-white shadow-sm">
              {selectedVenta ? (
                <>
                  <div className="border-b border-[#c4c6cd] px-4 py-3">
                    <div className="text-[16px] font-bold text-[#041627]">{selectedVenta.venta.numero}</div>
                    <div className="text-[12px] text-[#44474c]">{dateTime(selectedVenta.venta.created_at)}</div>
                  </div>
                  <div className="grid gap-3 border-b border-[#c4c6cd] px-4 py-3 sm:grid-cols-2">
                    <div className="rounded border border-[#e5e7eb] bg-[#f8fafc] px-3 py-2">
                      <div className="flex items-center gap-2 text-[12px] font-bold uppercase text-[#44474c]">
                        <UserRound size={14} />
                        Vendedor
                      </div>
                      <div className="mt-1 truncate text-[14px] font-semibold text-[#041627]">
                        {selectedVenta.vendedor?.nombreCompleto ?? 'Sin vendedor'}
                      </div>
                    </div>
                    <div className="rounded border border-[#e5e7eb] bg-[#f8fafc] px-3 py-2">
                      <div className="flex items-center gap-2 text-[12px] font-bold uppercase text-[#44474c]">
                        <Wallet size={14} />
                        Cajero
                      </div>
                      <div className="mt-1 truncate text-[14px] font-semibold text-[#041627]">
                        {selectedVenta.cajero?.nombreCompleto ?? 'Sin cajero'}
                      </div>
                    </div>
                  </div>
                  <div className="border-b border-[#c4c6cd] px-4 py-3">
                    <div className="mb-2 text-[12px] font-bold uppercase text-[#44474c]">Productos</div>
                    <div className="space-y-2">
                      {selectedVenta.venta.items.map((item) => (
                        <div key={item.id} className="grid grid-cols-[1fr_60px_100px] gap-2 rounded border border-[#e5e7eb] px-3 py-2 text-[13px]">
                          <div className="min-w-0">
                            <div className="truncate font-semibold text-[#041627]">{item.descripcion}</div>
                            <div className="text-[#44474c]">{money(item.precio_unitario)}</div>
                          </div>
                          <div className="text-center text-[#041627]">x{toNumber(item.cantidad)}</div>
                          <div className="text-right font-semibold text-[#041627]">{money(item.subtotal)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="border-b border-[#c4c6cd] px-4 py-3">
                    <div className="mb-2 flex items-center gap-2 text-[12px] font-bold uppercase text-[#44474c]">
                      <CreditCard size={14} />
                      Pagos
                    </div>
                    <div className="space-y-2">
                      {selectedVenta.pagos.map((pago) => (
                        <div key={pago.id} className="rounded border border-[#e5e7eb] bg-[#f8fafc] px-3 py-2">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-[13px] font-semibold text-[#041627]">
                              {pago.medioPago?.nombre ?? pago.tipo}
                            </span>
                            <span className="text-[14px] font-bold text-[#041627]">{money(pago.monto)}</span>
                          </div>
                          {pago.referencia ? <div className="mt-1 text-[12px] text-[#44474c]">Ref. {pago.referencia}</div> : null}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2 px-4 py-4">
                    <div className="flex items-center justify-between text-[14px] text-[#44474c]">
                      <span>Costo estimado</span>
                      <span>{money(selectedVenta.margen?.costo_total)}</span>
                    </div>
                    <div className="flex items-center justify-between text-[14px] text-[#44474c]">
                      <span>Ganancia estimada</span>
                      <span>{money(selectedVenta.margen?.ganancia_total)}</span>
                    </div>
                    <div className="flex items-center justify-between text-[14px] text-[#44474c]">
                      <span>Subtotal</span>
                      <span>{money(selectedVenta.venta.subtotal)}</span>
                    </div>
                    <div className="flex items-center justify-between text-[18px] font-bold text-[#041627]">
                      <span>Total</span>
                      <span>{money(selectedVenta.venta.total)}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="px-4 py-10 text-center text-[14px] text-[#44474c]">
                  Seleccione una venta para ver el detalle.
                </div>
              )}
            </aside>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-[#c4c6cd] bg-white shadow-sm lg:col-span-2">
              <div className="border-b border-[#c4c6cd] px-4 py-3 text-[14px] font-bold text-[#041627]">
                Pedidos de envio de esta caja
              </div>
              <div className="grid gap-3 p-4 md:grid-cols-2">
                {pedidosCaja.map((pedido) => (
                  <div key={pedido.id} className="rounded border border-[#e5e7eb] bg-[#f8fafc] px-3 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[13px] font-bold text-[#041627]">Pedido {pedido.id.slice(0, 8)}</div>
                        <div className="mt-1 text-[12px] text-[#44474c]">
                          {pedido.direccion_entrega} | {dateTime(pedido.created_at)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[14px] font-bold text-[#041627]">{money(pedido.comprobante?.total)}</div>
                        <div className="text-[11px] font-semibold text-[#44474c]">{pedido.estado_pago}</div>
                      </div>
                    </div>
                    <div className="mt-3 space-y-1">
                      {(pedido.comprobante?.items ?? []).map((item) => (
                        <div key={item.id} className="flex justify-between gap-3 text-[12px] text-[#44474c]">
                          <span className="truncate">{toNumber(item.cantidad)} x {item.descripcion}</span>
                          <span className="font-semibold text-[#041627]">{money(item.subtotal)}</span>
                        </div>
                      ))}
                    </div>
                    {pedido.monto_rendido ? (
                      <div className="mt-3 rounded border border-[#cfe2de] bg-[#f3fbf9] px-2 py-1 text-[12px] font-semibold text-[#075E54]">
                        Rendido en caja: {money(pedido.monto_rendido)}
                      </div>
                    ) : null}
                  </div>
                ))}
                {!pedidosCaja.length ? (
                  <div className="rounded border border-dashed border-[#c4c6cd] px-3 py-6 text-center text-[13px] text-[#44474c] md:col-span-2">
                    Sin pedidos vinculados a esta caja.
                  </div>
                ) : null}
              </div>
            </div>

            <div className="rounded-lg border border-[#c4c6cd] bg-white shadow-sm">
              <div className="border-b border-[#c4c6cd] px-4 py-3 text-[14px] font-bold text-[#041627]">
                Egresos y pagos de la caja
              </div>
              <div className="space-y-2 p-4">
                {egresosDetalle.map((movimiento) => (
                  <div key={movimiento.id} className="rounded border border-[#e5e7eb] bg-[#f8fafc] px-3 py-2">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[13px] font-semibold text-[#041627]">
                        {movimiento.categoria_egreso ?? 'EGRESO'}
                      </span>
                      <span className="text-[14px] font-bold text-[#b42318]">{money(movimiento.monto)}</span>
                    </div>
                    <div className="mt-1 text-[12px] text-[#44474c]">
                      {movimiento.descripcion ?? movimiento.entidad_nombre ?? dateTime(movimiento.created_at)}
                    </div>
                  </div>
                ))}
                {!egresosDetalle.length ? (
                  <div className="rounded border border-dashed border-[#c4c6cd] px-3 py-6 text-center text-[13px] text-[#44474c]">
                    Sin egresos en esta caja.
                  </div>
                ) : null}
              </div>
            </div>

            <div className="rounded-lg border border-[#c4c6cd] bg-white shadow-sm">
              <div className="border-b border-[#c4c6cd] px-4 py-3 text-[14px] font-bold text-[#041627]">
                Consumos internos
              </div>
              <div className="space-y-2 p-4">
                {consumosDetalle.map((movimiento) => (
                  <div key={movimiento.id} className="rounded border border-[#e5e7eb] bg-[#f8fafc] px-3 py-2">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[13px] font-semibold text-[#041627]">
                        {movimiento.entidad_nombre ?? 'Consumo interno'}
                      </span>
                      <span className="text-[12px] font-semibold text-[#44474c]">{dateTime(movimiento.created_at)}</span>
                    </div>
                    <div className="mt-1 text-[12px] text-[#44474c]">
                      {movimiento.descripcion ?? 'Descuento de stock por consumo interno'}
                    </div>
                  </div>
                ))}
                {!consumosDetalle.length ? (
                  <div className="rounded border border-dashed border-[#c4c6cd] px-3 py-6 text-center text-[13px] text-[#44474c]">
                    Sin consumos internos en esta caja.
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  if (isCierreCaja) {
    const egresos = movimientosCaja.filter((movimiento) => movimiento.accion === 'EGRESO');
    const consumosInternos = movimientosCaja.filter((movimiento) => movimiento.categoria_egreso === 'CONSUMO_INTERNO');

    return (
      <div className="min-h-[calc(100vh-52px)] bg-[#f3f4f6] px-4 py-4">
        <div className="mx-auto max-w-[1300px] rounded-lg border border-[#c4c6cd] bg-white shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#c4c6cd] px-4 py-3">
            <div className="flex items-center gap-3">
              <Link to={`/caja/${cajaId}`} className="inline-flex h-10 w-10 items-center justify-center rounded border border-[#c4c6cd] bg-white text-[#041627] hover:bg-[#f4f5f6]">
                <ArrowLeft size={18} />
              </Link>
              <div>
                <h1 className="text-[22px] font-bold text-[#041627]">Cerrar caja</h1>
                <p className="text-[13px] text-[#44474c]">Caja {cajaId?.slice(0, 8)} | arqueo y analisis final</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-4 lg:grid-cols-[1fr_0.9fr]">
            <section className="rounded border border-[#c4c6cd] bg-white">
              <div className="border-b border-[#c4c6cd] px-4 py-3 text-[13px] font-bold uppercase text-[#44474c]">
                Analisis de caja
              </div>
              <div className="grid gap-3 p-4 sm:grid-cols-2">
                <div className="rounded border border-[#e5e7eb] bg-[#f8fafc] px-3 py-3">
                  <div className="text-[12px] font-semibold text-[#44474c]">Monto inicial</div>
                  <div className="mt-1 text-[18px] font-bold text-[#041627]">{money(resumen?.totales.apertura ?? cajaEnDetalle?.monto_inicial)}</div>
                </div>
                <div className="rounded border border-[#e5e7eb] bg-[#f8fafc] px-3 py-3">
                  <div className="text-[12px] font-semibold text-[#44474c]">Cobros</div>
                  <div className="mt-1 text-[18px] font-bold text-[#041627]">{money(resumen?.totales.cobros)}</div>
                </div>
                <div className="rounded border border-[#e5e7eb] bg-[#f8fafc] px-3 py-3">
                  <div className="text-[12px] font-semibold text-[#44474c]">Ingresos manuales</div>
                  <div className="mt-1 text-[18px] font-bold text-[#041627]">{money(resumen?.totales.ingresos_manuales)}</div>
                </div>
                <div className="rounded border border-[#e5e7eb] bg-[#f8fafc] px-3 py-3">
                  <div className="text-[12px] font-semibold text-[#44474c]">Egresos / pagos</div>
                  <div className="mt-1 text-[18px] font-bold text-[#b42318]">{money(resumen?.totales.egresos)}</div>
                </div>
                <div className="rounded border border-[#cfe2de] bg-[#f3fbf9] px-3 py-3 sm:col-span-2">
                  <div className="text-[12px] font-semibold text-[#075E54]">Total esperado por sistema</div>
                  <div className="mt-1 text-[22px] font-bold text-[#041627]">{money(resumen?.totales.calculado)}</div>
                </div>
              </div>
              <div className="border-t border-[#c4c6cd]">
                <DataTable
                  rows={resumen?.cobros_por_medio ?? []}
                  columns={cobrosColumns}
                  getRowKey={(medio) => medio.medio_pago_id ?? medio.medio}
                  emptyMessage="Sin cobros por medio de pago."
                />
              </div>
            </section>

            <section className="rounded border border-[#c4c6cd] bg-white">
              <div className="border-b border-[#c4c6cd] px-4 py-3 text-[13px] font-bold uppercase text-[#44474c]">
                Arqueo final
              </div>
              <div className="space-y-3 p-4">
                <label className="block">
                  <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">Dinero declarado</span>
                  <input
                    type="number"
                    min={0}
                    value={montoCierre}
                    onChange={(event) => setMontoCierre(event.target.value)}
                    placeholder="Ingrese el monto contado"
                    className="h-10 w-full rounded border border-[#c4c6cd] px-3 text-[14px] outline-none focus:border-[#075E54]"
                  />
                </label>
                <div className={`rounded border px-3 py-3 ${!montoCierre ? 'border-[#e5e7eb] bg-[#f8fafc]' : cierreTieneDiferencia ? 'border-[#f1c7c7] bg-[#fff5f5]' : 'border-[#cfe2de] bg-[#f3fbf9]'}`}>
                  <div className="text-[12px] font-semibold text-[#44474c]">Diferencia</div>
                  <div className={`mt-1 text-[20px] font-bold ${diferenciaPreview < 0 ? 'text-[#b42318]' : 'text-[#075E54]'}`}>
                    {montoCierre ? money(diferenciaPreview) : money(0)}
                  </div>
                </div>
                <textarea
                  value={descripcionCierre}
                  onChange={(event) => setDescripcionCierre(event.target.value)}
                  placeholder="Observaciones del cierre"
                  className="min-h-[72px] w-full rounded border border-[#c4c6cd] px-3 py-2 text-[14px] outline-none focus:border-[#075E54]"
                />
                <button
                  type="button"
                  onClick={() =>
                    mutations.cerrarCaja.mutate({
                      cajaId: cajaId!,
                      monto_final_declarado: montoDeclarado,
                      descripcion: descripcionCierre || 'Cierre desde modulo caja',
                    })
                  }
                  disabled={!puedeCerrarCaja || mutations.cerrarCaja.isPending || !montoCierre || cajaEnDetalle?.estado !== 'ABIERTA'}
                  className="flex h-10 w-full items-center justify-center gap-2 rounded bg-[#b42318] px-4 text-[14px] font-semibold text-white hover:bg-[#9b1c13] disabled:opacity-60"
                >
                  <Lock size={15} />
                  Cerrar caja
                </button>
              </div>
            </section>

            <section className="rounded border border-[#c4c6cd] bg-white lg:col-span-2">
              <div className="border-b border-[#c4c6cd] px-4 py-3 text-[13px] font-bold uppercase text-[#44474c]">
                Pagos, egresos y consumos internos
              </div>
              <div className="grid gap-4 p-4 md:grid-cols-2">
                <div>
                  <div className="mb-2 text-[12px] font-bold uppercase text-[#44474c]">Egresos / pagos registrados</div>
                  <div className="space-y-2">
                    {egresos.map((movimiento) => (
                      <div key={movimiento.id} className="rounded border border-[#e5e7eb] bg-[#f8fafc] px-3 py-2 text-[13px]">
                        <div className="flex justify-between gap-3">
                          <span className="font-semibold text-[#041627]">{movimiento.categoria_egreso ?? movimiento.accion}</span>
                          <span className="font-bold text-[#b42318]">{money(movimiento.monto)}</span>
                        </div>
                        <div className="mt-1 text-[#44474c]">{movimiento.descripcion ?? movimiento.entidad_nombre ?? '-'}</div>
                      </div>
                    ))}
                    {!egresos.length ? <div className="rounded border border-dashed border-[#c4c6cd] px-3 py-5 text-center text-[13px] text-[#44474c]">Sin egresos.</div> : null}
                  </div>
                </div>
                <div>
                  <div className="mb-2 text-[12px] font-bold uppercase text-[#44474c]">Consumos internos</div>
                  <div className="space-y-2">
                    {consumosInternos.map((movimiento) => (
                      <div key={movimiento.id} className="rounded border border-[#e5e7eb] bg-[#f8fafc] px-3 py-2 text-[13px]">
                        <div className="flex justify-between gap-3">
                          <span className="font-semibold text-[#041627]">{movimiento.descripcion ?? 'Consumo interno'}</span>
                          <span className="font-bold text-[#b42318]">{money(movimiento.monto)}</span>
                        </div>
                      </div>
                    ))}
                    {!consumosInternos.length ? <div className="rounded border border-dashed border-[#c4c6cd] px-3 py-5 text-center text-[13px] text-[#44474c]">Sin consumos internos vinculados a caja.</div> : null}
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-52px)] bg-[#f3f4f6] px-4 py-4">
      <div className="mx-auto max-w-[1500px] rounded-lg border border-[#c4c6cd] bg-white shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#c4c6cd] px-4 py-3">
          <div>
            <div className="flex items-center gap-2 text-[15px] font-bold text-[#041627]">
              <Wallet size={17} className="text-[#075E54]" />
              Caja operativa
            </div>
            <div className="mt-1 text-[13px] text-[#44474c]">
              {cajaAbierta ? `Caja abierta ${shortId(cajaAbierta.id)}` : 'No hay caja abierta para este usuario'}
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-2">
            {!cajaAbierta ? (
              <>
                <input
                  type="number"
                  min={0}
                  value={montoInicial}
                  onChange={(event) => setMontoInicial(event.target.value)}
                  className="h-9 w-36 rounded border border-[#c4c6cd] px-3 text-[14px] outline-none focus:border-[#075E54]"
                />
                <button
                  onClick={() =>
                    mutations.abrirCaja.mutate({
                      monto_inicial: toNumber(montoInicial),
                      descripcion: 'Apertura desde modulo caja',
                    })
                  }
                  disabled={!puedeAbrirCaja || mutations.abrirCaja.isPending}
                  className="flex h-9 items-center gap-2 rounded bg-[#075E54] px-3 text-[13px] font-semibold text-white hover:bg-[#0b6d62]"
                >
                  <Plus size={15} />
                  Abrir caja
                </button>
              </>
            ) : (
              <>
                <input
                  type="number"
                  min={0}
                  value={montoMovimiento}
                  onChange={(event) => setMontoMovimiento(event.target.value)}
                  placeholder="Monto"
                  className="h-9 w-32 rounded border border-[#c4c6cd] px-3 text-[14px] outline-none focus:border-[#075E54]"
                />
                <button
                  onClick={() =>
                    mutations.movimientoCaja.mutate({
                      cajaId: cajaAbierta.id,
                      tipo: 'INGRESO_MANUAL',
                      monto: toNumber(montoMovimiento),
                      descripcion: 'Ingreso manual desde caja',
                    })
                  }
                  className="flex h-9 items-center gap-2 rounded border border-[#c4c6cd] bg-white px-3 text-[13px] font-semibold text-[#041627] hover:bg-[#f4f5f6]"
                >
                  <ArrowUpCircle size={15} />
                  Ingreso
                </button>
                <button
                  onClick={registrarEgreso}
                  disabled={!puedeRegistrarMovimiento || montoEgreso <= 0 || egresoSuperaDisponible}
                  className="flex h-9 items-center gap-2 rounded border border-[#c4c6cd] bg-white px-3 text-[13px] font-semibold text-[#041627] hover:bg-[#f4f5f6]"
                >
                  <ArrowDownCircle size={15} />
                  Egreso
                </button>
                <input
                  type="number"
                  min={0}
                  value={montoCierre}
                  onChange={(event) => setMontoCierre(event.target.value)}
                  placeholder="Declarado"
                  className="h-9 w-32 rounded border border-[#c4c6cd] px-3 text-[14px] outline-none focus:border-[#075E54]"
                />
                <button
                  onClick={() =>
                    mutations.cerrarCaja.mutate({
                      cajaId: cajaAbierta.id,
                      monto_final_declarado: toNumber(montoCierre),
                      descripcion: descripcionCierre || 'Cierre desde modulo caja',
                    })
                  }
                  disabled={!puedeCerrarCaja || mutations.cerrarCaja.isPending || !montoCierre}
                  className="flex h-9 items-center gap-2 rounded bg-[#b42318] px-3 text-[13px] font-semibold text-white hover:bg-[#9b1c13]"
                >
                  <Lock size={15} />
                  Cerrar
                </button>
              </>
            )}
          </div>
        </div>

        {cajaAbierta ? (
          <div className="border-b border-[#c4c6cd] bg-[#fbf9fa]">
            <div className="flex flex-wrap gap-2 border-b border-[#c4c6cd] px-4 py-3">
              {[
                { id: 'resumen', label: 'Resumen', icon: <Calculator size={14} /> },
                ...(puedeRegistrarMovimiento ? [{ id: 'egreso', label: 'Egreso', icon: <ArrowDownCircle size={14} /> }] : []),
                ...(puedeConsumirStock ? [{ id: 'consumo', label: 'Consumo interno', icon: <PackageMinus size={14} /> }] : []),
                ...(puedeCerrarCaja ? [{ id: 'cierre', label: 'Cerrar caja', icon: <Lock size={14} /> }] : []),
                { id: 'historial', label: 'Medios de pago', icon: <Wallet size={14} /> },
                { id: 'movimientos', label: 'Movimientos', icon: <ArrowUpCircle size={14} /> },
                { id: 'auditoria', label: 'Auditoria', icon: <ShieldAlert size={14} /> },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActivePanel(item.id as CajaPanel)}
                  className={`flex h-9 items-center gap-2 rounded border px-3 text-[13px] font-semibold ${
                    activePanel === item.id
                      ? 'border-[#075E54] bg-[#075E54] text-white'
                      : 'border-[#c4c6cd] bg-white text-[#041627] hover:bg-[#f4f5f6]'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </div>

            <div className="grid gap-4 p-4 lg:grid-cols-[1fr_1fr]">
            {activePanel === 'resumen' ? (
            <section className="rounded border border-[#c4c6cd] bg-white">
              <div className="flex items-center gap-2 border-b border-[#c4c6cd] px-4 py-3 text-[13px] font-bold uppercase tracking-wide text-[#44474c]">
                <Calculator size={15} className="text-[#075E54]" />
                Analisis de caja actual
              </div>
              <div className="grid gap-3 p-4 sm:grid-cols-2">
                <div className="rounded border border-[#e5e7eb] bg-[#f8fafc] px-3 py-3">
                  <div className="text-[12px] font-semibold text-[#44474c]">Monto inicial</div>
                  <div className="mt-1 text-[18px] font-bold text-[#041627]">
                  {money(resumen?.totales.apertura ?? cajaEnDetalle?.monto_inicial)}
                  </div>
                </div>
                <div className="rounded border border-[#e5e7eb] bg-[#f8fafc] px-3 py-3">
                  <div className="text-[12px] font-semibold text-[#44474c]">Cobros registrados</div>
                  <div className="mt-1 text-[18px] font-bold text-[#041627]">
                    {money(resumen?.totales.cobros)}
                  </div>
                </div>
                <div className="rounded border border-[#e5e7eb] bg-[#f8fafc] px-3 py-3">
                  <div className="text-[12px] font-semibold text-[#44474c]">Ingresos manuales</div>
                  <div className="mt-1 text-[18px] font-bold text-[#041627]">
                    {money(resumen?.totales.ingresos_manuales)}
                  </div>
                </div>
                <div className="rounded border border-[#e5e7eb] bg-[#f8fafc] px-3 py-3">
                  <div className="text-[12px] font-semibold text-[#44474c]">Egresos</div>
                  <div className="mt-1 text-[18px] font-bold text-[#b42318]">
                    {money(resumen?.totales.egresos)}
                  </div>
                </div>
                <div className="rounded border border-[#cfe2de] bg-[#f3fbf9] px-3 py-3 sm:col-span-2">
                  <div className="text-[12px] font-semibold text-[#075E54]">Total esperado por sistema</div>
                  <div className="mt-1 text-[22px] font-bold text-[#041627]">
                    {money(resumen?.totales.calculado)}
                  </div>
                </div>
                {cajaEnDetalle?.estado === 'CERRADA' ? (
                  <>
                    <div className="rounded border border-[#e5e7eb] bg-[#f8fafc] px-3 py-3">
                      <div className="text-[12px] font-semibold text-[#44474c]">Declarado al cierre</div>
                      <div className="mt-1 text-[18px] font-bold text-[#041627]">
                        {money(cajaEnDetalle.monto_final_declarado)}
                      </div>
                    </div>
                    <div className="rounded border border-[#e5e7eb] bg-[#f8fafc] px-3 py-3">
                      <div className="text-[12px] font-semibold text-[#44474c]">Diferencia final</div>
                      <div className={`mt-1 text-[18px] font-bold ${toNumber(cajaEnDetalle.diferencia) < 0 ? 'text-[#b42318]' : 'text-[#075E54]'}`}>
                        {money(cajaEnDetalle.diferencia)}
                      </div>
                    </div>
                  </>
                ) : null}
              </div>
            </section>
            ) : null}

            {activePanel === 'cierre' && cajaAbierta ? (
            <section className="rounded border border-[#c4c6cd] bg-white">
              <div className="border-b border-[#c4c6cd] px-4 py-3 text-[13px] font-bold uppercase tracking-wide text-[#44474c]">
                Cierre y arqueo
              </div>
              <div className="space-y-3 p-4">
                <label className="block">
                  <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">
                    Dinero declarado al cierre
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={montoCierre}
                    onChange={(event) => setMontoCierre(event.target.value)}
                    placeholder="Ingrese el monto contado"
                    className="h-10 w-full rounded border border-[#c4c6cd] px-3 text-[14px] outline-none focus:border-[#075E54]"
                  />
                </label>
                <div
                  className={`rounded border px-3 py-3 ${
                    !montoCierre
                      ? 'border-[#e5e7eb] bg-[#f8fafc]'
                      : cierreTieneDiferencia
                        ? 'border-[#f1c7c7] bg-[#fff5f5]'
                        : 'border-[#cfe2de] bg-[#f3fbf9]'
                  }`}
                >
                  <div className="text-[12px] font-semibold text-[#44474c]">
                    Diferencia contra sistema
                  </div>
                  <div className={`mt-1 text-[20px] font-bold ${diferenciaPreview < 0 ? 'text-[#b42318]' : 'text-[#075E54]'}`}>
                    {montoCierre ? money(diferenciaPreview) : money(0)}
                  </div>
                  {montoCierre ? (
                    <div className="mt-1 text-[12px] text-[#44474c]">
                      {diferenciaPreview === 0
                        ? 'Caja exacta'
                        : diferenciaPreview > 0
                          ? 'Sobra dinero contra lo esperado'
                          : 'Falta dinero contra lo esperado'}
                    </div>
                  ) : null}
                </div>
                <textarea
                  value={descripcionCierre}
                  onChange={(event) => setDescripcionCierre(event.target.value)}
                  placeholder="Observaciones del cierre"
                  className="min-h-[72px] w-full rounded border border-[#c4c6cd] px-3 py-2 text-[14px] outline-none focus:border-[#075E54]"
                />
                <button
                  type="button"
                  onClick={() =>
                    mutations.cerrarCaja.mutate({
                      cajaId: cajaAbierta.id,
                      monto_final_declarado: montoDeclarado,
                      descripcion: descripcionCierre || 'Cierre desde modulo caja',
                    })
                  }
                  disabled={!puedeCerrarCaja || mutations.cerrarCaja.isPending || !montoCierre}
                  className="flex h-10 w-full items-center justify-center gap-2 rounded bg-[#b42318] px-4 text-[14px] font-semibold text-white hover:bg-[#9b1c13] disabled:opacity-60"
                >
                  <Lock size={15} />
                  Cerrar caja con este monto
                </button>
              </div>
            </section>
            ) : null}

            {activePanel === 'historial' ? (
            <section className="rounded border border-[#c4c6cd] bg-white lg:col-span-2">
              <div className="border-b border-[#c4c6cd] px-4 py-3 text-[13px] font-bold uppercase tracking-wide text-[#44474c]">
                Cobros por medio de pago
              </div>
              <DataTable
                rows={resumen?.cobros_por_medio ?? []}
                columns={cobrosColumns}
                getRowKey={(medio) => medio.medio_pago_id ?? medio.medio}
                emptyMessage="Todavia no hay cobros registrados en esta caja."
              />
            </section>
            ) : null}

            {activePanel === 'movimientos' ? (
            <FichaHistoryPanel
              variant="section"
              className="lg:col-span-2 bg-white"
              title="Movimientos de caja"
              subtitle="Aperturas, cobros, ingresos, egresos y cierres"
              events={movimientosCaja}
              labels={{
                APERTURA: 'Apertura de caja',
                COBRO: 'Cobro registrado',
                EGRESO: 'Egreso de dinero',
                INGRESO_MANUAL: 'Ingreso manual',
                CIERRE: 'Cierre de caja',
              }}
              emptyTitle="Sin movimientos"
              emptyDescription="Aca se veran los movimientos operativos de esta caja."
              getActorName={() => 'Caja'}
              getChanges={(evento) => [
                `Monto: ${money(evento.monto)}`,
                evento.categoria_egreso ? `Categoria: ${evento.categoria_egreso}` : '',
                evento.entidad_nombre ? `Destino: ${evento.entidad_nombre}` : '',
              ].filter(Boolean)}
            />
            ) : null}

            {activePanel === 'auditoria' ? (
            <FichaHistoryPanel<IAuditoriaCaja>
              variant="section"
              className="lg:col-span-2 bg-white"
              title="Auditoria de caja"
              subtitle="Responsables, cobros, egresos, apertura y cierre con datos tecnicos"
              events={auditoriaCaja}
              isLoading={auditoriaCajaQuery.isLoading}
              labels={{
                ABRIR_CAJA: 'Caja abierta',
                CERRAR_CAJA: 'Caja cerrada',
                MOVIMIENTO_CAJA: 'Movimiento manual',
                EGRESO_CAJA: 'Egreso de caja',
                COBRO_CAJA: 'Cobro registrado',
                REEMBOLSO_CAJA: 'Reembolso',
              }}
              emptyTitle="Sin auditoria"
              emptyDescription="Aca se veran los eventos auditados de esta caja."
              getActorName={(evento) => evento.empleado_id ?? 'Sistema'}
              getChanges={(evento) => {
                const data = evento.despues ?? evento.metadata ?? {};
                return [
                  data.monto ? `Monto: ${money(data.monto as number | string)}` : '',
                  data.movimiento_id ? `Movimiento: ${String(data.movimiento_id).slice(0, 8)}` : '',
                  data.comprobante_id ? `Comprobante: ${String(data.comprobante_id).slice(0, 8)}` : '',
                  data.medio_pago_id ? `Medio: ${String(data.medio_pago_id).slice(0, 8)}` : '',
                  data.diferencia != null ? `Diferencia: ${money(data.diferencia as number | string)}` : '',
                ].filter(Boolean);
              }}
            />
            ) : null}

            {activePanel === 'egreso' ? (
            <section className="rounded border border-[#c4c6cd] bg-white">
              <div className="border-b border-[#c4c6cd] px-4 py-3 text-[13px] font-bold uppercase tracking-wide text-[#44474c]">
                Registrar egreso de dinero
              </div>
              <div className="grid gap-3 p-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">
                    Motivo
                  </span>
                  <select
                    value={categoriaEgreso}
                    onChange={(event) => setCategoriaEgreso(event.target.value as typeof categoriaEgreso)}
                    className="h-10 w-full rounded border border-[#c4c6cd] bg-white px-3 text-[14px] outline-none focus:border-[#075E54]"
                  >
                    {categoriasEgreso.map((categoria) => (
                      <option key={categoria.value} value={categoria.value}>
                        {categoria.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">
                    Monto
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={montoCalculado}
                    value={montoMovimiento}
                    onChange={(event) => setMontoMovimiento(event.target.value)}
                    className={`h-10 w-full rounded border px-3 text-[14px] outline-none focus:border-[#075E54] ${
                      egresoSuperaDisponible ? 'border-[#b42318]' : 'border-[#c4c6cd]'
                    }`}
                  />
                  <span className={`mt-1 block text-[12px] ${egresoSuperaDisponible ? 'text-[#b42318]' : 'text-[#44474c]'}`}>
                    Disponible en caja: {money(montoCalculado)}
                  </span>
                </label>
                <label className="block">
                  <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">
                    Proveedor / empleado / destino
                  </span>
                  <input
                    value={entidadNombre}
                    onChange={(event) => setEntidadNombre(event.target.value)}
                    className="h-10 w-full rounded border border-[#c4c6cd] px-3 text-[14px] outline-none focus:border-[#075E54]"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">
                    Referencia
                  </span>
                  <input
                    value={referenciaEgreso}
                    onChange={(event) => setReferenciaEgreso(event.target.value)}
                    className="h-10 w-full rounded border border-[#c4c6cd] px-3 text-[14px] outline-none focus:border-[#075E54]"
                  />
                </label>
                <label className="block md:col-span-2">
                  <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">
                    Observacion
                  </span>
                  <textarea
                    value={descripcionEgreso}
                    onChange={(event) => setDescripcionEgreso(event.target.value)}
                    className="min-h-[70px] w-full rounded border border-[#c4c6cd] px-3 py-2 text-[14px] outline-none focus:border-[#075E54]"
                  />
                </label>
                <button
                  type="button"
                  onClick={registrarEgreso}
                  disabled={!puedeRegistrarMovimiento || mutations.movimientoCaja.isPending || montoEgreso <= 0 || egresoSuperaDisponible}
                  className="flex h-10 items-center justify-center gap-2 rounded bg-[#b42318] px-4 text-[14px] font-semibold text-white hover:bg-[#9b1c13] disabled:opacity-60 md:col-span-2"
                >
                  <ArrowDownCircle size={15} />
                  Registrar egreso
                </button>
              </div>
            </section>
            ) : null}

            {activePanel === 'consumo' ? (
            <section className="rounded border border-[#c4c6cd] bg-white">
              <div className="border-b border-[#c4c6cd] px-4 py-3 text-[13px] font-bold uppercase tracking-wide text-[#44474c]">
                Consumo interno de productos
              </div>
              <div className="grid gap-3 p-4 md:grid-cols-[1fr_120px]">
                <div className="block">
                  <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">
                    Buscar producto
                  </span>
                  <input
                    value={productoSearch}
                    onChange={(event) => setProductoSearch(event.target.value)}
                    placeholder="Nombre o codigo"
                    className="h-10 w-full rounded border border-[#c4c6cd] bg-white px-3 text-[14px] outline-none focus:border-[#075E54]"
                  />
                  <div className="mt-2 max-h-[220px] overflow-auto rounded border border-[#c4c6cd] bg-white">
                    {productosConsumo.map((producto) => (
                      <button
                        key={producto.id}
                        type="button"
                        onClick={() => {
                          setProductoConsumoId(producto.id ?? '');
                          setProductoSearch(producto.nombre);
                        }}
                        className={`flex w-full items-center justify-between gap-3 border-b border-[#e5e7eb] px-3 py-2 text-left text-[13px] hover:bg-[#f8fafc] ${
                          productoConsumoId === producto.id ? 'bg-[#eef8f6]' : ''
                        }`}
                      >
                        <span className="font-semibold text-[#041627]">{producto.nombre}</span>
                        <span className="text-[#44474c]">{producto.codigo_barras || '-'}</span>
                      </button>
                    ))}
                    {!productosConsumo.length ? (
                      <div className="px-3 py-5 text-center text-[13px] text-[#44474c]">
                        Sin productos encontrados
                      </div>
                    ) : null}
                  </div>
                  {productoConsumo ? (
                    <div className="mt-2 rounded border border-[#cfe2de] bg-[#f3fbf9] px-3 py-2 text-[13px] font-semibold text-[#075E54]">
                      Seleccionado: {productoConsumo.nombre}
                    </div>
                  ) : null}
                </div>
                <label className="block">
                  <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">
                    Cantidad
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={cantidadConsumo}
                    onChange={(event) => setCantidadConsumo(event.target.value)}
                    className="h-10 w-full rounded border border-[#c4c6cd] px-3 text-[14px] outline-none focus:border-[#075E54]"
                  />
                </label>
                <label className="block md:col-span-2">
                  <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">
                    Motivo de consumo
                  </span>
                  <textarea
                    value={descripcionConsumo}
                    onChange={(event) => setDescripcionConsumo(event.target.value)}
                    placeholder="Ej: producto usado para limpieza, merienda del personal, muestra, rotura interna"
                    className="min-h-[70px] w-full rounded border border-[#c4c6cd] px-3 py-2 text-[14px] outline-none focus:border-[#075E54]"
                  />
                </label>
                <button
                  type="button"
                  onClick={registrarConsumo}
                  disabled={!puedeConsumirStock || mutations.consumoInterno.isPending || !productoConsumoId || toNumber(cantidadConsumo) <= 0}
                  className="flex h-10 items-center justify-center gap-2 rounded bg-[#075E54] px-4 text-[14px] font-semibold text-white hover:bg-[#0b6d62] disabled:opacity-60 md:col-span-2"
                >
                  <ArrowDownCircle size={15} />
                  Descontar del stock
                </button>
              </div>
            </section>
            ) : null}
            </div>
          </div>
        ) : null}

        {puedeVerTodasCajas ? (
          <section className="rounded-lg border border-[#c4c6cd] bg-white shadow-sm">
            <div className="flex flex-wrap items-end justify-between gap-3 px-4 py-3">
              <div>
                <div className="text-[14px] font-bold text-[#041627]">Historial de cajas</div>
                <div className="text-[12px] text-[#44474c]">
                  Filtra por periodo, estado y abre el detalle de cualquier caja.
                </div>
              </div>
              <div className="flex flex-wrap items-end gap-2">
                <label className="block">
                  <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">Desde</span>
                  <input
                    type="date"
                    value={desdeCajas}
                    onChange={(event) => setDesdeCajas(event.target.value)}
                    className="h-9 rounded border border-[#c4c6cd] px-3 text-[14px] outline-none focus:border-[#075E54]"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">Hasta</span>
                  <input
                    type="date"
                    value={hastaCajas}
                    onChange={(event) => setHastaCajas(event.target.value)}
                    className="h-9 rounded border border-[#c4c6cd] px-3 text-[14px] outline-none focus:border-[#075E54]"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">Estado</span>
                  <select
                    value={estadoCajas}
                    onChange={(event) => setEstadoCajas(event.target.value as typeof estadoCajas)}
                    className="h-9 rounded border border-[#c4c6cd] bg-white px-3 text-[14px] outline-none focus:border-[#075E54]"
                  >
                    <option value="TODAS">Todas</option>
                    <option value="ABIERTA">Abiertas</option>
                    <option value="CERRADA">Cerradas</option>
                  </select>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setDesdeCajas('');
                    setHastaCajas('');
                    setEstadoCajas('TODAS');
                  }}
                  className="h-9 rounded border border-[#c4c6cd] bg-white px-3 text-[13px] font-semibold text-[#041627] hover:bg-[#f4f5f6]"
                >
                  Limpiar
                </button>
              </div>
            </div>
          </section>
        ) : null}

        <DataTable
          rows={cajas}
          columns={cajasColumns}
          getRowKey={(caja) => caja.id}
          isLoading={cajasQuery.isLoading}
          loadingMessage="Cargando cajas..."
          emptyMessage={puedeVerTodasCajas ? 'Sin cajas para los filtros seleccionados.' : 'No tenes una caja abierta en proceso.'}
          onRowClick={(caja) => {
            setSelectedCajaId(caja.id);
            setActivePanel('resumen');
          }}
          rowClassName={(caja) => (resumenCajaId === caja.id ? 'bg-[#eef8f6]' : '')}
          getContextActions={(caja) => [
            {
              label: 'Ver resumen',
              icon: <Calculator size={14} />,
              onClick: () => {
                setSelectedCajaId(caja.id);
                setActivePanel('resumen');
              },
            },
            {
              label: 'Cerrar caja',
              icon: <Lock size={14} />,
              danger: true,
              disabled: caja.estado !== 'ABIERTA' || !puedeCerrarCaja,
              dividerBefore: true,
              onClick: () => {
                setSelectedCajaId(caja.id);
                setActivePanel('cierre');
              },
            },
          ]}
        />
      </div>
    </div>
  );
};

export default CajaPages;
