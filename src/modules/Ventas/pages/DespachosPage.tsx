import { Ban, FileText, PackageCheck, Plus, Printer, Search, Truck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../../store/auth.store';
import AccessDenied from '../../../components/common/AccessDenied';
import DataTable from '../../../components/common/DataTable';
import type { DataTableColumn } from '../../../components/common/DataTable';
import TableContextMenu from '../../../components/common/TableContextMenu';
import VentaDetalleFicha from '../../POSAuxiliares/components/VentaDetalleFicha';
import type { IDespachoAux } from '../../POSAuxiliares/types/pos-aux.type';
import {
  useDespachosAux,
  useFacturacionAux,
  useConfiguracionPos,
  usePosAuxMutation,
  useVentasGeneralAux,
  useVentasPosAux,
} from '../../POSAuxiliares/hooks/usePosAux';
import { dateTime, money, shortId, toNumber } from '../../POSAuxiliares/utils/format';
import { imprimirComprobante } from '../../POSAuxiliares/utils/printComprobante';
import { hasAnyPermission, POS_PERMISSIONS } from '../../POSAuxiliares/utils/posPermissions';

type MotivoPendiente = '' | 'RETIRA_LUEGO' | 'SIN_STOCK' | 'EN_GARANTIA';
type EntregaDraft = Record<string, { cantidad: string; motivo: MotivoPendiente }>;
type DespachoItemRow = IDespachoAux['items'][number];

const estadoClass: Record<string, string> = {
  PENDIENTE: 'border-[#f6d58f] bg-[#fff8e6] text-[#8a5a00]',
  ENTREGADO_PARCIAL: 'border-[#cfe2de] bg-[#f3fbf9] text-[#075E54]',
  ENTREGADO: 'border-[#cfe2de] bg-[#eef8f6] text-[#075E54]',
  ANULADO: 'border-[#f1c7c7] bg-[#fff5f5] text-[#b42318]',
};

const motivoLabel: Record<Exclude<MotivoPendiente, ''>, string> = {
  RETIRA_LUEGO: 'Retira luego',
  SIN_STOCK: 'Sin stock',
  EN_GARANTIA: 'En garantia',
};

const normalizeCode = (value?: string | null) =>
  String(value ?? '').trim().toLowerCase().replace(/\s+/g, '');

const buildDraft = (despacho?: IDespachoAux | null): EntregaDraft => {
  if (!despacho) return {};
  return despacho.items.reduce<EntregaDraft>((acc, item) => {
    const pendiente = toNumber(item.cantidad_pendiente);
    acc[item.id] = {
      cantidad: String(pendiente),
      motivo: (item.motivo_pendiente as MotivoPendiente) ?? '',
    };
    return acc;
  }, {});
};

const DespachosPage = () => {
  const [searchParams] = useSearchParams();
  const permisos = useAuthStore((state) => state.permisos);
  const puedeVerDespachos = hasAnyPermission(permisos, POS_PERMISSIONS.depositoVer, POS_PERMISSIONS.depositoDespachar, POS_PERMISSIONS.depositoRecepcionar);
  const puedeOperarDespacho = hasAnyPermission(permisos, POS_PERMISSIONS.depositoDespachar, POS_PERMISSIONS.depositoRecepcionar);
  const despachosQuery = useDespachosAux(puedeVerDespachos);
  const ventasQuery = useVentasPosAux(puedeOperarDespacho);
  const ventasGeneralQuery = useVentasGeneralAux(puedeVerDespachos);
  const facturacionQuery = useFacturacionAux(puedeVerDespachos);
  const configQuery = useConfiguracionPos();
  const mutations = usePosAuxMutation();
  const [comprobanteId, setComprobanteId] = useState('');
  const [scanCode, setScanCode] = useState('');
  const [selectedDespachoId, setSelectedDespachoId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [generarRemito, setGenerarRemito] = useState(false);
  const [observaciones, setObservaciones] = useState('');
  const [draft, setDraft] = useState<EntregaDraft>({});
  const [rowMenu, setRowMenu] = useState<{ x: number; y: number; despacho: IDespachoAux } | null>(null);
  const queryDespachoId = searchParams.get('despachoId');
  const queryComprobanteId = searchParams.get('comprobanteId');

  const despachos = despachosQuery.data ?? [];
  const facturacion = facturacionQuery.data ?? [];

  const despachosFiltrados = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return [];
    return despachos.filter((despacho) => {
      const items = despacho.items.map((item) => item.descripcion).join(' ').toLowerCase();
      const comprobante = despacho.comprobante?.numero ?? despacho.comprobante_id;
      const fiscales = facturacion
        .filter((fiscal) => fiscal.comprobante_origen_id === despacho.comprobante_id)
        .map((fiscal) => fiscal.numero)
        .join(' ')
        .toLowerCase();
      return (
        despacho.estado.toLowerCase().includes(term) ||
        comprobante.toLowerCase().includes(term) ||
        fiscales.includes(term) ||
        items.includes(term)
      );
    });
  }, [despachos, facturacion, search]);

  const selectedDespacho =
    despachos.find((despacho) => despacho.id === selectedDespachoId) ??
    null;

  const comprobantesConDespacho = useMemo(
    () => new Set(despachos.map((despacho) => despacho.comprobante_id)),
    [despachos],
  );
  const comprobantesDespachables = useMemo(() => {
    const ventas = (ventasQuery.data ?? []).filter((venta) =>
      ['COBRADA', 'ENTREGADO_PARCIAL'].includes(venta.estado),
    );
    const fiscales = (facturacionQuery.data ?? []).filter((comprobante) =>
      ['EMITIDO', 'EMITIDA'].includes(comprobante.estado),
    );
    return [...ventas, ...fiscales].filter(
      (comprobante) => !comprobantesConDespacho.has(comprobante.id),
    );
  }, [comprobantesConDespacho, facturacionQuery.data, ventasQuery.data]);
  const despachoPorCodigo = useMemo(() => {
    const code = normalizeCode(scanCode);
    if (!code) return null;
    return despachos.find((despacho) => {
      const comprobanteNumero = normalizeCode(despacho.comprobante?.numero);
      const despachoId = normalizeCode(despacho.id);
      const comprobanteIdActual = normalizeCode(despacho.comprobante_id);
      const fiscales = facturacion
        .filter((fiscal) => fiscal.comprobante_origen_id === despacho.comprobante_id)
        .some((fiscal) => normalizeCode(fiscal.numero) === code || normalizeCode(fiscal.id) === code);
      return (
        comprobanteNumero === code ||
        despachoId === code ||
        comprobanteIdActual === code ||
        fiscales
      );
    }) ?? null;
  }, [despachos, facturacion, scanCode]);
  const comprobantePorCodigo = useMemo(() => {
    const code = normalizeCode(scanCode);
    if (!code) return null;
    return comprobantesDespachables.find((comprobante) => {
      const numero = normalizeCode(comprobante.numero);
      const id = normalizeCode(comprobante.id);
      return numero === code || id === code || numero.includes(code) || id.startsWith(code);
    }) ?? null;
  }, [comprobantesDespachables, scanCode]);

  const resumenSeleccionado = useMemo(() => {
    if (!selectedDespacho) return { solicitado: 0, entregado: 0, pendiente: 0 };
    return selectedDespacho.items.reduce(
      (acc, item) => ({
        solicitado: acc.solicitado + toNumber(item.cantidad_solicitada),
        entregado: acc.entregado + toNumber(item.cantidad_despachada),
        pendiente: acc.pendiente + toNumber(item.cantidad_pendiente),
      }),
      { solicitado: 0, entregado: 0, pendiente: 0 },
    );
  }, [selectedDespacho]);
  const ventaSeleccionada = useMemo(() => {
    if (!selectedDespacho) return null;
    return (
      (ventasGeneralQuery.data ?? []).find(
        (venta) =>
          venta.comprobante.id === selectedDespacho.comprobante_id ||
          venta.fiscales.some((fiscal) => fiscal.id === selectedDespacho.comprobante_id),
      ) ?? null
    );
  }, [selectedDespacho, ventasGeneralQuery.data]);

  useEffect(() => {
    if (!despachos.length) return;
    const despachoDesdeUrl =
      (queryDespachoId
        ? despachos.find((despacho) => despacho.id === queryDespachoId)
        : null) ??
      (queryComprobanteId
        ? despachos.find((despacho) => despacho.comprobante_id === queryComprobanteId)
        : null);

    if (despachoDesdeUrl && despachoDesdeUrl.id !== selectedDespachoId) {
      setSelectedDespachoId(despachoDesdeUrl.id);
      setSearch('');
    }
  }, [despachos, queryComprobanteId, queryDespachoId, selectedDespachoId]);

  useEffect(() => {
    if (!selectedDespacho) {
      setSelectedDespachoId(null);
      setDraft({});
      return;
    }
    if (selectedDespacho.id !== selectedDespachoId) {
      setSelectedDespachoId(selectedDespacho.id);
    }
    setDraft(buildDraft(selectedDespacho));
    setObservaciones(selectedDespacho.observaciones ?? '');
  }, [selectedDespacho?.id]);

  const updateDraft = (itemId: string, patch: Partial<EntregaDraft[string]>) => {
    setDraft((current) => ({
      ...current,
      [itemId]: {
        cantidad: current[itemId]?.cantidad ?? '0',
        motivo: current[itemId]?.motivo ?? '',
        ...patch,
      },
    }));
  };
  const despachoItemColumns: DataTableColumn<DespachoItemRow>[] = [
    {
      key: 'producto',
      header: 'Producto',
      render: (item) => <span className="font-semibold text-[#041627]">{item.descripcion}</span>,
    },
    {
      key: 'solicitado',
      header: 'Solicitado',
      align: 'right',
      render: (item) => toNumber(item.cantidad_solicitada),
    },
    {
      key: 'entregado',
      header: 'Entregado',
      align: 'right',
      render: (item) => toNumber(item.cantidad_despachada),
    },
    {
      key: 'pendiente',
      header: 'Pendiente',
      align: 'right',
      render: (item) => (
        <span className="font-bold text-[#b42318]">{toNumber(item.cantidad_pendiente)}</span>
      ),
    },
    {
      key: 'entregar',
      header: 'Entregar ahora',
      render: (item) => {
        const pendiente = toNumber(item.cantidad_pendiente);
        const disabled = !puedeOperarDespacho || selectedDespacho?.estado === 'ENTREGADO' || selectedDespacho?.estado === 'ANULADO';
        return (
          <input
            type="number"
            min={0}
            max={pendiente}
            disabled={disabled || pendiente === 0}
            value={draft[item.id]?.cantidad ?? '0'}
            onChange={(event) => updateDraft(item.id, { cantidad: event.target.value })}
            className="h-9 w-28 rounded border border-[#c4c6cd] px-2 text-right outline-none focus:border-[#075E54] disabled:bg-[#f4f5f6]"
          />
        );
      },
    },
    {
      key: 'motivo',
      header: 'Motivo pendiente',
      render: (item) => {
        const pendiente = toNumber(item.cantidad_pendiente);
        const disabled = !puedeOperarDespacho || selectedDespacho?.estado === 'ENTREGADO' || selectedDespacho?.estado === 'ANULADO';
        return (
          <select
            disabled={disabled || pendiente === 0}
            value={draft[item.id]?.motivo ?? ''}
            onChange={(event) => updateDraft(item.id, { motivo: event.target.value as MotivoPendiente })}
            className="h-9 w-full rounded border border-[#c4c6cd] bg-white px-2 outline-none focus:border-[#075E54] disabled:bg-[#f4f5f6]"
          >
            <option value="">Sin motivo</option>
            {Object.entries(motivoLabel).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        );
      },
    },
  ];

  const entregar = () => {
    if (!selectedDespacho) return;
    const items = selectedDespacho.items
      .filter((item) => toNumber(item.cantidad_pendiente) > 0)
      .map((item) => {
        const pendiente = toNumber(item.cantidad_pendiente);
        const cantidad = Math.min(Math.max(toNumber(draft[item.id]?.cantidad), 0), pendiente);
        const motivo = draft[item.id]?.motivo || null;
        return {
          despacho_item_id: item.id,
          cantidad_despachada: cantidad,
          motivo_pendiente: cantidad < pendiente ? motivo : null,
        };
      });

    const itemsPendientes = selectedDespacho.items.filter(
      (item) => toNumber(item.cantidad_pendiente) > 0,
    );
    const itemSinMotivo = itemsPendientes.find((item, index) => {
      const pendiente = toNumber(item.cantidad_pendiente);
      return items[index].cantidad_despachada < pendiente && !items[index].motivo_pendiente;
    });
    if (itemSinMotivo) {
      window.alert(`Indique motivo pendiente para ${itemSinMotivo.descripcion}`);
      return;
    }

    mutations.entregarDespacho.mutate({
      despacho: selectedDespacho,
      generar_remito: generarRemito,
      observaciones,
      items,
    });
  };

  const crearDespacho = () => {
    if (!puedeOperarDespacho) return;
    if (!comprobanteId) return;
    mutations.crearDespacho.mutate(
      {
        comprobante_id: comprobanteId,
        observaciones: 'Despacho creado desde front',
      },
      {
        onSuccess: () => setComprobanteId(''),
      },
    );
  };

  const buscarOCrearPorCodigo = () => {
    if (!puedeOperarDespacho) return;
    if (despachoPorCodigo) {
      setSelectedDespachoId(despachoPorCodigo.id);
      setSearch(despachoPorCodigo.comprobante?.numero ?? despachoPorCodigo.comprobante_id);
      return;
    }
    const comprobante = comprobantePorCodigo ?? comprobantesDespachables.find((item) => item.id === comprobanteId);
    if (!comprobante) {
      window.alert('No se encontro una venta, ticket o factura pendiente para despachar con ese codigo');
      return;
    }
    setComprobanteId(comprobante.id);
    mutations.crearDespacho.mutate(
      {
        comprobante_id: comprobante.id,
        observaciones: 'Despacho creado desde lectura de comprobante',
      },
      {
        onSuccess: (despacho) => {
          setSelectedDespachoId(despacho.id);
          setSearch(despacho.comprobante?.numero ?? despacho.comprobante_id);
          setScanCode('');
          setComprobanteId('');
        },
      },
    );
  };

  if (!puedeVerDespachos) {
    return (
      <AccessDenied
        title="Sin permisos para despachos"
        message="Necesitas deposito.ver o permisos de despacho para consultar esta seccion."
      />
    );
  }

  return (
    <div className="min-h-[calc(100vh-52px)] bg-[#f3f4f6] px-4 py-4">
      <div className="mx-auto grid max-w-[1500px] gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <section className="rounded-lg border border-[#c4c6cd] bg-white shadow-sm">
          <div className="border-b border-[#c4c6cd] px-4 py-3">
            <div className="flex items-center gap-2 text-[15px] font-bold text-[#041627]">
              <Truck size={17} className="text-[#075E54]" />
              Despachos
            </div>
            <div className="mt-1 text-[13px] text-[#44474c]">
              Ordenes pendientes, parciales y remitos generados.
            </div>
          </div>

          <div className="border-b border-[#c4c6cd] bg-[#fbfbfc] p-3">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#44474c]" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por comprobante, estado o producto"
                className="h-9 w-full rounded border border-[#c4c6cd] bg-white pl-9 pr-3 text-[13px] outline-none focus:border-[#075E54]"
              />
            </div>
          </div>

          <div className="max-h-[670px] overflow-auto">
            {despachosFiltrados.map((despacho) => {
              const pendiente = despacho.items.reduce((sum, item) => sum + toNumber(item.cantidad_pendiente), 0);
              return (
                <button
                  key={despacho.id}
                  type="button"
                  onClick={() => setSelectedDespachoId(despacho.id)}
                  onContextMenu={(event) => {
                    event.preventDefault();
                    setSelectedDespachoId(despacho.id);
                    setRowMenu({ x: event.clientX, y: event.clientY, despacho });
                  }}
                  className={`w-full border-b border-[#e5e7eb] px-4 py-3 text-left hover:bg-[#f8fafc] ${
                    selectedDespacho?.id === despacho.id ? 'bg-[#eef8f6]' : 'bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-[14px] font-bold text-[#041627]">
                        {despacho.comprobante?.numero ?? shortId(despacho.comprobante_id)}
                      </div>
                      <div className="mt-1 text-[12px] text-[#44474c]">
                        {dateTime(despacho.created_at)}
                      </div>
                    </div>
                    <span className={`rounded border px-2 py-1 text-[11px] font-semibold ${estadoClass[despacho.estado] ?? 'border-[#c4c6cd] text-[#44474c]'}`}>
                      {despacho.estado}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[12px] text-[#44474c]">
                    <span>{despacho.items.length} items</span>
                    <strong className="text-[#041627]">{pendiente} pendientes</strong>
                  </div>
                </button>
              );
            })}
            {!despachosFiltrados.length && !despachosQuery.isLoading ? (
              <div className="px-4 py-10 text-center text-[14px] text-[#44474c]">
                Busque o escanee un comprobante para iniciar el despacho.
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
                  label: 'Ver ficha',
                  icon: <Truck size={14} />,
                  onClick: () => setSelectedDespachoId(rowMenu.despacho.id),
                },
                {
                  label: 'Imprimir remito',
                  icon: <Printer size={14} />,
                  disabled: !rowMenu.despacho.remito,
                  onClick: () =>
                    rowMenu.despacho.remito &&
                    imprimirComprobante(rowMenu.despacho.remito, {
                      titulo: 'Remito',
                      config: configQuery.data,
                      despacho: rowMenu.despacho,
                    }),
                },
                {
                  label: 'Registrar entrega',
                  icon: <PackageCheck size={14} />,
                  disabled: !puedeOperarDespacho || ['ENTREGADO', 'ANULADO'].includes(rowMenu.despacho.estado),
                },
                {
                  label: 'Anular despacho',
                  icon: <Ban size={14} />,
                  danger: true,
                  dividerBefore: true,
                  disabled: !puedeOperarDespacho || rowMenu.despacho.estado === 'ANULADO',
                  onClick: () => mutations.anularDespacho.mutate({ id: rowMenu.despacho.id, motivo: 'Anulado desde menu contextual' }),
                },
              ]}
            />
          ) : null}
        </section>

        <section className="rounded-lg border border-[#c4c6cd] bg-white shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#c4c6cd] px-4 py-3">
            <div>
              <div className="text-[15px] font-bold text-[#041627]">Ficha de despacho</div>
              <div className="text-[13px] text-[#44474c]">
                Control de entrega, parciales y remito.
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                value={scanCode}
                onChange={(event) => setScanCode(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    buscarOCrearPorCodigo();
                  }
                }}
                placeholder="Escanear factura, ticket o venta"
                className="h-9 w-[300px] rounded border border-[#c4c6cd] bg-white px-3 text-[13px] outline-none focus:border-[#075E54]"
              />
              <select
                value={comprobanteId}
                onChange={(event) => setComprobanteId(event.target.value)}
                className="h-9 w-[330px] rounded border border-[#c4c6cd] bg-white px-3 text-[13px] outline-none focus:border-[#075E54]"
              >
                <option value="">Crear desde venta, ticket o factura</option>
                {comprobantesDespachables.map((comprobante) => (
                  <option key={comprobante.id} value={comprobante.id}>
                    {comprobante.numero} - {comprobante.tipo} - {money(comprobante.total)}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={scanCode.trim() ? buscarOCrearPorCodigo : crearDespacho}
                disabled={
                  !puedeOperarDespacho ||
                  (!comprobanteId && !scanCode.trim()) ||
                  mutations.crearDespacho.isPending
                }
                className="flex h-9 items-center gap-2 rounded bg-[#075E54] px-3 text-[13px] font-semibold text-white hover:bg-[#0b6d62] disabled:opacity-60"
              >
                <Plus size={15} />
                {despachoPorCodigo ? 'Abrir' : 'Crear'}
              </button>
            </div>
          </div>

          {selectedDespacho ? (
            <>
              {ventaSeleccionada ? (
                <div className="border-b border-[#c4c6cd] bg-[#f3f4f6] p-4">
                  <VentaDetalleFicha venta={ventaSeleccionada} />
                </div>
              ) : null}

              <div className="grid gap-3 border-b border-[#c4c6cd] bg-[#fbfbfc] p-4 sm:grid-cols-4">
                <div className="rounded border border-[#e5e7eb] bg-white px-3 py-2">
                  <div className="text-[11px] font-bold uppercase text-[#44474c]">Comprobante</div>
                  <div className="mt-1 truncate text-[14px] font-semibold text-[#041627]">
                    {selectedDespacho.comprobante?.numero ?? shortId(selectedDespacho.comprobante_id)}
                  </div>
                </div>
                <div className="rounded border border-[#e5e7eb] bg-white px-3 py-2">
                  <div className="text-[11px] font-bold uppercase text-[#44474c]">Solicitado</div>
                  <div className="mt-1 text-[14px] font-semibold text-[#041627]">{resumenSeleccionado.solicitado}</div>
                </div>
                <div className="rounded border border-[#e5e7eb] bg-white px-3 py-2">
                  <div className="text-[11px] font-bold uppercase text-[#44474c]">Entregado</div>
                  <div className="mt-1 text-[14px] font-semibold text-[#075E54]">{resumenSeleccionado.entregado}</div>
                </div>
                <div className="rounded border border-[#e5e7eb] bg-white px-3 py-2">
                  <div className="text-[11px] font-bold uppercase text-[#44474c]">Pendiente</div>
                  <div className="mt-1 text-[14px] font-semibold text-[#b42318]">{resumenSeleccionado.pendiente}</div>
                </div>
              </div>

              <div className="border-b border-[#c4c6cd]">
                <DataTable
                  rows={selectedDespacho.items}
                  columns={despachoItemColumns}
                  getRowKey={(item) => item.id}
                  emptyMessage="Sin items para despachar."
                />
              </div>

              <div className="grid gap-3 p-4 lg:grid-cols-[1fr_220px_260px]">
                <textarea
                  value={observaciones}
                  onChange={(event) => setObservaciones(event.target.value)}
                  placeholder="Observaciones del despacho"
                  className="min-h-[76px] rounded border border-[#c4c6cd] px-3 py-2 text-[13px] outline-none focus:border-[#075E54]"
                />
                <label className="flex h-[76px] items-center justify-between rounded border border-[#c4c6cd] bg-white px-3 text-[13px] font-semibold text-[#041627]">
                  Generar remito
                  <input
                    type="checkbox"
                    checked={generarRemito}
                    onChange={(event) => setGenerarRemito(event.target.checked)}
                    className="h-4 w-4 accent-[#075E54]"
                  />
                </label>
                <div className="grid gap-2">
                  <button
                    type="button"
                    onClick={entregar}
                    disabled={
                      selectedDespacho.estado === 'ENTREGADO' ||
                      selectedDespacho.estado === 'ANULADO' ||
                      !puedeOperarDespacho ||
                      mutations.entregarDespacho.isPending
                    }
                    className="flex h-9 items-center justify-center gap-2 rounded bg-[#075E54] px-3 text-[13px] font-semibold text-white hover:bg-[#0b6d62] disabled:opacity-60"
                  >
                    <PackageCheck size={15} />
                    Registrar entrega
                  </button>
                  <button
                    type="button"
                    onClick={() => mutations.anularDespacho.mutate({ id: selectedDespacho.id, motivo: 'Anulado desde front' })}
                    disabled={!puedeOperarDespacho || selectedDespacho.estado === 'ANULADO' || mutations.anularDespacho.isPending}
                    className="flex h-9 items-center justify-center gap-2 rounded border border-[#f1c7c7] bg-[#fff5f5] px-3 text-[13px] font-semibold text-[#b42318] hover:bg-[#fdecec] disabled:opacity-60"
                  >
                    <Ban size={15} />
                    Anular
                  </button>
                </div>
              </div>

              {selectedDespacho.remito ? (
                <div className="border-t border-[#c4c6cd] bg-[#f3fbf9] px-4 py-3 text-[13px] text-[#075E54]">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 font-semibold">
                      <FileText size={15} />
                      Remito generado: {selectedDespacho.remito.numero}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        imprimirComprobante(selectedDespacho.remito!, {
                          titulo: 'Remito',
                          config: configQuery.data,
                          despacho: selectedDespacho,
                        })
                      }
                      className="inline-flex h-8 items-center gap-2 rounded border border-[#cfe2de] bg-white px-3 text-[12px] font-semibold text-[#075E54] hover:bg-[#eef8f6]"
                    >
                      <Printer size={14} />
                      Imprimir remito
                    </button>
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <div className="flex min-h-[420px] items-center justify-center px-4 text-center text-[14px] text-[#44474c]">
              Seleccione un despacho para controlar la entrega.
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default DespachosPage;
