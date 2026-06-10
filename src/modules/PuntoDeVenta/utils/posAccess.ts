import type { ModoPosSucursal } from '../../POSAuxiliares/types/pos-aux.type';

type PosAccessInput = {
  permisos: string[];
  modoPos?: ModoPosSucursal;
  cajaAbierta?: boolean;
};

export type PosAccessRules = {
  modoPos: ModoPosSucursal;
  esFlujoSimple: boolean;
  esMulticaja: boolean;
  esCajaCentralizada: boolean;
  esConDespacho: boolean;
  usaFlujoSeparado: boolean;
  permiteCobroDirecto: boolean;
  requiereOperadorCompleto: boolean;
  puedeVender: boolean;
  puedeCobrar: boolean;
  puedeAbrirCaja: boolean;
  puedeCancelarVenta: boolean;
  puedeVerPendientesCobro: boolean;
  puedeCrearVentaPendiente: boolean;
  puedeCobrarPendiente: boolean;
  puedeVenderYCobrar: boolean;
  puedeOperarPos: boolean;
  bloqueadoPorModo: boolean;
  muestraControlesCobro: boolean;
  requiereCajaParaVender: boolean;
  requiereCajaParaCobrar: boolean;
  mensajeBloqueo?: string;
};

const has = (permisos: string[], permiso: string) => permisos.includes(permiso);

export const getPosAccessRules = ({
  permisos,
  modoPos = 'SIMPLE',
  cajaAbierta = false,
}: PosAccessInput): PosAccessRules => {
  const esFlujoSimple = modoPos === 'SIMPLE';
  const esMulticaja = modoPos === 'MULTICAJA';
  const esCajaCentralizada = modoPos === 'CAJA_CENTRALIZADA';
  const esConDespacho = modoPos === 'CON_DESPACHO';
  const usaFlujoSeparado = esCajaCentralizada || esConDespacho;
  const permiteCobroDirecto = esFlujoSimple || esMulticaja;
  const requiereOperadorCompleto = permiteCobroDirecto;

  const puedeVender = has(permisos, 'ventas.crear');
  const puedeCobrar = has(permisos, 'caja.cobrar');
  const puedeAbrirCaja = has(permisos, 'caja.abrir');
  const puedeCancelarVenta = has(permisos, 'ventas.cancelar');
  const puedeVenderYCobrar = puedeVender && puedeCobrar;

  const bloqueadoPorModo = requiereOperadorCompleto && !puedeVenderYCobrar;
  const puedeCrearVentaPendiente = usaFlujoSeparado && puedeVender;
  const puedeVerPendientesCobro = usaFlujoSeparado && puedeCobrar;
  const puedeCobrarPendiente = puedeVerPendientesCobro && cajaAbierta;
  const muestraControlesCobro = puedeCobrar && (!usaFlujoSeparado || cajaAbierta);
  const puedeOperarPos =
    permiteCobroDirecto ? puedeVenderYCobrar : puedeVender || puedeCobrar;

  let mensajeBloqueo: string | undefined;
  if (bloqueadoPorModo) {
    mensajeBloqueo =
      'Este modo POS requiere un usuario vendedor-cajero. Un vendedor solo o cajero solo no puede operar venta simple o multicaja.';
  } else if (!puedeOperarPos) {
    mensajeBloqueo = 'Este usuario no tiene permisos para operar el punto de venta.';
  }

  return {
    modoPos,
    esFlujoSimple,
    esMulticaja,
    esCajaCentralizada,
    esConDespacho,
    usaFlujoSeparado,
    permiteCobroDirecto,
    requiereOperadorCompleto,
    puedeVender,
    puedeCobrar,
    puedeAbrirCaja,
    puedeCancelarVenta,
    puedeVerPendientesCobro,
    puedeCrearVentaPendiente,
    puedeCobrarPendiente,
    puedeVenderYCobrar,
    puedeOperarPos,
    bloqueadoPorModo,
    muestraControlesCobro,
    requiereCajaParaVender: permiteCobroDirecto,
    requiereCajaParaCobrar: true,
    mensajeBloqueo,
  };
};
