import { Lock, Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useAuthStore } from '../../../store/auth.store';
import { useGetProducts } from '../../Productos/hooks/useProducts';
import { useConfiguracionPos, useServiciosSucursal } from '../../POSAuxiliares/hooks/usePosAux';
import { imprimirComprobante } from '../../POSAuxiliares/utils/printComprobante';
import {
  useAbrirCaja,
  useCajaAbierta,
  useCancelarOrdenMercadoPagoQr,
  useCancelarVentaPendiente,
  useCobrarVentaPendiente,
  consultarEstadoMercadoPagoQrFn,
  useCrearOrdenMercadoPagoQr,
  useClientesPos,
  useCrearCotizacion,
  useCrearVentaQr,
  useCrearVentaCuentaCorriente,
  useCrearVentaPendiente,
  useListasPrecioPos,
  useMediosPagoActivos,
  useVentaCompleta,
  useVentasPendientesCobro,
} from '../hooks/usePos';
import type {
  ICartItem,
  IComprobantePos,
  IPagoPosPayload,
  TipoEmisionFiscal,
  IVentaCompletaResponse,
} from '../types/pos.type';
import { getPosAccessRules } from '../utils/posAccess';
import {
  applyPriceList,
  buildVentaPayload,
  getProductCode,
  getProductPrice,
  getStockForBranch,
  getStockLocationForBranch,
  mapMedioPagoToTipo,
  modoPosLabel,
  toNumber,
  type PaymentDraft,
  type QrOrderState,
} from '../utils/pos.utils';
import PosHeader from '../components/PosHeader';
import PosQrModal from '../components/PosQrModal';
import PosCajeroView from '../components/PosCajeroView';
import PosVendedorView from '../components/PosVendedorView';
import type { IProducto } from '../../Productos/types/productos.type';

