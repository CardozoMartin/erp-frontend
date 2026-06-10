import { CreditCard, FileText, PackagePlus, Plus, Printer, RotateCcw, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '../../../store/auth.store';
import AccessDenied from '../../../components/common/AccessDenied';
import DataTable from '../../../components/common/DataTable';
import type { DataTableColumn } from '../../../components/common/DataTable';
import { useMediosPagoActivos } from '../../PuntoDeVenta/hooks/usePos';
import type { IComprobanteAux } from '../types/pos-aux.type';
import {
  useCajaAbiertaAux,
  useFacturacionAux,
  useNotasCreditoAux,
  usePosAuxMutation,
  useVentasPosAux,
} from '../hooks/usePosAux';
import { dateTime, money, shortId, toNumber } from '../utils/format';
import { imprimirComprobante } from '../utils/printComprobante';
import { hasAnyPermission, POS_PERMISSIONS } from '../utils/posPermissions';

type DestinoNota = 'SALDO_CUENTA' | 'REEMBOLSO' | 'SOLO_EMITIR';
type ItemDraft = Record<string, string>;
type ItemDisponible = {
  item: NonNullable<IComprobanteAux['items']>[number];
  vendido: number;
  devuelto: number;
  disponible: number;
};

const destinoLabel: Record<DestinoNota, string> = {
  SOLO_EMITIR: 'Solo emitir',
  REEMBOLSO: 'Reintegrar dinero',
  SALDO_CUENTA: 'Saldo a favor',
};

const estadosOrigenValidos = ['COBRADA', 'ENTREGADO_PARCIAL', 'ENTREGADO', 'EMITIDO', 'EMITIDA'];

const NotasCreditoAuxPage = () => {
  const permisos = useAuthStore((state) => state.permisos);
  const puedeVerNotas = hasAnyPermission(permisos, POS_PERMISSIONS.ventasVer, POS_PERMISSIONS.reportesVer, POS_PERMISSIONS.reportesVentas);
  const puedeCrearNota = permisos.includes(POS_PERMISSIONS.ventasCancelarPagada);
  const notasQuery = useNotasCreditoAux(puedeVerNotas);
  const ventasQuery = useVentasPosAux(puedeVerNotas);
  const facturacionQuery = useFacturacionAux(puedeVerNotas);
  const cajaQuery = useCajaAbiertaAux(puedeCrearNota);
  const mediosPagoQuery = useMediosPagoActivos();
  const mutations = usePosAuxMutation();
  const [origenId, setOrigenId] = useState('');
  const [destino, setDestino] = useState<DestinoNota>('REEMBOLSO');
  const [reingresarStock, setReingresarStock] = useState(true);
  const [medioPagoId, setMedioPagoId] = useState('');
  const [referencia, setReferencia] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState<ItemDraft>({});

  const notas = notasQuery.data ?? [];
  const cajaAbierta = cajaQuery.data;
  const mediosPago = mediosPagoQuery.data ?? [];
  const comprobantesOrigen = useMemo(() => {
    const ventas = (ventasQuery.data ?? []).filter((venta) =>
      estadosOrigenValidos.includes(venta.estado),
    );
    const fiscales = (facturacionQuery.data ?? []).filter((comprobante) =>
      estadosOrigenValidos.includes(comprobante.estado),
    );
    return [...ventas, ...fiscales].filter((comprobante) => comprobante.items?.length);
  }, [facturacionQuery.data, ventasQuery.data]);

  const comprobantesFiltrados = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return comprobantesOrigen;
    return comprobantesOrigen.filter((comprobante) => {
      const items = (comprobante.items ?? [])
        .map((item) => item.descripcion)
        .join(' ')
        .toLowerCase();
      return (
        comprobante.numero.toLowerCase().includes(term) ||
        comprobante.estado.toLowerCase().includes(term) ||
        items.includes(term)
      );
    });
  }, [comprobantesOrigen, search]);

  const origenSeleccionado =
    comprobantesOrigen.find((comprobante) => comprobante.id === origenId) ??
    comprobantesFiltrados[0] ??
    null;

  const devueltoPorItem = useMemo(() => {
    const cantidades = new Map<string, number>();
    for (const nota of notas) {
      if (nota.estado === 'ANULADO' || nota.comprobante_origen_id !== origenSeleccionado?.id) continue;
      for (const item of nota.items ?? []) {
        const origenItemId = item.comprobante_item_origen_id;
        if (!origenItemId) continue;
        cantidades.set(origenItemId, toNumber(cantidades.get(origenItemId)) + toNumber(item.cantidad));
      }
    }
    return cantidades;
  }, [notas, origenSeleccionado?.id]);

  const itemsDisponibles = useMemo(() => {
    if (!origenSeleccionado) return [];
    return (origenSeleccionado.items ?? [])
      .filter((item) => item.producto_id)
      .map((item) => {
        const vendido = toNumber(item.cantidad);
        const devuelto = toNumber(devueltoPorItem.get(item.id));
        const disponible = Math.max(0, vendido - devuelto);
        return { item, vendido, devuelto, disponible };
      });
  }, [devueltoPorItem, origenSeleccionado]);

  const totalNota = itemsDisponibles.reduce((sum, row) => {
    const cantidad = Math.min(toNumber(draft[row.item.id]), row.disponible);
    const precio = toNumber(row.item.precio_unitario);
    return sum + cantidad * precio;
  }, 0);

  useEffect(() => {
    if (!origenSeleccionado) {
      setOrigenId('');
      setDraft({});
      return;
    }
    if (origenSeleccionado.id !== origenId) {
      setOrigenId(origenSeleccionado.id);
    }
    setDraft(
      itemsDisponibles.reduce<ItemDraft>((acc, row) => {
        acc[row.item.id] = String(row.disponible);
        return acc;
      }, {}),
    );
    setObservaciones(`Devolucion de ${origenSeleccionado.numero}`);
  }, [origenSeleccionado?.id]);

  useEffect(() => {
    if (medioPagoId || !mediosPago.length) return;
    const efectivo =
      mediosPago.find((medio) => medio.tipo === 'efectivo') ??
      mediosPago.find((medio) => medio.nombre.toLowerCase().includes('efectivo')) ??
      mediosPago[0];
    setMedioPagoId(efectivo.id);
  }, [medioPagoId, mediosPago]);

  const seleccionarOrigen = (comprobante: IComprobanteAux) => {
    setOrigenId(comprobante.id);
    setDraft(
      (comprobante.items ?? []).reduce<ItemDraft>((acc, item) => {
        const devuelto = toNumber(devueltoPorItem.get(item.id));
        acc[item.id] = String(Math.max(0, toNumber(item.cantidad) - devuelto));
        return acc;
      }, {}),
    );
  };

  const crearNota = () => {
    if (!puedeCrearNota) return;
    if (!origenSeleccionado) return;
    const items = itemsDisponibles
      .map((row) => ({
        comprobante_item_id: row.item.id,
        cantidad: Math.min(toNumber(draft[row.item.id]), row.disponible),
      }))
      .filter((item) => item.cantidad > 0);

    if (!items.length) {
      window.alert('Seleccione al menos un producto para devolver');
      return;
    }
    if (destino === 'SALDO_CUENTA' && !origenSeleccionado.cliente_id) {
      window.alert('Para dejar saldo a favor la venta debe tener cliente');
      return;
    }
    if (destino === 'REEMBOLSO' && !cajaAbierta?.id) {
      window.alert('Abra una caja para reintegrar dinero');
      return;
    }

    mutations.crearNotaCredito.mutate(
      {
        comprobante_origen_id: origenSeleccionado.id,
        items,
        destino,
        reingresar_stock: reingresarStock,
        caja_id: destino === 'REEMBOLSO' ? cajaAbierta?.id : undefined,
        medio_pago_id: destino === 'REEMBOLSO' ? medioPagoId || undefined : undefined,
        referencia: destino === 'REEMBOLSO' ? referencia || undefined : undefined,
        observaciones,
      },
      {
        onSuccess: () => {
          setReferencia('');
          setDraft({});
        },
      },
    );
  };
  const notasColumns: DataTableColumn<IComprobanteAux>[] = [
    {
      key: 'numero',
      header: 'Numero',
      render: (nota) => <span className="font-semibold text-[#041627]">{nota.numero}</span>,
    },
    { key: 'estado', header: 'Estado', render: (nota) => nota.estado },
    { key: 'origen', header: 'Origen', render: (nota) => shortId(nota.comprobante_origen_id) },
    { key: 'fecha', header: 'Fecha', render: (nota) => dateTime(nota.created_at) },
    {
      key: 'total',
      header: 'Total',
      align: 'right',
      render: (nota) => <span className="font-semibold">{money(nota.total)}</span>,
    },
    {
      key: 'accion',
      header: 'Accion',
      align: 'right',
      render: (nota) => (
        <button
          type="button"
          onClick={() => imprimirComprobante(nota, 'Nota de credito')}
          className="inline-flex items-center gap-2 rounded border border-[#c4c6cd] bg-white px-3 py-2 text-[12px] font-semibold text-[#041627] hover:bg-[#f4f5f6]"
        >
          <Printer size={14} />
          Imprimir
        </button>
      ),
    },
  ];

  if (!puedeVerNotas) {
    return (
      <AccessDenied
        title="Sin permisos para notas de credito"
        message="Necesitas ventas.ver o permisos de reportes para consultar devoluciones."
      />
    );
  }

  const itemsDisponiblesColumns: DataTableColumn<ItemDisponible>[] = [
    {
      key: 'producto',
      header: 'Producto',
      render: (row) => <span className="font-semibold text-[#041627]">{row.item.descripcion}</span>,
    },
    { key: 'vendido', header: 'Vendido', align: 'right', render: (row) => row.vendido },
    { key: 'devuelto', header: 'Devuelto', align: 'right', render: (row) => row.devuelto },
    {
      key: 'disponible',
      header: 'Disponible',
      align: 'right',
      render: (row) => <span className="font-bold text-[#041627]">{row.disponible}</span>,
    },
    {
      key: 'devolver',
      header: 'Devolver',
      render: (row) => (
        <input
          type="number"
          min={0}
          max={row.disponible}
          disabled={row.disponible === 0}
          value={draft[row.item.id] ?? '0'}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              [row.item.id]: event.target.value,
            }))
          }
          className="h-9 w-28 rounded border border-[#c4c6cd] px-2 text-right outline-none focus:border-[#075E54] disabled:bg-[#f4f5f6]"
        />
      ),
    },
    {
      key: 'importe',
      header: 'Importe',
      align: 'right',
      render: (row) => {
        const cantidad = Math.min(toNumber(draft[row.item.id]), row.disponible);
        return (
          <span className="font-semibold text-[#b42318]">
            {money(cantidad * toNumber(row.item.precio_unitario))}
          </span>
        );
      },
    },
  ];

  return (
    <div className="min-h-[calc(100vh-52px)] bg-[#f3f4f6] px-4 py-4">
      <div className="mx-auto grid max-w-[1500px] gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <section className="rounded-lg border border-[#c4c6cd] bg-white shadow-sm">
          <div className="border-b border-[#c4c6cd] px-4 py-3">
            <div className="flex items-center gap-2 text-[15px] font-bold text-[#041627]">
              <RotateCcw size={17} className="text-[#075E54]" />
              Ventas para devolver
            </div>
            <div className="mt-1 text-[13px] text-[#44474c]">
              Busque una venta cobrada, ticket o factura.
            </div>
          </div>

          <div className="border-b border-[#c4c6cd] bg-[#fbfbfc] p-3">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#44474c]" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por numero, estado o producto"
                className="h-9 w-full rounded border border-[#c4c6cd] bg-white pl-9 pr-3 text-[13px] outline-none focus:border-[#075E54]"
              />
            </div>
          </div>

          <div className="max-h-[650px] overflow-auto">
            {comprobantesFiltrados.map((comprobante) => (
              <button
                key={comprobante.id}
                type="button"
                onClick={() => seleccionarOrigen(comprobante)}
                className={`w-full border-b border-[#e5e7eb] px-4 py-3 text-left hover:bg-[#f8fafc] ${
                  origenSeleccionado?.id === comprobante.id ? 'bg-[#eef8f6]' : 'bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-[14px] font-bold text-[#041627]">
                      {comprobante.numero}
                    </div>
                    <div className="mt-1 text-[12px] text-[#44474c]">
                      {comprobante.tipo} | {comprobante.estado} | {dateTime(comprobante.created_at)}
                    </div>
                  </div>
                  <div className="text-right text-[14px] font-bold text-[#041627]">
                    {money(comprobante.total)}
                  </div>
                </div>
              </button>
            ))}
            {!comprobantesFiltrados.length && !ventasQuery.isLoading ? (
              <div className="px-4 py-10 text-center text-[14px] text-[#44474c]">
                Sin ventas cobradas para devolver.
              </div>
            ) : null}
          </div>
        </section>

        <section className="rounded-lg border border-[#c4c6cd] bg-white shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#c4c6cd] px-4 py-3">
            <div>
              <div className="text-[15px] font-bold text-[#041627]">Nueva nota de credito</div>
              <div className="text-[13px] text-[#44474c]">
                Devolucion parcial o total, con reembolso o saldo a favor.
              </div>
            </div>
            {origenSeleccionado ? (
              <span className="rounded border border-[#cfe2de] bg-[#f3fbf9] px-2.5 py-1 text-[11px] font-semibold text-[#075E54]">
                Origen {origenSeleccionado.numero}
              </span>
            ) : null}
          </div>

          {origenSeleccionado ? (
            <>
              <div className="grid gap-3 border-b border-[#c4c6cd] bg-[#fbfbfc] p-4 sm:grid-cols-4">
                <div className="rounded border border-[#e5e7eb] bg-white px-3 py-2">
                  <div className="text-[11px] font-bold uppercase text-[#44474c]">Venta</div>
                  <div className="mt-1 truncate text-[14px] font-semibold text-[#041627]">{origenSeleccionado.numero}</div>
                </div>
                <div className="rounded border border-[#e5e7eb] bg-white px-3 py-2">
                  <div className="text-[11px] font-bold uppercase text-[#44474c]">Cliente</div>
                  <div className="mt-1 truncate text-[14px] font-semibold text-[#041627]">
                    {origenSeleccionado.cliente_id ? shortId(origenSeleccionado.cliente_id) : 'Consumidor final'}
                  </div>
                </div>
                <div className="rounded border border-[#e5e7eb] bg-white px-3 py-2">
                  <div className="text-[11px] font-bold uppercase text-[#44474c]">Total origen</div>
                  <div className="mt-1 text-[14px] font-semibold text-[#041627]">{money(origenSeleccionado.total)}</div>
                </div>
                <div className="rounded border border-[#e5e7eb] bg-white px-3 py-2">
                  <div className="text-[11px] font-bold uppercase text-[#44474c]">A devolver</div>
                  <div className="mt-1 text-[14px] font-semibold text-[#b42318]">{money(totalNota)}</div>
                </div>
              </div>

              <div className="overflow-auto border-b border-[#c4c6cd]">
                <DataTable
                  rows={itemsDisponibles}
                  columns={itemsDisponiblesColumns}
                  getRowKey={(row) => row.item.id}
                  emptyMessage="Sin productos disponibles para devolver."
                />
              </div>

              <div className="grid gap-3 p-4 lg:grid-cols-[1fr_220px_220px]">
                <textarea
                  value={observaciones}
                  onChange={(event) => setObservaciones(event.target.value)}
                  placeholder="Observaciones"
                  className="min-h-[96px] rounded border border-[#c4c6cd] px-3 py-2 text-[13px] outline-none focus:border-[#075E54]"
                />
                <div className="grid gap-2">
                  <label className="text-[12px] font-semibold text-[#041627]">
                    Destino
                    <select
                      value={destino}
                      onChange={(event) => setDestino(event.target.value as DestinoNota)}
                      className="mt-1 h-9 w-full rounded border border-[#c4c6cd] bg-white px-2 text-[13px] outline-none focus:border-[#075E54]"
                    >
                      {Object.entries(destinoLabel).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </label>
                  <label className="flex h-9 items-center justify-between rounded border border-[#c4c6cd] bg-white px-3 text-[13px] font-semibold text-[#041627]">
                    Reingresar stock
                    <input
                      type="checkbox"
                      checked={reingresarStock}
                      onChange={(event) => setReingresarStock(event.target.checked)}
                      className="h-4 w-4 accent-[#075E54]"
                    />
                  </label>
                </div>
                <div className="grid gap-2">
                  {destino === 'REEMBOLSO' ? (
                    <>
                      <select
                        value={medioPagoId}
                        onChange={(event) => setMedioPagoId(event.target.value)}
                        className="h-9 rounded border border-[#c4c6cd] bg-white px-2 text-[13px] outline-none focus:border-[#075E54]"
                      >
                        {mediosPago.map((medio) => (
                          <option key={medio.id} value={medio.id}>{medio.nombre}</option>
                        ))}
                      </select>
                      <input
                        value={referencia}
                        onChange={(event) => setReferencia(event.target.value)}
                        placeholder="Referencia"
                        className="h-9 rounded border border-[#c4c6cd] px-2 text-[13px] outline-none focus:border-[#075E54]"
                      />
                    </>
                  ) : (
                    <div className="rounded border border-[#e5e7eb] bg-[#f8fafc] px-3 py-2 text-[13px] text-[#44474c]">
                      {destino === 'SALDO_CUENTA'
                        ? 'El importe queda como saldo a favor del cliente.'
                        : 'Solo se emite la nota, sin movimiento de caja.'}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={crearNota}
                    disabled={!puedeCrearNota || mutations.crearNotaCredito.isPending || totalNota <= 0}
                    className="flex h-9 items-center justify-center gap-2 rounded bg-[#075E54] px-3 text-[13px] font-semibold text-white hover:bg-[#0b6d62] disabled:opacity-60"
                  >
                    {destino === 'REEMBOLSO' ? <CreditCard size={15} /> : <Plus size={15} />}
                    Crear nota
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex min-h-[420px] flex-col items-center justify-center gap-2 px-4 text-center text-[14px] text-[#44474c]">
              <PackagePlus size={24} />
              Seleccione una venta para cargar la devolucion.
            </div>
          )}
        </section>

        <section className="rounded-lg border border-[#c4c6cd] bg-white shadow-sm lg:col-span-2">
          <div className="flex items-center gap-2 border-b border-[#c4c6cd] px-4 py-3 text-[15px] font-bold text-[#041627]">
            <FileText size={17} className="text-[#075E54]" />
            Notas emitidas
          </div>
          <DataTable
            rows={notas}
            columns={notasColumns}
            getRowKey={(nota) => nota.id}
            isLoading={notasQuery.isLoading}
            loadingMessage="Cargando notas de credito..."
            emptyMessage="Sin notas de credito"
            getContextActions={(nota) => [
              {
                label: 'Imprimir',
                icon: <Printer size={14} />,
                onClick: () => imprimirComprobante(nota, 'Nota de credito'),
              },
              {
                label: 'Ver venta origen',
                icon: <FileText size={14} />,
                disabled: !nota.comprobante_origen_id,
                dividerBefore: true,
              },
            ]}
          />
        </section>
      </div>
    </div>
  );
};

export default NotasCreditoAuxPage;
