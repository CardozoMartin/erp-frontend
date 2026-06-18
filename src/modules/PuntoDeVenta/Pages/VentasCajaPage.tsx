import {
  ArrowLeft,
  CreditCard,
  Loader2,
  ReceiptText,
  UserRound,
  Wallet,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import DataTable from '../../../components/common/DataTable';
import type { DataTableColumn } from '../../../components/common/DataTable';
import { useCajaAbierta, useVentasCaja } from '../hooks/usePos';
import type { IVentaCajaPos } from '../types/pos.type';

const formatCurrency = (value: number) =>
  value.toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  });

const toNumber = (value: unknown, fallback = 0) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
};

const formatDate = (value?: string) => {
  if (!value) return '-';
  return new Date(value).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getPagosResumen = (ventaCaja: IVentaCajaPos) => {
  if (!ventaCaja.pagos.length) return 'Sin pagos registrados';
  return ventaCaja.pagos
    .map((pago) => pago.medioPago?.nombre ?? pago.tipo.split('_').join(' '))
    .join(' + ');
};

const ventasColumns: DataTableColumn<IVentaCajaPos>[] = [
  {
    key: 'numero',
    header: 'Numero',
    render: (ventaCaja) => (
      <div>
        <div className="text-[14px] font-semibold text-[#041627]">{ventaCaja.venta.numero}</div>
        <div className="text-[12px] text-[#44474c]">{ventaCaja.venta.estado}</div>
      </div>
    ),
  },
  { key: 'fecha', header: 'Fecha', render: (ventaCaja) => formatDate(ventaCaja.venta.created_at) },
  { key: 'pago', header: 'Pago', render: (ventaCaja) => getPagosResumen(ventaCaja) },
  {
    key: 'total',
    header: 'Total',
    align: 'right',
    render: (ventaCaja) => (
      <span className="font-bold text-[#041627]">
        {formatCurrency(toNumber(ventaCaja.venta.total))}
      </span>
    ),
  },
];

const VentasCajaPage = () => {
  const cajaQuery = useCajaAbierta();
  const cajaAbierta = cajaQuery.data;
  const ventasQuery = useVentasCaja(cajaAbierta?.id);
  const ventas = ventasQuery.data ?? [];
  const [selectedVentaId, setSelectedVentaId] = useState<string | null>(null);

  const selectedVenta = useMemo(
    () => ventas.find((ventaCaja) => ventaCaja.venta.id === selectedVentaId) ?? ventas[0],
    [selectedVentaId, ventas],
  );

  const totalCaja = ventas.reduce((sum, ventaCaja) => sum + toNumber(ventaCaja.venta.total), 0);
  const totalCobrado = ventas.reduce(
    (sum, ventaCaja) =>
      sum +
      ventaCaja.pagos.reduce(
        (pagosSum, pago) => pagosSum + toNumber(pago.monto) + toNumber(pago.recargo_monto),
        0,
      ),
    0,
  );

  return (
    <div className="min-h-[calc(100vh-52px)] bg-[#f3f4f6] px-4 py-4">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              to="/punto-venta"
              className="inline-flex h-10 w-10 items-center justify-center rounded border border-[#c4c6cd] bg-white text-[#041627] hover:bg-[#f4f5f6]"
              title="Volver al POS"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-[22px] font-bold text-[#041627]">Ventas de esta caja</h1>
              <p className="text-[13px] text-[#44474c]">
                {cajaAbierta ? `Caja ${cajaAbierta.id.slice(0, 8)}` : 'No hay caja abierta'}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="rounded border border-[#c4c6cd] bg-white px-4 py-2">
              <div className="text-[11px] font-bold uppercase tracking-wide text-[#44474c]">
                Ventas
              </div>
              <div className="text-[18px] font-bold text-[#041627]">{ventas.length}</div>
            </div>
            <div className="rounded border border-[#c4c6cd] bg-white px-4 py-2">
              <div className="text-[11px] font-bold uppercase tracking-wide text-[#44474c]">
                Total ventas
              </div>
              <div className="text-[18px] font-bold text-[#041627]">
                {formatCurrency(totalCaja)}
              </div>
            </div>
            <div className="rounded border border-[#c4c6cd] bg-white px-4 py-2">
              <div className="text-[11px] font-bold uppercase tracking-wide text-[#44474c]">
                Cobrado
              </div>
              <div className="text-[18px] font-bold text-[#075E54]">
                {formatCurrency(totalCobrado)}
              </div>
            </div>
          </div>
        </div>

        {!cajaAbierta && !cajaQuery.isLoading ? (
          <section className="rounded-lg border border-[#c4c6cd] bg-white px-6 py-10 text-center shadow-sm">
            <Wallet size={30} className="mx-auto mb-3 text-[#b42318]" />
            <h2 className="text-[18px] font-semibold text-[#041627]">No hay caja abierta</h2>
            <p className="mt-1 text-[14px] text-[#44474c]">
              Abra una caja desde el POS para ver sus ventas.
            </p>
          </section>
        ) : null}

        {cajaQuery.isLoading || ventasQuery.isLoading ? (
          <section className="flex items-center justify-center gap-2 rounded-lg border border-[#c4c6cd] bg-white py-12 text-[14px] text-[#44474c] shadow-sm">
            <Loader2 size={17} className="animate-spin" />
            Cargando ventas de caja
          </section>
        ) : null}

        {cajaAbierta && !ventasQuery.isLoading ? (
          <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-lg border border-[#c4c6cd] bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-[#c4c6cd] px-4 py-3">
                <div className="flex items-center gap-2 text-[14px] font-semibold text-[#041627]">
                  <ReceiptText size={16} className="text-[#075E54]" />
                  Operaciones
                </div>
              </div>
              <div className="max-h-[640px] overflow-auto">
                <DataTable
                  rows={ventas}
                  columns={ventasColumns}
                  getRowKey={(ventaCaja) => ventaCaja.venta.id}
                  emptyMessage="Todavia no hay ventas en esta caja."
                  onRowClick={(ventaCaja) => setSelectedVentaId(ventaCaja.venta.id)}
                  rowClassName={(ventaCaja) =>
                    selectedVenta?.venta.id === ventaCaja.venta.id ? 'bg-[#eef8f6]' : ''
                  }
                  getContextActions={(ventaCaja) => [
                    {
                      label: 'Ver detalle',
                      icon: <ReceiptText size={14} />,
                      onClick: () => setSelectedVentaId(ventaCaja.venta.id),
                    },
                  ]}
                />
              </div>
            </div>

            <aside className="rounded-lg border border-[#c4c6cd] bg-white shadow-sm">
              {selectedVenta ? (
                <>
                  <div className="border-b border-[#c4c6cd] px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-[16px] font-bold text-[#041627]">
                          {selectedVenta.venta.numero}
                        </div>
                        <div className="text-[12px] text-[#44474c]">
                          {formatDate(selectedVenta.venta.created_at)}
                        </div>
                      </div>
                      <div className="rounded border border-[#cfe2de] bg-[#f3fbf9] px-3 py-1 text-[12px] font-semibold text-[#075E54]">
                        {selectedVenta.venta.estado}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 border-b border-[#c4c6cd] px-4 py-3 sm:grid-cols-2">
                    <div className="rounded border border-[#e5e7eb] bg-[#f8fafc] px-3 py-2">
                      <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wide text-[#44474c]">
                        <UserRound size={14} />
                        Vendedor
                      </div>
                      <div className="mt-1 truncate text-[14px] font-semibold text-[#041627]">
                        {selectedVenta.vendedor?.nombreCompleto ?? 'Sin vendedor'}
                      </div>
                    </div>
                    <div className="rounded border border-[#e5e7eb] bg-[#f8fafc] px-3 py-2">
                      <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wide text-[#44474c]">
                        <Wallet size={14} />
                        Cajero
                      </div>
                      <div className="mt-1 truncate text-[14px] font-semibold text-[#041627]">
                        {selectedVenta.cajero?.nombreCompleto ?? 'Sin cajero'}
                      </div>
                    </div>
                  </div>

                  <div className="border-b border-[#c4c6cd] px-4 py-3">
                    <div className="mb-2 text-[12px] font-bold uppercase tracking-wide text-[#44474c]">
                      Productos
                    </div>
                    <div className="space-y-2">
                      {(() => {
                        const devueltos = new Map<string, number>();
                        for (const nc of selectedVenta.notasCredito ?? []) {
                          for (const ncItem of nc.items ?? []) {
                            if (!ncItem.comprobante_item_origen_id) continue;
                            devueltos.set(
                              ncItem.comprobante_item_origen_id,
                              (devueltos.get(ncItem.comprobante_item_origen_id) ?? 0) + toNumber(ncItem.cantidad),
                            );
                          }
                        }
                        return selectedVenta.venta.items.map((item) => {
                          const devuelto = devueltos.get(item.id) ?? 0;
                          const neto = Math.max(0, toNumber(item.cantidad) - devuelto);
                          const todoDevuelto = neto === 0;
                          return (
                            <div
                              key={item.id}
                              className={`grid grid-cols-[1fr_60px_100px] gap-2 rounded border px-3 py-2 text-[13px] ${todoDevuelto ? 'border-[#f1c7c7] bg-[#fff5f5] opacity-60' : 'border-[#e5e7eb] bg-white'}`}
                            >
                              <div className="min-w-0">
                                <div className={`truncate font-semibold ${todoDevuelto ? 'text-[#b42318] line-through' : 'text-[#041627]'}`}>
                                  {item.descripcion}
                                  {devuelto > 0 && (
                                    <span className="ml-1.5 rounded bg-[#fff5f5] px-1 text-[10px] font-bold text-[#b42318]">
                                      -{devuelto} dev.
                                    </span>
                                  )}
                                </div>
                                <div className="text-[#44474c]">
                                  {formatCurrency(toNumber(item.precio_unitario))}
                                </div>
                              </div>
                              <div className={`text-center ${todoDevuelto ? 'text-[#b42318] line-through' : 'text-[#041627]'}`}>
                                x{todoDevuelto ? toNumber(item.cantidad) : neto}
                              </div>
                              <div className={`text-right font-semibold ${todoDevuelto ? 'text-[#b42318] line-through' : 'text-[#041627]'}`}>
                                {formatCurrency(todoDevuelto ? toNumber(item.subtotal) : neto * toNumber(item.precio_unitario))}
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                    {(selectedVenta.notasCredito ?? []).length > 0 && (
                      <div className="mt-3 space-y-1">
                        <div className="text-[11px] font-bold uppercase text-[#b42318]">Notas de crédito</div>
                        {selectedVenta.notasCredito.map((nc) => (
                          <div key={nc.id} className="flex items-center justify-between rounded border border-[#f1c7c7] bg-[#fff5f5] px-3 py-1.5 text-[12px]">
                            <span className="font-semibold text-[#b42318]">{nc.numero}</span>
                            <span className="font-bold text-[#b42318]">-{formatCurrency(toNumber(nc.subtotal))}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="border-b border-[#c4c6cd] px-4 py-3">
                    <div className="mb-2 flex items-center gap-2 text-[12px] font-bold uppercase tracking-wide text-[#44474c]">
                      <CreditCard size={14} />
                      Pagos
                    </div>
                    <div className="space-y-2">
                      {selectedVenta.pagos.map((pago) => (
                        <div
                          key={pago.id}
                          className="rounded border border-[#e5e7eb] bg-[#f8fafc] px-3 py-2"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-[13px] font-semibold text-[#041627]">
                              {pago.medioPago?.nombre ?? pago.tipo.split('_').join(' ')}
                            </span>
                            <span className="text-[14px] font-bold text-[#041627]">
                              {formatCurrency(toNumber(pago.monto))}
                            </span>
                          </div>
                          {pago.referencia ? (
                            <div className="mt-1 text-[12px] text-[#44474c]">
                              Ref. {pago.referencia}
                            </div>
                          ) : null}
                        </div>
                      ))}
                      {!selectedVenta.pagos.length ? (
                        <div className="rounded border border-dashed border-[#c4c6cd] px-3 py-4 text-center text-[13px] text-[#44474c]">
                          Sin pagos registrados.
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {(() => {
                    const totalNC = (selectedVenta.notasCredito ?? []).reduce(
                      (sum, nc) => sum + toNumber(nc.subtotal),
                      0,
                    );
                    const tieneNC = totalNC > 0;
                    return (
                      <div className="space-y-2 px-4 py-4">
                        <div className="flex items-center justify-between text-[14px] text-[#44474c]">
                          <span>Subtotal</span>
                          <span>{formatCurrency(toNumber(selectedVenta.venta.subtotal))}</span>
                        </div>
                        <div className="flex items-center justify-between text-[14px] text-[#44474c]">
                          <span>Descuento</span>
                          <span>{formatCurrency(toNumber(selectedVenta.venta.descuento_total))}</span>
                        </div>
                        {tieneNC && (
                          <div className="flex items-center justify-between text-[14px] text-[#b42318]">
                            <span>Notas de crédito</span>
                            <span>-{formatCurrency(totalNC)}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-[18px] font-bold text-[#041627]">
                          <span>Total</span>
                          <span>{formatCurrency(toNumber(selectedVenta.venta.total) - totalNC)}</span>
                        </div>
                      </div>
                    );
                  })()}
                </>
              ) : (
                <div className="px-4 py-10 text-center text-[14px] text-[#44474c]">
                  Seleccione una venta para ver el detalle.
                </div>
              )}
            </aside>
          </section>
        ) : null}
      </div>
    </div>
  );
};

export default VentasCajaPage;
