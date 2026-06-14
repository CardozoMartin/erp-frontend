import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuthStore } from '../../../store/auth.store';
import { imprimirComprobante } from '../../POSAuxiliares/utils/printComprobante';
import {
  useAbrirCaja,
  useCancelarOrdenMercadoPagoQr,
  useCancelarVentaPendiente,
  useCobrarVentaPendiente,
  useCrearCotizacion,
  useCrearOrdenMercadoPagoQr,
  useCrearVentaCuentaCorriente,
  useCrearVentaPendiente,
  useCrearVentaQr,
  useVentaCompleta,
  consultarEstadoMercadoPagoQrFn,
} from './usePos';
import { useCarritoStore } from '../store/carrito.store';
import type { IComprobantePos, IVentaCompletaResponse, TipoEmisionFiscal } from '../types/pos.type';
import type { IPagoPosPayload } from '../types/pos.type';
import { buildVentaPayload, toNumber } from '../utils/pos.utils';
import type { QrOrderState } from '../utils/pos.utils';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface UseAccionesVentaParams {
  cajaAbiertaId: string | null | undefined;
  sucursalId: string | null | undefined;
  mercadoPagoDisponible: boolean;
  emitirTicket: boolean;
  tipoFiscal: TipoEmisionFiscal;
  config: { imprimir_automaticamente?: boolean } | null | undefined;
  posAccess: {
    puedeOperarPos: boolean;
    puedeVender: boolean;
    puedeVenderYCobrar: boolean;
    puedeCrearVentaPendiente: boolean;
    puedeCobrarPendiente: boolean;
    puedeAbrirCaja: boolean;
    mensajeBloqueo?: string | null;
    bloqueadoPorModo: boolean;
  };
  puedeCancelarVenta: boolean;
  permiteCuentaCorriente: boolean;
  // Construye y valida el payload de pagos — viene del hook usePagoPos
  construirPagos: (monto: number, clienteId?: string | null) => IPagoPosPayload[] | null;
  validarLimiteCC: (clienteId: string | null | undefined, monto: number) => boolean;
  resetearPagos: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useAccionesVenta = ({
  cajaAbiertaId,
  sucursalId,
  mercadoPagoDisponible,
  emitirTicket,
  tipoFiscal,
  config,
  posAccess,
  puedeCancelarVenta,
  construirPagos,
  resetearPagos,
}: UseAccionesVentaParams) => {
  const queryClient = useQueryClient();
  const empleado = useAuthStore(s => s.empleado);
  const { items: cartItems, limpiarCarrito } = useCarritoStore();

  const [montoInicial, setMontoInicial] = useState('1000');
  const [qrOrder, setQrOrder] = useState<QrOrderState | null>(null);

  // ─── Mutations ────────────────────────────────────────────────────────────

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

  // ─── Polling QR ───────────────────────────────────────────────────────────

  // 1.- Polling de estado QR cada 5 segundos mientras haya una orden activa
  useEffect(() => {
    if (!qrOrder || !sucursalId) return;
    const interval = window.setInterval(async () => {
      try {
        const estado = await consultarEstadoMercadoPagoQrFn({ sucursalId, ventaId: qrOrder.ventaId });
        if (estado.estado !== 'aprobado') return;
        toast.success('Pago Mercado Pago confirmado');
        setQrOrder(current => current?.ventaId === qrOrder.ventaId ? { ...current, status: 'confirmed' } : current);
        window.setTimeout(() => { setQrOrder(null); limpiarCarrito(); }, 1800);
        queryClient.invalidateQueries({ queryKey: ['products'] });
        queryClient.invalidateQueries({ queryKey: ['pos', 'ventas-pendientes'] });
        queryClient.invalidateQueries({ queryKey: ['pos', 'ventas-caja'] });
        queryClient.invalidateQueries({ queryKey: ['pos', 'caja-abierta'] });
      } catch { /* polling auxiliar — error silencioso */ }
    }, 5000);
    return () => window.clearInterval(interval);
  }, [qrOrder, queryClient, sucursalId, limpiarCarrito]);

  // ─── Helpers internos ─────────────────────────────────────────────────────

  const limpiarCarritoYPagos = () => {
    limpiarCarrito();
    resetearPagos();
  };

  const validarVenta = (clienteId?: string) => {
    if (!posAccess.puedeOperarPos || posAccess.bloqueadoPorModo) {
      toast.warning(posAccess.mensajeBloqueo ?? 'Este usuario no puede operar el punto de venta');
      return false;
    }
    if (!posAccess.puedeVender) { toast.warning('No tenés permisos para crear ventas'); return false; }
    if (!cartItems.length) { toast.warning('Agregue productos al carrito'); return false; }
    return true;
  };

  const imprimirVenta = (response: IVentaCompletaResponse, printWindow?: Window | null) => {
    if (!config?.imprimir_automaticamente) return;
    const comprobante = response.comprobanteFiscal ?? response.venta;
    imprimirComprobante(comprobante, {
      titulo: comprobante.tipo === 'VENTA' ? 'Venta POS' : comprobante.tipo,
      config,
      printWindow,
    });
  };

  const crearOrdenQrParaVenta = (venta: IComprobantePos) => {
    if (!mercadoPagoDisponible) { toast.warning('Mercado Pago no está configurado para esta sucursal'); return; }
    if (!sucursalId || !cajaAbiertaId) { toast.warning('Abra una caja y seleccione una sucursal para cobrar con QR'); return; }
    crearOrdenQrMutation.mutate({
      sucursalId,
      ventaId: venta.id,
      cajaId: cajaAbiertaId,
      total: toNumber(venta.total),
      items: (venta.items ?? []).map(item => ({
        titulo: item.descripcion || 'Producto',
        cantidad: toNumber(item.cantidad),
        precioUnitario: toNumber(item.precio_unitario),
      })),
    }, {
      onSuccess: orden => {
        setQrOrder({ ventaId: venta.id, numero: venta.numero, total: toNumber(venta.total), orden, status: 'waiting' });
        queryClient.invalidateQueries({ queryKey: ['pos', 'ventas-pendientes'] });
      },
    });
  };

  // ─── Acciones públicas ────────────────────────────────────────────────────

  // 2.- Abrir caja con monto inicial
  const manejarAbrirCaja = () => {
    if (!posAccess.puedeAbrirCaja) { toast.warning('No tenés permisos para abrir caja'); return; }
    abrirCajaMutation.mutate(toNumber(montoInicial));
  };

  // 3.- Enviar venta a caja (flujo con caja centralizada)
  const manejarEnviarACaja = (clienteId: string, listaPrecioId?: string) => {
    if (!validarVenta()) return;
    if (!posAccess.puedeCrearVentaPendiente) { toast.warning('Esta acción solo aplica para caja centralizada o despacho'); return; }
    crearPendienteMutation.mutate(
      buildVentaPayload(cartItems, empleado?.id, clienteId, listaPrecioId),
      { onSuccess: limpiarCarritoYPagos },
    );
  };

  // 4.- Crear cotización
  const manejarCrearCotizacion = (clienteId: string, listaPrecioId?: string) => {
    if (!validarVenta()) return;
    crearCotizacionMutation.mutate(
      buildVentaPayload(cartItems, empleado?.id, clienteId, listaPrecioId),
      { onSuccess: limpiarCarritoYPagos },
    );
  };

  // 5.- Cargar a cuenta corriente (flujo con caja centralizada)
  const manejarCargarCuentaCorriente = (clienteId: string, total: number, listaPrecioId?: string) => {
    if (!validarVenta()) return;
    if (!posAccess.puedeCrearVentaPendiente) { toast.warning('Esta acción solo aplica para caja centralizada o despacho'); return; }
    if (!clienteId) { toast.warning('Seleccione un cliente para cargar a cuenta corriente'); return; }
    crearCuentaCorrienteMutation.mutate(
      buildVentaPayload(cartItems, empleado?.id, clienteId, listaPrecioId),
      { onSuccess: limpiarCarritoYPagos },
    );
  };

  // 6.- Finalizar venta con cobro directo
  const manejarFinalizarVenta = (total: number, clienteId: string, listaPrecioId?: string, permiteCobroDirecto = true) => {
    if (!validarVenta() || !cajaAbiertaId) return;
    if (!posAccess.puedeVenderYCobrar) { toast.warning('No tenés permisos para cobrar ventas'); return; }
    if (!permiteCobroDirecto) { toast.warning('Esta sucursal trabaja con caja centralizada. Envíe la venta a caja.'); return; }
    const pagos = construirPagos(total, clienteId);
    if (!pagos) return;
    const printWindow = config?.imprimir_automaticamente ? window.open('', '_blank', 'width=900,height=700') : null;
    ventaCompletaMutation.mutate({
      venta: buildVentaPayload(cartItems, empleado?.id, clienteId, listaPrecioId),
      cajaId: cajaAbiertaId,
      pagos,
      emitirComprobante: emitirTicket,
      tipoFiscal,
    }, {
      onSuccess: response => { imprimirVenta(response, printWindow); limpiarCarritoYPagos(); },
      onError: () => printWindow?.close(),
    });
  };

  // 7.- Cobrar con QR desde el carrito
  const manejarCobrarQrCarrito = (clienteId: string, listaPrecioId?: string) => {
    if (!mercadoPagoDisponible) { toast.warning('Mercado Pago no está configurado para esta sucursal'); return; }
    if (!validarVenta() || !cajaAbiertaId) return;
    if (!posAccess.puedeVenderYCobrar) { toast.warning('No tenés permisos para cobrar ventas'); return; }
    crearVentaQrMutation.mutate(
      buildVentaPayload(cartItems, empleado?.id, clienteId, listaPrecioId),
      { onSuccess: venta => { crearOrdenQrParaVenta(venta); limpiarCarritoYPagos(); } },
    );
  };

  // 8.- Cobrar con QR una venta pendiente
  const manejarCobrarQrPendiente = (venta: IComprobantePos) => {
    if (!mercadoPagoDisponible) { toast.warning('Mercado Pago no está configurado para esta sucursal'); return; }
    if (!cajaAbiertaId) { toast.warning('Abra una caja para cobrar con QR'); return; }
    if (!posAccess.puedeCobrarPendiente && !posAccess.puedeVenderYCobrar) { toast.warning('No tenés permisos para cobrar ventas'); return; }
    crearOrdenQrParaVenta(venta);
  };

  // 9.- Cancelar orden QR activa
  const manejarCancelarQr = () => {
    if (!sucursalId || !qrOrder) return;
    cancelarOrdenQrMutation.mutate({ sucursalId }, {
      onSuccess: () => {
        if (puedeCancelarVenta) {
          cancelarPendienteMutation.mutate({ ventaId: qrOrder.ventaId, motivo: 'Venta QR cancelada desde POS' });
        }
        setQrOrder(null);
      },
    });
  };

  // 10.- Cobrar una venta pendiente
  const manejarCobrarPendiente = (venta: IComprobantePos) => {
    if (!cajaAbiertaId) { toast.warning('Abra una caja para cobrar'); return; }
    if (!posAccess.puedeCobrarPendiente) { toast.warning('No tenés permisos para cobrar ventas'); return; }
    const pagos = construirPagos(toNumber(venta.total), venta.cliente_id);
    if (!pagos) return;
    const printWindow = config?.imprimir_automaticamente ? window.open('', '_blank', 'width=900,height=700') : null;
    cobrarPendienteMutation.mutate({
      ventaId: venta.id,
      cajaId: cajaAbiertaId,
      pagos,
      emitirComprobante: emitirTicket,
      tipoFiscal,
    }, {
      onSuccess: response => imprimirVenta(response, printWindow),
      onError: () => printWindow?.close(),
    });
  };

  // 11.- Cancelar una venta pendiente
  const manejarCancelarPendiente = (venta: IComprobantePos) => {
    if (!puedeCancelarVenta) { toast.warning('No tenés permisos para cancelar ventas'); return; }
    if (!window.confirm(`¿Cancelar la venta pendiente ${venta.numero}?`)) return;
    cancelarPendienteMutation.mutate({ ventaId: venta.id, motivo: 'Venta pendiente cancelada desde punto de venta' });
  };

  return {
    // Estado
    montoInicial,
    qrOrder,
    isBusy,
    // Setters
    setMontoInicial,
    // Flags de pending por mutation
    abrirCajaIsPending: abrirCajaMutation.isPending,
    ventaCompletaIsPending: ventaCompletaMutation.isPending,
    crearVentaQrIsPending: crearVentaQrMutation.isPending,
    crearOrdenQrIsPending: crearOrdenQrMutation.isPending,
    crearCuentaCorrienteIsPending: crearCuentaCorrienteMutation.isPending,
    cobrarPendienteIsPending: cobrarPendienteMutation.isPending,
    cancelarOrdenQrIsPending: cancelarOrdenQrMutation.isPending,
    // Acciones
    manejarAbrirCaja,
    manejarEnviarACaja,
    manejarCrearCotizacion,
    manejarCargarCuentaCorriente,
    manejarFinalizarVenta,
    manejarCobrarQrCarrito,
    manejarCobrarQrPendiente,
    manejarCancelarQr,
    manejarCobrarPendiente,
    manejarCancelarPendiente,
  };
};
