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

  // Con una venta tomada: ticket a la izquierda y panel de cobro a la derecha
  if (selectedPendiente) {
    return (
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
        onVolver={() => onSelectPendiente('')}
        mostrarEnviarCaja={usaFlujoSeparado}
      />
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
