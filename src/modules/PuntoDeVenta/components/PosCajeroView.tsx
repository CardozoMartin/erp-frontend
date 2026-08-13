import { ArrowLeft, CreditCard } from 'lucide-react';
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
  usaFlujoSeparado,
  puedeUsarCuentaCorriente,
  onPendingSearchChange,
  onSelectPendiente,
  onCobrar,
  onCobrarQr,
  onCancelar,
  onLimpiarPagos,
  onSeleccionarMedioPago,
  onAddPaymentDraft,
  onUpdatePaymentDraft,
  onRemovePaymentDraft,
}: PropsPosCajeroView) {

  // Cuando hay una venta seleccionada mostramos solo el panel de cobro
  if (selectedPendiente) {
    return (
      <div className="flex flex-col bg-white">
        {/* Barra superior con volver */}
        <div className="flex items-center gap-3 border-b border-[#c4c6cd] bg-[#fbf9fa] px-4 py-3">
          <button
            type="button"
            onClick={() => onSelectPendiente('')}
            disabled={isBusy}
            className="flex items-center gap-1.5 rounded border border-[#c4c6cd] bg-white px-3 py-1.5 text-[13px] font-medium text-[#44474c] hover:bg-[#f4f5f6] disabled:opacity-50"
          >
            <ArrowLeft size={14} />
            Volver a lista
          </button>
          <div className="flex flex-1 items-center gap-2 text-[14px] font-semibold text-[#041627]">
            <CreditCard size={16} className="text-[#075E54]" />
            Cobrando: {selectedPendiente.numero}
          </div>
          <span className="shrink-0 rounded border border-[#cfe2de] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#075E54]">
            {selectedPendiente.estado.replace('_', ' ')}
          </span>
        </div>

        {/* Detalle ocupa toda la pantalla */}
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
          onSeleccionarMedioPago={onSeleccionarMedioPago}
          onAddPaymentDraft={onAddPaymentDraft}
          onUpdatePaymentDraft={onUpdatePaymentDraft}
          onRemovePaymentDraft={onRemovePaymentDraft}
          mostrarEnviarCaja={usaFlujoSeparado}
        />
      </div>
    );
  }

  // Sin venta seleccionada: solo la lista
  return (
    <PendientesLista
      ventasPendientes={ventasPendientes}
      pendingSearch={pendingSearch}
      selectedPendienteId={selectedPendienteId}
      totalPendiente={totalPendiente}
      cajaAbierta={cajaAbierta}
      onSearchChange={onPendingSearchChange}
      onSelectPendiente={onSelectPendiente}
    />
  );
}
