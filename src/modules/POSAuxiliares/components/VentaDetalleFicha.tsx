import { Banknote, CreditCard, Landmark, Printer, Smartphone, Wallet } from 'lucide-react';
import type { IComprobanteAux, IVentaGeneralAux } from '../types/pos-aux.type';
import { dateTime, money, shortId, toNumber } from '../utils/format';

type Props = {
  venta: IVentaGeneralAux;
  /** Reimprime una nota de credito ya emitida */
  onImprimirNota?: (nota: IComprobanteAux) => void;
};

const calcularDevueltosPorItem = (notasCredito: IComprobanteAux[]): Map<string, number> => {
  const mapa = new Map<string, number>();
  for (const nota of notasCredito) {
    for (const item of nota.items ?? []) {
      if (!item.comprobante_item_origen_id) continue;
      mapa.set(
        item.comprobante_item_origen_id,
        (mapa.get(item.comprobante_item_origen_id) ?? 0) + toNumber(item.cantidad),
      );
    }
  }
  return mapa;
};

const iconoMedioPago = (nombre: string) => {
  const n = nombre.toLowerCase();
  if (n.includes('efectivo')) return Banknote;
  if (n.includes('transferencia') || n.includes('banco')) return Landmark;
  if (n.includes('qr') || n.includes('mercado')) return Smartphone;
  if (n.includes('tarjeta') || n.includes('credito') || n.includes('debito')) return CreditCard;
  return Wallet;
};

/** Iniciales del cliente para el avatar del bloque inferior. */
const iniciales = (nombre: string) =>
  nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? '')
    .join('') || '?';

