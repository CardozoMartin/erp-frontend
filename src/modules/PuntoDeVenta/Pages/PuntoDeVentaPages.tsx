import { useMemo, useState } from 'react';
import { Lock, ShoppingCart, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { useObtenerProductos } from '../../Productos/hooks/useProductos';
import { getProductCode, getStockLocationForBranch, modoPosLabel, toNumber } from '../utils/pos.utils';
import { useCarritoStore } from '../store/carrito.store';
import { useEstadoPos } from '../hooks/useEstadoPos';
import { usePagoPos } from '../hooks/usePagoPos';
import { useAccionesVenta } from '../hooks/useAccionesVenta';
import PosHeader from '../components/PosHeader';
import PosQrModal from '../components/PosQrModal';
import PosCajeroView from '../components/PosCajeroView';
import PosVendedorView from '../components/PosVendedorView';
import { PosAbrirCaja } from '../components/PosAbrirCaja';

const PuntoDeVentaPages = () => {
  const [search, setSearch] = useState('');
  const [medioPagoSugeridoId, setMedioPagoSugeridoId] = useState('');

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

  // 5.- Selección de venta pendiente: toma el bloqueo en el backend y libera el anterior
  const manejarSeleccionarPendiente = (nuevoId: string) => {
    const anteriorId = estado.selectedPendienteId;
    if (anteriorId && anteriorId !== nuevoId) {
      acciones.manejarLiberarPendiente(anteriorId);
    }
    estado.setSelectedPendienteId(nuevoId);
    if (nuevoId) acciones.manejarTomarPendiente(nuevoId);
  };

  // 6.- Wrappers cajero: limpian la selección al completar cobro o cancelación
  const manejarCobrarPendienteYVolver = (venta: Parameters<typeof acciones.manejarCobrarPendiente>[0]) => {
    acciones.manejarCobrarPendiente(venta);
    // La selección se limpia vía invalidación del query — el item desaparece de la lista
    // pero forzamos el retorno inmediato a la lista para que el cajero no quede bloqueado
    estado.setSelectedPendienteId('');
  };

  const manejarCancelarPendienteYVolver = (venta: Parameters<typeof acciones.manejarCancelarPendiente>[0]) => {
    acciones.manejarCancelarPendiente(venta);
    estado.setSelectedPendienteId('');
  };

  // 7.- Productos filtrados por búsqueda
  const productsQuery = useObtenerProductos(1, 200);
  const productos = useMemo(() => {
    const raw = productsQuery.data;
    const lista = Array.isArray(raw) ? raw : raw?.data ?? [];
    return lista.filter(p => p.activo && p.activo_pos);
  }, [productsQuery.data]);

  const productosFiltrados = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return [];
    return productos.filter(p => {
      return (
        p.nombre.toLowerCase().includes(term) ||
        getProductCode(p).toLowerCase().includes(term)
      );
    });
  }, [productos, search, estado.sucursalActiva?.id]);

  const { posAccess, esSoloCajero } = estado;

  // Modal de selección de rol para empleados con doble permiso en modo flujo separado
  if (estado.necesitaElegirRol) {
    return (
      <div className="flex min-h-[calc(100vh-52px)] items-center justify-center bg-[#f3f4f6] px-4 py-8">
        <div className="w-full max-w-md rounded-xl border border-[#c4c6cd] bg-white shadow-lg">
          <div className="border-b border-[#c4c6cd] px-6 py-5 text-center">
            <h2 className="text-[18px] font-bold text-[#041627]">¿Cómo vas a operar hoy?</h2>
            <p className="mt-1 text-[13px] text-[#44474c]">
              Tu usuario tiene permisos de vendedor y cajero.
              Elegí tu rol para esta sesión del POS.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 p-6">
            <button
              type="button"
              onClick={() => estado.setRolPosElegido('vendedor')}
              className="flex flex-col items-center gap-3 rounded-lg border-2 border-[#c4c6cd] bg-white px-4 py-6 text-center transition-all hover:border-[#075E54] hover:bg-[#f3fbf9] hover:shadow-md"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#eef8f6] text-[#075E54]">
                <ShoppingCart size={26} />
              </div>
              <div>
                <p className="text-[15px] font-bold text-[#041627]">Vendedor</p>
                <p className="mt-1 text-[12px] text-[#44474c]">Creás ventas y cotizaciones. Las ventas quedan pendientes de cobro.</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => estado.setRolPosElegido('cajero')}
              className="flex flex-col items-center gap-3 rounded-lg border-2 border-[#c4c6cd] bg-white px-4 py-6 text-center transition-all hover:border-[#075E54] hover:bg-[#f3fbf9] hover:shadow-md"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#eef8f6] text-[#075E54]">
                <Wallet size={26} />
              </div>
              <div>
                <p className="text-[15px] font-bold text-[#041627]">Cajero</p>
                <p className="mt-1 text-[12px] text-[#44474c]">Cobrás las ventas pendientes que generaron los vendedores.</p>
              </div>
            </button>
          </div>
          <p className="border-t border-[#c4c6cd] px-6 py-3 text-center text-[11px] text-[#8b8fa3]">
            Podés cambiar tu rol en cualquier momento desde el encabezado del POS.
          </p>
        </div>
      </div>
    );
  }

  // Bloqueo por caja: vendedor en modo simple/multicaja sin caja abierta
  // o cajero en flujo separado que va a cobrar sin caja abierta
  const necesitaAbrirCaja =
    posAccess.puedeAbrirCaja &&
    !estado.cajaAbierta &&
    !estado.cajaQuery.isLoading &&
    (posAccess.requiereCajaParaVender && !esSoloCajero ||
      esSoloCajero && posAccess.requiereCajaParaCobrar);

  if (necesitaAbrirCaja) {
    return (
      <PosAbrirCaja
        empleadoNombre={estado.empleado?.nombreCompleto ?? 'Usuario'}
        sucursalNombre={estado.sucursalActiva?.nombre ?? ''}
        modoPos={posAccess.modoPos}
        descripcionModo={posAccess.descripcionModo}
        isPending={acciones.abrirCajaIsPending}
        onAbrir={(montoInicial, descripcion) =>
          acciones.manejarAbrirCaja(montoInicial, descripcion)
        }
      />
    );
  }

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
            rolPosElegido={estado.rolPosElegido}
            onCambiarRol={estado.rolPosElegido ? () => estado.setRolPosElegido(null) : undefined}
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
                usaFlujoSeparado={posAccess.usaFlujoSeparado}
                puedeUsarCuentaCorriente={estado.puedeUsarCuentaCorriente}
                onPendingSearchChange={estado.setPendingSearch}
                onSelectPendiente={manejarSeleccionarPendiente}
                onCobrar={manejarCobrarPendienteYVolver}
                onCobrarQr={acciones.manejarCobrarQrPendiente}
                onCancelar={manejarCancelarPendienteYVolver}
                onLimpiarPagos={pago.resetearPagos}
                onSeleccionarMedioPago={pago.setSelectedPaymentId}
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
                esSoloCajero={esSoloCajero}
                selectedCliente={estado.selectedCliente}
                medioPagoSugeridoId={medioPagoSugeridoId}
                onSeleccionarMedioPagoSugerido={setMedioPagoSugeridoId}
                crearPendienteIsPending={acciones.crearPendienteIsPending}
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
                onEnviarACaja={() => acciones.manejarEnviarACaja(estado.selectedClienteId, estado.selectedLista?.id, medioPagoSugeridoId)}
                onCargarCuentaCorriente={() => acciones.manejarCargarCuentaCorriente(estado.selectedClienteId, subtotal, estado.selectedLista?.id)}
                onFinalizar={() => acciones.manejarFinalizarVenta(subtotal, estado.selectedClienteId, estado.selectedLista?.id, posAccess.permiteCobroDirecto)}
                onCobrarQrCarrito={() => acciones.manejarCobrarQrCarrito(estado.selectedClienteId, estado.selectedLista?.id)}
                onCobrarPendiente={acciones.manejarCobrarPendiente}
                onSeleccionarMedioPago={pago.setSelectedPaymentId}
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
