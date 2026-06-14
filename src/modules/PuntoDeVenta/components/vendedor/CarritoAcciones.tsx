import { CreditCard, Loader2, QrCode, ReceiptText, Send, Trash2 } from 'lucide-react';
import type { ICartItem, IComprobantePos, IMedioPago, PosAccessSubset } from '../../types/pos.type';
import type { PaymentDraft } from '../../utils/pos.utils';
import { formatCurrency, toNumber } from '../../utils/pos.utils';
import type { ICaja } from '../../../Cajas/types/caja.type';
import { PagosMixtos } from '../cajero/PagosMixtos';

interface Props {
  cartItems: ICartItem[];
  mediosPago: IMedioPago[];
  selectedPaymentId: string;
  paymentDrafts: PaymentDraft[];
  cajaAbierta: ICaja | null | undefined;
  posAccess: PosAccessSubset;
  permitePagoMixto: boolean;
  muestraControlesCobro: boolean;
  permiteCobroDirecto: boolean;
  usaFlujoSeparado: boolean;
  usaDespacho: boolean;
  permiteCotizaciones: boolean;
  mercadoPagoDisponible: boolean;
  puedeUsarCuentaCorriente: (clienteId?: string | null) => boolean;
  selectedClienteId: string;
  isBusy: boolean;
  ventaCompletaIsPending: boolean;
  crearVentaQrIsPending: boolean;
  crearOrdenQrIsPending: boolean;
  crearCuentaCorrienteIsPending: boolean;
  // Acciones
  onLimpiar: () => void;
  onCotizar: () => void;
  onEnviarACaja: () => void;
  onCargarCuentaCorriente: () => void;
  onFinalizar: () => void;
  onCobrarQrCarrito: () => void;
  onAddPaymentDraft: () => void;
  onUpdatePaymentDraft: (id: string, patch: Partial<PaymentDraft>) => void;
  onRemovePaymentDraft: (id: string) => void;
  // Pendientes de cobro (flujo separado)
  ventasPendientes: IComprobantePos[];
  cobrarPendienteIsPending: boolean;
  onCobrarPendiente: (venta: IComprobantePos) => void;
}

