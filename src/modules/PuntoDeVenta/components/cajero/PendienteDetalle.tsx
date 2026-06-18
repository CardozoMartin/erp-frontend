import { ArrowRightLeft, CreditCard, Loader2, QrCode, XCircle } from 'lucide-react';
import { useState } from 'react';
import type { IComprobantePos, IMedioPago } from '../../types/pos.type';
import type { PaymentDraft } from '../../utils/pos.utils';
import { formatCurrency, toNumber } from '../../utils/pos.utils';
import type { ICaja } from '../../../Cajas/types/caja.type';
import { PagosMixtos } from './PagosMixtos';
import { useAsignarCajaPendiente } from '../../hooks/usePos';
import { useCajasAbiertas } from '../../../Cajas/hooks/useCaja';

interface Props {
  venta: IComprobantePos;
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
  onCobrar: (venta: IComprobantePos) => void;
  onCobrarQr: (venta: IComprobantePos) => void;
  onCancelar: (venta: IComprobantePos) => void;
  onLimpiarPagos: () => void;
  onAddPaymentDraft: () => void;
  onUpdatePaymentDraft: (id: string, patch: Partial<PaymentDraft>) => void;
  onRemovePaymentDraft: (id: string) => void;
  mostrarEnviarCaja?: boolean;
}

