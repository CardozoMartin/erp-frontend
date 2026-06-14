import { Trash2 } from 'lucide-react';
import type { IMedioPago } from '../../types/pos.type';
import type { PaymentDraft } from '../../utils/pos.utils';

interface Props {
  paymentDrafts: PaymentDraft[];
  mediosPago: IMedioPago[];
  selectedPayment: IMedioPago | undefined;
  clienteId?: string | null;
  puedeUsarCuentaCorriente: (clienteId?: string | null) => boolean;
  onAgregar: () => void;
  onActualizar: (id: string, patch: Partial<PaymentDraft>) => void;
  onQuitar: (id: string) => void;
}

export const PagosMixtos = ({
  paymentDrafts,
  mediosPago,
  selectedPayment,
  clienteId,
  puedeUsarCuentaCorriente,
  onAgregar,
  onActualizar,
  onQuitar,
}: Props) => {
  return (
    <div className="border-b border-[#c4c6cd] px-4 py-4">
      <div className="mb-2 text-[12px] font-bold uppercase tracking-wide text-[#44474c]">Pagos</div>
      <div className="space-y-2">
        {paymentDrafts.map(draft => (
          <div key={draft.id} className="grid gap-2 md:grid-cols-[1fr_120px_1fr_34px]">
            <select
              value={draft.medioPagoId || selectedPayment?.id || ''}
              onChange={e => onActualizar(draft.id, { medioPagoId: e.target.value })}
              className="h-9 rounded border border-[#c4c6cd] bg-white px-2 text-[13px] outline-none focus:border-[#075E54]"
            >
              {puedeUsarCuentaCorriente(clienteId) ? (
                <option value="CUENTA_CORRIENTE">Cuenta corriente</option>
              ) : null}
              {mediosPago.map(m => (
                <option key={m.id} value={m.id}>{m.nombre}</option>
              ))}
            </select>
            <input
              type="number"
              min={0}
              value={draft.monto}
              onChange={e => onActualizar(draft.id, { monto: e.target.value })}
              placeholder="Monto"
              className="h-9 rounded border border-[#c4c6cd] px-2 text-[13px] outline-none focus:border-[#075E54]"
            />
            <input
              value={draft.referencia}
              onChange={e => onActualizar(draft.id, { referencia: e.target.value })}
              placeholder="Referencia"
              className="h-9 rounded border border-[#c4c6cd] px-2 text-[13px] outline-none focus:border-[#075E54]"
            />
            <button
              type="button"
              onClick={() => onQuitar(draft.id)}
              className="inline-flex h-9 items-center justify-center rounded border border-[#f1c7c7] bg-[#fff5f5] text-[#b42318] hover:bg-[#fdecec]"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={onAgregar}
        className="mt-3 rounded border border-[#c4c6cd] bg-white px-3 py-2 text-[12px] font-semibold text-[#041627] hover:bg-[#f4f5f6]"
      >
        Agregar pago
      </button>
    </div>
  );
};
