import {
  ArrowLeft,
  ArrowRightLeft,
  CalendarDays,
  CreditCard,
  Loader2,
  QrCode,
  ReceiptText,
  Tag,
  User,
  UserCircle2,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';
import type { IComprobantePos, IMedioPago } from '../../types/pos.type';
import type { PaymentDraft } from '../../utils/pos.utils';
import { formatCurrency, toNumber } from '../../utils/pos.utils';
import type { ICaja } from '../../../Cajas/types/caja.type';
import { PanelMedioPago } from './PanelMedioPago';
import { useAsignarCajaPendiente } from '../../hooks/usePos';
import { useCajasAbiertas } from '../../../Cajas/hooks/useCaja';

interface Props {
  venta: IComprobantePos;
  cajaAbierta: ICaja | null | undefined;
  mediosPago: IMedioPago[];
  paymentDrafts: PaymentDraft[];
  selectedPaymentId: string;
  permitePagoMixto: boolean;
  muestraControlesCobro: boolean;
  mercadoPagoDisponible: boolean;
  isBusy: boolean;
  puedeCobrar: boolean;
  puedeCancelarVenta: boolean;
  cobrarPendienteIsPending: boolean;
  crearOrdenQrIsPending: boolean;
  puedeUsarCuentaCorriente: (clienteId?: string | null) => boolean;
  onCobrar: (venta: IComprobantePos) => void;
  onCobrarQr: (venta: IComprobantePos) => void;
  onCancelar: (venta: IComprobantePos) => void;
  onLimpiarPagos: () => void;
  onSeleccionarMedioPago: (id: string) => void;
  onAddPaymentDraft: () => void;
  onUpdatePaymentDraft: (id: string, patch: Partial<PaymentDraft>) => void;
  onRemovePaymentDraft: (id: string) => void;
  onVolver?: () => void;
  mostrarEnviarCaja?: boolean;
}

export const PendienteDetalle = ({
  venta,
  cajaAbierta,
  mediosPago,
  paymentDrafts,
  selectedPaymentId,
  permitePagoMixto,
  muestraControlesCobro,
  mercadoPagoDisponible,
  isBusy,
  puedeCobrar,
  puedeCancelarVenta,
  cobrarPendienteIsPending,
  crearOrdenQrIsPending,
  puedeUsarCuentaCorriente,
  onCobrar,
  onCobrarQr,
  onCancelar,
  onLimpiarPagos,
  onSeleccionarMedioPago,
  onAddPaymentDraft,
  onUpdatePaymentDraft,
  onRemovePaymentDraft,
  onVolver,
  mostrarEnviarCaja = false,
}: Props) => {
  const [seleccionandoCaja, setSeleccionandoCaja] = useState(false);
  const asignarCajaMutation = useAsignarCajaPendiente();
  const cajasAbiertasQuery = useCajasAbiertas(mostrarEnviarCaja);

  // El backend aplana los datos del cliente con @AfterLoad (cliente_nombre/cuit);
  // si la venta salio a consumidor final no viene ninguno.
  const nombreCliente =
    venta.cliente_nombre ??
    (venta.cliente
      ? (venta.cliente.razon_social ??
        [venta.cliente.nombre, venta.cliente.apellido].filter(Boolean).join(' '))
      : null) ??
    'Consumidor final';
  const cuitCliente = venta.cliente_cuit ?? venta.cliente?.cuit ?? null;

  const total = toNumber(venta.total);
  const cobroDeshabilitado = isBusy || !cajaAbierta || !puedeCobrar;

  return (
    <div className="grid min-h-0 flex-1 gap-5 lg:grid-cols-[minmax(0,1fr)_420px]">
      {/* ── Izquierda: el comprobante ─────────────────────────────────── */}
      <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-[#e5e7eb] bg-white">
        {/* Encabezado */}
        <div className="border-b border-[#e5e7eb] px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-[22px] font-bold tracking-tight text-[#041627]">
                  {venta.numero}
                </span>
                <span className="rounded-md bg-[#fee2e2] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#b42318]">
                  {venta.estado.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="mt-2 space-y-1 text-[13px] text-[#64748b]">
                <div className="flex items-center gap-1.5">
                  <CalendarDays size={13} className="shrink-0" />
                  {new Date(venta.created_at).toLocaleString('es-AR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
                {venta.vendedor && (
                  <div className="flex items-center gap-1.5">
                    <User size={13} className="shrink-0" />
                    {venta.vendedor.nombreCompleto}
                  </div>
                )}
                {venta.lista_precio_nombre && (
                  <div className="flex items-center gap-1.5">
                    <Tag size={13} className="shrink-0" />
                    {venta.lista_precio_nombre}
                  </div>
                )}
              </div>
            </div>

            {onVolver && (
              <button
                type="button"
                onClick={onVolver}
                disabled={isBusy}
                className="flex shrink-0 items-center gap-1.5 rounded-lg border border-[#dbe0e6] bg-white px-3.5 py-2 text-[13px] font-medium text-[#475569] transition-colors hover:bg-[#f8fafc] disabled:opacity-50"
              >
                <ArrowLeft size={14} />
                Volver a lista
              </button>
            )}
          </div>

          {/* A quien pertenece la venta */}
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[#eef1f6] pt-3">
            <span className="flex items-center gap-1.5 text-[13.5px] font-semibold text-[#041627]">
              <UserCircle2 size={15} className="text-[#075E54]" />
              {nombreCliente}
            </span>
            {cuitCliente && (
              <span className="text-[12.5px] text-[#64748b]">CUIT {cuitCliente}</span>
            )}
            {venta.medio_pago_sugerido_nombre && (
              <span className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-[#fde68a] bg-[#fffbeb] px-2.5 py-1 text-[11.5px] font-semibold text-[#92400e]">
                <CreditCard size={12} />
                El vendedor indicó: {venta.medio_pago_sugerido_nombre}
              </span>
            )}
          </div>

          {venta.observaciones && (
            <p className="mt-2 text-[12.5px] italic text-[#64748b]">{venta.observaciones}</p>
          )}
        </div>

        {/* Items */}
        <div className="min-h-0 flex-1 overflow-auto px-5 py-4">
          {(venta.items ?? []).length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-[#94a3b8]">
              <ReceiptText size={30} strokeWidth={1.4} />
              <p className="text-[13.5px]">La venta no tiene ítems cargados</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {(venta.items ?? []).map((item) => (
                <li
                  key={item.id}
                  className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-xl border border-[#e5e7eb] bg-[#f8fafc] px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-semibold text-[#041627]">
                      {item.descripcion}
                    </p>
                    <p className="mt-0.5 text-[12.5px] text-[#64748b]">
                      {formatCurrency(toNumber(item.precio_unitario))} c/u
                    </p>
                  </div>
                  <span className="rounded-md bg-[#e8ecf7] px-2 py-1 font-mono text-[12.5px] font-semibold text-[#475569]">
                    x{toNumber(item.cantidad)}
                  </span>
                  <span className="min-w-[92px] text-right text-[15px] font-bold text-[#041627]">
                    {formatCurrency(toNumber(item.subtotal))}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Totales */}
        <div className="border-t border-[#e5e7eb] px-5 py-4">
          <div className="flex items-center justify-between text-[13.5px] text-[#475569]">
            <span>Subtotal</span>
            <span className="font-medium text-[#041627]">
              {formatCurrency(toNumber(venta.subtotal))}
            </span>
          </div>
          {toNumber(venta.descuento_total) > 0 && (
            <div className="mt-1.5 flex items-center justify-between text-[13.5px]">
              <span className="text-[#475569]">Descuento</span>
              <span className="font-medium text-[#b42318]">
                − {formatCurrency(toNumber(venta.descuento_total))}
              </span>
            </div>
          )}
          <div className="mt-3 flex items-center justify-between border-t border-[#e5e7eb] pt-3">
            <span className="text-[20px] font-bold text-[#041627]">Total</span>
            <span className="text-[28px] font-extrabold tracking-tight text-[#041627]">
              {formatCurrency(total)}
            </span>
          </div>
        </div>
      </section>

      {/* ── Derecha: medio de pago y acciones ─────────────────────────── */}
      <aside className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-[#e5e7eb] bg-white">
        {muestraControlesCobro ? (
          <PanelMedioPago
            total={total}
            mediosPago={mediosPago}
            selectedPaymentId={selectedPaymentId}
            medioPagoSugeridoId={venta.medio_pago_sugerido_id}
            paymentDrafts={paymentDrafts}
            permitePagoMixto={permitePagoMixto}
            puedeUsarCuentaCorriente={puedeUsarCuentaCorriente(venta.cliente_id)}
            disabled={isBusy}
            onSeleccionarMedioPago={onSeleccionarMedioPago}
            onAgregarDraft={onAddPaymentDraft}
            onActualizarDraft={onUpdatePaymentDraft}
            onQuitarDraft={onRemovePaymentDraft}
          />
        ) : (
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 px-6 py-12 text-center text-[#94a3b8]">
            <CreditCard size={30} strokeWidth={1.4} />
            <p className="text-[14px] font-semibold text-[#64748b]">
              Cobro no disponible
            </p>
            <p className="text-[12.5px]">
              {!cajaAbierta
                ? 'Abrí una caja para poder cobrar esta venta.'
                : 'Tu usuario no tiene permisos de cobro.'}
            </p>
          </div>
        )}

        {/* Selector de caja destino */}
        {mostrarEnviarCaja && seleccionandoCaja && (
          <div className="border-t border-[#e5e7eb] bg-[#f0f9f6] px-5 py-4">
            <div className="mb-2 text-[11.5px] font-bold uppercase tracking-wider text-[#075E54]">
              Seleccionar caja destino
            </div>
            <div className="flex flex-wrap gap-2">
              {(cajasAbiertasQuery.data ?? [])
                .filter((c) => c.id !== cajaAbierta?.id)
                .map((caja) => (
                  <button
                    key={caja.id}
                    type="button"
                    onClick={() =>
                      asignarCajaMutation.mutate(
                        { ventaId: venta.id, cajaId: caja.id },
                        { onSuccess: () => setSeleccionandoCaja(false) },
                      )
                    }
                    disabled={asignarCajaMutation.isPending}
                    className="rounded-lg border border-[#075E54] bg-white px-3 py-1.5 text-[13px] font-medium text-[#075E54] transition-colors hover:bg-[#e6f4f1] disabled:opacity-50"
                  >
                    {`Caja ${caja.id.slice(0, 6)} — ${new Date(caja.fecha_apertura).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`}
                  </button>
                ))}
              {(cajasAbiertasQuery.data ?? []).filter((c) => c.id !== cajaAbierta?.id)
                .length === 0 && (
                <span className="text-[13px] text-[#64748b]">No hay otras cajas abiertas</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setSeleccionandoCaja(false)}
              className="mt-2 text-[12px] text-[#64748b] underline"
            >
              Cancelar
            </button>
          </div>
        )}

        {/* Acciones */}
        <div className="space-y-2 border-t border-[#e5e7eb] px-5 py-4">
          <button
            type="button"
            onClick={() => onCobrar(venta)}
            disabled={cobroDeshabilitado}
            className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#075E54] px-4 py-4 text-[16px] font-bold text-white transition-colors hover:bg-[#0b6d62] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cobrarPendienteIsPending ? (
              <Loader2 size={19} className="animate-spin" />
            ) : (
              <ReceiptText size={19} />
            )}
            Cobrar y Emitir Ticket
          </button>

          {mercadoPagoDisponible && (
            <button
              type="button"
              onClick={() => onCobrarQr(venta)}
              disabled={cobroDeshabilitado}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#009EE3] px-4 py-3 text-[14px] font-semibold text-white transition-colors hover:bg-[#0086c2] disabled:opacity-60"
            >
              {crearOrdenQrIsPending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <QrCode size={16} />
              )}
              Cobrar con QR
            </button>
          )}

          <div className="grid grid-cols-2 gap-2">
            {puedeCancelarVenta && (
              <button
                type="button"
                onClick={() => onCancelar(venta)}
                disabled={isBusy}
                className="flex items-center justify-center gap-2 rounded-xl border border-[#f1c7c7] bg-white px-3 py-3 text-[13.5px] font-medium text-[#b42318] transition-colors hover:bg-[#fff5f5] disabled:opacity-60"
              >
                <XCircle size={15} />
                Cancelar Venta
              </button>
            )}

            {mostrarEnviarCaja && venta.estado === 'PENDIENTE_COBRO' && (
              <button
                type="button"
                onClick={() => setSeleccionandoCaja((prev) => !prev)}
                disabled={isBusy || asignarCajaMutation.isPending}
                className="flex items-center justify-center gap-2 rounded-xl border border-[#dbe0e6] bg-white px-3 py-3 text-[13.5px] font-medium text-[#475569] transition-colors hover:bg-[#f8fafc] disabled:opacity-60"
              >
                {asignarCajaMutation.isPending ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <ArrowRightLeft size={15} />
                )}
                Enviar a otra caja
              </button>
            )}

            {/* Solo ocupa lugar si sobra una celda: con Cancelar + Enviar a otra
                caja la fila ya esta completa y este boton la desbalancearia. */}
            {!(puedeCancelarVenta && mostrarEnviarCaja && venta.estado === 'PENDIENTE_COBRO') && (
              <button
                type="button"
                onClick={onLimpiarPagos}
                disabled={isBusy}
                className="rounded-xl border border-[#dbe0e6] bg-white px-3 py-3 text-[13.5px] font-medium text-[#041627] transition-colors hover:bg-[#f8fafc] disabled:opacity-60"
              >
                Limpiar pagos
              </button>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
};
