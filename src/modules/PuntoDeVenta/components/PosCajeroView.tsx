import { Clock, CreditCard, Loader2, QrCode, ReceiptText, Search, Trash2, XCircle } from 'lucide-react';
import type { IComprobantePos, IMedioPago } from '../types/pos.type';
import type { PaymentDraft } from '../utils/pos.utils';
import { formatCurrency, toNumber } from '../utils/pos.utils';
import type { ICaja } from '../../Cajas/types/caja.type';

interface Props {
  ventasPendientes: IComprobantePos[];
  pendingSearch: string;
  selectedPendienteId: string | null;
  selectedPendiente: IComprobantePos | null;
  totalPendiente: number;
  cajaAbierta: ICaja | null | undefined;
  mediosPago: IMedioPago[];
  paymentDrafts: PaymentDraft[];
  selectedPaymentId: string;
  permitePagoMixto: boolean;
  muestraControlesCobro: boolean;
  mercadoPagoDisponible: boolean;
  isBusy: boolean;
  puedeCobrar: boolean;
  puedeCancelarVenta: boolean;
  cobrarPendienteIsPending: boolean;
  crearOrdenQrIsPending: boolean;
  puedeUsarCuentaCorriente: (clienteId?: string | null) => boolean;
  onPendingSearchChange: (value: string) => void;
  onSelectPendiente: (id: string) => void;
  onCobrar: (venta: IComprobantePos) => void;
  onCobrarQr: (venta: IComprobantePos) => void;
  onCancelar: (venta: IComprobantePos) => void;
  onLimpiarPagos: () => void;
  onAddPaymentDraft: () => void;
  onUpdatePaymentDraft: (id: string, patch: Partial<PaymentDraft>) => void;
  onRemovePaymentDraft: (id: string) => void;
}

