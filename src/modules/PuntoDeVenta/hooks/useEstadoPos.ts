import { useMemo, useState } from 'react';
import { useAuthStore } from '../../../store/auth.store';
import { useConfiguracionPos, useServiciosSucursal } from '../../POSAuxiliares/hooks/usePosAux';
import { useCajaAbierta, useClientesPos, useHayCajaAbierta, useListasPrecioPos, useMediosPagoActivos, useVentasPendientesCobro } from './usePos';
import { getPosAccessRules } from '../utils/posAccess';
import { toNumber } from '../utils/pos.utils';
import type { TipoEmisionFiscal } from '../types/pos.type';

//Hook que centraliza todo el estado derivado del POS ─────────────────────
// Agrupa queries de config, caja, medios de pago, clientes y listas de precio,
// y expone los flags derivados que usan la page y los componentes.

export const useEstadoPos = () => {
  const sucursalActiva = useAuthStore(s => s.sucursalActiva);
  const empleado = useAuthStore(s => s.empleado);
  const permisos = useAuthStore(s => s.permisos);

  //Estado de UI propio del POS ──────────────────────────────────────────
  const [selectedClienteId, setSelectedClienteId] = useState('');
  const [selectedListaId, setSelectedListaId] = useState('');
  const [emitirTicket, setEmitirTicket] = useState(true);
  const [tipoFiscal, setTipoFiscal] = useState<TipoEmisionFiscal>('TICKET');
  const [pendingSearch, setPendingSearch] = useState('');
  const [selectedPendienteId, setSelectedPendienteId] = useState<string | null>(null);
  // Rol elegido en modo flujo separado cuando el empleado tiene ambos permisos (null = pendiente elección)
  const [rolPosElegido, setRolPosElegido] = useState<'vendedor' | 'cajero' | null>(null);

  //Queries ──────────────────────────────────────────────────────────────

  const configQuery = useConfiguracionPos();
  const serviciosQuery = useServiciosSucursal();
  const cajaQuery = useCajaAbierta();
  const mediosPagoQuery = useMediosPagoActivos();
  const clientesQuery = useClientesPos();
  const listasPrecioQuery = useListasPrecioPos();

  //Datos derivados ──────────────────────────────────────────────────────

  const config = configQuery.data;
  const cajaAbierta = cajaQuery.data;
  const mediosPago = mediosPagoQuery.data ?? [];
  const clientes = useMemo(
    () => (clientesQuery.data ?? []).filter(c => c.activo),
    [clientesQuery.data],
  );
  const listasPrecio = useMemo(
    () => (listasPrecioQuery.data ?? []).filter(l => l.activa),
    [listasPrecioQuery.data],
  );

  const mercadoPagoDisponible = !!serviciosQuery.data?.mercadoPago.disponible;
  const permitePagoMixto = config?.permitir_pago_mixto !== false;
  const permiteListasPrecio = config?.permitir_listas_precio === true;
  const permiteCotizaciones = config?.permitir_cotizaciones === true;
  const permiteCuentaCorriente = config?.permitir_cuenta_corriente === true;
  const permiteEnvios = config?.permitir_envios === true;
  const puedeAplicarListasPrecio = permiteListasPrecio || listasPrecio.length > 0;

  const selectedLista = listasPrecio.find(l => l.id === selectedListaId);
  const selectedCliente = clientes.find(c => c.id === selectedClienteId) ?? null;

  //Cuenta corriente del cliente seleccionado ───────────────────────────
  const cuentaSeleccionada = selectedCliente?.cuentaCorriente ?? null;
  const saldoCuentaSeleccionada = Math.max(0, toNumber(cuentaSeleccionada?.saldo));
  const limiteCuentaSeleccionada = toNumber(cuentaSeleccionada?.limite_credito);
  const disponibleCuentaSeleccionada =
    limiteCuentaSeleccionada > 0 ? Math.max(0, limiteCuentaSeleccionada - saldoCuentaSeleccionada) : 0;

  // Reglas de acceso ─────────────────────────────────────────────────────
  const posAccess = getPosAccessRules({
    permisos,
    modoPos: config?.modo_pos,
    cajaAbierta: !!cajaAbierta,
  });

  // Necesita elegir rol cuando el modo usa flujo separado Y tiene ambos permisos
  const necesitaElegirRol = posAccess.usaFlujoSeparado && posAccess.puedeVenderYCobrar && rolPosElegido === null;

  // En modo flujo separado con doble permiso, el rol determina la vista; si no, se deduce de los permisos
  const esSoloCajero = posAccess.usaFlujoSeparado && posAccess.puedeVenderYCobrar
    ? rolPosElegido === 'cajero'
    : !posAccess.puedeVender && posAccess.puedeCobrar;

  const puedeVerDetallesConfigPos =
    permisos.includes('config.pos') ||
    permisos.includes('reportes.ver') ||
    permisos.includes('reportes.ventas');

  // Caja de la sucursal ──────────────────────────────────────────────────
  // El vendedor de flujo separado no abre caja ni la ve, pero su venta pendiente
  // necesita una abierta para tener destino. Sin este flag se entera recién al
  // apretar "Enviar a caja", con el carrito ya armado.
  const esVendedorDeFlujoSeparado = posAccess.usaFlujoSeparado && !esSoloCajero;
  const hayCajaEnSucursalQuery = useHayCajaAbierta(esVendedorDeFlujoSeparado);
  const faltaCajaEnSucursal =
    esVendedorDeFlujoSeparado && hayCajaEnSucursalQuery.data === false;

  //Ventas pendientes ────────────────────────────────────────────────────
  // Solo carga pendientes si el usuario opera como cajero — si eligió rol "vendedor" no las ve
  const habilitarPendientes = posAccess.puedeVerPendientesCobro && esSoloCajero;
  const pendientesQuery = useVentasPendientesCobro(habilitarPendientes);
  const ventasPendientes = pendientesQuery.data ?? [];

  const ventasPendientesFiltradas = useMemo(() => {
    const term = pendingSearch.trim().toLowerCase();
    if (!term) return ventasPendientes;
    return ventasPendientes.filter(venta => {
      const items = (venta.items ?? []).map(i => i.descripcion).join(' ').toLowerCase();
      return (
        venta.numero.toLowerCase().includes(term) ||
        venta.estado.toLowerCase().includes(term) ||
        items.includes(term)
      );
    });
  }, [pendingSearch, ventasPendientes]);

  const totalPendiente = ventasPendientesFiltradas.reduce((sum, v) => sum + toNumber(v.total), 0);
  const selectedPendiente = selectedPendienteId
    ? (ventasPendientesFiltradas.find(v => v.id === selectedPendienteId) ?? null)
    : null;

  // Helper cuenta corriente ──────────────────────────────────────────────
  const puedeUsarCuentaCorriente = (clienteId?: string | null) => {
    if (!permiteCuentaCorriente || !clienteId) return false;
    return !!clientes.find(c => c.id === clienteId)?.cuentaCorriente?.activa;
  };

  return {
    // Auth
    sucursalActiva,
    empleado,
    permisos,
    // Queries (para flags isLoading/isFetching)
    configQuery,
    cajaQuery,
    mediosPagoQuery,
    clientesQuery,
    listasPrecioQuery,
    pendientesQuery,
    // Datos
    config,
    cajaAbierta,
    mediosPago,
    clientes,
    listasPrecio,
    selectedLista,
    selectedCliente,
    // Flags de config
    mercadoPagoDisponible,
    permitePagoMixto,
    permiteCotizaciones,
    permiteCuentaCorriente,
    permiteEnvios,
    puedeAplicarListasPrecio,
    // Cuenta corriente
    cuentaSeleccionada,
    saldoCuentaSeleccionada,
    limiteCuentaSeleccionada,
    disponibleCuentaSeleccionada,
    puedeUsarCuentaCorriente,
    // Permisos y modo POS
    posAccess,
    esSoloCajero,
    puedeVerDetallesConfigPos,
    faltaCajaEnSucursal,
    // Pendientes
    ventasPendientesFiltradas,
    totalPendiente,
    selectedPendiente,
    pendingSearch,
    selectedPendienteId,
    setPendingSearch,
    setSelectedPendienteId,
    // UI state
    selectedClienteId,
    selectedListaId,
    emitirTicket,
    tipoFiscal,
    setSelectedClienteId,
    setSelectedListaId,
    setEmitirTicket,
    setTipoFiscal,
    // Rol POS en flujo separado con doble permiso
    necesitaElegirRol,
    rolPosElegido,
    setRolPosElegido,
  };
};
