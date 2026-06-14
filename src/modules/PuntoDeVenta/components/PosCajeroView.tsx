import { CreditCard } from 'lucide-react';
import type { PropsPosCajeroView } from '../types/pos.type';
import { PendientesLista } from './cajero/PendientesLista';
import { PendienteDetalle } from './cajero/PendienteDetalle';

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
}: PropsPosCajeroView) {
  return (
    <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
      {/* 1.- Lista de ventas pendientes con buscador */}
      <PendientesLista
        ventasPendientes={ventasPendientes}
        pendingSearch={pendingSearch}
        selectedPendienteId={selectedPendienteId}
        totalPendiente={totalPendiente}
        cajaAbierta={cajaAbierta}
        onSearchChange={onPendingSearchChange}
        onSelectPendiente={onSelectPendiente}
      />

      {/* 2.- Panel de cobro de la venta seleccionada */}
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
          <PendienteDetalle
            venta={selectedPendiente}
            cajaAbierta={cajaAbierta}
            mediosPago={mediosPago}
            paymentDrafts={paymentDrafts}
            selectedPaymentId={selectedPaymentId}
            permitePagoMixto={permitePagoMixto}
            muestraControlesCobro={muestraControlesCobro}
            mercadoPagoDisponible={mercadoPagoDisponible}
            isBusy={isBusy}
            puedeCobrar={puedeCobrar}
            puedeCancelarVenta={puedeCancelarVenta}
            cobrarPendienteIsPending={cobrarPendienteIsPending}
            crearOrdenQrIsPending={crearOrdenQrIsPending}
            puedeUsarCuentaCorriente={puedeUsarCuentaCorriente}
            onCobrar={onCobrar}
            onCobrarQr={onCobrarQr}
            onCancelar={onCancelar}
            onLimpiarPagos={onLimpiarPagos}
            onAddPaymentDraft={onAddPaymentDraft}
            onUpdatePaymentDraft={onUpdatePaymentDraft}
            onRemovePaymentDraft={onRemovePaymentDraft}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center px-4 py-12 text-center text-[14px] text-[#44474c]">
            Seleccione una venta pendiente para ver el detalle y cobrar.
          </div>
        )}
      </aside>
    </div>
  );
}
