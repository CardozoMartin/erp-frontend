import {
  ArrowDownCircle,
  Calculator,
  Clock,
  CreditCard,
  Lock,
  Loader2,
  Minus,
  PackageMinus,
  Plus,
  QrCode,
  ReceiptText,
  Search,
  Send,
  Trash2,
  Truck,
  Wallet,
  XCircle,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import DataTable from '../../../components/common/DataTable';
import type { DataTableColumn } from '../../../components/common/DataTable';
import { useAuthStore } from '../../../store/auth.store';
import { useGetProducts } from '../../Productos/hooks/useProducts';
import type { IProducto, IStock } from '../../Productos/types/productos.type';
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
  IListaPrecioPos,
  IComprobantePos,
  IMercadoPagoQrOrdenResponse,
  IMedioPago,
  IPagoPosPayload,
  TipoEmisionFiscal,
  TipoPagoPos,
  IVentaPosPayload,
  IVentaCompletaResponse,
} from '../types/pos.type';
import { getPosAccessRules } from '../utils/posAccess';

type PaymentDraft = {
  id: string;
  medioPagoId: string;
  monto: string;
  referencia: string;
};

type QrOrderState = {
  ventaId: string;
  numero: string;
  total: number;
  orden: IMercadoPagoQrOrdenResponse;
  status: 'waiting' | 'confirmed';
};

const CheckCircleIcon = ({ large = false }: { large?: boolean }) => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    className={large ? 'h-20 w-20' : 'h-[17px] w-[17px] text-[#075E54]'}
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <path d="m9 11 3 3L22 4" />
  </svg>
);

const formatCurrency = (value: number) =>
  value.toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  });

const toNumber = (value: unknown, fallback = 0) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
};

const getProductPrice = (product: IProducto) =>
  toNumber(product.precio_venta ?? product.precio_base);

const applyPriceList = (price: number, list?: IListaPrecioPos) => {
  if (!list) return price;
  const factor = toNumber(list.porcentaje) / 100;
  const adjustedPrice =
    list.tipo_ajuste === 'DESCUENTO' ? price * (1 - factor) : price * (1 + factor);
  const ivaFactor = toNumber(list.porcentaje_iva) / 100;
  const finalPrice =
    list.modo_iva === 'AGREGAR_IVA' ? adjustedPrice * (1 + ivaFactor) : adjustedPrice;
  return Number(finalPrice.toFixed(2));
};

const describePriceList = (list?: IListaPrecioPos) => {
  if (!list) return 'Precio base';
  const porcentaje = toNumber(list.porcentaje);
  const parts =
    porcentaje > 0
      ? [
          list.tipo_ajuste === 'DESCUENTO'
            ? `${porcentaje}% desc.`
            : `${porcentaje}% recargo`,
        ]
      : ['Sin desc./recargo'];
  if (list.cuotas) parts.push(`${list.cuotas} cuotas`);
  if (list.modo_iva === 'AGREGAR_IVA') parts.push(`+ IVA ${toNumber(list.porcentaje_iva)}%`);
  if (list.modo_iva === 'IVA_INCLUIDO') parts.push('IVA incluido');
  return parts.join(' | ');
};

const getProductCode = (product: IProducto) => product.codigo_barras || product.id || '-';

const getStockForBranch = (product: IProducto, sucursalId?: string | null) => {
  if (!product.stock?.length) return 0;
  const stocks = product.stock.filter((item: IStock) => {
    if (!sucursalId) return true;
    return !item.sucursal_id || item.sucursal_id === sucursalId;
  });
  return stocks.reduce((sum, item) => sum + toNumber(item.cantidad), 0);
};

const getStockLocationForBranch = (product: IProducto, sucursalId?: string | null) => {
  const stocks = product.stock ?? [];
  const selectedStock =
    stocks.find((item) => sucursalId && item.sucursal_id === sucursalId) ??
    stocks.find((item) => !item.sucursal_id) ??
    stocks[0];

  const parts = [
    selectedStock?.deposito,
    selectedStock?.pasillo,
    selectedStock?.estante,
    selectedStock?.sector,
    selectedStock?.codigo_ubicacion ? `Cod. ${selectedStock.codigo_ubicacion}` : null,
    selectedStock?.ubicacion_referencia,
  ]
    .map((part) => part?.toString?.().trim())
    .filter(Boolean);

  return parts.length ? parts.join(' | ') : 'Sin ubicacion';
};

const mapMedioPagoToTipo = (medio?: IMedioPago): TipoPagoPos => {
  if (!medio) return 'EFECTIVO';
  const nombre = medio.nombre.toLowerCase();
  if (medio.tipo === 'efectivo') return 'EFECTIVO';
  if (medio.tipo === 'transferencia') return 'TRANSFERENCIA';
  if (medio.tipo === 'qr') return 'QR';
  if (medio.tipo === 'tarjeta' && nombre.includes('deb')) return 'TARJETA_DEBITO';
  if (medio.tipo === 'tarjeta') return 'TARJETA_CREDITO';
  return 'OTRO';
};

const modoPosLabel: Record<string, string> = {
  SIMPLE: 'Simple',
  MULTICAJA: 'Multicaja',
  CAJA_CENTRALIZADA: 'Caja centralizada',
  CON_DESPACHO: 'Con despacho',
};

