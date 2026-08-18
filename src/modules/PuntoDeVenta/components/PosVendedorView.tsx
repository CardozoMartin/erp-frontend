import type { PropsPosVendedorView } from '../types/pos.type';
import { formatCurrency } from '../utils/pos.utils';
import { ProductosGrilla } from './vendedor/ProductosGrilla';
import { CarritoPanel } from './vendedor/CarritoPanel';
import { CarritoAcciones } from './vendedor/CarritoAcciones';
import { PosCamposVenta } from './vendedor/PosCamposVenta';

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
  permiteEnvios,
  mercadoPagoDisponible,
  puedeUsarCuentaCorriente,
  selectedClienteId,
  cuentaSeleccionada,
  saldoCuentaSeleccionada,
  limiteCuentaSeleccionada,
  disponibleCuentaSeleccionada,
  permiteCuentaCorriente,
  esSoloCajero,
  selectedCliente,
  medioPagoSugeridoId,
  onSeleccionarMedioPagoSugerido,
  crearPendienteIsPending,
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
  onSeleccionarMedioPago,
  onAddPaymentDraft,
  onUpdatePaymentDraft,
  onRemovePaymentDraft,
  // Campos de cabecera (sucursal, empleado, cliente, lista, fiscal)
  sucursalNombre,
  empleadoNombre,
  clientes,
  listasPrecio,
  listasPrecioLoading,
  selectedListaId,
  tipoFiscal,
  emitirTicket,
  rolPosElegido,
  onCambiarRol,
  onClienteChange,
  onListaChange,
  onTipoFiscalChange,
  onEmitirTicketChange,
}: PropsPosVendedorView) {
  return (
    <div className="grid min-h-0 flex-1 gap-5 lg:grid-cols-[minmax(0,1fr)_400px]">
      {/* Columna izquierda: datos de la venta + grilla de productos */}
      <div className="flex min-h-0 flex-col gap-4">
        <PosCamposVenta
          sucursalNombre={sucursalNombre}
          empleadoNombre={empleadoNombre}
          muestraControlesCobro={muestraControlesCobro}
          tipoFiscal={tipoFiscal}
          emitirTicket={emitirTicket}
          selectedClienteId={selectedClienteId}
          clientes={clientes}
          listasPrecio={listasPrecio}
          listasPrecioLoading={listasPrecioLoading}
          selectedListaId={selectedListaId}
          selectedLista={selectedLista}
          permiteEnvios={permiteEnvios}
          rolPosElegido={rolPosElegido}
          onCambiarRol={onCambiarRol}
          onTipoFiscalChange={onTipoFiscalChange}
          onEmitirTicketChange={onEmitirTicketChange}
          onClienteChange={onClienteChange}
          onListaChange={onListaChange}
        />

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-[#e5e7eb] bg-white">
          <ProductosGrilla
            productos={filteredProducts}
            cargando={productsLoading}
            sucursalId={sucursalId}
            busqueda={search}
            selectedLista={selectedLista}
            puedeVender={posAccess.puedeVender}
            onBusquedaChange={onSearchChange}
            onAgregar={onAddProduct}
          />
        </div>
      </div>

      {/* Columna derecha: carrito fijo + acciones de cobro */}
      <aside className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-[#e5e7eb] bg-white">
        {/* Cuenta corriente del cliente seleccionado */}
        {cuentaSeleccionada && permiteCuentaCorriente ? (
          <div className="grid grid-cols-3 gap-2 border-b border-[#e5e7eb] bg-[#f3fbf9] px-4 py-3 text-[11.5px]">
            {[
              { label: 'Cta. corriente', valor: 'Activa', color: 'text-[#075E54]' },
              {
                label: 'Saldo',
                valor: formatCurrency(saldoCuentaSeleccionada),
                color: saldoCuentaSeleccionada > 0 ? 'text-[#b42318]' : 'text-[#075E54]',
              },
              {
                label: 'Disponible',
                valor:
                  limiteCuentaSeleccionada > 0
                    ? formatCurrency(disponibleCuentaSeleccionada)
                    : 'Sin límite',
                color: 'text-[#041627]',
              },
            ].map((campo) => (
              <div key={campo.label} className="min-w-0">
                <span className="block truncate font-bold uppercase tracking-wide text-[#64748b]">
                  {campo.label}
                </span>
                <strong className={`truncate ${campo.color}`}>{campo.valor}</strong>
              </div>
            ))}
          </div>
        ) : null}

        <CarritoPanel
          cartItems={cartItems}
          selectedLista={selectedLista}
          subtotal={subtotal}
          total={total}
          onCambiarCantidad={onChangeQuantity}
          onQuitar={onRemoveProduct}
        />

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
          permiteEnvios={permiteEnvios}
          clientes={clientes}
          mercadoPagoDisponible={mercadoPagoDisponible}
          puedeUsarCuentaCorriente={puedeUsarCuentaCorriente}
          selectedClienteId={selectedClienteId}
          selectedLista={selectedLista}
          subtotal={subtotal}
          onSeleccionarMedioPago={onSeleccionarMedioPago}
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
          esSoloCajero={esSoloCajero}
          selectedCliente={selectedCliente}
          medioPagoSugeridoId={medioPagoSugeridoId}
          onSeleccionarMedioPagoSugerido={onSeleccionarMedioPagoSugerido}
          crearPendienteIsPending={crearPendienteIsPending}
          ventasPendientes={ventasPendientes}
          cobrarPendienteIsPending={cobrarPendienteIsPending}
          onCobrarPendiente={onCobrarPendiente}
        />
      </aside>
    </div>
  );
}
