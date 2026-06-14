import type { PropsPosVendedorView } from '../types/pos.type';
import { formatCurrency } from '../utils/pos.utils';
import { ProductosBuscador } from './vendedor/ProductosBuscador';
import { CarritoTabla } from './vendedor/CarritoTabla';
import { CarritoAcciones } from './vendedor/CarritoAcciones';

export default function PosVendedorView({
  sucursalId,
  filteredProducts,
  productsLoading,
  cartItems,
  mediosPago,
  selectedPaymentId,
  selectedLista,
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
  cuentaSeleccionada,
  saldoCuentaSeleccionada,
  limiteCuentaSeleccionada,
  disponibleCuentaSeleccionada,
  permiteCuentaCorriente,
  ventasPendientes,
  search,
  subtotal,
  total,
  isBusy,
  ventaCompletaIsPending,
  crearVentaQrIsPending,
  crearOrdenQrIsPending,
  crearCuentaCorrienteIsPending,
  cobrarPendienteIsPending,
  onSearchChange,
  onAddProduct,
  onChangeQuantity,
  onRemoveProduct,
  onClearCart,
  onCotizar,
  onEnviarACaja,
  onCargarCuentaCorriente,
  onFinalizar,
  onCobrarQrCarrito,
  onCobrarPendiente,
  onAddPaymentDraft,
  onUpdatePaymentDraft,
  onRemovePaymentDraft,
}: PropsPosVendedorView) {
  return (
    <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
      {/* 1.- Buscador de productos con tabla */}
      <ProductosBuscador
        productos={filteredProducts}
        cargando={productsLoading}
        sucursalId={sucursalId}
        busqueda={search}
        selectedLista={selectedLista}
        puedeVender={posAccess.puedeVender}
        onBusquedaChange={onSearchChange}
        onAgregar={onAddProduct}
      />

      {/* 2.- Panel derecho: carrito + acciones */}
      <aside className="flex flex-col">
        {/* Info de cuenta corriente del cliente */}
        {cuentaSeleccionada && permiteCuentaCorriente ? (
          <div className="grid gap-2 border-b border-[#c4c6cd] bg-[#f3fbf9] px-4 py-3 text-[12px] sm:grid-cols-3">
            {[
              { label: 'Cuenta corriente', valor: 'Activa', color: 'text-[#075E54]' },
              {
                label: 'Saldo actual',
                valor: formatCurrency(saldoCuentaSeleccionada),
                color: saldoCuentaSeleccionada > 0 ? 'text-[#b42318]' : 'text-[#075E54]',
              },
              {
                label: 'Disponible',
                valor: limiteCuentaSeleccionada > 0 ? formatCurrency(disponibleCuentaSeleccionada) : 'Sin límite',
                color: 'text-[#041627]',
              },
            ].map(campo => (
              <div key={campo.label}>
                <span className="block font-bold uppercase text-[#44474c]">{campo.label}</span>
                <strong className={campo.color}>{campo.valor}</strong>
              </div>
            ))}
          </div>
        ) : null}

        {/* Tabla del carrito con totales */}
        <CarritoTabla
          cartItems={cartItems}
          selectedLista={selectedLista}
          subtotal={subtotal}
          total={total}
          onCambiarCantidad={onChangeQuantity}
          onQuitar={onRemoveProduct}
        />

        {/* Acciones: pagos mixtos + botones + pendientes */}
        <CarritoAcciones
          cartItems={cartItems}
          mediosPago={mediosPago}
          selectedPaymentId={selectedPaymentId}
          paymentDrafts={paymentDrafts}
          cajaAbierta={cajaAbierta}
          posAccess={posAccess}
          permitePagoMixto={permitePagoMixto}
          muestraControlesCobro={muestraControlesCobro}
          permiteCobroDirecto={permiteCobroDirecto}
          usaFlujoSeparado={usaFlujoSeparado}
          usaDespacho={usaDespacho}
          permiteCotizaciones={permiteCotizaciones}
          mercadoPagoDisponible={mercadoPagoDisponible}
          puedeUsarCuentaCorriente={puedeUsarCuentaCorriente}
          selectedClienteId={selectedClienteId}
          isBusy={isBusy}
          ventaCompletaIsPending={ventaCompletaIsPending}
          crearVentaQrIsPending={crearVentaQrIsPending}
          crearOrdenQrIsPending={crearOrdenQrIsPending}
          crearCuentaCorrienteIsPending={crearCuentaCorrienteIsPending}
          onLimpiar={onClearCart}
          onCotizar={onCotizar}
          onEnviarACaja={onEnviarACaja}
          onCargarCuentaCorriente={onCargarCuentaCorriente}
          onFinalizar={onFinalizar}
          onCobrarQrCarrito={onCobrarQrCarrito}
          onAddPaymentDraft={onAddPaymentDraft}
          onUpdatePaymentDraft={onUpdatePaymentDraft}
          onRemovePaymentDraft={onRemovePaymentDraft}
          ventasPendientes={ventasPendientes}
          cobrarPendienteIsPending={cobrarPendienteIsPending}
          onCobrarPendiente={onCobrarPendiente}
        />
      </aside>
    </div>
  );
}
