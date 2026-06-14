import { Loader2 } from 'lucide-react';
import { formatCurrency } from '../utils/pos.utils';
import type { QrOrderState } from '../utils/pos.utils';

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

interface Props {
  qrOrder: QrOrderState;
  isCancelando: boolean;
  onCancelar: () => void;
}

export default function PosQrModal({ qrOrder, isCancelando, onCancelar }: Props) {
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
              onClick={onCancelar}
              disabled={isCancelando}
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
}
