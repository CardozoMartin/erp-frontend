import { useMemo, useState } from 'react';
import { Lock } from 'lucide-react';
import { toast } from 'sonner';
import { useGetProducts } from '../../Productos/hooks/useProducts';
import { getProductCode, getStockLocationForBranch, modoPosLabel, toNumber } from '../utils/pos.utils';
import { useCarritoStore } from '../store/carrito.store';
import { useEstadoPos } from '../hooks/useEstadoPos';
import { usePagoPos } from '../hooks/usePagoPos';
import { useAccionesVenta } from '../hooks/useAccionesVenta';
import PosHeader from '../components/PosHeader';
import PosQrModal from '../components/PosQrModal';
import PosCajeroView from '../components/PosCajeroView';
import PosVendedorView from '../components/PosVendedorView';

const PuntoDeVentaPages = () => {
  const [search, setSearch] = useState('');

  // 1.- Estado global del POS: config, caja, permisos, clientes, listas
  const estado = useEstadoPos();

  // 2.- Carrito desde el store Zustand
  const { items: cartItems, agregarProducto, cambiarCantidad, quitarProducto, limpiarCarrito } = useCarritoStore();
  const subtotal = cartItems.reduce((total, item) => total + item.precioUnitario * item.cantidad, 0);

  // 3.- Lógica de pagos y drafts
  const pago = usePagoPos({
    mediosPago: estado.mediosPago,
    clientes: estado.clientes,
    selectedClienteId: estado.selectedClienteId,
    permitePagoMixto: estado.permitePagoMixto,
    permiteCuentaCorriente: estado.permiteCuentaCorriente,
  });

  // 4.- Acciones de venta (finalizar, enviar a caja, QR, cotizar, etc.)
  const acciones = useAccionesVenta({
    cajaAbiertaId: estado.cajaAbierta?.id,
    sucursalId: estado.sucursalActiva?.id,
    mercadoPagoDisponible: estado.mercadoPagoDisponible,
    emitirTicket: estado.emitirTicket,
    tipoFiscal: estado.tipoFiscal,
    config: estado.config,
    posAccess: estado.posAccess,
    puedeCancelarVenta: estado.posAccess.puedeCancelarVenta,
    permiteCuentaCorriente: estado.permiteCuentaCorriente,
    construirPagos: pago.construirPagos,
    validarLimiteCC: pago.validarLimiteCC,
    resetearPagos: pago.resetearPagos,
  });

  // 5.- Productos filtrados por búsqueda
  const productsQuery = useGetProducts(1, 200);
  const productos = useMemo(() => {
    const raw = productsQuery.data;
    const lista = Array.isArray(raw) ? raw : raw?.data ?? [];
    return lista.filter(p => p.activo && p.activo_pos);
  }, [productsQuery.data]);

  const productosFiltrados = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return productos;
    return productos.filter(p => {
      const ubicacion = getStockLocationForBranch(p, estado.sucursalActiva?.id).toLowerCase();
      return (
        p.nombre.toLowerCase().includes(term) ||
        getProductCode(p).toLowerCase().includes(term) ||
        ubicacion.includes(term)
      );
    });
  }, [productos, search, estado.sucursalActiva?.id]);

  const { posAccess, esSoloCajero } = estado;

  return (
    <div className="min-h-[calc(100vh-52px)] bg-[#f3f4f6] px-4 py-4">
      {acciones.qrOrder ? (
        <PosQrModal
          qrOrder={acciones.qrOrder}
          isCancelando={acciones.cancelarOrdenQrIsPending}
          onCancelar={acciones.manejarCancelarQr}
        />
      ) : null}

      <div className="mx-auto flex max-w-400 flex-col gap-4">
        <section className="rounded-lg border border-[#c4c6cd] bg-white shadow-sm">

          <PosHeader
            sucursalNombre={estado.sucursalActiva?.nombre ?? 'Sin sucursal'}
            empleadoNombre={estado.empleado?.nombreCompleto ?? 'Usuario'}
            cajaAbierta={estado.cajaAbierta}
            listasPrecio={estado.listasPrecio}
            listasPrecioLoading={estado.listasPrecioQuery.isLoading}
            selectedListaId={estado.selectedListaId}
            selectedLista={estado.selectedLista}
            selectedClienteId={estado.selectedClienteId}
            clientes={estado.clientes}
            tipoFiscal={estado.tipoFiscal}
            emitirTicket={estado.emitirTicket}
            montoInicial={acciones.montoInicial}
            posAccess={posAccess}
            muestraControlesCobro={posAccess.muestraControlesCobro}
            permiteCobroDirecto={posAccess.permiteCobroDirecto}
            usaFlujoSeparado={posAccess.usaFlujoSeparado}
            puedeVerDetallesConfigPos={estado.puedeVerDetallesConfigPos}
            configFetching={estado.configQuery.isFetching}
            abrirCajaIsPending={acciones.abrirCajaIsPending}
            onClienteChange={estado.setSelectedClienteId}
            onListaChange={estado.setSelectedListaId}
            onTipoFiscalChange={estado.setTipoFiscal}
            onEmitirTicketChange={estado.setEmitirTicket}
            onMontoInicialChange={acciones.setMontoInicial}
            onAbrirCaja={acciones.manejarAbrirCaja}
          />

          {posAccess.bloqueadoPorModo || !posAccess.puedeOperarPos ? (
            <div className="border-b border-[#c4c6cd] bg-white px-4 py-12">
              <div className="mx-auto max-w-190 rounded border border-[#f1c7c7] bg-[#fff5f5] px-5 py-5 text-center">
                <Lock size={28} className="mx-auto mb-3 text-[#b42318]" />
                <h2 className="text-[18px] font-bold text-[#041627]">Punto de venta bloqueado</h2>
                <p className="mt-2 text-[14px] text-[#44474c]">
                  {posAccess.mensajeBloqueo ?? `El modo ${modoPosLabel[posAccess.modoPos] ?? posAccess.modoPos} no permite operar con este usuario.`}
                </p>
                <div className="mt-4 grid gap-2 text-left text-[13px] sm:grid-cols-2">
                  <div className={`rounded border px-3 py-2 ${posAccess.puedeVender ? 'border-[#cfe2de] bg-white text-[#075E54]' : 'border-[#f1c7c7] bg-white text-[#b42318]'}`}>
                    Permiso ventas.crear: {posAccess.puedeVender ? 'activo' : 'faltante'}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {!posAccess.bloqueadoPorModo && posAccess.puedeOperarPos ? (
            esSoloCajero ? (
              <PosCajeroView
                ventasPendientes={estado.ventasPendientesFiltradas}
                pendingSearch={estado.pendingSearch}
                selectedPendienteId={estado.selectedPendienteId}
                selectedPendiente={estado.selectedPendiente}
                totalPendiente={estado.totalPendiente}
                cajaAbierta={estado.cajaAbierta}
                mediosPago={estado.mediosPago}
                paymentDrafts={pago.paymentDrafts}
                selectedPaymentId={pago.selectedPaymentId}
                permitePagoMixto={estado.permitePagoMixto}
                muestraControlesCobro={posAccess.muestraControlesCobro}
                mercadoPagoDisponible={estado.mercadoPagoDisponible}
                isBusy={acciones.isBusy}
                puedeCobrar={posAccess.puedeCobrar}
                puedeCancelarVenta={posAccess.puedeCancelarVenta}
                cobrarPendienteIsPending={acciones.cobrarPendienteIsPending}
                crearOrdenQrIsPending={acciones.crearOrdenQrIsPending}
                puedeUsarCuentaCorriente={estado.puedeUsarCuentaCorriente}
                onPendingSearchChange={estado.setPendingSearch}
                onSelectPendiente={estado.setSelectedPendienteId}
                onCobrar={acciones.manejarCobrarPendiente}
                onCobrarQr={acciones.manejarCobrarQrPendiente}
                onCancelar={acciones.manejarCancelarPendiente}
                onLimpiarPagos={pago.resetearPagos}
                onAddPaymentDraft={pago.agregarDraft}
                onUpdatePaymentDraft={pago.actualizarDraft}
                onRemovePaymentDraft={pago.quitarDraft}
              />
            ) : (
              <PosVendedorView
                sucursalId={estado.sucursalActiva?.id}
                filteredProducts={productosFiltrados}
                productsLoading={productsQuery.isLoading}
                cartItems={cartItems}
                mediosPago={estado.mediosPago}
                selectedPaymentId={pago.selectedPaymentId}
                selectedLista={estado.selectedLista}
                paymentDrafts={pago.paymentDrafts}
                cajaAbierta={estado.cajaAbierta}
                posAccess={posAccess}
                permitePagoMixto={estado.permitePagoMixto}
                muestraControlesCobro={posAccess.muestraControlesCobro}
                permiteCobroDirecto={posAccess.permiteCobroDirecto}
                usaFlujoSeparado={posAccess.usaFlujoSeparado}
                usaDespacho={posAccess.esConDespacho}
                permiteCotizaciones={estado.permiteCotizaciones}
                mercadoPagoDisponible={estado.mercadoPagoDisponible}
                puedeUsarCuentaCorriente={estado.puedeUsarCuentaCorriente}
                selectedClienteId={estado.selectedClienteId}
                cuentaSeleccionada={estado.cuentaSeleccionada}
                saldoCuentaSeleccionada={estado.saldoCuentaSeleccionada}
                limiteCuentaSeleccionada={estado.limiteCuentaSeleccionada}
                disponibleCuentaSeleccionada={estado.disponibleCuentaSeleccionada}
                permiteCuentaCorriente={estado.permiteCuentaCorriente}
                ventasPendientes={estado.ventasPendientesFiltradas}
                pendientesLoading={estado.pendientesQuery.isLoading}
                search={search}
                subtotal={subtotal}
                total={subtotal}
                isBusy={acciones.isBusy}
                ventaCompletaIsPending={acciones.ventaCompletaIsPending}
                crearVentaQrIsPending={acciones.crearVentaQrIsPending}
                crearOrdenQrIsPending={acciones.crearOrdenQrIsPending}
                crearCuentaCorrienteIsPending={acciones.crearCuentaCorrienteIsPending}
                cobrarPendienteIsPending={acciones.cobrarPendienteIsPending}
                onSearchChange={setSearch}
                onAddProduct={p => {
                  const resultado = agregarProducto(p, estado.sucursalActiva?.id, estado.selectedLista, estado.puedeAplicarListasPrecio);
                  if (resultado === 'sin_stock') toast.warning('No hay más stock disponible para este producto');
                }}
                onChangeQuantity={(id, delta) => cambiarCantidad(id ?? '', delta, estado.sucursalActiva?.id)}
                onRemoveProduct={id => quitarProducto(id ?? '')}
                onClearCart={() => { limpiarCarrito(); pago.resetearPagos(); }}
                onCotizar={() => acciones.manejarCrearCotizacion(estado.selectedClienteId, estado.selectedLista?.id)}
                onEnviarACaja={() => acciones.manejarEnviarACaja(estado.selectedClienteId, estado.selectedLista?.id)}
                onCargarCuentaCorriente={() => acciones.manejarCargarCuentaCorriente(estado.selectedClienteId, subtotal, estado.selectedLista?.id)}
                onFinalizar={() => acciones.manejarFinalizarVenta(subtotal, estado.selectedClienteId, estado.selectedLista?.id, posAccess.permiteCobroDirecto)}
                onCobrarQrCarrito={() => acciones.manejarCobrarQrCarrito(estado.selectedClienteId, estado.selectedLista?.id)}
                onCobrarPendiente={acciones.manejarCobrarPendiente}
                onAddPaymentDraft={pago.agregarDraft}
                onUpdatePaymentDraft={pago.actualizarDraft}
                onRemovePaymentDraft={pago.quitarDraft}
              />
            )
          ) : null}
        </section>
      </div>
    </div>
  );
};

export default PuntoDeVentaPages;