const VentaDetalleFicha = ({ venta, onImprimirNota }: Props) => {
  const comprobante = venta.comprobante;
  const devueltosPorItem = calcularDevueltosPorItem(venta.notasCredito);
  const pagosTotal = venta.pagos.reduce(
    (sum, pago) => sum + toNumber(pago.monto) + toNumber(pago.recargo_monto),
    0,
  );
  const totalNotasCredito = venta.notasCredito.reduce(
    (sum, nc) => sum + toNumber(nc.subtotal),
    0,
  );
  const descuento = toNumber(comprobante.descuento_total);
  const nombreCliente = comprobante.cliente_nombre ?? 'Consumidor final';

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
      {/* ── Izquierda: productos ──────────────────────────────────────── */}
      <section className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white">
        <div className="flex items-center justify-between border-b border-[#e5e7eb] bg-[#f5f7fc] px-5 py-4">
          <h2 className="text-[18px] font-bold text-[#041627]">Productos</h2>
          <span className="text-[12.5px] font-medium text-[#64748b]">
            {(comprobante.items ?? []).length} referencia
            {(comprobante.items ?? []).length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-160 border-collapse text-[13.5px]">
            <thead>
              <tr className="border-b border-[#e5e7eb] text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
                <th className="px-5 py-3 text-left">Producto</th>
                <th className="px-3 py-3 text-center">Cant.</th>
                <th className="px-3 py-3 text-right">Precio unit.</th>
                <th className="px-5 py-3 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {(comprobante.items ?? []).map((item) => {
                const devuelto = devueltosPorItem.get(item.id) ?? 0;
                const cantNeta = Math.max(0, toNumber(item.cantidad) - devuelto);
                const todoDevuelto = cantNeta === 0;

                return (
                  <tr
                    key={item.id}
                    className={`border-b border-[#eef1f6] transition-colors last:border-b-0 hover:bg-[#f8fafc] ${
                      todoDevuelto ? 'opacity-55' : ''
                    }`}
                  >
                    <td className="px-5 py-4">
                      <div
                        className={`font-semibold text-[#041627] ${
                          todoDevuelto ? 'line-through' : ''
                        }`}
                      >
                        {item.descripcion}
                      </div>
                      {devuelto > 0 && (
                        <span className="mt-1 inline-block rounded-md bg-[#fff5f5] px-2 py-0.5 text-[10.5px] font-bold text-[#b42318]">
                          {devuelto} devuelto{devuelto > 1 ? 's' : ''}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-4 text-center text-[#475569]">
                      {devuelto > 0 ? (
                        <span>
                          {cantNeta}{' '}
                          <span className="text-[11.5px] text-[#94a3b8] line-through">
                            ({toNumber(item.cantidad)})
                          </span>
                        </span>
                      ) : (
                        toNumber(item.cantidad)
                      )}
                    </td>
                    <td className="px-3 py-4 text-right text-[#475569]">
                      {money(item.precio_unitario)}
                    </td>
                    <td className="px-5 py-4 text-right font-bold text-[#041627]">
                      {todoDevuelto ? (
                        <span className="text-[#b42318] line-through">{money(item.subtotal)}</span>
                      ) : devuelto > 0 ? (
                        money(cantNeta * toNumber(item.precio_unitario))
                      ) : (
                        money(item.subtotal)
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Derecha: resumen, pagos, datos ────────────────────────────── */}
      <aside className="flex flex-col gap-5">
        {/* Resumen */}
        <section className="rounded-xl border border-[#e5e7eb] bg-white p-5">
          <h2 className="mb-4 border-b border-[#e5e7eb] pb-3 text-[18px] font-bold text-[#041627]">
            Resumen
          </h2>
          <dl className="space-y-2.5 text-[13.5px]">
            <div className="flex items-center justify-between">
              <dt className="text-[#475569]">Subtotal</dt>
              <dd className="font-medium text-[#041627]">{money(comprobante.subtotal)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-[#475569]">IVA estimado</dt>
              <dd className="font-medium text-[#041627]">{money(venta.margen.iva_estimado)}</dd>
            </div>
            {descuento > 0 && (
              <div className="flex items-center justify-between">
                <dt className="text-[#475569]">Descuento</dt>
                <dd className="font-medium text-[#b42318]">− {money(descuento)}</dd>
              </div>
            )}
            {totalNotasCredito > 0 && (
              <div className="flex items-center justify-between">
                <dt className="text-[#475569]">Notas de crédito</dt>
                <dd className="font-medium text-[#b42318]">− {money(totalNotasCredito)}</dd>
              </div>
            )}
          </dl>

          <div className="mt-4 flex items-baseline justify-between border-t border-[#e5e7eb] pt-4">
            <span className="text-[22px] font-bold text-[#041627]">Total</span>
            <span className="text-[26px] font-extrabold tracking-tight text-[#041627]">
              {money(toNumber(comprobante.total) - totalNotasCredito)}
            </span>
          </div>

          {/* Margen: dato interno, no va en el comprobante del cliente */}
          <div className="mt-4 grid grid-cols-2 gap-2 border-t border-[#eef1f6] pt-3 text-[12px]">
            <div>
              <span className="block text-[#64748b]">Costo estimado</span>
              <strong className="text-[#041627]">{money(venta.margen.costo_total)}</strong>
            </div>
            <div className="text-right">
              <span className="block text-[#64748b]">Ganancia</span>
              <strong className="text-[#075E54]">
                {money(venta.margen.ganancia_total)} ({venta.margen.margen_porcentaje.toFixed(1)}%)
              </strong>
            </div>
          </div>
        </section>

        {/* Pagos */}
        <section className="rounded-xl border border-[#e5e7eb] bg-white p-5">
          <h2 className="mb-4 border-b border-[#e5e7eb] pb-3 text-[18px] font-bold text-[#041627]">
            Pagos
          </h2>

          {venta.pagos.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[#dbe0e6] px-3 py-5 text-center text-[13px] text-[#64748b]">
              Sin pagos registrados.
            </div>
          ) : (
            <div className="space-y-2">
              {venta.pagos.map((pago) => {
                const nombre = pago.medioPago?.nombre ?? pago.tipo;
                const Icono = iconoMedioPago(nombre);
                return (
                  <div
                    key={pago.id}
                    className="flex items-center gap-3 rounded-lg bg-[#f5f7fc] px-3.5 py-3"
                  >
                    <Icono size={19} className="shrink-0 text-[#475569]" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13.5px] font-semibold text-[#041627]">
                        {nombre}
                      </div>
                      <div className="text-[12px] text-[#64748b]">
                        {dateTime(pago.created_at)}
                      </div>
                    </div>
                    <span className="shrink-0 text-[14px] font-bold text-[#041627]">
                      {money(toNumber(pago.monto) + toNumber(pago.recargo_monto))}
                    </span>
                  </div>
                );
              })}

              {venta.pagos.length > 1 && (
                <div className="flex items-center justify-between border-t border-[#eef1f6] pt-2.5 text-[13.5px]">
                  <span className="font-semibold text-[#475569]">Total cobrado</span>
                  <span className="font-bold text-[#041627]">{money(pagosTotal)}</span>
                </div>
              )}
            </div>
          )}

          {/* Notas de credito emitidas sobre esta venta */}
          {venta.notasCredito.length > 0 && (
            <div className="mt-4 border-t border-[#eef1f6] pt-3">
              <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#b42318]">
                Notas de crédito
              </div>
              <div className="space-y-1.5">
                {venta.notasCredito.map((nc) => (
                  <div
                    key={nc.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-[#f1c7c7] bg-[#fff5f5] px-3 py-2 text-[12.5px]"
                  >
                    <span className="font-semibold text-[#b42318]">{nc.numero}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#b42318]">− {money(nc.subtotal)}</span>
                      {onImprimirNota && (
                        <button
                          type="button"
                          onClick={() => onImprimirNota(nc)}
                          title={`Imprimir ${nc.numero}`}
                          className="rounded-md border border-[#f1c7c7] bg-white p-1.5 text-[#b42318] transition-colors hover:bg-[#fdecec]"
                        >
                          <Printer size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Cliente y datos de la operacion */}
        <section className="rounded-xl border border-[#e5e7eb] bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#e8ecf7] text-[15px] font-bold text-[#475569]">
              {iniciales(nombreCliente)}
            </div>
            <div className="min-w-0">
              <div className="truncate text-[17px] font-bold text-[#041627]">{nombreCliente}</div>
              {comprobante.cliente_cuit && (
                <div className="text-[12.5px] text-[#64748b]">
                  CUIT: {comprobante.cliente_cuit}
                </div>
              )}
            </div>
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-3 border-t border-[#eef1f6] pt-4 text-[12.5px]">
            <Dato label="Vendedor" valor={venta.vendedor?.nombreCompleto ?? '—'} />
            <Dato label="Cajero" valor={venta.cajero?.nombreCompleto ?? '—'} />
            <Dato label="Lista precio" valor={venta.listaPrecio?.nombre ?? 'Precio base'} />
            <Dato label="Caja" valor={shortId(comprobante.caja_id)} />
            <Dato
              label="Comprobantes fiscales"
              valor={venta.fiscales.length ? String(venta.fiscales.length) : 'No emitidos'}
            />
            <Dato
              label="Notas de crédito"
              valor={venta.notasCredito.length ? String(venta.notasCredito.length) : 'Ninguna'}
            />
          </dl>
        </section>
      </aside>
    </div>
  );
};

const Dato = ({ label, valor }: { label: string; valor: string }) => (
  <div className="min-w-0">
    <dt className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">{label}</dt>
    <dd className="mt-0.5 truncate font-semibold text-[#041627]">{valor}</dd>
  </div>
);

export default VentaDetalleFicha;
