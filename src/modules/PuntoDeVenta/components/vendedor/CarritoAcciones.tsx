import { useState } from 'react';
import { CreditCard, Loader2, QrCode, ReceiptText, Trash2, Truck } from 'lucide-react';
import { usePedidosEnvioMutations } from '../../../PedidosEnvio/hooks/usePedidosEnvio';
import type { CrearPedidoEnvioPayload } from '../../../PedidosEnvio/types/pedido-envio.type';
import { ModalEnvio } from '../shared/ModalEnvio';
import type { ICartItem, IClientePos, IComprobantePos, IListaPrecioPos, IMedioPago, PosAccessSubset } from '../../types/pos.type';
import type { PaymentDraft } from '../../utils/pos.utils';
import { formatCurrency, toNumber } from '../../utils/pos.utils';
import type { ICaja } from '../../../Cajas/types/caja.type';
import { ModalCobro } from '../shared/ModalCobro';
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
  /** La sucursal habilito envios a domicilio en la configuracion del POS */
  permiteEnvios: boolean;
  /** Necesarios para elegir a quien se le entrega el pedido */
  clientes: IClientePos[];
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
  permiteEnvios,
  clientes,
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
  const [modalCobroAbierto, setModalCobroAbierto] = useState(false);
  const [modalEnvioAbierto, setModalEnvioAbierto] = useState(false);
  const crearPedidoEnvio = usePedidosEnvioMutations().crear;

  // El pedido nace de los productos que ya estan en el carrito: el modal solo
  // pide los datos de entrega, no vuelve a cargar la mercaderia.
  const manejarConfirmarEnvio = (
    datos: Omit<CrearPedidoEnvioPayload, 'caja_id'>,
  ) => {
    if (!cajaAbierta) return;
    crearPedidoEnvio.mutate(
      { ...datos, caja_id: cajaAbierta.id },
      {
        onSuccess: () => {
          setModalEnvioAbierto(false);
          onLimpiar();
        },
      },
    );
  };

  // El modal se cierra solo cuando la venta se concreta: mientras la mutacion
  // esta en vuelo se deja abierto para que el cajero vea el spinner.
  const manejarConfirmarCobro = () => {
    onFinalizar();
    setModalCobroAbierto(false);
  };

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

      {/* Flujo directo (vende y cobra) */}
      {permiteCobroDirecto ? (
        <>
          {/* El medio de pago, el importe recibido y el vuelto se eligen en el
              modal de cobro: el panel lateral es angosto y el cajero necesita
              ver el vuelto grande. Aca queda solo el disparador. */}

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
              onClick={() => setModalCobroAbierto(true)}
              disabled={
                isBusy ||
                !cartItems.length ||
                !cajaAbierta ||
                !posAccess.puedeVenderYCobrar ||
                !muestraControlesCobro
              }
              className="flex items-center justify-center gap-2 rounded bg-[#075E54] px-4 py-3 text-[14px] font-semibold text-white hover:bg-[#0b6d62] disabled:opacity-60 sm:col-span-2"
            >
              {ventaCompletaIsPending ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
              Cobrar
            </button>

            {/* Envio a domicilio: el carrito ya armado se convierte en pedido
                sin salir del POS. Solo si la sucursal habilito envios. */}
            {permiteEnvios ? (
              <button
                type="button"
                onClick={() => setModalEnvioAbierto(true)}
                disabled={isBusy || !cartItems.length || !cajaAbierta || !posAccess.puedeVender}
                className="flex items-center justify-center gap-2 rounded border border-[#cfe2de] bg-[#f3fbf9] px-4 py-3 text-[13px] font-semibold text-[#075E54] hover:bg-[#eef8f6] disabled:opacity-60 sm:col-span-2"
              >
                <Truck size={15} />
                Enviar a domicilio
              </button>
            ) : null}

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

      <ModalCobro
        abierto={modalCobroAbierto}
        total={subtotal}
        mediosPago={mediosPago}
        selectedPaymentId={selectedPaymentId}
        puedeUsarCuentaCorriente={puedeUsarCuentaCorriente(selectedClienteId)}
        permitePagoMixto={permitePagoMixto}
        paymentDrafts={paymentDrafts}
        isPending={ventaCompletaIsPending}
        onSeleccionarMedioPago={onSeleccionarMedioPago}
        onAddPaymentDraft={onAddPaymentDraft}
        onUpdatePaymentDraft={onUpdatePaymentDraft}
        onRemovePaymentDraft={onRemovePaymentDraft}
        onCerrar={() => setModalCobroAbierto(false)}
        onConfirmar={manejarConfirmarCobro}
      />

      <ModalEnvio
        abierto={modalEnvioAbierto}
        cartItems={cartItems}
        total={subtotal}
        cajaId={cajaAbierta?.id}
        clientes={clientes}
        selectedClienteId={selectedClienteId}
        isPending={crearPedidoEnvio.isPending}
        onCerrar={() => setModalEnvioAbierto(false)}
        onConfirmar={manejarConfirmarEnvio}
      />
    </div>
  );
};