export default function PosCajeroView({
  ventasPendientes,
  pendingSearch,
  selectedPendienteId,
  selectedPendiente,
  totalPendiente,
  cajaAbierta,
  mediosPago,
  paymentDrafts,
  selectedPaymentId,
  permitePagoMixto,
  muestraControlesCobro,
  mercadoPagoDisponible,
  isBusy,
  puedeCobrar,
  puedeCancelarVenta,
  cobrarPendienteIsPending,
  crearOrdenQrIsPending,
  puedeUsarCuentaCorriente,
  onPendingSearchChange,
  onSelectPendiente,
  onCobrar,
  onCobrarQr,
  onCancelar,
  onLimpiarPagos,
  onAddPaymentDraft,
  onUpdatePaymentDraft,
  onRemovePaymentDraft,
}: Props) {
  const selectedPayment = mediosPago.find((m) => m.id === selectedPaymentId) ?? mediosPago[0];

  return (
    <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="border-b border-[#c4c6cd] lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between border-b border-[#c4c6cd] bg-[#fbf9fa] px-4 py-3">
          <div className="flex items-center gap-2 text-[14px] font-semibold text-[#041627]">
            <ReceiptText size={16} className="text-[#075E54]" />
            Ventas pendientes
          </div>
          <span className="rounded border border-[#cfe2de] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#075E54]">
            {ventasPendientes.length} pendientes
          </span>
        </div>

        <div className="border-b border-[#c4c6cd] bg-white px-3 py-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#44474c]" />
            <input
              type="text"
              value={pendingSearch}
              onChange={(event) => onPendingSearchChange(event.target.value)}
              placeholder="Buscar venta, estado o producto"
              className="h-9 w-full rounded border border-[#c4c6cd] bg-white pl-9 pr-3 text-[13px] text-[#041627] outline-none focus:border-[#075E54]"
            />
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-[12px]">
            <div className="rounded border border-[#e5e7eb] bg-[#f8fafc] px-3 py-2">
              <span className="block text-[#44474c]">Total pendiente</span>
              <strong className="text-[#041627]">{formatCurrency(totalPendiente)}</strong>
            </div>
            <div className="rounded border border-[#e5e7eb] bg-[#f8fafc] px-3 py-2">
              <span className="block text-[#44474c]">Caja destino</span>
              <strong className="text-[#041627]">
                {cajaAbierta ? cajaAbierta.id.slice(0, 8) : 'Sin caja'}
              </strong>
            </div>
          </div>
        </div>

        <div className="max-h-[650px] overflow-auto p-3">
          {!cajaAbierta ? (
            <div className="rounded border border-dashed border-[#c4c6cd] bg-white px-4 py-8 text-center text-[14px] text-[#44474c]">
              Abra una caja para cobrar ventas pendientes.
            </div>
          ) : ventasPendientes.length === 0 ? (
            <div className="rounded border border-dashed border-[#c4c6cd] bg-white px-4 py-8 text-center text-[14px] text-[#44474c]">
              No hay ventas pendientes de cobro.
            </div>
          ) : (
            <div className="space-y-2">
              {ventasPendientes.map((venta) => (
                <button
                  key={venta.id}
                  type="button"
                  onClick={() => onSelectPendiente(venta.id)}
                  className={`w-full rounded border px-3 py-3 text-left hover:bg-[#f8fafc] ${
                    selectedPendienteId === venta.id
                      ? 'border-[#075E54] bg-[#eef8f6]'
                      : 'border-[#e5e7eb] bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-[14px] font-bold text-[#041627]">{venta.numero}</div>
                      <div className="text-[12px] text-[#44474c]">
                        {venta.items?.length ?? 0} productos | {venta.estado}
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-[11px] text-[#44474c]">
                        <Clock size={12} />
                        {new Date(venta.created_at).toLocaleString('es-AR')}
                      </div>
                    </div>
                    <div className="text-right text-[15px] font-bold text-[#041627]">
                      {formatCurrency(toNumber(venta.total))}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <aside className="flex flex-col bg-white">
        <div className="border-b border-[#c4c6cd] bg-[#fbf9fa] px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[14px] font-semibold text-[#041627]">
              <CreditCard size={16} className="text-[#075E54]" />
              Cobro de venta
            </div>
            {selectedPendiente ? (
              <span className="rounded border border-[#cfe2de] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#075E54]">
                {selectedPendiente.estado}
              </span>
            ) : null}
          </div>
        </div>

        {selectedPendiente ? (
          <div className="flex flex-1 flex-col">
            <div className="border-b border-[#c4c6cd] px-4 py-3">
              <div className="text-[16px] font-bold text-[#041627]">{selectedPendiente.numero}</div>
              <div className="text-[12px] text-[#44474c]">
                Venta enviada por vendedor |{' '}
                {new Date(selectedPendiente.created_at).toLocaleString('es-AR')}
              </div>
            </div>

            <div className="grid gap-2 border-b border-[#c4c6cd] bg-[#fbfbfc] p-3 sm:grid-cols-3">
              <div className="rounded border border-[#e5e7eb] bg-white px-3 py-2">
                <div className="text-[11px] font-bold uppercase text-[#44474c]">Cliente</div>
                <div className="mt-1 truncate text-[13px] font-semibold text-[#041627]">
                  {selectedPendiente.cliente_id
                    ? selectedPendiente.cliente_id.slice(0, 8)
                    : 'Consumidor final'}
                </div>
              </div>
              <div className="rounded border border-[#e5e7eb] bg-white px-3 py-2">
                <div className="text-[11px] font-bold uppercase text-[#44474c]">Vendedor</div>
                <div className="mt-1 truncate text-[13px] font-semibold text-[#041627]">
                  {selectedPendiente.empleado_vendedor_id
                    ? selectedPendiente.empleado_vendedor_id.slice(0, 8)
                    : 'Sin vendedor'}
                </div>
              </div>
              <div className="rounded border border-[#e5e7eb] bg-white px-3 py-2">
                <div className="text-[11px] font-bold uppercase text-[#44474c]">Estado</div>
                <div className="mt-1 truncate text-[13px] font-semibold text-[#075E54]">
                  {selectedPendiente.estado}
                </div>
              </div>
            </div>

            <div className="max-h-[300px] overflow-auto border-b border-[#c4c6cd] p-3">
              <div className="space-y-2">
                {(selectedPendiente.items ?? []).map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-[1fr_64px_110px] gap-2 rounded border border-[#e5e7eb] bg-[#f8fafc] px-3 py-2 text-[13px]"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-[#041627]">{item.descripcion}</div>
                      <div className="text-[#44474c]">{formatCurrency(toNumber(item.precio_unitario))}</div>
                    </div>
                    <div className="text-center font-medium text-[#041627]">x{toNumber(item.cantidad)}</div>
                    <div className="text-right font-bold text-[#041627]">
                      {formatCurrency(toNumber(item.subtotal))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-b border-[#c4c6cd] px-4 py-4">
              <div className="flex items-center justify-between text-[14px] text-[#44474c]">
                <span>Subtotal</span>
                <span>{formatCurrency(toNumber(selectedPendiente.subtotal))}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-[20px] font-bold text-[#041627]">
                <span>Total a cobrar</span>
                <span>{formatCurrency(toNumber(selectedPendiente.total))}</span>
              </div>
            </div>

            {muestraControlesCobro && !permitePagoMixto ? (
              <div className="border-b border-[#c4c6cd] px-4 py-4">
                <div className="mb-1 text-[12px] font-bold uppercase tracking-wide text-[#44474c]">
                  Cobro
                </div>
                <div className="rounded border border-[#e5e7eb] bg-[#f8fafc] px-3 py-2 text-[13px] text-[#041627]">
                  Se cobrara con{' '}
                  {selectedPaymentId === 'CUENTA_CORRIENTE'
                    ? 'cuenta corriente'
                    : (selectedPayment?.nombre ?? 'medio de pago seleccionado')}{' '}
                  por <strong>{formatCurrency(toNumber(selectedPendiente.total))}</strong>.
                </div>
              </div>
            ) : null}

            {muestraControlesCobro && permitePagoMixto ? (
              <div className="border-b border-[#c4c6cd] px-4 py-4">
                <div className="mb-2 text-[12px] font-bold uppercase tracking-wide text-[#44474c]">
                  Pagos
                </div>
                <div className="space-y-2">
                  {paymentDrafts.map((draft) => (
                    <div key={draft.id} className="grid gap-2 md:grid-cols-[1fr_120px_1fr_34px]">
                      <select
                        value={draft.medioPagoId || selectedPayment?.id || ''}
                        onChange={(event) => onUpdatePaymentDraft(draft.id, { medioPagoId: event.target.value })}
                        className="h-9 rounded border border-[#c4c6cd] bg-white px-2 text-[13px] outline-none focus:border-[#075E54]"
                      >
                        {puedeUsarCuentaCorriente(selectedPendiente.cliente_id) ? (
                          <option value="CUENTA_CORRIENTE">Cuenta corriente</option>
                        ) : null}
                        {mediosPago.map((method) => (
                          <option key={method.id} value={method.id}>{method.nombre}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min={0}
                        value={draft.monto}
                        onChange={(event) => onUpdatePaymentDraft(draft.id, { monto: event.target.value })}
                        placeholder="Monto"
                        className="h-9 rounded border border-[#c4c6cd] px-2 text-[13px] outline-none focus:border-[#075E54]"
                      />
                      <input
                        value={draft.referencia}
                        onChange={(event) => onUpdatePaymentDraft(draft.id, { referencia: event.target.value })}
                        placeholder="Referencia"
                        className="h-9 rounded border border-[#c4c6cd] px-2 text-[13px] outline-none focus:border-[#075E54]"
                      />
                      <button
                        type="button"
                        onClick={() => onRemovePaymentDraft(draft.id)}
                        className="inline-flex h-9 items-center justify-center rounded border border-[#f1c7c7] bg-[#fff5f5] text-[#b42318] hover:bg-[#fdecec]"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={onAddPaymentDraft}
                  className="mt-3 rounded border border-[#c4c6cd] bg-white px-3 py-2 text-[12px] font-semibold text-[#041627] hover:bg-[#f4f5f6]"
                >
                  Agregar pago
                </button>
              </div>
            ) : null}

            <div className="mt-auto grid gap-3 px-4 py-4 sm:grid-cols-3">
              {puedeCancelarVenta ? (
                <button
                  type="button"
                  onClick={() => onCancelar(selectedPendiente)}
                  disabled={isBusy}
                  className="flex items-center justify-center gap-2 rounded border border-[#f1c7c7] bg-[#fff5f5] px-4 py-3 text-[14px] font-medium text-[#b42318] hover:bg-[#fdecec] disabled:opacity-60"
                >
                  <XCircle size={16} />
                  Cancelar pendiente
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onLimpiarPagos}
                  className="rounded border border-[#c4c6cd] bg-white px-4 py-3 text-[14px] font-medium text-[#041627] hover:bg-[#f4f5f6]"
                >
                  Limpiar pagos
                </button>
              )}
              <button
                type="button"
                onClick={() => onCobrar(selectedPendiente)}
                disabled={isBusy || !cajaAbierta || !puedeCobrar}
                className="flex items-center justify-center gap-2 rounded bg-[#075E54] px-4 py-3 text-[14px] font-semibold text-white hover:bg-[#0b6d62] disabled:opacity-60"
              >
                {cobrarPendienteIsPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <CreditCard size={16} />
                )}
                Cobrar venta
              </button>
              {mercadoPagoDisponible ? (
                <button
                  type="button"
                  onClick={() => onCobrarQr(selectedPendiente)}
                  disabled={isBusy || !cajaAbierta || !puedeCobrar}
                  className="flex items-center justify-center gap-2 rounded bg-[#0f766e] px-4 py-3 text-[14px] font-semibold text-white hover:bg-[#115e59] disabled:opacity-60"
                >
                  {crearOrdenQrIsPending ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <QrCode size={16} />
                  )}
                  Cobrar QR
                </button>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center px-4 py-12 text-center text-[14px] text-[#44474c]">
            Seleccione una venta pendiente para ver el detalle y cobrar.
          </div>
        )}
      </aside>
    </div>
  );
}