export const PendienteDetalle = ({
  venta,
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
  onCobrar,
  onCobrarQr,
  onCancelar,
  onLimpiarPagos,
  onAddPaymentDraft,
  onUpdatePaymentDraft,
  onRemovePaymentDraft,
  mostrarEnviarCaja = false,
}: Props) => {
  const [seleccionandoCaja, setSeleccionandoCaja] = useState(false);
  const asignarCajaMutation = useAsignarCajaPendiente();
  const cajasAbiertasQuery = useCajasAbiertas(mostrarEnviarCaja);
  const selectedPayment = mediosPago.find(m => m.id === selectedPaymentId) ?? mediosPago[0];

  return (
    <div className="flex flex-1 flex-col">

      {/* Encabezado — número, vendedor y hora */}
      <div className="border-b border-[#c4c6cd] px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[18px] font-bold text-[#041627]">{venta.numero}</div>
            <div className="mt-0.5 text-[12px] text-[#44474c]">
              {new Date(venta.created_at).toLocaleString('es-AR', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
            </div>
          </div>
          <span className="mt-0.5 shrink-0 rounded border border-[#cfe2de] bg-[#f3fbf9] px-2.5 py-1 text-[11px] font-semibold text-[#075E54]">
            {venta.estado.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Productos — solo lectura */}
      <div className="flex-1 overflow-auto border-b border-[#c4c6cd] p-3">
        <div className="space-y-1.5">
          {(venta.items ?? []).map(item => (
            <div
              key={item.id}
              className="grid grid-cols-[1fr_48px_100px] gap-2 rounded border border-[#e5e7eb] bg-[#f8fafc] px-3 py-2 text-[13px]"
            >
              <div className="min-w-0">
                <div className="truncate font-semibold text-[#041627]">{item.descripcion}</div>
                <div className="text-[11px] text-[#44474c]">{formatCurrency(toNumber(item.precio_unitario))} c/u</div>
              </div>
              <div className="text-center font-medium text-[#44474c]">x{toNumber(item.cantidad)}</div>
              <div className="text-right font-bold text-[#041627]">{formatCurrency(toNumber(item.subtotal))}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Total */}
      <div className="border-b border-[#c4c6cd] bg-[#f8fafc] px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-[#44474c]">Subtotal</span>
          <span className="text-[13px] text-[#44474c]">{formatCurrency(toNumber(venta.subtotal))}</span>
        </div>
        {toNumber(venta.descuento_total) > 0 && (
          <div className="mt-1 flex items-center justify-between">
            <span className="text-[13px] text-[#44474c]">Descuento</span>
            <span className="text-[13px] text-[#b42318]">− {formatCurrency(toNumber(venta.descuento_total))}</span>
          </div>
        )}
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[20px] font-bold text-[#041627]">Total</span>
          <span className="text-[24px] font-extrabold text-[#041627]">{formatCurrency(toNumber(venta.total))}</span>
        </div>
      </div>

      {/* Medio de pago */}
      {muestraControlesCobro && !permitePagoMixto && (
        <div className="border-b border-[#c4c6cd] px-4 py-3">
          <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-[#44474c]">Medio de pago</div>
          <div className="rounded border border-[#e5e7eb] bg-white px-3 py-2 text-[13px] text-[#041627]">
            {selectedPaymentId === 'CUENTA_CORRIENTE'
              ? 'Cuenta corriente'
              : (selectedPayment?.nombre ?? '—')}
          </div>
        </div>
      )}

      {/* Pagos mixtos */}
      {muestraControlesCobro && permitePagoMixto && (
        <PagosMixtos
          paymentDrafts={paymentDrafts}
          mediosPago={mediosPago}
          selectedPayment={selectedPayment}
          clienteId={venta.cliente_id}
          puedeUsarCuentaCorriente={puedeUsarCuentaCorriente}
          onAgregar={onAddPaymentDraft}
          onActualizar={onUpdatePaymentDraft}
          onQuitar={onRemovePaymentDraft}
        />
      )}

      {/* Selector de caja destino */}
      {mostrarEnviarCaja && seleccionandoCaja && (
        <div className="border-b border-[#c4c6cd] bg-[#f0f9f6] px-4 py-3">
          <div className="mb-2 text-[12px] font-bold uppercase tracking-wide text-[#075E54]">Seleccionar caja destino</div>
          <div className="flex flex-wrap gap-2">
            {(cajasAbiertasQuery.data ?? [])
              .filter(c => c.id !== cajaAbierta?.id)
              .map(caja => (
                <button
                  key={caja.id}
                  type="button"
                  onClick={() => asignarCajaMutation.mutate(
                    { ventaId: venta.id, cajaId: caja.id },
                    { onSuccess: () => setSeleccionandoCaja(false) },
                  )}
                  disabled={asignarCajaMutation.isPending}
                  className="rounded border border-[#075E54] bg-white px-3 py-1.5 text-[13px] font-medium text-[#075E54] hover:bg-[#e6f4f1] disabled:opacity-50"
                >
                  {`Caja ${caja.id.slice(0, 6)} — ${new Date(caja.fecha_apertura).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`}
                </button>
              ))}
            {(cajasAbiertasQuery.data ?? []).filter(c => c.id !== cajaAbierta?.id).length === 0 && (
              <span className="text-[13px] text-[#44474c]">No hay otras cajas abiertas</span>
            )}
          </div>
          <button type="button" onClick={() => setSeleccionandoCaja(false)} className="mt-2 text-[12px] text-[#44474c] underline">
            Cancelar
          </button>
        </div>
      )}

      {/* Botones de acción */}
      <div className="mt-auto grid gap-2 px-4 py-4" style={{ gridTemplateColumns: mercadoPagoDisponible ? '1fr 1fr 1fr' : '1fr 1fr' }}>
        {puedeCancelarVenta ? (
          <button
            type="button"
            onClick={() => onCancelar(venta)}
            disabled={isBusy}
            className="flex items-center justify-center gap-2 rounded border border-[#f1c7c7] bg-[#fff5f5] px-3 py-3 text-[13px] font-medium text-[#b42318] hover:bg-[#fdecec] disabled:opacity-60"
          >
            <XCircle size={15} />
            Cancelar
          </button>
        ) : (
          <button
            type="button"
            onClick={onLimpiarPagos}
            className="rounded border border-[#c4c6cd] bg-white px-3 py-3 text-[13px] font-medium text-[#041627] hover:bg-[#f4f5f6]"
          >
            Limpiar
          </button>
        )}

        <button
          type="button"
          onClick={() => onCobrar(venta)}
          disabled={isBusy || !cajaAbierta || !puedeCobrar}
          className="flex items-center justify-center gap-2 rounded bg-[#075E54] px-3 py-3 text-[13px] font-semibold text-white hover:bg-[#0b6d62] disabled:opacity-60"
        >
          {cobrarPendienteIsPending ? <Loader2 size={15} className="animate-spin" /> : <CreditCard size={15} />}
          Cobrar
        </button>

        {mercadoPagoDisponible && (
          <button
            type="button"
            onClick={() => onCobrarQr(venta)}
            disabled={isBusy || !cajaAbierta || !puedeCobrar}
            className="flex items-center justify-center gap-2 rounded bg-[#009EE3] px-3 py-3 text-[13px] font-semibold text-white hover:bg-[#0086c2] disabled:opacity-60"
          >
            {crearOrdenQrIsPending ? <Loader2 size={15} className="animate-spin" /> : <QrCode size={15} />}
            QR
          </button>
        )}

        {mostrarEnviarCaja && venta.estado === 'PENDIENTE_COBRO' && (
          <button
            type="button"
            onClick={() => setSeleccionandoCaja(prev => !prev)}
            disabled={isBusy || asignarCajaMutation.isPending}
            className="col-span-full flex items-center justify-center gap-2 rounded border border-[#075E54] bg-white px-3 py-2.5 text-[13px] font-medium text-[#075E54] hover:bg-[#e6f4f1] disabled:opacity-60"
          >
            {asignarCajaMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <ArrowRightLeft size={15} />}
            Enviar a otra caja
          </button>
        )}
      </div>
    </div>
  );
};
