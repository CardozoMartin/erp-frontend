import { CreditCard, Loader2, QrCode, ReceiptText, Trash2 } from 'lucide-react';
import type { ICartItem, IClientePos, IComprobantePos, IListaPrecioPos, IMedioPago, PosAccessSubset } from '../../types/pos.type';
import type { PaymentDraft } from '../../utils/pos.utils';
import { formatCurrency, toNumber } from '../../utils/pos.utils';
import type { ICaja } from '../../../Cajas/types/caja.type';
import { PagosMixtos } from '../cajero/PagosMixtos';
import { BotonesMedioPago } from '../shared/BotonesMedioPago';
import { ResumenEnvioACaja } from '../shared/ResumenEnvioACaja';

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
  selectedCliente: IClientePos | null;
  selectedLista?: IListaPrecioPos;
  subtotal: number;
  medioPagoSugeridoId: string;
  isBusy: boolean;
  ventaCompletaIsPending: boolean;
  crearVentaQrIsPending: boolean;
  crearOrdenQrIsPending: boolean;
  crearCuentaCorrienteIsPending: boolean;
  crearPendienteIsPending: boolean;
  // Acciones
  onLimpiar: () => void;
  onCotizar: () => void;
  onEnviarACaja: () => void;
  onCargarCuentaCorriente: () => void;
  onFinalizar: () => void;
  onCobrarQrCarrito: () => void;
  onSeleccionarMedioPagoSugerido: (id: string) => void;
  onSeleccionarMedioPago: (id: string) => void;
  onAddPaymentDraft: () => void;
  onUpdatePaymentDraft: (id: string, patch: Partial<PaymentDraft>) => void;
  onRemovePaymentDraft: (id: string) => void;
  esSoloCajero: boolean;
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
  selectedCliente,
  selectedLista,
  subtotal,
  medioPagoSugeridoId,
  isBusy,
  ventaCompletaIsPending,
  crearVentaQrIsPending,
  crearOrdenQrIsPending,
  crearCuentaCorrienteIsPending,
  crearPendienteIsPending,
  onLimpiar,
  onCotizar,
  onEnviarACaja,
  onCargarCuentaCorriente,
  onFinalizar,
  onCobrarQrCarrito,
  onSeleccionarMedioPagoSugerido,
  onSeleccionarMedioPago,
  onAddPaymentDraft,
  onUpdatePaymentDraft,
  onRemovePaymentDraft,
  esSoloCajero,
  ventasPendientes,
  cobrarPendienteIsPending,
  onCobrarPendiente,
}: Props) => {
  const selectedPayment =
    selectedPaymentId === 'CUENTA_CORRIENTE'
      ? undefined
      : mediosPago.find(m => m.id === selectedPaymentId) ?? mediosPago[0];

  return (
    <div className="px-4 py-4 space-y-4">

      {/* Flujo separado (vendedor solo): panel de resumen con medio sugerido */}
      {usaFlujoSeparado && !esSoloCajero && posAccess.puedeCrearVentaPendiente ? (
        <>
          <ResumenEnvioACaja
            cartItems={cartItems}
            subtotal={subtotal}
            cliente={selectedCliente}
            selectedLista={selectedLista}
            mediosPago={mediosPago}
            medioPagoSugeridoId={medioPagoSugeridoId}
            puedeUsarCuentaCorriente={puedeUsarCuentaCorriente(selectedClienteId)}
            usaDespacho={usaDespacho}
            isBusy={isBusy}
            isPending={crearPendienteIsPending}
            puedeCrearVentaPendiente={posAccess.puedeCrearVentaPendiente}
            onSeleccionarMedioPago={onSeleccionarMedioPagoSugerido}
            onEnviar={onEnviarACaja}
          />

          {permiteCotizaciones && (
            <button
              type="button"
              onClick={onCotizar}
              disabled={isBusy || !cartItems.length || !posAccess.puedeVender}
              className="flex w-full items-center justify-center gap-2 rounded border border-[#c4c6cd] bg-white px-4 py-2.5 text-[13px] font-semibold text-[#041627] hover:bg-[#f4f5f6] disabled:opacity-60"
            >
              <ReceiptText size={15} />
              Cotizar
            </button>
          )}

          <button
            type="button"
            onClick={onLimpiar}
            className="flex w-full items-center justify-center gap-1.5 rounded border border-[#c4c6cd] bg-white px-4 py-2.5 text-[13px] font-medium text-[#44474c] hover:bg-[#f4f5f6]"
          >
            <Trash2 size={14} />
            Limpiar carrito
          </button>
        </>
      ) : null}

      {/* Flujo directo (vende y cobra): botones grandes de medio de pago */}
      {permiteCobroDirecto ? (
        <>
          {/* Pagos mixtos */}
          {muestraControlesCobro && permitePagoMixto ? (
            <div className="rounded border border-[#c4c6cd] bg-white">
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

          {/* Botones de medio de pago (reemplaza el select) */}
          {muestraControlesCobro && !permitePagoMixto ? (
            <div>
              <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-[#44474c]">
                Medio de pago
              </div>
              <BotonesMedioPago
                mediosPago={mediosPago}
                selectedPaymentId={selectedPaymentId}
                puedeUsarCuentaCorriente={puedeUsarCuentaCorriente(selectedClienteId)}
                onSeleccionar={onSeleccionarMedioPago}
                disabled={isBusy}
              />
            </div>
          ) : null}

          {/* Botones de acción: limpiar, cotizar, cobrar */}
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={onLimpiar}
              className="flex items-center justify-center gap-1.5 rounded border border-[#c4c6cd] bg-white px-4 py-3 text-[13px] font-medium text-[#041627] hover:bg-[#f4f5f6]"
            >
              <Trash2 size={14} />
              Limpiar
            </button>

            {permiteCotizaciones ? (
              <button
                type="button"
                onClick={onCotizar}
                disabled={isBusy || !cartItems.length || !posAccess.puedeVender}
                className="flex items-center justify-center gap-2 rounded border border-[#c4c6cd] bg-white px-4 py-3 text-[13px] font-semibold text-[#041627] hover:bg-[#f4f5f6] disabled:opacity-60"
              >
                <ReceiptText size={15} />
                Cotizar
              </button>
            ) : null}

            {puedeUsarCuentaCorriente(selectedClienteId) ? (
              <button
                type="button"
                onClick={onCargarCuentaCorriente}
                disabled={isBusy || !cartItems.length || !cajaAbierta}
                className="flex items-center justify-center gap-2 rounded bg-[#0f766e] px-4 py-3 text-[13px] font-semibold text-white hover:bg-[#115e59] disabled:opacity-60"
              >
                {crearCuentaCorrienteIsPending ? <Loader2 size={15} className="animate-spin" /> : <CreditCard size={15} />}
                Cta. corriente
              </button>
            ) : null}

            <button
              type="button"
              onClick={onFinalizar}
              disabled={isBusy || !cartItems.length || !cajaAbierta || !posAccess.puedeVenderYCobrar}
              className="flex items-center justify-center gap-2 rounded bg-[#075E54] px-4 py-3 text-[14px] font-semibold text-white hover:bg-[#0b6d62] disabled:opacity-60 sm:col-span-2"
            >
              {ventaCompletaIsPending ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
              Cobrar
            </button>

            {mercadoPagoDisponible ? (
              <button
                type="button"
                onClick={onCobrarQrCarrito}
                disabled={isBusy || !cartItems.length || !cajaAbierta || !posAccess.puedeVenderYCobrar}
                className="flex items-center justify-center gap-2 rounded bg-[#009EE3] px-4 py-3 text-[13px] font-semibold text-white hover:bg-[#0086c2] disabled:opacity-60 sm:col-span-2"
              >
                {crearVentaQrIsPending || crearOrdenQrIsPending ? <Loader2 size={15} className="animate-spin" /> : <QrCode size={15} />}
                Cobrar QR
              </button>
            ) : null}
          </div>
        </>
      ) : null}

      {/* Pendientes de cobro (solo cajero en flujo separado) */}
      {usaFlujoSeparado && esSoloCajero && posAccess.puedeCobrarPendiente ? (
        <div className="rounded border border-[#c4c6cd] bg-white">
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
