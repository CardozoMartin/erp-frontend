import { Loader2, Wallet } from 'lucide-react';

interface Props {
  montoInicial: string;
  abrirCajaIsPending: boolean;
  onMontoChange: (valor: string) => void;
  onAbrirCaja: () => void;
}

export const PosAbrirCaja = ({ montoInicial, abrirCajaIsPending, onMontoChange, onAbrirCaja }: Props) => {
  return (
    <div className="flex flex-wrap items-end gap-3 border-b border-[#c4c6cd] bg-[#fff7e8] px-4 py-3">
      <div>
        <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[#7a4f00]">
          Monto inicial
        </label>
        <input
          type="number"
          min={0}
          value={montoInicial}
          onChange={e => onMontoChange(e.target.value)}
          className="w-40 rounded border border-[#e3bf7a] bg-white px-3 py-2 text-[14px] text-[#041627] outline-none focus:border-[#075E54]"
        />
      </div>
      <button
        type="button"
        onClick={onAbrirCaja}
        disabled={abrirCajaIsPending}
        className="flex items-center gap-2 rounded bg-[#075E54] px-4 py-2 text-[14px] font-semibold text-white hover:bg-[#0b6d62] disabled:opacity-60"
      >
        {abrirCajaIsPending ? <Loader2 size={16} className="animate-spin" /> : <Wallet size={16} />}
        Abrir caja
      </button>
    </div>
  );
};
