import { CreditCard, Loader2, QrCode, XCircle } from 'lucide-react';
import type { IComprobantePos, IMedioPago } from '../../types/pos.type';
import type { PaymentDraft } from '../../utils/pos.utils';
import { formatCurrency, toNumber } from '../../utils/pos.utils';
import type { ICaja } from '../../../Cajas/types/caja.type';
import { PagosMixtos } from './PagosMixtos';

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
  onAddPaymentDraft: () => void;
  onUpdatePaymentDraft: (id: string, patch: Partial<PaymentDraft>) => void;
  onRemovePaymentDraft: (id: string) => void;
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
  onAddPaymentDraft,
  onUpdatePaymentDraft,
  onRemovePaymentDraft,
}: Props) => {
  const selectedPayment = mediosPago.find(m => m.id === selectedPaymentId) ?? mediosPago[0];

  return (
    <div className="flex flex-1 flex-col">
      {/* Número y fecha */}
      <div className="border-b border-[#c4c6cd] px-4 py-3">
        <div className="text-[16px] font-bold text-[#041627]">{venta.numero}</div>
        <div className="text-[12px] text-[#44474c]">
          Venta enviada por vendedor | {new Date(venta.created_at).toLocaleString('es-AR')}
        </div>
      </div>

      {/* Datos de cliente, vendedor y estado */}
      <div className="grid gap-2 border-b border-[#c4c6cd] bg-[#fbfbfc] p-3 sm:grid-cols-3">
        {[
          { label: 'Cliente', valor: venta.cliente_id ? venta.cliente_id.slice(0, 8) : 'Consumidor final' },
          { label: 'Vendedor', valor: venta.empleado_vendedor_id ? venta.empleado_vendedor_id.slice(0, 8) : 'Sin vendedor' },
          { label: 'Estado', valor: venta.estado, color: 'text-[#075E54]' },
        ].map(campo => (
          <div key={campo.label} className="rounded border border-[#e5e7eb] bg-white px-3 py-2">
            <div className="text-[11px] font-bold uppercase text-[#44474c]">{campo.label}</div>
            <div className={`mt-1 truncate text-[13px] font-semibold ${campo.color ?? 'text-[#041627]'}`}>
              {campo.valor}
            </div>
          </div>
        ))}
      </div>

      {/* Items de la venta */}
      <div className="max-h-[300px] overflow-auto border-b border-[#c4c6cd] p-3">
        <div className="space-y-2">
          {(venta.items ?? []).map(item => (
            <div
              key={item.id}
              className="grid grid-cols-[1fr_64px_110px] gap-2 rounded border border-[#e5e7eb] bg-[#f8fafc] px-3 py-2 text-[13px]"
            >
              <div className="min-w-0">
                <div className="truncate font-semibold text-[#041627]">{item.descripcion}</div>
                <div className="text-[#44474c]">{formatCurrency(toNumber(item.precio_unitario))}</div>
              </div>
              <div className="text-center font-medium text-[#041627]">x{toNumber(item.cantidad)}</div>
              <div className="text-right font-bold text-[#041627]">
                {formatCurrency(toNumber(item.subtotal))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Totales */}
      <div className="border-b border-[#c4c6cd] px-4 py-4">
        <div className="flex items-center justify-between text-[14px] text-[#44474c]">
          <span>Subtotal</span>
          <span>{formatCurrency(toNumber(venta.subtotal))}</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-[20px] font-bold text-[#041627]">
          <span>Total a cobrar</span>
          <span>{formatCurrency(toNumber(venta.total))}</span>
        </div>
      </div>

      {/* Pago simple */}
      {muestraControlesCobro && !permitePagoMixto ? (
        <div className="border-b border-[#c4c6cd] px-4 py-4">
          <div className="mb-1 text-[12px] font-bold uppercase tracking-wide text-[#44474c]">Cobro</div>
          <div className="rounded border border-[#e5e7eb] bg-[#f8fafc] px-3 py-2 text-[13px] text-[#041627]">
            Se cobrará con{' '}
            {selectedPaymentId === 'CUENTA_CORRIENTE'
              ? 'cuenta corriente'
              : (selectedPayment?.nombre ?? 'medio de pago seleccionado')}{' '}
            por <strong>{formatCurrency(toNumber(venta.total))}</strong>.
          </div>
        </div>
      ) : null}

      {/* Pagos mixtos */}
      {muestraControlesCobro && permitePagoMixto ? (
        <PagosMixtos
          paymentDrafts={paymentDrafts}
          mediosPago={mediosPago}
          selectedPayment={selectedPayment}
          clienteId={venta.cliente_id}
          puedeUsarCuentaCorriente={puedeUsarCuentaCorriente}
          onAgregar={onAddPaymentDraft}
          onActualizar={onUpdatePaymentDraft}
          onQuitar={onRemovePaymentDraft}
        />
      ) : null}

      {/* Botones de acción */}
      <div className="mt-auto grid gap-3 px-4 py-4 sm:grid-cols-3">
        {puedeCancelarVenta ? (
          <button
            type="button"
            onClick={() => onCancelar(venta)}
            disabled={isBusy}
            className="flex items-center justify-center gap-2 rounded border border-[#f1c7c7] bg-[#fff5f5] px-4 py-3 text-[14px] font-medium text-[#b42318] hover:bg-[#fdecec] disabled:opacity-60"
          >
            <XCircle size={16} />
            Cancelar pendiente
          </button>
        ) : (
          <button
            type="button"
            onClick={onLimpiarPagos}
            className="rounded border border-[#c4c6cd] bg-white px-4 py-3 text-[14px] font-medium text-[#041627] hover:bg-[#f4f5f6]"
          >
            Limpiar pagos
          </button>
        )}
        <button
          type="button"
          onClick={() => onCobrar(venta)}
          disabled={isBusy || !cajaAbierta || !puedeCobrar}
          className="flex items-center justify-center gap-2 rounded bg-[#075E54] px-4 py-3 text-[14px] font-semibold text-white hover:bg-[#0b6d62] disabled:opacity-60"
        >
          {cobrarPendienteIsPending ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
          Cobrar venta
        </button>
        {mercadoPagoDisponible ? (
          <button
            type="button"
            onClick={() => onCobrarQr(venta)}
            disabled={isBusy || !cajaAbierta || !puedeCobrar}
            className="flex items-center justify-center gap-2 rounded bg-[#0f766e] px-4 py-3 text-[14px] font-semibold text-white hover:bg-[#115e59] disabled:opacity-60"
          >
            {crearOrdenQrIsPending ? <Loader2 size={16} className="animate-spin" /> : <QrCode size={16} />}
            Cobrar QR
          </button>
        ) : null}
      </div>
    </div>
  );
};