const PuntoDeVentaPages = () => {
  const queryClient = useQueryClient();
  const sucursalActiva = useAuthStore((state) => state.sucursalActiva);
  const empleado = useAuthStore((state) => state.empleado);
  const permisos = useAuthStore((state) => state.permisos);
  const [search, setSearch] = useState('');
  const [cartItems, setCartItems] = useState<ICartItem[]>([]);
  const [selectedClienteId, setSelectedClienteId] = useState('');
  const [selectedListaId, setSelectedListaId] = useState('');
  const [selectedPaymentId, setSelectedPaymentId] = useState('');
  const [paymentDrafts, setPaymentDrafts] = useState<PaymentDraft[]>([
    { id: crypto.randomUUID(), medioPagoId: '', monto: '', referencia: '' },
  ]);
  const [emitirTicket, setEmitirTicket] = useState(true);
  const [tipoFiscal, setTipoFiscal] = useState<TipoEmisionFiscal>('TICKET');
  const [montoInicial, setMontoInicial] = useState('1000');
  const [selectedPendienteId, setSelectedPendienteId] = useState<string | null>(null);
  const [pendingSearch, setPendingSearch] = useState('');
  const [qrOrder, setQrOrder] = useState<QrOrderState | null>(null);

  const productsQuery = useGetProducts(1, 200);
  const configQuery = useConfiguracionPos();
  const serviciosQuery = useServiciosSucursal();
  const cajaQuery = useCajaAbierta();
  const mediosPagoQuery = useMediosPagoActivos();
  const clientesQuery = useClientesPos();
  const listasPrecioQuery = useListasPrecioPos();
  const abrirCajaMutation = useAbrirCaja();
  const crearCotizacionMutation = useCrearCotizacion();
  const crearCuentaCorrienteMutation = useCrearVentaCuentaCorriente();
  const crearPendienteMutation = useCrearVentaPendiente();
  const crearVentaQrMutation = useCrearVentaQr();
  const crearOrdenQrMutation = useCrearOrdenMercadoPagoQr();
  const cancelarOrdenQrMutation = useCancelarOrdenMercadoPagoQr();
  const ventaCompletaMutation = useVentaCompleta();
  const cobrarPendienteMutation = useCobrarVentaPendiente();
  const cancelarPendienteMutation = useCancelarVentaPendiente();

  const products = useMemo(() => {
    const response = productsQuery.data;
    const data = Array.isArray(response) ? response : response?.data ?? [];
    return data.filter((product) => product.activo && product.activo_pos);
  }, [productsQuery.data]);

  const mediosPago = mediosPagoQuery.data ?? [];
  const clientes = (clientesQuery.data ?? []).filter((cliente) => cliente.activo);
  const listasPrecio = useMemo(
    () => (listasPrecioQuery.data ?? []).filter((lista) => lista.activa),
    [listasPrecioQuery.data],
  );
  const cajaAbierta = cajaQuery.data;
  const config = configQuery.data;
  const mercadoPagoDisponible = !!serviciosQuery.data?.mercadoPago.disponible;
  const permitePagoMixto = config?.permitir_pago_mixto !== false;
  const permiteListasPrecio = config?.permitir_listas_precio === true;
  const permiteCotizaciones = config?.permitir_cotizaciones === true;
  const permiteCuentaCorriente = config?.permitir_cuenta_corriente === true;
  const puedeAplicarListasPrecio = permiteListasPrecio || listasPrecio.length > 0;
  const selectedLista = listasPrecio.find((lista) => lista.id === selectedListaId);
  const selectedCliente = clientes.find((cliente) => cliente.id === selectedClienteId);
  const selectedPayment =
    selectedPaymentId === 'CUENTA_CORRIENTE'
      ? undefined
      : mediosPago.find((method) => method.id === selectedPaymentId) ?? mediosPago[0];
  const posAccess = getPosAccessRules({ permisos, modoPos: config?.modo_pos, cajaAbierta: !!cajaAbierta });
  const { modoPos, esCajaCentralizada: requiereCajaCentral, esConDespacho: usaDespacho, usaFlujoSeparado, permiteCobroDirecto, puedeVender, puedeCobrar, puedeAbrirCaja, puedeCancelarVenta, bloqueadoPorModo, muestraControlesCobro } = posAccess;
  const esSoloCajero = !puedeVender && puedeCobrar;
  const puedeVerDetallesConfigPos =
    permisos.includes('config.pos') || permisos.includes('reportes.ver') || permisos.includes('reportes.ventas');
  const pendientesQuery = useVentasPendientesCobro(posAccess.puedeVerPendientesCobro);
  const ventasPendientes = pendientesQuery.data ?? [];
  const ventasPendientesFiltradas = useMemo(() => {
    const term = pendingSearch.trim().toLowerCase();
    if (!term) return ventasPendientes;
    return ventasPendientes.filter((venta) => {
      const items = (venta.items ?? []).map((item) => item.descripcion).join(' ').toLowerCase();
      return (
        venta.numero.toLowerCase().includes(term) ||
        venta.estado.toLowerCase().includes(term) ||
        items.includes(term)
      );
    });
  }, [pendingSearch, ventasPendientes]);
  const totalPendiente = ventasPendientesFiltradas.reduce((sum, venta) => sum + toNumber(venta.total), 0);
  const selectedPendiente =
    ventasPendientesFiltradas.find((venta) => venta.id === selectedPendienteId) ??
    ventasPendientesFiltradas[0] ??
    null;
  const cuentaSeleccionada = selectedCliente?.cuentaCorriente ?? null;
  const saldoCuentaSeleccionada = Math.max(0, toNumber(cuentaSeleccionada?.saldo));
  const limiteCuentaSeleccionada = toNumber(cuentaSeleccionada?.limite_credito);
  const disponibleCuentaSeleccionada =
    limiteCuentaSeleccionada > 0 ? Math.max(0, limiteCuentaSeleccionada - saldoCuentaSeleccionada) : 0;
  const subtotal = cartItems.reduce((total, item) => total + item.precioUnitario * item.cantidad, 0);
  const total = subtotal;
  const isBusy =
    ventaCompletaMutation.isPending || crearCotizacionMutation.isPending ||
    crearCuentaCorrienteMutation.isPending || crearPendienteMutation.isPending ||
    crearVentaQrMutation.isPending || crearOrdenQrMutation.isPending ||
    cancelarOrdenQrMutation.isPending || cobrarPendienteMutation.isPending ||
    cancelarPendienteMutation.isPending;

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return products;
    return products.filter((product) => {
      const location = getStockLocationForBranch(product, sucursalActiva?.id).toLowerCase();
      return (
        product.nombre.toLowerCase().includes(term) ||
        getProductCode(product).toLowerCase().includes(term) ||
        location.includes(term)
      );
    });
  }, [products, search, sucursalActiva?.id]);

  const puedeUsarCuentaCorriente = (clienteId?: string | null) => {
    if (!permiteCuentaCorriente || !clienteId) return false;
    const cliente = clientes.find((item) => item.id === clienteId);
    return !!cliente?.cuentaCorriente?.activa;
  };

  const validarLimiteCuentaCorriente = (clienteId: string | null | undefined, montoCuenta: number) => {
    const cliente = clientes.find((item) => item.id === clienteId);
    if (!cliente?.cuentaCorriente?.activa) {
      toast.warning('El cliente no tiene cuenta corriente activa');
      return false;
    }
    const limite = toNumber(cliente.cuentaCorriente.limite_credito);
    const saldoActual = Math.max(0, toNumber(cliente.cuentaCorriente.saldo));
    if (limite > 0 && saldoActual + montoCuenta > limite) {
      toast.warning(`La cuenta corriente supera el limite disponible (${toNumber(Math.max(0, limite - saldoActual))})`);
      return false;
    }
    return true;
  };

  // ─── Effects ───────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!puedeVerDetallesConfigPos) return;
    console.log('[ConfigPOSDebug][front-pos] config query state', {
      isLoading: configQuery.isLoading, isError: configQuery.isError, data: configQuery.data,
      modoPos, permiteListasPrecio, puedeAplicarListasPrecio, permiteCotizaciones,
      requiereCajaCentral, usaFlujoSeparado, puedeVender, puedeCobrar, puedeAbrirCaja,
      bloqueadoPorModo, cajaAbiertaId: cajaAbierta?.id,
    });
  }, [cajaAbierta?.id, configQuery.data, configQuery.isError, configQuery.isLoading, modoPos,
    permiteCotizaciones, permiteListasPrecio, puedeAplicarListasPrecio, posAccess.puedeAbrirCaja,
    posAccess.bloqueadoPorModo, posAccess.puedeCobrar, posAccess.puedeVender,
    puedeVerDetallesConfigPos, requiereCajaCentral, usaFlujoSeparado]);

  useEffect(() => {
    if (!ventasPendientesFiltradas.length) { setSelectedPendienteId(null); return; }
    if (!selectedPendienteId || !ventasPendientesFiltradas.some((v) => v.id === selectedPendienteId)) {
      setSelectedPendienteId(ventasPendientesFiltradas[0].id);
    }
  }, [selectedPendienteId, ventasPendientesFiltradas]);

  useEffect(() => {
    if (!mediosPago.length || selectedPaymentId) return;
    const efectivo =
      mediosPago.find((m) => m.tipo === 'efectivo') ??
      mediosPago.find((m) => m.nombre.toLowerCase().includes('efectivo')) ??
      mediosPago[0];
    setSelectedPaymentId(efectivo.id);
    setPaymentDrafts((current) =>
      current.map((draft, index) =>
        index === 0 && !draft.medioPagoId ? { ...draft, medioPagoId: efectivo.id } : draft,
      ),
    );
  }, [mediosPago, selectedPaymentId]);

  useEffect(() => {
    if (selectedPaymentId !== 'CUENTA_CORRIENTE') return;
    if (puedeUsarCuentaCorriente(selectedClienteId)) return;
    const efectivo =
      mediosPago.find((m) => m.tipo === 'efectivo') ??
      mediosPago.find((m) => m.nombre.toLowerCase().includes('efectivo')) ??
      mediosPago[0];
    setSelectedPaymentId(efectivo?.id ?? '');
  }, [mediosPago, selectedClienteId, selectedPaymentId, permiteCuentaCorriente]);

  useEffect(() => {
    setCartItems((current) =>
      current.map((item) => ({
        ...item,
        precioUnitario: applyPriceList(getProductPrice(item.producto), puedeAplicarListasPrecio ? selectedLista : undefined),
      })),
    );
  }, [puedeAplicarListasPrecio, selectedLista]);

  useEffect(() => {
    if (!esSoloCajero || !selectedPendiente || !permitePagoMixto) return;
    setPaymentDrafts([{
      id: crypto.randomUUID(),
      medioPagoId: selectedPayment?.id ?? mediosPago[0]?.id ?? '',
      monto: String(toNumber(selectedPendiente.total)),
      referencia: '',
    }]);
  }, [esSoloCajero, mediosPago, permitePagoMixto, selectedPayment?.id, selectedPendiente?.id, selectedPendiente?.total]);

  useEffect(() => {
    if (!qrOrder || !sucursalActiva?.id) return;
    const interval = window.setInterval(async () => {
      try {
        const estado = await consultarEstadoMercadoPagoQrFn({ sucursalId: sucursalActiva.id, ventaId: qrOrder.ventaId });
        if (estado.estado === 'aprobado') {
          toast.success('Pago Mercado Pago confirmado');
          setQrOrder((current) => current?.ventaId === qrOrder.ventaId ? { ...current, status: 'confirmed' } : current);
          window.setTimeout(() => { setQrOrder(null); clearCart(); }, 1800);
          queryClient.invalidateQueries({ queryKey: ['products'] });
          queryClient.invalidateQueries({ queryKey: ['pos', 'ventas-pendientes'] });
          queryClient.invalidateQueries({ queryKey: ['pos', 'ventas-caja'] });
          queryClient.invalidateQueries({ queryKey: ['pos', 'caja-abierta'] });
        }
      } catch { /* polling auxiliar */ }
    }, 5000);
    return () => window.clearInterval(interval);
  }, [qrOrder, queryClient, sucursalActiva?.id]);

  // ─── Cart helpers ─────────────────────────────────────────────────────────

  const addProduct = (product: IProducto) => {
    if (!product.id) return;
    const stock = getStockForBranch(product, sucursalActiva?.id);
    const currentQuantity = cartItems.find((item) => item.producto.id === product.id)?.cantidad ?? 0;
    if (stock <= currentQuantity) { toast.warning('No hay mas stock disponible para este producto'); return; }
    setCartItems((current) => {
      const exists = current.find((item) => item.producto.id === product.id);
      if (exists) {
        return current.map((item) =>
          item.producto.id === product.id ? { ...item, cantidad: item.cantidad + 1 } : item,
        );
      }
      return [...current, {
        producto: product, cantidad: 1,
        precioUnitario: applyPriceList(getProductPrice(product), puedeAplicarListasPrecio ? selectedLista : undefined),
      }];
    });
  };

  const changeQuantity = (productId: string | undefined, delta: number) => {
    if (!productId) return;
    setCartItems((current) =>
      current.map((item) => {
        if (item.producto.id !== productId) return item;
        const stock = getStockForBranch(item.producto, sucursalActiva?.id);
        return { ...item, cantidad: Math.max(0, Math.min(item.cantidad + delta, stock)) };
      }).filter((item) => item.cantidad > 0),
    );
  };

  const removeProduct = (productId: string | undefined) => {
    setCartItems((current) => current.filter((item) => item.producto.id !== productId));
  };

  const clearCart = () => {
    setCartItems([]);
    setSelectedClienteId('');
    setPaymentDrafts([{ id: crypto.randomUUID(), medioPagoId: selectedPayment?.id ?? mediosPago[0]?.id ?? '', monto: '', referencia: '' }]);
  };

  // ─── Payment draft helpers ────────────────────────────────────────────────

  const addPaymentDraft = () => {
    setPaymentDrafts((current) => [...current, { id: crypto.randomUUID(), medioPagoId: selectedPayment?.id ?? mediosPago[0]?.id ?? '', monto: '', referencia: '' }]);
  };
  const updatePaymentDraft = (id: string, patch: Partial<PaymentDraft>) => {
    setPaymentDrafts((current) => current.map((draft) => (draft.id === id ? { ...draft, ...patch } : draft)));
  };
  const removePaymentDraft = (id: string) => {
    setPaymentDrafts((current) => current.length === 1 ? current : current.filter((draft) => draft.id !== id));
  };

  // ─── Sale actions ─────────────────────────────────────────────────────────

  const validateSale = () => {
    if (!sucursalActiva) { toast.warning('Seleccione una sucursal para vender'); return false; }
    if (!posAccess.puedeOperarPos || bloqueadoPorModo) { toast.warning(posAccess.mensajeBloqueo ?? 'Este usuario no puede operar el punto de venta'); return false; }
    if (!puedeVender) { toast.warning('No tenes permisos para crear ventas'); return false; }
    if (!cartItems.length) { toast.warning('Agregue productos al carrito'); return false; }
    return true;
  };

  const buildPagos = (amount: number, clienteIdPago?: string | null): IPagoPosPayload[] | null => {
    if (permitePagoMixto) {
      const pagos = paymentDrafts
        .map((draft) => ({
          draft,
          esCuentaCorriente: draft.medioPagoId === 'CUENTA_CORRIENTE',
          medio: mediosPago.find((m) => m.id === (draft.medioPagoId || selectedPayment?.id || mediosPago[0]?.id)),
          monto: toNumber(draft.monto),
        }))
        .filter((item) => (item.medio || item.esCuentaCorriente) && item.monto > 0);
      if (!pagos.length) { toast.warning('Agregue al menos un pago'); return null; }
      if (pagos.some((p) => p.esCuentaCorriente) && !(clienteIdPago || selectedClienteId)) { toast.warning('Seleccione un cliente para cobrar por cuenta corriente'); return null; }
      if (pagos.some((p) => p.esCuentaCorriente) && !permiteCuentaCorriente) { toast.warning('La cuenta corriente no esta habilitada para esta sucursal'); return null; }
      const totalCC = pagos.filter((p) => p.esCuentaCorriente).reduce((sum, p) => sum + p.monto, 0);
      if (totalCC > 0 && !validarLimiteCuentaCorriente(clienteIdPago || selectedClienteId, totalCC)) return null;
      if (Math.abs(pagos.reduce((sum, p) => sum + p.monto, 0) - amount) > 0.01) { toast.warning('La suma de pagos debe coincidir con el total'); return null; }
      return pagos.map(({ draft, medio, monto, esCuentaCorriente }) => ({
        tipo: esCuentaCorriente ? 'CUENTA_CORRIENTE' : mapMedioPagoToTipo(medio),
        medio_pago_id: esCuentaCorriente ? null : medio!.id,
        monto,
        referencia: draft.referencia.trim() || null,
      }));
    }
    if (selectedPaymentId === 'CUENTA_CORRIENTE') {
      const clienteId = clienteIdPago || selectedClienteId;
      if (!clienteId) { toast.warning('Seleccione un cliente para cobrar por cuenta corriente'); return null; }
      if (!permiteCuentaCorriente) { toast.warning('La cuenta corriente no esta habilitada para esta sucursal'); return null; }
      if (!validarLimiteCuentaCorriente(clienteId, amount)) return null;
      return [{ tipo: 'CUENTA_CORRIENTE', medio_pago_id: null, monto: amount }];
    }
    if (!selectedPayment) { toast.warning('Seleccione un medio de pago'); return null; }
    return [{ tipo: mapMedioPagoToTipo(selectedPayment), medio_pago_id: selectedPayment.id, monto: amount }];
  };

  const imprimirVentaRegistrada = (response: IVentaCompletaResponse, printWindow?: Window | null) => {
    if (!config?.imprimir_automaticamente) return;
    const comprobante = response.comprobanteFiscal ?? response.venta;
    imprimirComprobante(comprobante, { titulo: comprobante.tipo === 'VENTA' ? 'Venta POS' : comprobante.tipo, config, printWindow });
  };

  const handleAbrirCaja = () => {
    if (!puedeAbrirCaja) { toast.warning('No tenes permisos para abrir caja'); return; }
    abrirCajaMutation.mutate(toNumber(montoInicial));
  };

  const handleEnviarACaja = () => {
    if (!validateSale()) return;
    if (!posAccess.puedeCrearVentaPendiente) { toast.warning('Esta accion solo aplica para caja centralizada o despacho'); return; }
    crearPendienteMutation.mutate(buildVentaPayload(cartItems, empleado?.id, selectedClienteId, selectedLista?.id), { onSuccess: () => clearCart() });
  };

  const crearOrdenQrParaVenta = (venta: IComprobantePos) => {
    if (!mercadoPagoDisponible) { toast.warning('Mercado Pago no esta configurado para esta sucursal'); return; }
    if (!sucursalActiva?.id || !cajaAbierta?.id) { toast.warning('Abra una caja y seleccione una sucursal para cobrar con QR'); return; }
    crearOrdenQrMutation.mutate({
      sucursalId: sucursalActiva.id, ventaId: venta.id, cajaId: cajaAbierta.id,
      total: toNumber(venta.total),
      items: (venta.items ?? []).map((item) => ({ titulo: item.descripcion || 'Producto', cantidad: toNumber(item.cantidad), precioUnitario: toNumber(item.precio_unitario) })),
    }, {
      onSuccess: (orden) => {
        setQrOrder({ ventaId: venta.id, numero: venta.numero, total: toNumber(venta.total), orden, status: 'waiting' });
        queryClient.invalidateQueries({ queryKey: ['pos', 'ventas-pendientes'] });
      },
    });
  };

  const handleCobrarQrCarrito = () => {
    if (!mercadoPagoDisponible) { toast.warning('Mercado Pago no esta configurado para esta sucursal'); return; }
    if (!validateSale() || !cajaAbierta) return;
    if (!posAccess.puedeVenderYCobrar) { toast.warning('No tenes permisos para cobrar ventas'); return; }
    crearVentaQrMutation.mutate(buildVentaPayload(cartItems, empleado?.id, selectedClienteId, selectedLista?.id), {
      onSuccess: (venta) => { crearOrdenQrParaVenta(venta); clearCart(); },
    });
  };

  const handleCobrarQrPendiente = (venta: IComprobantePos) => {
    if (!mercadoPagoDisponible) { toast.warning('Mercado Pago no esta configurado para esta sucursal'); return; }
    if (!cajaAbierta) { toast.warning('Abra una caja para cobrar con QR'); return; }
    if (!posAccess.puedeCobrarPendiente && !posAccess.puedeVenderYCobrar) { toast.warning('No tenes permisos para cobrar ventas'); return; }
    crearOrdenQrParaVenta(venta);
  };

  const handleCancelarQr = () => {
    if (!sucursalActiva?.id || !qrOrder) return;
    cancelarOrdenQrMutation.mutate({ sucursalId: sucursalActiva.id }, {
      onSuccess: () => {
        if (puedeCancelarVenta) {
          cancelarPendienteMutation.mutate({ ventaId: qrOrder.ventaId, motivo: 'Venta QR cancelada desde POS' });
        }
        setQrOrder(null);
      },
    });
  };

  const handleCargarCuentaCorriente = () => {
    if (!validateSale()) return;
    if (!posAccess.puedeCrearVentaPendiente) { toast.warning('Esta accion solo aplica para caja centralizada o despacho'); return; }
    if (!selectedClienteId) { toast.warning('Seleccione un cliente para cargar a cuenta corriente'); return; }
    if (!validarLimiteCuentaCorriente(selectedClienteId, total)) return;
    crearCuentaCorrienteMutation.mutate(buildVentaPayload(cartItems, empleado?.id, selectedClienteId, selectedLista?.id), { onSuccess: () => clearCart() });
  };

  const handleCrearCotizacion = () => {
    if (!validateSale()) return;
    crearCotizacionMutation.mutate(buildVentaPayload(cartItems, empleado?.id, selectedClienteId, selectedLista?.id), { onSuccess: () => clearCart() });
  };

  const handleFinalizarVenta = () => {
    if (!validateSale() || !cajaAbierta) return;
    if (!posAccess.puedeVenderYCobrar) { toast.warning('No tenes permisos para cobrar ventas'); return; }
    if (!permiteCobroDirecto) { toast.warning('Esta sucursal trabaja con caja centralizada. Envie la venta a caja.'); return; }
    const pagos = buildPagos(total, selectedClienteId);
    if (!pagos) return;
    const printWindow = config?.imprimir_automaticamente ? window.open('', '_blank', 'width=900,height=700') : null;
    ventaCompletaMutation.mutate({
      venta: buildVentaPayload(cartItems, empleado?.id, selectedClienteId, selectedLista?.id),
      cajaId: cajaAbierta.id, pagos, emitirComprobante: emitirTicket, tipoFiscal,
    }, {
      onSuccess: (response) => { imprimirVentaRegistrada(response, printWindow); clearCart(); },
      onError: () => printWindow?.close(),
    });
  };

  const handleCobrarPendiente = (venta: IComprobantePos) => {
    if (!cajaAbierta) { toast.warning('Abra una caja para cobrar'); return; }
    if (!posAccess.puedeCobrarPendiente) { toast.warning('No tenes permisos para cobrar ventas'); return; }
    const pagos = buildPagos(toNumber(venta.total), venta.cliente_id);
    if (!pagos) return;
    const printWindow = config?.imprimir_automaticamente ? window.open('', '_blank', 'width=900,height=700') : null;
    cobrarPendienteMutation.mutate({
      ventaId: venta.id, cajaId: cajaAbierta.id, pagos, emitirComprobante: emitirTicket, tipoFiscal,
    }, {
      onSuccess: (response) => { imprimirVentaRegistrada(response, printWindow); },
      onError: () => printWindow?.close(),
    });
  };

  const handleCancelarPendiente = (venta: IComprobantePos) => {
    if (!puedeCancelarVenta) { toast.warning('No tenes permisos para cancelar ventas'); return; }
    if (!window.confirm(`Cancelar la venta pendiente ${venta.numero}?`)) return;
    cancelarPendienteMutation.mutate({ ventaId: venta.id, motivo: 'Venta pendiente cancelada desde punto de venta' });
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-[calc(100vh-52px)] bg-[#f3f4f6] px-4 py-4">
      {qrOrder ? (
        <PosQrModal
          qrOrder={qrOrder}
          isCancelando={cancelarOrdenQrMutation.isPending}
          onCancelar={handleCancelarQr}
        />
      ) : null}
      <div className="mx-auto flex max-w-400 flex-col gap-4">
        <section className="rounded-lg border border-[#c4c6cd] bg-white shadow-sm">
          <PosHeader
            sucursalNombre={sucursalActiva?.nombre ?? 'Sin sucursal'}
            empleadoNombre={empleado?.nombreCompleto ?? 'Usuario'}
            cajaAbierta={cajaAbierta}
            listasPrecio={listasPrecio}
            listasPrecioLoading={listasPrecioQuery.isLoading}
            selectedListaId={selectedListaId}
            selectedLista={selectedLista}
            selectedClienteId={selectedClienteId}
            clientes={clientes}
            tipoFiscal={tipoFiscal}
            emitirTicket={emitirTicket}
            montoInicial={montoInicial}
            posAccess={posAccess}
            muestraControlesCobro={muestraControlesCobro}
            permiteCobroDirecto={permiteCobroDirecto}
            usaFlujoSeparado={usaFlujoSeparado}
            puedeVerDetallesConfigPos={puedeVerDetallesConfigPos}
            configFetching={configQuery.isFetching}
            abrirCajaIsPending={abrirCajaMutation.isPending}
            onClienteChange={setSelectedClienteId}
            onListaChange={setSelectedListaId}
            onTipoFiscalChange={setTipoFiscal}
            onEmitirTicketChange={setEmitirTicket}
            onMontoInicialChange={setMontoInicial}
            onAbrirCaja={handleAbrirCaja}
          />

          {bloqueadoPorModo || !posAccess.puedeOperarPos ? (
            <div className="border-b border-[#c4c6cd] bg-white px-4 py-12">
              <div className="mx-auto max-w-190 rounded border border-[#f1c7c7] bg-[#fff5f5] px-5 py-5 text-center">
                <Lock size={28} className="mx-auto mb-3 text-[#b42318]" />
                <h2 className="text-[18px] font-bold text-[#041627]">Punto de venta bloqueado</h2>
                <p className="mt-2 text-[14px] text-[#44474c]">
                  {posAccess.mensajeBloqueo ?? `El modo ${modoPosLabel[modoPos] ?? modoPos} no permite operar con este usuario.`}
                </p>
                <div className="mt-4 grid gap-2 text-left text-[13px] sm:grid-cols-2">
                  <div className={`rounded border px-3 py-2 ${puedeVender ? 'border-[#cfe2de] bg-white text-[#075E54]' : 'border-[#f1c7c7] bg-white text-[#b42318]'}`}>
                    Permiso ventas.crear: {puedeVender ? 'activo' : 'faltante'}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {!bloqueadoPorModo && posAccess.puedeOperarPos ? (
            esSoloCajero ? (
              <PosCajeroView
                ventasPendientes={ventasPendientesFiltradas}
                pendingSearch={pendingSearch}
                selectedPendienteId={selectedPendienteId}
                selectedPendiente={selectedPendiente}
                totalPendiente={totalPendiente}
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
                cobrarPendienteIsPending={cobrarPendienteMutation.isPending}
                crearOrdenQrIsPending={crearOrdenQrMutation.isPending}
                puedeUsarCuentaCorriente={puedeUsarCuentaCorriente}
                onPendingSearchChange={setPendingSearch}
                onSelectPendiente={setSelectedPendienteId}
                onCobrar={handleCobrarPendiente}
                onCobrarQr={handleCobrarQrPendiente}
                onCancelar={handleCancelarPendiente}
                onLimpiarPagos={clearCart}
                onAddPaymentDraft={addPaymentDraft}
                onUpdatePaymentDraft={updatePaymentDraft}
                onRemovePaymentDraft={removePaymentDraft}
              />
            ) : (
              <PosVendedorView
                sucursalId={sucursalActiva?.id}
                filteredProducts={filteredProducts}
                productsLoading={productsQuery.isLoading}
                cartItems={cartItems}
                mediosPago={mediosPago}
                selectedPaymentId={selectedPaymentId}
                selectedLista={selectedLista}
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
                cuentaSeleccionada={cuentaSeleccionada}
                saldoCuentaSeleccionada={saldoCuentaSeleccionada}
                limiteCuentaSeleccionada={limiteCuentaSeleccionada}
                disponibleCuentaSeleccionada={disponibleCuentaSeleccionada}
                permiteCuentaCorriente={permiteCuentaCorriente}
                ventasPendientes={ventasPendientes}
                pendientesLoading={pendientesQuery.isLoading}
                search={search}
                subtotal={subtotal}
                total={total}
                isBusy={isBusy}
                ventaCompletaIsPending={ventaCompletaMutation.isPending}
                crearVentaQrIsPending={crearVentaQrMutation.isPending}
                crearOrdenQrIsPending={crearOrdenQrMutation.isPending}
                crearCuentaCorrienteIsPending={crearCuentaCorrienteMutation.isPending}
                cobrarPendienteIsPending={cobrarPendienteMutation.isPending}
                onSearchChange={setSearch}
                onAddProduct={addProduct}
                onChangeQuantity={changeQuantity}
                onRemoveProduct={removeProduct}
                onClearCart={clearCart}
                onCotizar={handleCrearCotizacion}
                onEnviarACaja={handleEnviarACaja}
                onCargarCuentaCorriente={handleCargarCuentaCorriente}
                onFinalizar={handleFinalizarVenta}
                onCobrarQrCarrito={handleCobrarQrCarrito}
                onCobrarPendiente={handleCobrarPendiente}
                onAddPaymentDraft={addPaymentDraft}
                onUpdatePaymentDraft={updatePaymentDraft}
                onRemovePaymentDraft={removePaymentDraft}
              />
            )
          ) : null}
        </section>
      </div>
    </div>
  );
};

export default PuntoDeVentaPages;
