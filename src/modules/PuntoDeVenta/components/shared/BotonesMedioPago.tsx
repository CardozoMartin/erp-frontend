import { Banknote, CreditCard, Landmark, Smartphone, Wallet } from 'lucide-react';
import type { IMedioPago } from '../../types/pos.type';

interface Props {
  mediosPago: IMedioPago[];
  selectedPaymentId: string;
  puedeUsarCuentaCorriente: boolean;
  medioPagoSugeridoId?: string | null;
  onSeleccionar: (id: string) => void;
  disabled?: boolean;
}

const iconoPorNombre = (nombre: string) => {
  const n = nombre.toLowerCase();
  if (n.includes('efectivo') || n.includes('cash')) return Banknote;
  if (n.includes('débito') || n.includes('debito')) return CreditCard;
  if (n.includes('crédito') || n.includes('credito') || n.includes('tarjeta')) return CreditCard;
  if (n.includes('transferencia') || n.includes('banco')) return Landmark;
  if (n.includes('qr') || n.includes('mercado') || n.includes('digital')) return Smartphone;
  return Wallet;
};

export const BotonesMedioPago = ({
  mediosPago,
  selectedPaymentId,
  puedeUsarCuentaCorriente,
  medioPagoSugeridoId,
  onSeleccionar,
  disabled = false,
}: Props) => {
  const opciones: { id: string; nombre: string }[] = [
    ...(puedeUsarCuentaCorriente
      ? [{ id: 'CUENTA_CORRIENTE', nombre: 'Cta. corriente' }]
      : []),
    ...mediosPago.map((m) => ({ id: m.id, nombre: m.nombre })),
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {opciones.map((opcion) => {
        const esSugerido = opcion.id === medioPagoSugeridoId;
        const esSeleccionado = opcion.id === selectedPaymentId;
        const Icono = opcion.id === 'CUENTA_CORRIENTE' ? CreditCard : iconoPorNombre(opcion.nombre);

        return (
          <button
            key={opcion.id}
            type="button"
            onClick={() => onSeleccionar(opcion.id)}
            disabled={disabled}
            className={[
              'relative flex flex-col items-center gap-1.5 rounded-lg border-2 px-3 py-3 text-center transition-all',
              esSeleccionado
                ? 'border-[#075E54] bg-[#f0faf8] text-[#075E54] shadow-sm'
                : 'border-[#c4c6cd] bg-white text-[#44474c] hover:border-[#075E54] hover:bg-[#f8fdfc]',
              'disabled:opacity-50',
            ].join(' ')}
          >
            {esSugerido && !esSeleccionado && (
              <span className="absolute -right-1.5 -top-1.5 rounded-full bg-[#f59e0b] px-1.5 py-0.5 text-[9px] font-bold text-white">
                Sugerido
              </span>
            )}
            {esSugerido && esSeleccionado && (
              <span className="absolute -right-1.5 -top-1.5 rounded-full bg-[#075E54] px-1.5 py-0.5 text-[9px] font-bold text-white">
                ✓ Sugerido
              </span>
            )}
            <Icono size={22} strokeWidth={1.6} />
            <span className="text-[12px] font-semibold leading-tight">{opcion.nombre}</span>
          </button>
        );
      })}
    </div>
  );
};
