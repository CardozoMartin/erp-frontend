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
  /** Solo MULTICAJA exige que la caja sea del propio vendedor */
  requiereCajaPropiaParaVender: boolean;
  requiereCajaParaCobrar: boolean;
  descripcionModo: string;
  mensajeBloqueo?: string;
};

const has = (permisos: string[], permiso: string) => permisos.includes(permiso);

const DESCRIPCION_MODO: Record<ModoPosSucursal, string> = {
  SIMPLE: 'Solo una caja por sucursal. El mismo operador vende y cobra.',
  MULTICAJA: 'Múltiples cajeros independientes, cada uno con su propia caja.',
  CAJA_CENTRALIZADA: 'Vendedores crean ventas pendientes. Los cajeros cobran en la caja central.',
  CON_DESPACHO: 'Vendedores crean ventas, cajeros cobran y una zona de despacho entrega el pedido.',
};

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

  // En flujo simple/multicaja: el vendedor DEBE poder cobrar también (no se permiten roles separados)
  // En flujo separado: vendedor solo vende, cajero solo cobra — tener ambos permisos está bien
  const bloqueadoPorModo = requiereOperadorCompleto && !puedeVenderYCobrar;

  const puedeCrearVentaPendiente = usaFlujoSeparado && puedeVender;
  const puedeVerPendientesCobro = usaFlujoSeparado && puedeCobrar;
  const puedeCobrarPendiente = puedeVerPendientesCobro && cajaAbierta;
  const muestraControlesCobro = puedeCobrar && (!usaFlujoSeparado || cajaAbierta);
  const puedeOperarPos =
    permiteCobroDirecto ? puedeVenderYCobrar : puedeVender || puedeCobrar;

  // El bloqueo casi nunca es "te falta un permiso": es que el modo de la sucursal
  // exige un operador que venda Y cobre, y este usuario cumple un solo rol. Decirle
  // "pedí caja.cobrar" manda a un vendedor a pedir un permiso que su rol no deberia
  // tener; el arreglo real es cambiar el modo de la sucursal.
  const nombreModo = esFlujoSimple ? 'SIMPLE' : 'MULTICAJA';
  const sugerenciaModo =
    'Para separar vendedores y cajeros, la sucursal tiene que estar en CAJA_CENTRALIZADA o CON_DESPACHO.';

  let mensajeBloqueo: string | undefined;
  if (bloqueadoPorModo) {
    if (puedeVender) {
      mensajeBloqueo = `Esta sucursal está en modo ${nombreModo}, donde la misma persona vende y cobra. Tu usuario puede vender pero no cobrar. ${sugerenciaModo}`;
    } else if (puedeCobrar) {
      mensajeBloqueo = `Esta sucursal está en modo ${nombreModo}, donde la misma persona vende y cobra. Tu usuario puede cobrar pero no vender. ${sugerenciaModo}`;
    } else {
      mensajeBloqueo = `Esta sucursal está en modo ${nombreModo} y tu usuario no tiene permisos de venta ni de cobro.`;
    }
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
    // Espeja lo que valida el backend al crear la venta (pos-ventas.service.ts):
    // MULTICAJA exige caja propia del vendedor; SIMPLE y los flujos separados solo
    // piden que haya una caja abierta en la sucursal, sin importar quien la abrio.
    requiereCajaParaVender: permiteCobroDirecto,
    requiereCajaPropiaParaVender: esMulticaja,
    requiereCajaParaCobrar: true,
    descripcionModo: DESCRIPCION_MODO[modoPos],
    mensajeBloqueo,
  };
};
