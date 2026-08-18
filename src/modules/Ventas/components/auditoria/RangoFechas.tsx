import { ATAJOS_RANGO } from './rangos';

interface Props {
  desde: string;
  hasta: string;
  onCambiar: (desde: string, hasta: string) => void;
}

export const RangoFechas = ({ desde, hasta, onCambiar }: Props) => {
  const activo = (calcular: () => [string, string]) => {
    const [d, h] = calcular();
    return d === desde && h === hasta;
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="date"
        value={desde}
        onChange={(e) => onCambiar(e.target.value, hasta)}
        className="h-9 border border-[#c4c6cd] px-2.5 text-[13px] outline-none focus:border-[#075E54]"
      />
      <span className="text-[13px] text-[#64748b]">a</span>
      <input
        type="date"
        value={hasta}
        onChange={(e) => onCambiar(desde, e.target.value)}
        className="h-9 border border-[#c4c6cd] px-2.5 text-[13px] outline-none focus:border-[#075E54]"
      />
      <div className="flex flex-wrap gap-1">
        {ATAJOS_RANGO.map((atajo) => (
          <button
            key={atajo.label}
            type="button"
            onClick={() => {
              const [d, h] = atajo.calcular();
              onCambiar(d, h);
            }}
            className={`h-9 border px-2.5 text-[12.5px] font-semibold transition-colors ${
              activo(atajo.calcular)
                ? 'border-[#075E54] bg-[#f0faf8] text-[#075E54]'
                : 'border-[#c4c6cd] bg-white text-[#44474c] hover:bg-[#f5f7f8]'
            }`}
          >
            {atajo.label}
          </button>
        ))}
      </div>
    </div>
  );
};