const buildVentaPayload = (
  cartItems: ICartItem[],
  empleadoId?: string,
  clienteId?: string | null,
  listaPrecioId?: string | null,
): IVentaPosPayload => ({
  cliente_id: clienteId || null,
  empleado_vendedor_id: empleadoId ?? null,
  lista_precio_id: listaPrecioId || null,
  observaciones: 'Venta creada desde punto de venta',
  items: cartItems.map((item) => ({
    producto_id: item.producto.id!,
    variante_id: null,
    descripcion: item.producto.nombre,
    cantidad: item.cantidad,
    precio_unitario: item.precioUnitario,
  })),
});

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
  const posAccess = getPosAccessRules({
    permisos,
    modoPos: config?.modo_pos,
    cajaAbierta: !!cajaAbierta,
  });
  const modoPos = posAccess.modoPos;
  const requiereCajaCentral = posAccess.esCajaCentralizada;
  const usaDespacho = posAccess.esConDespacho;
  const usaFlujoSeparado = posAccess.usaFlujoSeparado;
  const permiteCobroDirecto = posAccess.permiteCobroDirecto;
  const puedeVender = posAccess.puedeVender;
  const puedeCobrar = posAccess.puedeCobrar;
  const puedeAbrirCaja = posAccess.puedeAbrirCaja;
  const puedeCancelarVenta = posAccess.puedeCancelarVenta;
  const esSoloCajero = !puedeVender && puedeCobrar;
  const bloqueadoPorModo = posAccess.bloqueadoPorModo;
  const muestraControlesCobro = posAccess.muestraControlesCobro;
  const puedeVerDetallesConfigPos =
    permisos.includes('config.pos') || permisos.includes('reportes.ver') || permisos.includes('reportes.ventas');
  const pendientesQuery = useVentasPendientesCobro(posAccess.puedeVerPendientesCobro);
  const ventasPendientes = pendientesQuery.data ?? [];
  const ventasPendientesFiltradas = useMemo(() => {
    const term = pendingSearch.trim().toLowerCase();
    if (!term) return ventasPendientes;
    return ventasPendientes.filter((venta) => {
      const items = (venta.items ?? [])
        .map((item) => item.descripcion)
        .join(' ')
        .toLowerCase();
      return (
        venta.numero.toLowerCase().includes(term) ||
        venta.estado.toLowerCase().includes(term) ||
        items.includes(term)
      );
    });
  }, [pendingSearch, ventasPendientes]);
  const totalPendiente = ventasPendientesFiltradas.reduce(
    (sum, venta) => sum + toNumber(venta.total),
    0,
  );
  const selectedPendiente =
    ventasPendientesFiltradas.find((venta) => venta.id === selectedPendienteId) ??
    ventasPendientesFiltradas[0] ??
    null;
  const cuentaSeleccionada = selectedCliente?.cuentaCorriente ?? null;
  const saldoCuentaSeleccionada = Math.max(0, toNumber(cuentaSeleccionada?.saldo));
  const limiteCuentaSeleccionada = toNumber(cuentaSeleccionada?.limite_credito);
  const disponibleCuentaSeleccionada =
    limiteCuentaSeleccionada > 0
      ? Math.max(0, limiteCuentaSeleccionada - saldoCuentaSeleccionada)
      : 0;
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
      toast.warning(
        `La cuenta corriente supera el limite disponible (${formatCurrency(Math.max(0, limite - saldoActual))})`,
      );
      return false;
    }
    return true;
  };

  useEffect(() => {
    if (!puedeVerDetallesConfigPos) return;
    console.log('[ConfigPOSDebug][front-pos] config query state', {
      isLoading: configQuery.isLoading,
      isError: configQuery.isError,
      data: configQuery.data,
      modoPos,
      permiteListasPrecio,
      puedeAplicarListasPrecio,
      permiteCotizaciones,
      requiereCajaCentral,
      usaFlujoSeparado,
      puedeVender,
      puedeCobrar,
      puedeAbrirCaja,
      bloqueadoPorModo,
    cajaAbiertaId: cajaAbierta?.id,
    });
  }, [
    cajaAbierta?.id,
    configQuery.data,
    configQuery.isError,
    configQuery.isLoading,
    modoPos,
    permiteCotizaciones,
    permiteListasPrecio,
    puedeAplicarListasPrecio,
    puedeAbrirCaja,
    bloqueadoPorModo,
    puedeCobrar,
    puedeVender,
    puedeVerDetallesConfigPos,
    requiereCajaCentral,
    usaFlujoSeparado,
  ]);

  useEffect(() => {
    if (!ventasPendientesFiltradas.length) {
      setSelectedPendienteId(null);
      return;
    }
    if (!selectedPendienteId || !ventasPendientesFiltradas.some((venta) => venta.id === selectedPendienteId)) {
      setSelectedPendienteId(ventasPendientesFiltradas[0].id);
    }
  }, [selectedPendienteId, ventasPendientesFiltradas]);

  useEffect(() => {
    if (!mediosPago.length || selectedPaymentId) return;
    const efectivo =
      mediosPago.find((medio) => medio.tipo === 'efectivo') ??
      mediosPago.find((medio) => medio.nombre.toLowerCase().includes('efectivo')) ??
      mediosPago[0];
    setSelectedPaymentId(efectivo.id);
    setPaymentDrafts((current) =>
      current.map((draft, index) =>
        index === 0 && !draft.medioPagoId
          ? { ...draft, medioPagoId: efectivo.id }
          : draft,
      ),
    );
  }, [mediosPago, selectedPaymentId]);

  useEffect(() => {
    if (selectedPaymentId !== 'CUENTA_CORRIENTE') return;
    if (puedeUsarCuentaCorriente(selectedClienteId)) return;
    const efectivo =
      mediosPago.find((medio) => medio.tipo === 'efectivo') ??
      mediosPago.find((medio) => medio.nombre.toLowerCase().includes('efectivo')) ??
      mediosPago[0];
    setSelectedPaymentId(efectivo?.id ?? '');
  }, [mediosPago, selectedClienteId, selectedPaymentId, permiteCuentaCorriente]);

  useEffect(() => {
    setCartItems((current) =>
      current.map((item) => ({
        ...item,
        precioUnitario: applyPriceList(
          getProductPrice(item.producto),
          puedeAplicarListasPrecio ? selectedLista : undefined,
        ),
      })),
    );
  }, [puedeAplicarListasPrecio, selectedLista]);

  useEffect(() => {
    if (!esSoloCajero || !selectedPendiente || !permitePagoMixto) return;
    setPaymentDrafts([
      {
        id: crypto.randomUUID(),
        medioPagoId: selectedPayment?.id ?? mediosPago[0]?.id ?? '',
        monto: String(toNumber(selectedPendiente.total)),
        referencia: '',
      },
    ]);
  }, [
    esSoloCajero,
    mediosPago,
    permitePagoMixto,
    selectedPayment?.id,
    selectedPendiente?.id,
    selectedPendiente?.total,
  ]);

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

  const subtotal = cartItems.reduce(
    (total, item) => total + item.precioUnitario * item.cantidad,
    0,
  );
  const total = subtotal;
  const isBusy =
    ventaCompletaMutation.isPending ||
    crearCotizacionMutation.isPending ||
    crearCuentaCorrienteMutation.isPending ||
    crearPendienteMutation.isPending ||
    crearVentaQrMutation.isPending ||
    crearOrdenQrMutation.isPending ||
    cancelarOrdenQrMutation.isPending ||
    cobrarPendienteMutation.isPending ||
    cancelarPendienteMutation.isPending;

  useEffect(() => {
    if (!qrOrder || !sucursalActiva?.id) return;
    const interval = window.setInterval(async () => {
      try {
        const estado = await consultarEstadoMercadoPagoQrFn({
          sucursalId: sucursalActiva.id,
          ventaId: qrOrder.ventaId,
        });
        if (estado.estado === 'aprobado') {
          toast.success('Pago Mercado Pago confirmado');
          setQrOrder((current) =>
            current?.ventaId === qrOrder.ventaId ? { ...current, status: 'confirmed' } : current,
          );
          window.setTimeout(() => {
            setQrOrder(null);
            clearCart();
          }, 1800);
          queryClient.invalidateQueries({ queryKey: ['products'] });
          queryClient.invalidateQueries({ queryKey: ['pos', 'ventas-pendientes'] });
          queryClient.invalidateQueries({ queryKey: ['pos', 'ventas-caja'] });
          queryClient.invalidateQueries({ queryKey: ['pos', 'caja-abierta'] });
        }
      } catch {
        // El polling es auxiliar; el webhook sigue siendo la fuente real del cobro.
      }
    }, 5000);
    return () => window.clearInterval(interval);
  }, [qrOrder, queryClient, sucursalActiva?.id]);

  const addProduct = (product: IProducto) => {
    if (!product.id) return;
    const stock = getStockForBranch(product, sucursalActiva?.id);
    const currentQuantity =
      cartItems.find((item) => item.producto.id === product.id)?.cantidad ?? 0;
    if (stock <= currentQuantity) {
      toast.warning('No hay mas stock disponible para este producto');
      return;
    }

    setCartItems((current) => {
      const exists = current.find((item) => item.producto.id === product.id);
      if (exists) {
        return current.map((item) =>
          item.producto.id === product.id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item,
        );
      }
      return [
        ...current,
        {
          producto: product,
          cantidad: 1,
          precioUnitario: applyPriceList(
            getProductPrice(product),
            puedeAplicarListasPrecio ? selectedLista : undefined,
          ),
        },
      ];
    });
  };

  const changeQuantity = (productId: string | undefined, delta: number) => {
    if (!productId) return;
    setCartItems((current) =>
      current
        .map((item) => {
          if (item.producto.id !== productId) return item;
          const nextQuantity = item.cantidad + delta;
          const stock = getStockForBranch(item.producto, sucursalActiva?.id);
          return {
            ...item,
            cantidad: Math.max(0, Math.min(nextQuantity, stock)),
          };
        })
        .filter((item) => item.cantidad > 0),
    );
  };

  const removeProduct = (productId: string | undefined) => {
    setCartItems((current) => current.filter((item) => item.producto.id !== productId));
  };

  const clearCart = () => {
    setCartItems([]);
    setSelectedClienteId('');
    setPaymentDrafts([
      {
        id: crypto.randomUUID(),
        medioPagoId: selectedPayment?.id ?? mediosPago[0]?.id ?? '',
        monto: '',
        referencia: '',
      },
    ]);
  };

  const imprimirVentaRegistrada = (
    response: IVentaCompletaResponse,
    printWindow?: Window | null,
  ) => {
    if (!config?.imprimir_automaticamente) return;
    const comprobante = response.comprobanteFiscal ?? response.venta;
    imprimirComprobante(comprobante, {
      titulo: comprobante.tipo === 'VENTA' ? 'Venta POS' : comprobante.tipo,
      config,
      printWindow,
    });
  };

  const productosColumns: DataTableColumn<IProducto>[] = [
    {
      key: 'producto',
      header: 'Producto',
      render: (product) => <span className="font-medium text-[#041627]">{product.nombre}</span>,
    },
    { key: 'codigo', header: 'Codigo', render: (product) => getProductCode(product) },
    {
      key: 'stock',
      header: 'Stock',
      align: 'right',
      render: (product) => getStockForBranch(product, sucursalActiva?.id),
    },
    {
      key: 'ubicacion',
      header: 'Ubicacion',
      render: (product) => (
        <span className="block max-w-[240px] whitespace-normal text-[12px] leading-snug text-[#44474c]">
          {getStockLocationForBranch(product, sucursalActiva?.id)}
        </span>
      ),
    },
    {
      key: 'precio',
      header: 'Precio',
      align: 'right',
      render: (product) => (
        <span className="font-semibold text-[#041627]">
          {formatCurrency(
            applyPriceList(getProductPrice(product), puedeAplicarListasPrecio ? selectedLista : undefined),
          )}
        </span>
      ),
    },
    {
      key: 'accion',
      header: 'Accion',
      align: 'center',
      render: (product) => {
        const stock = getStockForBranch(product, sucursalActiva?.id);
        return (
          <button
            type="button"
            onClick={() => addProduct(product)}
            disabled={stock <= 0 || !puedeVender}
            className="inline-flex items-center gap-1 rounded border border-[#c4c6cd] bg-white px-3 py-1.5 text-[12px] font-medium text-[#075E54] hover:bg-[#f3fbf9] disabled:text-[#9ca3af]"
          >
            <Plus size={14} />
            Agregar
          </button>
        );
      },
    },
  ];

  const carritoColumns: DataTableColumn<ICartItem>[] = [
    {
      key: 'producto',
      header: 'Producto',
      render: (item) => <span className="font-medium text-[#041627]">{item.producto.nombre}</span>,
    },
    {
      key: 'cantidad',
      header: 'Cant.',
      align: 'center',
      render: (item) => (
        <div className="flex items-center justify-center gap-1">
          <button
            type="button"
            onClick={() => changeQuantity(item.producto.id, -1)}
            className="inline-flex h-7 w-7 items-center justify-center rounded border border-[#c4c6cd] bg-white text-[#041627] hover:bg-[#f4f5f6]"
          >
            <Minus size={13} />
          </button>
          <span className="inline-flex h-7 min-w-9 items-center justify-center rounded border border-[#e5e7eb] bg-[#f8fafc] px-2 text-[13px]">
            {item.cantidad}
          </span>
          <button
            type="button"
            onClick={() => changeQuantity(item.producto.id, 1)}
            className="inline-flex h-7 w-7 items-center justify-center rounded border border-[#c4c6cd] bg-white text-[#041627] hover:bg-[#f4f5f6]"
          >
            <Plus size={13} />
          </button>
        </div>
      ),
    },
    {
      key: 'total',
      header: 'Total',
      align: 'right',
      render: (item) => (
        <span className="font-semibold text-[#041627]">
          {formatCurrency(item.precioUnitario * item.cantidad)}
        </span>
      ),
    },
    {
      key: 'quitar',
      header: 'Quitar',
      align: 'center',
      render: (item) => (
        <button
          type="button"
          onClick={() => removeProduct(item.producto.id)}
          className="inline-flex h-8 w-8 items-center justify-center rounded border border-[#f1c7c7] bg-[#fff5f5] text-[#b42318] hover:bg-[#fdecec]"
        >
          <Trash2 size={14} />
        </button>
      ),
    },
  ];

  const validateSale = () => {
    if (!sucursalActiva) {
      toast.warning('Seleccione una sucursal para vender');
      return false;
    }
    if (!posAccess.puedeOperarPos || bloqueadoPorModo) {
      toast.warning(posAccess.mensajeBloqueo ?? 'Este usuario no puede operar el punto de venta');
      return false;
    }
    if (!puedeVender) {
      toast.warning('No tenes permisos para crear ventas');
      return false;
    }
    if (!cartItems.length) {
      toast.warning('Agregue productos al carrito');
      return false;
    }
    return true;
  };

  const buildPagos = (amount: number, clienteIdPago?: string | null): IPagoPosPayload[] | null => {
    if (permitePagoMixto) {
      const pagos = paymentDrafts
        .map((draft) => ({
          draft,
          esCuentaCorriente: draft.medioPagoId === 'CUENTA_CORRIENTE',
          medio: mediosPago.find(
            (method) =>
              method.id === (draft.medioPagoId || selectedPayment?.id || mediosPago[0]?.id),
          ),
          monto: toNumber(draft.monto),
        }))
        .filter((item) => (item.medio || item.esCuentaCorriente) && item.monto > 0);

      if (!pagos.length) {
        toast.warning('Agregue al menos un pago');
        return null;
      }
      if (pagos.some((pago) => pago.esCuentaCorriente) && !(clienteIdPago || selectedClienteId)) {
        toast.warning('Seleccione un cliente para cobrar por cuenta corriente');
        return null;
      }
      if (pagos.some((pago) => pago.esCuentaCorriente) && !permiteCuentaCorriente) {
        toast.warning('La cuenta corriente no esta habilitada para esta sucursal');
        return null;
      }
      const totalCuentaCorriente = pagos
        .filter((pago) => pago.esCuentaCorriente)
        .reduce((sum, item) => sum + item.monto, 0);
      if (totalCuentaCorriente > 0 && !validarLimiteCuentaCorriente(clienteIdPago || selectedClienteId, totalCuentaCorriente)) {
        return null;
      }

      const totalPagos = pagos.reduce((sum, item) => sum + item.monto, 0);
      if (Math.abs(totalPagos - amount) > 0.01) {
        toast.warning('La suma de pagos debe coincidir con el total');
        return null;
      }

      return pagos.map(({ draft, medio, monto, esCuentaCorriente }) => ({
        tipo: esCuentaCorriente ? 'CUENTA_CORRIENTE' : mapMedioPagoToTipo(medio),
        medio_pago_id: esCuentaCorriente ? null : medio!.id,
        monto,
        referencia: draft.referencia.trim() || null,
      }));
    }

    if (selectedPaymentId === 'CUENTA_CORRIENTE') {
      const clienteId = clienteIdPago || selectedClienteId;
      if (!clienteId) {
        toast.warning('Seleccione un cliente para cobrar por cuenta corriente');
        return null;
      }
      if (!permiteCuentaCorriente) {
        toast.warning('La cuenta corriente no esta habilitada para esta sucursal');
        return null;
      }
      if (!validarLimiteCuentaCorriente(clienteId, amount)) return null;
      return [{
        tipo: 'CUENTA_CORRIENTE',
        medio_pago_id: null,
        monto: amount,
      }];
    }

    if (!selectedPayment) {
      toast.warning('Seleccione un medio de pago');
      return null;
    }
    return [{
      tipo: mapMedioPagoToTipo(selectedPayment),
      medio_pago_id: selectedPayment.id,
      monto: amount,
    }];
  };

  const addPaymentDraft = () => {
    setPaymentDrafts((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        medioPagoId: selectedPayment?.id ?? mediosPago[0]?.id ?? '',
        monto: '',
        referencia: '',
      },
    ]);
  };

  const updatePaymentDraft = (id: string, patch: Partial<PaymentDraft>) => {
    setPaymentDrafts((current) =>
      current.map((draft) => (draft.id === id ? { ...draft, ...patch } : draft)),
    );
  };

  const removePaymentDraft = (id: string) => {
    setPaymentDrafts((current) =>
      current.length === 1 ? current : current.filter((draft) => draft.id !== id),
    );
  };

  const handleAbrirCaja = () => {
    if (!puedeAbrirCaja) {
      toast.warning('No tenes permisos para abrir caja');
      return;
    }
    abrirCajaMutation.mutate(toNumber(montoInicial));
  };

  const handleEnviarACaja = () => {
    if (!validateSale()) return;
    if (!posAccess.puedeCrearVentaPendiente) {
      toast.warning('Esta accion solo aplica para caja centralizada o despacho');
      return;
    }
    crearPendienteMutation.mutate(
      buildVentaPayload(cartItems, empleado?.id, selectedClienteId, selectedLista?.id),
      {
        onSuccess: () => clearCart(),
      },
    );
  };

  const crearOrdenQrParaVenta = (venta: IComprobantePos) => {
    if (!mercadoPagoDisponible) {
      toast.warning('Mercado Pago no esta configurado para esta sucursal');
      return;
    }
    if (!sucursalActiva?.id || !cajaAbierta?.id) {
      toast.warning('Abra una caja y seleccione una sucursal para cobrar con QR');
      return;
    }

    crearOrdenQrMutation.mutate(
      {
        sucursalId: sucursalActiva.id,
        ventaId: venta.id,
        cajaId: cajaAbierta.id,
        total: toNumber(venta.total),
        items: (venta.items ?? []).map((item) => ({
          titulo: item.descripcion || 'Producto',
          cantidad: toNumber(item.cantidad),
          precioUnitario: toNumber(item.precio_unitario),
        })),
      },
      {
        onSuccess: (orden) => {
          setQrOrder({
            ventaId: venta.id,
            numero: venta.numero,
            total: toNumber(venta.total),
            orden,
            status: 'waiting',
          });
          queryClient.invalidateQueries({ queryKey: ['pos', 'ventas-pendientes'] });
        },
      },
    );
  };

  const handleCobrarQrCarrito = () => {
    if (!mercadoPagoDisponible) {
      toast.warning('Mercado Pago no esta configurado para esta sucursal');
      return;
    }
    if (!validateSale() || !cajaAbierta) return;
    if (!posAccess.puedeVenderYCobrar) {
      toast.warning('No tenes permisos para cobrar ventas');
      return;
    }

    crearVentaQrMutation.mutate(
      buildVentaPayload(cartItems, empleado?.id, selectedClienteId, selectedLista?.id),
      {
        onSuccess: (venta) => {
          crearOrdenQrParaVenta(venta);
          clearCart();
        },
      },
    );
  };

  const handleCobrarQrPendiente = (venta: IComprobantePos) => {
    if (!mercadoPagoDisponible) {
      toast.warning('Mercado Pago no esta configurado para esta sucursal');
      return;
    }
    if (!cajaAbierta) {
      toast.warning('Abra una caja para cobrar con QR');
      return;
    }
    if (!posAccess.puedeCobrarPendiente && !posAccess.puedeVenderYCobrar) {
      toast.warning('No tenes permisos para cobrar ventas');
      return;
    }
    crearOrdenQrParaVenta(venta);
  };

  const handleCancelarQr = () => {
    if (!sucursalActiva?.id || !qrOrder) return;
    cancelarOrdenQrMutation.mutate(
      { sucursalId: sucursalActiva.id },
      {
        onSuccess: () => {
          if (puedeCancelarVenta) {
            cancelarPendienteMutation.mutate({
              ventaId: qrOrder.ventaId,
              motivo: 'Venta QR cancelada desde POS',
            });
          }
          setQrOrder(null);
        },
      },
    );
  };

  const handleCargarCuentaCorriente = () => {
    if (!validateSale()) return;
    if (!posAccess.puedeCrearVentaPendiente) {
      toast.warning('Esta accion solo aplica para caja centralizada o despacho');
      return;
    }
    if (!selectedClienteId) {
      toast.warning('Seleccione un cliente para cargar a cuenta corriente');
      return;
    }
    if (!validarLimiteCuentaCorriente(selectedClienteId, total)) return;

    crearCuentaCorrienteMutation.mutate(
      buildVentaPayload(cartItems, empleado?.id, selectedClienteId, selectedLista?.id),
      {
        onSuccess: () => clearCart(),
      },
    );
  };

  const handleCrearCotizacion = () => {
    if (!validateSale()) return;
    crearCotizacionMutation.mutate(
      buildVentaPayload(cartItems, empleado?.id, selectedClienteId, selectedLista?.id),
      {
        onSuccess: () => clearCart(),
      },
    );
  };

  const handleFinalizarVenta = () => {
    if (!validateSale() || !cajaAbierta) return;
    if (!posAccess.puedeVenderYCobrar) {
      toast.warning('No tenes permisos para cobrar ventas');
      return;
    }
    if (!permiteCobroDirecto) {
      toast.warning('Esta sucursal trabaja con caja centralizada. Envie la venta a caja.');
      return;
    }
    const pagos = buildPagos(total, selectedClienteId);
    if (!pagos) return;
    const printWindow = config?.imprimir_automaticamente
      ? window.open('', '_blank', 'width=900,height=700')
      : null;

    ventaCompletaMutation.mutate(
      {
        venta: buildVentaPayload(cartItems, empleado?.id, selectedClienteId, selectedLista?.id),
        cajaId: cajaAbierta.id,
        pagos,
        emitirComprobante: emitirTicket,
        tipoFiscal,
      },
      {
        onSuccess: (response) => {
          imprimirVentaRegistrada(response, printWindow);
          clearCart();
        },
        onError: () => printWindow?.close(),
      },
    );
  };

  const handleCobrarPendiente = (venta: IComprobantePos) => {
    if (!cajaAbierta) {
      toast.warning('Abra una caja para cobrar');
      return;
    }
    if (!posAccess.puedeCobrarPendiente) {
      toast.warning('No tenes permisos para cobrar ventas');
      return;
    }
    const pagos = buildPagos(toNumber(venta.total), venta.cliente_id);
    if (!pagos) return;
    const printWindow = config?.imprimir_automaticamente
      ? window.open('', '_blank', 'width=900,height=700')
      : null;

    cobrarPendienteMutation.mutate(
      {
        ventaId: venta.id,
        cajaId: cajaAbierta.id,
        pagos,
        emitirComprobante: emitirTicket,
        tipoFiscal,
      },
      {
        onSuccess: (response) => {
          imprimirVentaRegistrada(response, printWindow);
        },
        onError: () => printWindow?.close(),
      },
    );
  };

  const handleCancelarPendiente = (venta: IComprobantePos) => {
    if (!puedeCancelarVenta) {
      toast.warning('No tenes permisos para cancelar ventas');
      return;
    }
    const confirmada = window.confirm(`Cancelar la venta pendiente ${venta.numero}?`);
    if (!confirmada) return;
    cancelarPendienteMutation.mutate({
      ventaId: venta.id,
      motivo: 'Venta pendiente cancelada desde punto de venta',
    });
  };

  const renderQrModal = () => {
    if (!qrOrder) return null;
    const confirmed = qrOrder.status === 'confirmed';
    return (
      <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 px-4">
        <div className="w-full max-w-[420px] rounded-lg border border-[#c4c6cd] bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-[#c4c6cd] px-4 py-3">
            <div>
              <div className="flex items-center gap-2 text-[15px] font-bold text-[#041627]">
                {confirmed ? (
                  <CheckCircleIcon />
                ) : (
                  <Loader2 size={17} className="animate-spin text-[#075E54]" />
                )}
                {confirmed ? 'Pago aceptado' : 'Procesando pago'}
              </div>
              <div className="mt-1 text-[12px] text-[#44474c]">
                {qrOrder.numero} | {formatCurrency(qrOrder.total)}
              </div>
            </div>
            {!confirmed ? (
              <button
                type="button"
                onClick={handleCancelarQr}
                disabled={cancelarOrdenQrMutation.isPending}
                className="rounded border border-[#f1c7c7] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#b42318] hover:bg-[#fff5f5] disabled:opacity-60"
              >
                Cancelar
              </button>
            ) : null}
          </div>

          <div className="p-4">
            <div className="flex flex-col items-center">
              {confirmed ? (
                <div className="flex h-36 w-36 items-center justify-center rounded-full border border-[#cfe2de] bg-[#f3fbf9] text-[#075E54]">
                  <CheckCircleIcon large />
                </div>
              ) : (
                <div className="flex h-36 w-36 items-center justify-center rounded-full border border-[#cfe2de] bg-[#f3fbf9] text-[#075E54]">
                  <Loader2 size={72} className="animate-spin" strokeWidth={1.8} />
                </div>
              )}
            </div>

            <div className="mt-4 rounded border border-[#e5e7eb] bg-[#f8fafc] px-3 py-2 text-center text-[13px] font-semibold text-[#041627]">
              {confirmed
                ? 'El pago fue aceptado e impacto en el sistema'
                : 'Verificando el pago con Mercado Pago'}
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded bg-[#e5e7eb]">
              <div
                className={`h-full rounded bg-[#075E54] transition-all duration-700 ${
                  confirmed ? 'w-full' : 'w-1/2 animate-pulse'
                }`}
              />
            </div>

            <div className="mt-3 text-center text-[12px] text-[#44474c]">
              {confirmed
                ? 'Cerrando cobro y actualizando caja'
                : 'Consultando automaticamente. Esto puede tardar unos segundos.'}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-[calc(100vh-52px)] bg-[#f3f4f6] px-4 py-4">
      {renderQrModal()}
      <div className="mx-auto flex max-w-[1600px] flex-col gap-4">
        <section className="rounded-lg border border-[#c4c6cd] bg-white shadow-sm">
          <div className="border-b border-[#c4c6cd] px-4 py-3">
            <div className="grid gap-3 xl:grid-cols-[auto_minmax(190px,1fr)_minmax(190px,1fr)_auto] xl:items-end">
              <Link
                to="/pedidos-envio"
                className="inline-flex h-[38px] items-center justify-center gap-2 rounded border border-[#cfe2de] bg-[#f3fbf9] px-3 text-[13px] font-semibold text-[#075E54] hover:bg-[#eef8f6]"
              >
                <Truck size={15} />
                Cargar pedido con envio
              </Link>

              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[#44474c]">
                  Sucursal
                </label>
                <input
                  value={sucursalActiva?.nombre ?? 'Sin sucursal'}
                  readOnly
                  className="w-full rounded border border-[#c4c6cd] bg-[#f8f9fa] px-3 py-2 text-[14px] text-[#041627] outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[#44474c]">
                  Vendedor
                </label>
                <input
                  value={empleado?.nombreCompleto ?? 'Usuario'}
                  readOnly
                  className="w-full rounded border border-[#c4c6cd] bg-[#f8f9fa] px-3 py-2 text-[14px] text-[#041627] outline-none"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[300px] xl:justify-self-end">
                {muestraControlesCobro ? (
                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[#44474c]">
                      Ticket
                    </label>
                    <select
                      value={tipoFiscal}
                      onChange={(event) => setTipoFiscal(event.target.value as TipoEmisionFiscal)}
                      className="w-full rounded border border-[#c4c6cd] bg-white px-3 py-2 text-[14px] text-[#041627] outline-none focus:border-[#075E54]"
                    >
                      <option value="TICKET">Ticket</option>
                      <option value="FACTURA_A">Factura A</option>
                      <option value="FACTURA_B">Factura B</option>
                      <option value="FACTURA_C">Factura C</option>
                    </select>
                  </div>
                ) : null}

                {muestraControlesCobro ? (
                  <div className="flex items-end">
                    <label className="flex h-[38px] w-full items-center justify-center gap-2 rounded border border-[#c4c6cd] bg-white px-3 text-[13px] font-medium text-[#041627]">
                      <input
                        type="checkbox"
                        checked={emitirTicket}
                        onChange={(event) => setEmitirTicket(event.target.checked)}
                        className="h-4 w-4 accent-[#075E54]"
                      />
                      Emitir
                    </label>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(220px,1fr)_minmax(220px,1fr)] xl:max-w-[780px]">
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[#44474c]">
                  Cliente
                </label>
                <select
                  value={selectedClienteId}
                  onChange={(event) => setSelectedClienteId(event.target.value)}
                  className="w-full rounded border border-[#c4c6cd] bg-white px-3 py-2 text-[14px] text-[#041627] outline-none focus:border-[#075E54]"
                >
                  <option value="">Consumidor final</option>
                  {clientes.map((cliente) => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.razon_social || `${cliente.nombre} ${cliente.apellido ?? ''}`.trim()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[#44474c]">
                  Lista precio
                </label>
                <select
                  value={selectedListaId}
                  onChange={(event) => setSelectedListaId(event.target.value)}
                  className="w-full rounded border border-[#c4c6cd] bg-white px-3 py-2 text-[14px] text-[#041627] outline-none focus:border-[#075E54]"
                >
                  <option value="">
                    {listasPrecioQuery.isLoading
                      ? 'Cargando listas'
                      : listasPrecio.length
                        ? 'Precio base'
                        : 'Sin listas activas'}
                  </option>
                  {listasPrecio.map((lista) => (
                    <option key={lista.id} value={lista.id}>
                      {lista.nombre} - {describePriceList(lista)}
                    </option>
                  ))}
                </select>
                {selectedLista ? (
                  <div className="mt-1 truncate text-[11px] text-[#44474c]">
                    {selectedLista.descripcion || describePriceList(selectedLista)}
                  </div>
                ) : null}
              </div>

              {muestraControlesCobro ? (
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[#44474c]">
                    Medio de pago
                  </label>
                  <select
                    value={selectedPaymentId || selectedPayment?.id || ''}
                    onChange={(event) => setSelectedPaymentId(event.target.value)}
                    className="w-full rounded border border-[#c4c6cd] bg-white px-3 py-2 text-[14px] text-[#041627] outline-none focus:border-[#075E54]"
                  >
                    {puedeUsarCuentaCorriente(selectedClienteId) ? (
                      <option value="CUENTA_CORRIENTE">Cuenta corriente</option>
                    ) : null}
                    {mediosPago.map((method) => (
                      <option key={method.id} value={method.id}>
                        {method.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#c4c6cd] bg-[#f8fafc] px-4 py-2">
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[#44474c]">
                Caja
              </label>
              <div className="grid grid-cols-[1fr_38px] gap-2">
                <div className="flex h-[38px] items-center gap-2 rounded border border-[#c4c6cd] bg-[#f8f9fa] px-3 text-[14px] text-[#041627]">
                  <Wallet size={15} className={cajaAbierta ? 'text-[#075E54]' : 'text-[#b42318]'} />
                  <span className="truncate">
                    {cajaAbierta
                      ? `Abierta ${cajaAbierta.id.slice(0, 8)}`
                      : usaFlujoSeparado
                        ? 'Venta pendiente de cobro'
                        : 'Sin caja abierta'}
                  </span>
                </div>
                {cajaAbierta ? (
                  <Link
                    to="/punto-venta/ventas-caja"
                    title="Ver ventas de esta caja"
                    className="inline-flex h-[38px] items-center justify-center rounded border border-[#c4c6cd] bg-white text-[#075E54] hover:bg-[#f3fbf9]"
                  >
                    <ReceiptText size={16} />
                  </Link>
                ) : (
                  <button
                    type="button"
                    title="Abra una caja para ver sus ventas"
                    disabled
                    className="inline-flex h-[38px] items-center justify-center rounded border border-[#c4c6cd] bg-[#f8f9fa] text-[#9ca3af]"
                  >
                    <ReceiptText size={16} />
                  </button>
                )}
              </div>
            </div>
            {cajaAbierta && posAccess.puedeCobrar ? (
              <div className="flex flex-wrap gap-2">
                <Link
                  to={`/caja/${cajaAbierta.id}/cierre`}
                  className="flex h-8 items-center gap-2 rounded border border-[#c4c6cd] bg-white px-3 text-[12px] font-semibold text-[#041627] hover:bg-[#f4f5f6]"
                >
                  <Lock size={14} />
                  Cierre
                </Link>
                <Link
                  to="/caja/movimientos?panel=egreso"
                  className="flex h-8 items-center gap-2 rounded border border-[#c4c6cd] bg-white px-3 text-[12px] font-semibold text-[#041627] hover:bg-[#f4f5f6]"
                >
                  <ArrowDownCircle size={14} />
                  Egresos
                </Link>
                <Link
                  to="/caja/movimientos?panel=consumo"
                  className="flex h-8 items-center gap-2 rounded border border-[#c4c6cd] bg-white px-3 text-[12px] font-semibold text-[#041627] hover:bg-[#f4f5f6]"
                >
                  <PackageMinus size={14} />
                  Consumos
                </Link>
              </div>
            ) : null}
            {configQuery.isFetching && puedeVerDetallesConfigPos ? (
              <span className="flex items-center gap-1 text-[12px] text-[#44474c]">
                <Loader2 size={13} className="animate-spin" />
                Actualizando configuracion
              </span>
            ) : null}
          </div>

          {!cajaAbierta && posAccess.puedeAbrirCaja && (permiteCobroDirecto || usaFlujoSeparado) ? (
            <div className="flex flex-wrap items-end gap-3 border-b border-[#c4c6cd] bg-[#fff7e8] px-4 py-3">
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[#7a4f00]">
                  Monto inicial
                </label>
                <input
                  type="number"
                  min={0}
                  value={montoInicial}
                  onChange={(event) => setMontoInicial(event.target.value)}
                  className="w-[160px] rounded border border-[#e3bf7a] bg-white px-3 py-2 text-[14px] text-[#041627] outline-none focus:border-[#075E54]"
                />
              </div>
              <button
                type="button"
                onClick={handleAbrirCaja}
                disabled={abrirCajaMutation.isPending}
                className="flex items-center gap-2 rounded bg-[#075E54] px-4 py-2 text-[14px] font-semibold text-white hover:bg-[#0b6d62] disabled:opacity-60"
              >
                {abrirCajaMutation.isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Wallet size={16} />
                )}
                Abrir caja
              </button>
            </div>
          ) : null}

          {bloqueadoPorModo || !posAccess.puedeOperarPos ? (
            <div className="border-b border-[#c4c6cd] bg-white px-4 py-12">
              <div className="mx-auto max-w-[760px] rounded border border-[#f1c7c7] bg-[#fff5f5] px-5 py-5 text-center">
                <Lock size={28} className="mx-auto mb-3 text-[#b42318]" />
                <h2 className="text-[18px] font-bold text-[#041627]">Punto de venta bloqueado</h2>
                <p className="mt-2 text-[14px] text-[#44474c]">
                  {posAccess.mensajeBloqueo ??
                    `El modo ${modoPosLabel[modoPos] ?? modoPos} no permite operar con este usuario.`}
                </p>
                <div className="mt-4 grid gap-2 text-left text-[13px] sm:grid-cols-2">
                  <div
                    className={`rounded border px-3 py-2 ${puedeVender ? 'border-[#cfe2de] bg-white text-[#075E54]' : 'border-[#f1c7c7] bg-white text-[#b42318]'}`}
                  >
                    Permiso ventas.crear: {puedeVender ? 'activo' : 'faltante'}
                  </div>
                  <div
                    className={`rounded border px-3 py-2 ${puedeCobrar ? 'border-[#cfe2de] bg-white text-[#075E54]' : 'border-[#f1c7c7] bg-white text-[#b42318]'}`}
                  >
                    Permiso caja.cobrar: {puedeCobrar ? 'activo' : 'faltante'}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {!bloqueadoPorModo && posAccess.puedeOperarPos ? (
            esSoloCajero ? (
              <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
                <section className="border-b border-[#c4c6cd] lg:border-b-0 lg:border-r">
                  <div className="flex items-center justify-between border-b border-[#c4c6cd] bg-[#fbf9fa] px-4 py-3">
                    <div className="flex items-center gap-2 text-[14px] font-semibold text-[#041627]">
                      <ReceiptText size={16} className="text-[#075E54]" />
                      Ventas pendientes
                    </div>
                    <span className="rounded border border-[#cfe2de] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#075E54]">
                      {ventasPendientesFiltradas.length} pendientes
                    </span>
                  </div>

                  <div className="border-b border-[#c4c6cd] bg-white px-3 py-3">
                    <div className="relative">
                      <Search
                        size={15}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#44474c]"
                      />
                      <input
                        type="text"
                        value={pendingSearch}
                        onChange={(event) => setPendingSearch(event.target.value)}
                        placeholder="Buscar venta, estado o producto"
                        className="h-9 w-full rounded border border-[#c4c6cd] bg-white pl-9 pr-3 text-[13px] text-[#041627] outline-none focus:border-[#075E54]"
                      />
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-[12px]">
                      <div className="rounded border border-[#e5e7eb] bg-[#f8fafc] px-3 py-2">
                        <span className="block text-[#44474c]">Total pendiente</span>
                        <strong className="text-[#041627]">{formatCurrency(totalPendiente)}</strong>
                      </div>
                      <div className="rounded border border-[#e5e7eb] bg-[#f8fafc] px-3 py-2">
                        <span className="block text-[#44474c]">Caja destino</span>
                        <strong className="text-[#041627]">
                          {cajaAbierta ? cajaAbierta.id.slice(0, 8) : 'Sin caja'}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="max-h-[650px] overflow-auto p-3">
                    {!cajaAbierta ? (
                      <div className="rounded border border-dashed border-[#c4c6cd] bg-white px-4 py-8 text-center text-[14px] text-[#44474c]">
                        Abra una caja para cobrar ventas pendientes.
                      </div>
                    ) : ventasPendientesFiltradas.length === 0 ? (
                      <div className="rounded border border-dashed border-[#c4c6cd] bg-white px-4 py-8 text-center text-[14px] text-[#44474c]">
                        No hay ventas pendientes de cobro.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {ventasPendientesFiltradas.map((venta) => (
                          <button
                            key={venta.id}
                            type="button"
                            onClick={() => setSelectedPendienteId(venta.id)}
                            className={`w-full rounded border px-3 py-3 text-left hover:bg-[#f8fafc] ${
                              selectedPendiente?.id === venta.id
                                ? 'border-[#075E54] bg-[#eef8f6]'
                                : 'border-[#e5e7eb] bg-white'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <div className="truncate text-[14px] font-bold text-[#041627]">
                                  {venta.numero}
                                </div>
                                <div className="text-[12px] text-[#44474c]">
                                  {venta.items?.length ?? 0} productos | {venta.estado}
                                </div>
                                <div className="mt-1 flex items-center gap-1 text-[11px] text-[#44474c]">
                                  <Clock size={12} />
                                  {new Date(venta.created_at).toLocaleString('es-AR')}
                                </div>
                              </div>
                              <div className="text-right text-[15px] font-bold text-[#041627]">
                                {formatCurrency(toNumber(venta.total))}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </section>

                <aside className="flex flex-col bg-white">
                  <div className="border-b border-[#c4c6cd] bg-[#fbf9fa] px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-[14px] font-semibold text-[#041627]">
                        <CreditCard size={16} className="text-[#075E54]" />
                        Cobro de venta
                      </div>
                      {selectedPendiente ? (
                        <span className="rounded border border-[#cfe2de] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#075E54]">
                          {selectedPendiente.estado}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {selectedPendiente ? (
                    <div className="flex flex-1 flex-col">
                      <div className="border-b border-[#c4c6cd] px-4 py-3">
                        <div className="text-[16px] font-bold text-[#041627]">
                          {selectedPendiente.numero}
                        </div>
                        <div className="text-[12px] text-[#44474c]">
                          Venta enviada por vendedor |{' '}
                          {new Date(selectedPendiente.created_at).toLocaleString('es-AR')}
                        </div>
                      </div>

                      <div className="grid gap-2 border-b border-[#c4c6cd] bg-[#fbfbfc] p-3 sm:grid-cols-3">
                        <div className="rounded border border-[#e5e7eb] bg-white px-3 py-2">
                          <div className="text-[11px] font-bold uppercase text-[#44474c]">
                            Cliente
                          </div>
                          <div className="mt-1 truncate text-[13px] font-semibold text-[#041627]">
                            {selectedPendiente.cliente_id
                              ? selectedPendiente.cliente_id.slice(0, 8)
                              : 'Consumidor final'}
                          </div>
                        </div>
                        <div className="rounded border border-[#e5e7eb] bg-white px-3 py-2">
                          <div className="text-[11px] font-bold uppercase text-[#44474c]">
                            Vendedor
                          </div>
                          <div className="mt-1 truncate text-[13px] font-semibold text-[#041627]">
                            {selectedPendiente.empleado_vendedor_id
                              ? selectedPendiente.empleado_vendedor_id.slice(0, 8)
                              : 'Sin vendedor'}
                          </div>
                        </div>
                        <div className="rounded border border-[#e5e7eb] bg-white px-3 py-2">
                          <div className="text-[11px] font-bold uppercase text-[#44474c]">
                            Estado
                          </div>
                          <div className="mt-1 truncate text-[13px] font-semibold text-[#075E54]">
                            {selectedPendiente.estado}
                          </div>
                        </div>
                      </div>

                      <div className="max-h-[300px] overflow-auto border-b border-[#c4c6cd] p-3">
                        <div className="space-y-2">
                          {(selectedPendiente.items ?? []).map((item) => (
                            <div
                              key={item.id}
                              className="grid grid-cols-[1fr_64px_110px] gap-2 rounded border border-[#e5e7eb] bg-[#f8fafc] px-3 py-2 text-[13px]"
                            >
                              <div className="min-w-0">
                                <div className="truncate font-semibold text-[#041627]">
                                  {item.descripcion}
                                </div>
                                <div className="text-[#44474c]">
                                  {formatCurrency(toNumber(item.precio_unitario))}
                                </div>
                              </div>
                              <div className="text-center font-medium text-[#041627]">
                                x{toNumber(item.cantidad)}
                              </div>
                              <div className="text-right font-bold text-[#041627]">
                                {formatCurrency(toNumber(item.subtotal))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="border-b border-[#c4c6cd] px-4 py-4">
                        <div className="flex items-center justify-between text-[14px] text-[#44474c]">
                          <span>Subtotal</span>
                          <span>{formatCurrency(toNumber(selectedPendiente.subtotal))}</span>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[20px] font-bold text-[#041627]">
                          <span>Total a cobrar</span>
                          <span>{formatCurrency(toNumber(selectedPendiente.total))}</span>
                        </div>
                      </div>

                      {muestraControlesCobro && !permitePagoMixto ? (
                        <div className="border-b border-[#c4c6cd] px-4 py-4">
                          <div className="mb-1 text-[12px] font-bold uppercase tracking-wide text-[#44474c]">
                            Cobro
                          </div>
                          <div className="rounded border border-[#e5e7eb] bg-[#f8fafc] px-3 py-2 text-[13px] text-[#041627]">
                            Se cobrara con{' '}
                            {selectedPaymentId === 'CUENTA_CORRIENTE'
                              ? 'cuenta corriente'
                              : (selectedPayment?.nombre ?? 'medio de pago seleccionado')}{' '}
                            por <strong>{formatCurrency(toNumber(selectedPendiente.total))}</strong>
                            .
                          </div>
                        </div>
                      ) : null}

                      {muestraControlesCobro && permitePagoMixto ? (
                        <div className="border-b border-[#c4c6cd] px-4 py-4">
                          <div className="mb-2 text-[12px] font-bold uppercase tracking-wide text-[#44474c]">
                            Pagos
                          </div>
                          <div className="space-y-2">
                            {paymentDrafts.map((draft) => (
                              <div
                                key={draft.id}
                                className="grid gap-2 md:grid-cols-[1fr_120px_1fr_34px]"
                              >
                                <select
                                  value={draft.medioPagoId || selectedPayment?.id || ''}
                                  onChange={(event) =>
                                    updatePaymentDraft(draft.id, {
                                      medioPagoId: event.target.value,
                                    })
                                  }
                                  className="h-9 rounded border border-[#c4c6cd] bg-white px-2 text-[13px] outline-none focus:border-[#075E54]"
                                >
                                  {puedeUsarCuentaCorriente(selectedPendiente.cliente_id) ? (
                                    <option value="CUENTA_CORRIENTE">Cuenta corriente</option>
                                  ) : null}
                                  {mediosPago.map((method) => (
                                    <option key={method.id} value={method.id}>
                                      {method.nombre}
                                    </option>
                                  ))}
                                </select>
                                <input
                                  type="number"
                                  min={0}
                                  value={draft.monto}
                                  onChange={(event) =>
                                    updatePaymentDraft(draft.id, { monto: event.target.value })
                                  }
                                  placeholder="Monto"
                                  className="h-9 rounded border border-[#c4c6cd] px-2 text-[13px] outline-none focus:border-[#075E54]"
                                />
                                <input
                                  value={draft.referencia}
                                  onChange={(event) =>
                                    updatePaymentDraft(draft.id, { referencia: event.target.value })
                                  }
                                  placeholder="Referencia"
                                  className="h-9 rounded border border-[#c4c6cd] px-2 text-[13px] outline-none focus:border-[#075E54]"
                                />
                                <button
                                  type="button"
                                  onClick={() => removePaymentDraft(draft.id)}
                                  className="inline-flex h-9 items-center justify-center rounded border border-[#f1c7c7] bg-[#fff5f5] text-[#b42318] hover:bg-[#fdecec]"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={addPaymentDraft}
                            className="mt-3 rounded border border-[#c4c6cd] bg-white px-3 py-2 text-[12px] font-semibold text-[#041627] hover:bg-[#f4f5f6]"
                          >
                            Agregar pago
                          </button>
                        </div>
                      ) : null}

                      <div className="mt-auto grid gap-3 px-4 py-4 sm:grid-cols-3">
                        {puedeCancelarVenta ? (
                          <button
                            type="button"
                            onClick={() => handleCancelarPendiente(selectedPendiente)}
                            disabled={isBusy}
                            className="flex items-center justify-center gap-2 rounded border border-[#f1c7c7] bg-[#fff5f5] px-4 py-3 text-[14px] font-medium text-[#b42318] hover:bg-[#fdecec] disabled:opacity-60"
                          >
                            <XCircle size={16} />
                            Cancelar pendiente
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={clearCart}
                            className="rounded border border-[#c4c6cd] bg-white px-4 py-3 text-[14px] font-medium text-[#041627] hover:bg-[#f4f5f6]"
                          >
                            Limpiar pagos
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleCobrarPendiente(selectedPendiente)}
                          disabled={isBusy || !cajaAbierta || !puedeCobrar}
                          className="flex items-center justify-center gap-2 rounded bg-[#075E54] px-4 py-3 text-[14px] font-semibold text-white hover:bg-[#0b6d62] disabled:opacity-60"
                        >
                          {cobrarPendienteMutation.isPending ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <CreditCard size={16} />
                          )}
                          Cobrar venta
                        </button>
                        {mercadoPagoDisponible ? (
                          <button
                            type="button"
                            onClick={() => handleCobrarQrPendiente(selectedPendiente)}
                            disabled={isBusy || !cajaAbierta || !puedeCobrar}
                            className="flex items-center justify-center gap-2 rounded bg-[#0f766e] px-4 py-3 text-[14px] font-semibold text-white hover:bg-[#115e59] disabled:opacity-60"
                          >
                            {crearOrdenQrMutation.isPending ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <QrCode size={16} />
                            )}
                            Cobrar QR
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-1 items-center justify-center px-4 py-12 text-center text-[14px] text-[#44474c]">
                      Seleccione una venta pendiente para ver el detalle y cobrar.
                    </div>
                  )}
                </aside>
              </div>
            ) : (
              <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
                <section className="border-b border-[#c4c6cd] lg:border-b-0 lg:border-r">
                  {cuentaSeleccionada && permiteCuentaCorriente ? (
                    <div className="grid gap-2 border-b border-[#c4c6cd] bg-[#f3fbf9] px-4 py-3 text-[12px] sm:grid-cols-3">
                      <div>
                        <span className="block font-bold uppercase text-[#44474c]">
                          Cuenta corriente
                        </span>
                        <strong className="text-[#075E54]">Activa</strong>
                      </div>
                      <div>
                        <span className="block font-bold uppercase text-[#44474c]">
                          Saldo actual
                        </span>
                        <strong
                          className={
                            saldoCuentaSeleccionada > 0 ? 'text-[#b42318]' : 'text-[#075E54]'
                          }
                        >
                          {formatCurrency(saldoCuentaSeleccionada)}
                        </strong>
                      </div>
                      <div>
                        <span className="block font-bold uppercase text-[#44474c]">Disponible</span>
                        <strong className="text-[#041627]">
                          {limiteCuentaSeleccionada > 0
                            ? formatCurrency(disponibleCuentaSeleccionada)
                            : 'Sin limite'}
                        </strong>
                      </div>
                    </div>
                  ) : null}
                  <div className="border-b border-[#c4c6cd] bg-[#fbf9fa] px-4 py-3">
                    <div className="relative">
                      <Search
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#44474c]"
                      />
                      <input
                        type="text"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Buscar producto por nombre, codigo o ubicacion"
                        className="w-full rounded border border-[#c4c6cd] bg-white py-2 pl-10 pr-3 text-[14px] text-[#041627] outline-none focus:border-[#075E54]"
                      />
                    </div>
                  </div>

                  <div className="max-h-[600px] overflow-auto">
                    <DataTable
                      rows={filteredProducts}
                      columns={productosColumns}
                      getRowKey={(product) => product.id ?? product.codigo_barras ?? product.nombre}
                      isLoading={productsQuery.isLoading}
                      loadingMessage="Cargando productos"
                      emptyMessage="No se encontraron productos."
                      getContextActions={(product) => [
                        {
                          label: 'Agregar',
                          icon: <Plus size={14} />,
                          disabled:
                            getStockForBranch(product, sucursalActiva?.id) <= 0 || !puedeVender,
                          onClick: () => addProduct(product),
                        },
                      ]}
                    />
                  </div>
                </section>

                <aside className="flex flex-col">
                  <div className="border-b border-[#c4c6cd] bg-[#fbf9fa] px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-[14px] font-semibold text-[#041627]">
                        <Calculator size={16} className="text-[#075E54]" />
                        Carrito
                      </div>
                      <span className="rounded border border-[#cfe2de] bg-[#f3fbf9] px-2.5 py-1 text-[11px] font-medium text-[#075E54]">
                        {cartItems.length} items
                      </span>
                    </div>
                  </div>

                  <div className="max-h-[360px] flex-1 overflow-auto">
                    <DataTable
                      rows={cartItems}
                      columns={carritoColumns}
                      getRowKey={(item) => item.producto.id ?? item.producto.nombre}
                      emptyMessage="Carrito vacio."
                      getContextActions={(item) => [
                        {
                          label: 'Sumar unidad',
                          icon: <Plus size={14} />,
                          onClick: () => changeQuantity(item.producto.id, 1),
                        },
                        {
                          label: 'Restar unidad',
                          icon: <Minus size={14} />,
                          onClick: () => changeQuantity(item.producto.id, -1),
                        },
                        {
                          label: 'Quitar producto',
                          icon: <Trash2 size={14} />,
                          danger: true,
                          dividerBefore: true,
                          onClick: () => removeProduct(item.producto.id),
                        },
                      ]}
                    />
                  </div>

                  <div className="border-t border-[#c4c6cd] bg-[#fbf9fa] px-4 py-4">
                    <div className="space-y-2">
                      {selectedLista ? (
                        <div className="rounded border border-[#cfe2de] bg-white px-3 py-2 text-[12px] text-[#075E54]">
                          <span className="font-semibold">{selectedLista.nombre}</span>
                          <span className="ml-1 text-[#44474c]">
                            {describePriceList(selectedLista)}
                          </span>
                        </div>
                      ) : null}
                      <div className="flex items-center justify-between text-[14px] text-[#44474c]">
                        <span>Subtotal</span>
                        <span>{formatCurrency(subtotal)}</span>
                      </div>
                      <div className="flex items-center justify-between text-[18px] font-bold text-[#041627]">
                        <span>Total</span>
                        <span>{formatCurrency(total)}</span>
                      </div>
                    </div>

                    {muestraControlesCobro && permitePagoMixto ? (
                      <div className="mt-4 rounded border border-[#c4c6cd] bg-white">
                        <div className="flex items-center justify-between border-b border-[#c4c6cd] px-3 py-2">
                          <span className="text-[12px] font-bold uppercase tracking-wide text-[#44474c]">
                            Pagos
                          </span>
                          <button
                            type="button"
                            onClick={addPaymentDraft}
                            className="rounded border border-[#c4c6cd] bg-white px-2 py-1 text-[12px] font-semibold text-[#041627] hover:bg-[#f4f5f6]"
                          >
                            Agregar pago
                          </button>
                        </div>
                        <div className="space-y-2 p-3">
                          {paymentDrafts.map((draft) => (
                            <div
                              key={draft.id}
                              className="grid gap-2 md:grid-cols-[1fr_110px_1fr_34px]"
                            >
                              <select
                                value={draft.medioPagoId || selectedPayment?.id || ''}
                                onChange={(event) =>
                                  updatePaymentDraft(draft.id, {
                                    medioPagoId: event.target.value,
                                  })
                                }
                                className="h-9 rounded border border-[#c4c6cd] bg-white px-2 text-[13px] outline-none focus:border-[#075E54]"
                              >
                                {puedeUsarCuentaCorriente(selectedClienteId) ? (
                                  <option value="CUENTA_CORRIENTE">Cuenta corriente</option>
                                ) : null}
                                {mediosPago.map((method) => (
                                  <option key={method.id} value={method.id}>
                                    {method.nombre}
                                  </option>
                                ))}
                              </select>
                              <input
                                type="number"
                                min={0}
                                value={draft.monto}
                                onChange={(event) =>
                                  updatePaymentDraft(draft.id, { monto: event.target.value })
                                }
                                placeholder="Monto"
                                className="h-9 rounded border border-[#c4c6cd] px-2 text-[13px] outline-none focus:border-[#075E54]"
                              />
                              <input
                                value={draft.referencia}
                                onChange={(event) =>
                                  updatePaymentDraft(draft.id, { referencia: event.target.value })
                                }
                                placeholder="Referencia"
                                className="h-9 rounded border border-[#c4c6cd] px-2 text-[13px] outline-none focus:border-[#075E54]"
                              />
                              <button
                                type="button"
                                onClick={() => removePaymentDraft(draft.id)}
                                className="inline-flex h-9 items-center justify-center rounded border border-[#f1c7c7] bg-[#fff5f5] text-[#b42318] hover:bg-[#fdecec]"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    <div className="mt-4 grid gap-3 sm:grid-cols-5">
                      <button
                        type="button"
                        onClick={clearCart}
                        className="rounded border border-[#c4c6cd] bg-white px-4 py-3 text-[14px] font-medium text-[#041627] hover:bg-[#f4f5f6]"
                      >
                        Limpiar
                      </button>
                      {permiteCotizaciones ? (
                        <button
                          type="button"
                          onClick={handleCrearCotizacion}
                          disabled={isBusy || !cartItems.length || !posAccess.puedeVender}
                          className="flex items-center justify-center gap-2 rounded border border-[#c4c6cd] bg-white px-4 py-3 text-[14px] font-semibold text-[#041627] hover:bg-[#f4f5f6] disabled:opacity-60"
                        >
                          <ReceiptText size={16} />
                          Cotizar
                        </button>
                      ) : null}
                      {usaFlujoSeparado ? (
                        <button
                          type="button"
                          onClick={handleEnviarACaja}
                          disabled={
                            isBusy || !cartItems.length || !posAccess.puedeCrearVentaPendiente
                          }
                          className="flex items-center justify-center gap-2 rounded bg-[#075E54] px-4 py-3 text-[14px] font-semibold text-white hover:bg-[#0b6d62] disabled:opacity-60"
                        >
                          <Send size={16} />
                          {usaDespacho ? 'Enviar a cobro' : 'Enviar a caja'}
                        </button>
                      ) : null}
                      {usaFlujoSeparado && puedeUsarCuentaCorriente(selectedClienteId) ? (
                        <button
                          type="button"
                          onClick={handleCargarCuentaCorriente}
                          disabled={
                            isBusy ||
                            !cartItems.length ||
                            !posAccess.puedeCrearVentaPendiente
                          }
                          className="flex items-center justify-center gap-2 rounded bg-[#0f766e] px-4 py-3 text-[14px] font-semibold text-white hover:bg-[#115e59] disabled:opacity-60"
                        >
                          {crearCuentaCorrienteMutation.isPending ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <CreditCard size={16} />
                          )}
                          Cuenta corriente
                        </button>
                      ) : null}
                      {permiteCobroDirecto ? (
                        <button
                          type="button"
                          onClick={handleFinalizarVenta}
                          disabled={
                            isBusy ||
                            !cartItems.length ||
                            !cajaAbierta ||
                            !posAccess.puedeVenderYCobrar
                          }
                          className="flex items-center justify-center gap-2 rounded bg-[#075E54] px-4 py-3 text-[14px] font-semibold text-white hover:bg-[#0b6d62] disabled:opacity-60"
                        >
                          {ventaCompletaMutation.isPending ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <CreditCard size={16} />
                          )}
                          {usaDespacho ? 'Cobrar y despachar' : 'Cobrar'}
                        </button>
                      ) : null}
                      {permiteCobroDirecto && mercadoPagoDisponible ? (
                        <button
                          type="button"
                          onClick={handleCobrarQrCarrito}
                          disabled={
                            isBusy ||
                            !cartItems.length ||
                            !cajaAbierta ||
                            !posAccess.puedeVenderYCobrar
                          }
                          className="flex items-center justify-center gap-2 rounded bg-[#0f766e] px-4 py-3 text-[14px] font-semibold text-white hover:bg-[#115e59] disabled:opacity-60"
                        >
                          {crearVentaQrMutation.isPending || crearOrdenQrMutation.isPending ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <QrCode size={16} />
                          )}
                          Cobrar QR
                        </button>
                      ) : null}
                    </div>

                    {usaFlujoSeparado && posAccess.puedeCobrarPendiente ? (
                      <div className="mt-4 rounded border border-[#c4c6cd] bg-white">
                        <div className="flex items-center justify-between border-b border-[#c4c6cd] px-4 py-2">
                          <span className="text-[12px] font-bold uppercase tracking-wide text-[#44474c]">
                            Pendientes de cobro
                          </span>
                          <ReceiptText size={15} className="text-[#075E54]" />
                        </div>
                        <div className="max-h-[190px] overflow-auto px-3 py-3">
                          {(pendientesQuery.data ?? []).length === 0 ? (
                            <div className="rounded border border-dashed border-[#c4c6cd] px-3 py-5 text-center text-[13px] text-[#44474c]">
                              Sin ventas pendientes
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {(pendientesQuery.data ?? []).map((venta) => (
                                <div
                                  key={venta.id}
                                  className="flex items-center justify-between gap-3 rounded border border-[#e5e7eb] bg-[#f8fafc] px-3 py-2"
                                >
                                  <div className="min-w-0">
                                    <div className="truncate text-[13px] font-semibold text-[#041627]">
                                      {venta.numero}
                                    </div>
                                    <div className="text-[12px] text-[#44474c]">
                                      {formatCurrency(toNumber(venta.total))}
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleCobrarPendiente(venta)}
                                    disabled={
                                      cobrarPendienteMutation.isPending ||
                                      !posAccess.puedeCobrarPendiente
                                    }
                                    className="rounded bg-[#075E54] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[#0b6d62] disabled:opacity-60"
                                  >
                                    Cobrar
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </aside>
              </div>
            )
          ) : null}
        </section>
      </div>
    </div>
  );
};

export default PuntoDeVentaPages;
