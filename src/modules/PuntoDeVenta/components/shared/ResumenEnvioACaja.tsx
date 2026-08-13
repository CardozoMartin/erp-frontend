import { CheckCircle2, Loader2, Send, Tag, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { ICartItem, IClientePos, IListaPrecioPos, IMedioPago } from '../../types/pos.type';
import { formatCurrency } from '../../utils/pos.utils';
import { BotonesMedioPago } from './BotonesMedioPago';

interface Props {
  cartItems: ICartItem[];
  subtotal: number;
  cliente: IClientePos | null;
  selectedLista: IListaPrecioPos | undefined;
  mediosPago: IMedioPago[];
  medioPagoSugeridoId: string;
  puedeUsarCuentaCorriente: boolean;
  usaDespacho: boolean;
  isBusy: boolean;
  isPending: boolean;
  puedeCrearVentaPendiente: boolean;
  onSeleccionarMedioPago: (id: string) => void;
  onEnviar: () => void;
}

export const ResumenEnvioACaja = ({
  cartItems,
  subtotal,
  cliente,
  selectedLista,
  mediosPago,
  medioPagoSugeridoId,
  puedeUsarCuentaCorriente,
  usaDespacho,
  isBusy,
  isPending,
  puedeCrearVentaPendiente,
  onSeleccionarMedioPago,
  onEnviar,
}: Props) => {
  const [esperandoConfirmacion, setEsperandoConfirmacion] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const puedeEnviar = !isBusy && cartItems.length > 0 && puedeCrearVentaPendiente;

  // Enter: 1er toque → pide confirmación, 2do toque → envía
  useEffect(() => {
    const manejarKeydown = (e: KeyboardEvent) => {
      const tagActivo = (document.activeElement as HTMLElement)?.tagName;
      // No interceptar si el foco está en un input, select, textarea o button
      if (['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON'].includes(tagActivo)) return;
      if (e.key !== 'Enter') return;
      if (!puedeEnviar || isPending) return;

      e.preventDefault();

      if (!esperandoConfirmacion) {
        setEsperandoConfirmacion(true);
        // Si no confirma en 4 segundos, cancela
        timeoutRef.current = setTimeout(() => setEsperandoConfirmacion(false), 4000);
      } else {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setEsperandoConfirmacion(false);
        onEnviar();
      }
    };

    window.addEventListener('keydown', manejarKeydown);
    return () => {
      window.removeEventListener('keydown', manejarKeydown);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [esperandoConfirmacion, puedeEnviar, isPending, onEnviar]);

  // Resetea la confirmación cuando cambia el carrito
  useEffect(() => {
    setEsperandoConfirmacion(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, [cartItems.length]);

  const nombreCliente = cliente
    ? (cliente.razon_social ?? `${cliente.nombre}${cliente.apellido ? ` ${cliente.apellido}` : ''}`)
    : 'Sin cliente';

  const labelBoton = usaDespacho ? 'Enviar a cobro' : 'Enviar a caja';

  return (
    <div className={[
      'rounded border bg-white transition-colors',
      esperandoConfirmacion ? 'border-[#075E54] shadow-sm' : 'border-[#c4c6cd]',
    ].join(' ')}>
      <div className="border-b border-[#c4c6cd] px-4 py-2.5">
        <span className="text-[12px] font-bold uppercase tracking-wide text-[#44474c]">
          {labelBoton}
        </span>
      </div>

      <div className="space-y-3 px-4 py-3">
        {/* Cliente y lista de precio */}
        <div className="grid grid-cols-2 gap-2 text-[12px]">
          <div className="flex items-center gap-1.5 truncate text-[#44474c]">
            <User size={13} className="shrink-0 text-[#075E54]" />
            <span className="truncate">{nombreCliente}</span>
          </div>
          {selectedLista && (
            <div className="flex items-center gap-1.5 truncate text-[#44474c]">
              <Tag size={13} className="shrink-0 text-[#075E54]" />
              <span className="truncate">{selectedLista.nombre}</span>
            </div>
          )}
        </div>

        {/* Resumen de ítems */}
        <div className="max-h-[130px] space-y-1 overflow-auto">
          {cartItems.map((item) => (
            <div
              key={item.producto.id}
              className="flex items-center justify-between gap-2 text-[12px]"
            >
              <span className="truncate text-[#041627]">
                {item.cantidad}× {item.producto.nombre}
              </span>
              <span className="shrink-0 font-semibold text-[#041627]">
                {formatCurrency(item.precioUnitario * item.cantidad)}
              </span>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="flex items-center justify-between border-t border-[#e5e7eb] pt-2">
          <span className="text-[13px] font-bold text-[#041627]">Total</span>
          <span className="text-[18px] font-extrabold text-[#041627]">
            {formatCurrency(subtotal)}
          </span>
        </div>

        {/* Medio de pago sugerido */}
        <div>
          <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-[#44474c]">
            Indicar medio de pago al cajero
          </div>
          <BotonesMedioPago
            mediosPago={mediosPago}
            selectedPaymentId={medioPagoSugeridoId}
            puedeUsarCuentaCorriente={puedeUsarCuentaCorriente}
            onSeleccionar={onSeleccionarMedioPago}
            disabled={isBusy}
          />
        </div>

        {/* Estado de confirmación por teclado */}
        {esperandoConfirmacion && (
          <div className="flex items-center gap-2 rounded border border-[#075E54] bg-[#f0faf8] px-3 py-2.5 text-[13px] font-semibold text-[#075E54]">
            <CheckCircle2 size={16} />
            ¿Confirmar envío? Presioná Enter nuevamente
          </div>
        )}

        {/* Botón enviar */}
        <button
          type="button"
          onClick={() => {
            if (!esperandoConfirmacion) {
              setEsperandoConfirmacion(true);
              timeoutRef.current = setTimeout(() => setEsperandoConfirmacion(false), 4000);
            } else {
              if (timeoutRef.current) clearTimeout(timeoutRef.current);
              setEsperandoConfirmacion(false);
              onEnviar();
            }
          }}
          disabled={!puedeEnviar}
          className={[
            'flex w-full items-center justify-center gap-2 rounded px-4 py-3 text-[14px] font-semibold text-white transition-colors',
            esperandoConfirmacion
              ? 'bg-[#0b6d62] hover:bg-[#0a5c52]'
              : 'bg-[#075E54] hover:bg-[#0b6d62]',
            'disabled:opacity-60',
          ].join(' ')}
        >
          {isPending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Send size={16} />
          )}
          {esperandoConfirmacion ? `Confirmar: ${labelBoton}` : labelBoton}
        </button>

        {!esperandoConfirmacion && puedeEnviar && (
          <p className="text-center text-[11px] text-[#8b8fa3]">
            Presioná <kbd className="rounded border border-[#c4c6cd] bg-[#f4f5f6] px-1.5 py-0.5 font-mono text-[10px]">Enter</kbd> para confirmar el envío
          </p>
        )}
      </div>
    </div>
  );
};