export const CarritoAcciones = ({
  cartItems,
  mediosPago,
  selectedPaymentId,
  paymentDrafts,
  cajaAbierta,
  posAccess,
  permitePagoMixto,
  muestraControlesCobro,
  permiteCobroDirecto,
  usaFlujoSeparado,
  usaDespacho,
  permiteCotizaciones,
  mercadoPagoDisponible,
  puedeUsarCuentaCorriente,
  selectedClienteId,
  isBusy,
  ventaCompletaIsPending,
  crearVentaQrIsPending,
  crearOrdenQrIsPending,
  crearCuentaCorrienteIsPending,
  onLimpiar,
  onCotizar,
  onEnviarACaja,
  onCargarCuentaCorriente,
  onFinalizar,
  onCobrarQrCarrito,
  onAddPaymentDraft,
  onUpdatePaymentDraft,
  onRemovePaymentDraft,
  ventasPendientes,
  cobrarPendienteIsPending,
  onCobrarPendiente,
}: Props) => {
  const selectedPayment =
    selectedPaymentId === 'CUENTA_CORRIENTE'
      ? undefined
      : mediosPago.find(m => m.id === selectedPaymentId) ?? mediosPago[0];

  return (
    <div className="px-4 py-4">
      {/* Pagos mixtos */}
      {muestraControlesCobro && permitePagoMixto ? (
        <div className="mb-4 rounded border border-[#c4c6cd] bg-white">
          <div className="flex items-center justify-between border-b border-[#c4c6cd] px-3 py-2">
            <span className="text-[12px] font-bold uppercase tracking-wide text-[#44474c]">Pagos</span>
            <button
              type="button"
              onClick={onAddPaymentDraft}
              className="rounded border border-[#c4c6cd] bg-white px-2 py-1 text-[12px] font-semibold text-[#041627] hover:bg-[#f4f5f6]"
            >
              Agregar pago
            </button>
          </div>
          <div className="p-3">
            <PagosMixtos
              paymentDrafts={paymentDrafts}
              mediosPago={mediosPago}
              selectedPayment={selectedPayment}
              clienteId={selectedClienteId}
              puedeUsarCuentaCorriente={puedeUsarCuentaCorriente}
              onAgregar={onAddPaymentDraft}
              onActualizar={onUpdatePaymentDraft}
              onQuitar={onRemovePaymentDraft}
            />
          </div>
        </div>
      ) : null}

      {/* Botones de acción */}
      <div className="grid gap-3 sm:grid-cols-5">
        <button
          type="button"
          onClick={onLimpiar}
          className="flex items-center justify-center gap-1 rounded border border-[#c4c6cd] bg-white px-4 py-3 text-[14px] font-medium text-[#041627] hover:bg-[#f4f5f6]"
        >
          <Trash2 size={15} />
          Limpiar
        </button>

        {permiteCotizaciones ? (
          <button
            type="button"
            onClick={onCotizar}
            disabled={isBusy || !cartItems.length || !posAccess.puedeVender}
            className="flex items-center justify-center gap-2 rounded border border-[#c4c6cd] bg-white px-4 py-3 text-[14px] font-semibold text-[#041627] hover:bg-[#f4f5f6] disabled:opacity-60"
          >
            <ReceiptText size={16} />
            Cotizar
          </button>
        ) : null}

        {usaFlujoSeparado ? (
          <button
            type="button"
            onClick={onEnviarACaja}
            disabled={isBusy || !cartItems.length || !posAccess.puedeCrearVentaPendiente}
            className="flex items-center justify-center gap-2 rounded bg-[#075E54] px-4 py-3 text-[14px] font-semibold text-white hover:bg-[#0b6d62] disabled:opacity-60"
          >
            <Send size={16} />
            {usaDespacho ? 'Enviar a cobro' : 'Enviar a caja'}
          </button>
        ) : null}

        {usaFlujoSeparado && puedeUsarCuentaCorriente(selectedClienteId) ? (
          <button
            type="button"
            onClick={onCargarCuentaCorriente}
            disabled={isBusy || !cartItems.length || !posAccess.puedeCrearVentaPendiente}
            className="flex items-center justify-center gap-2 rounded bg-[#0f766e] px-4 py-3 text-[14px] font-semibold text-white hover:bg-[#115e59] disabled:opacity-60"
          >
            {crearCuentaCorrienteIsPending ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
            Cuenta corriente
          </button>
        ) : null}

        {permiteCobroDirecto ? (
          <button
            type="button"
            onClick={onFinalizar}
            disabled={isBusy || !cartItems.length || !cajaAbierta || !posAccess.puedeVenderYCobrar}
            className="flex items-center justify-center gap-2 rounded bg-[#075E54] px-4 py-3 text-[14px] font-semibold text-white hover:bg-[#0b6d62] disabled:opacity-60"
          >
            {ventaCompletaIsPending ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
            {usaDespacho ? 'Cobrar y despachar' : 'Cobrar'}
          </button>
        ) : null}

        {permiteCobroDirecto && mercadoPagoDisponible ? (
          <button
            type="button"
            onClick={onCobrarQrCarrito}
            disabled={isBusy || !cartItems.length || !cajaAbierta || !posAccess.puedeVenderYCobrar}
            className="flex items-center justify-center gap-2 rounded bg-[#0f766e] px-4 py-3 text-[14px] font-semibold text-white hover:bg-[#115e59] disabled:opacity-60"
          >
            {crearVentaQrIsPending || crearOrdenQrIsPending ? <Loader2 size={16} className="animate-spin" /> : <QrCode size={16} />}
            Cobrar QR
          </button>
        ) : null}
      </div>

      {/* Pendientes de cobro (solo flujo separado con cajero) */}
      {usaFlujoSeparado && posAccess.puedeCobrarPendiente ? (
        <div className="mt-4 rounded border border-[#c4c6cd] bg-white">
          <div className="flex items-center justify-between border-b border-[#c4c6cd] px-4 py-2">
            <span className="text-[12px] font-bold uppercase tracking-wide text-[#44474c]">Pendientes de cobro</span>
            <ReceiptText size={15} className="text-[#075E54]" />
          </div>
          <div className="max-h-[190px] overflow-auto px-3 py-3">
            {ventasPendientes.length === 0 ? (
              <div className="rounded border border-dashed border-[#c4c6cd] px-3 py-5 text-center text-[13px] text-[#44474c]">
                Sin ventas pendientes
              </div>
            ) : (
              <div className="space-y-2">
                {ventasPendientes.map(venta => (
                  <div
                    key={venta.id}
                    className="flex items-center justify-between gap-3 rounded border border-[#e5e7eb] bg-[#f8fafc] px-3 py-2"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-semibold text-[#041627]">{venta.numero}</div>
                      <div className="text-[12px] text-[#44474c]">{formatCurrency(toNumber(venta.total))}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onCobrarPendiente(venta)}
                      disabled={cobrarPendienteIsPending || !posAccess.puedeCobrarPendiente}
                      className="rounded bg-[#075E54] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[#0b6d62] disabled:opacity-60"
                    >
                      Cobrar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};
