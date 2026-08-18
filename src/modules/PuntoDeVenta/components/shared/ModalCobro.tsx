import { useEffect, useMemo, useRef, useState } from 'react';
import { Delete, Loader2, Split, Wallet, X } from 'lucide-react';
import type { IMedioPago } from '../../types/pos.type';
import type { PaymentDraft } from '../../utils/pos.utils';
import { formatCurrency, toNumber } from '../../utils/pos.utils';
import { BotonesMedioPago } from './BotonesMedioPago';

interface Props {
  abierto: boolean;
  total: number;
  mediosPago: IMedioPago[];
  selectedPaymentId: string;
  puedeUsarCuentaCorriente: boolean;
  permitePagoMixto: boolean;
  paymentDrafts: PaymentDraft[];
  isPending: boolean;
  /** Texto del boton principal: cambia entre cobrar carrito y cobrar pendiente */
  etiquetaConfirmar?: string;
  onSeleccionarMedioPago: (id: string) => void;
  onAddPaymentDraft: () => void;
  onUpdatePaymentDraft: (id: string, patch: Partial<PaymentDraft>) => void;
  onRemovePaymentDraft: (id: string) => void;
  onCerrar: () => void;
  onConfirmar: () => void;
}

// Billetes de curso legal en Argentina utiles para el vuelto. Se filtran los que
// no alcanzan el total, asi el cajero solo ve importes que puede recibir.
const BILLETES = [1000, 2000, 5000, 10000, 20000];

const esEfectivo = (medio?: IMedioPago) =>
  medio?.tipo === 'efectivo' || medio?.nombre?.toLowerCase().includes('efectivo');

/**
 * Wrapper que desmonta el contenido al cerrar. Asi el estado interno (importe
 * recibido, modo dividido) nace limpio en cada apertura sin resetearlo dentro de
 * un efecto, que dispara renders en cascada.
 */
export const ModalCobro = (props: Props) => {
  if (!props.abierto) return null;
  return <ContenidoModalCobro {...props} />;
};

const ContenidoModalCobro = ({
  total,
  mediosPago,
  selectedPaymentId,
  puedeUsarCuentaCorriente,
  permitePagoMixto,
  paymentDrafts,
  isPending,
  etiquetaConfirmar = 'Confirmar cobro',
  onSeleccionarMedioPago,
  onAddPaymentDraft,
  onUpdatePaymentDraft,
  onRemovePaymentDraft,
  onCerrar,
  onConfirmar,
}: Props) => {
  // Lo que entrega el cliente es una ayuda para calcular el vuelto: NO viaja al
  // backend. `construirPagos` cobra el total exacto en pago simple, y en mixto
  // exige que la suma de los drafts iguale el total; mandar el importe recibido
  // haria fallar el cobro por diferencia.
  const [pagaCon, setPagaCon] = useState('');
  const [modoDividido, setModoDividido] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const medioSeleccionado = mediosPago.find((m) => m.id === selectedPaymentId);
  const cobraEnEfectivo = esEfectivo(medioSeleccionado);

  // Enfocar el importe al abrir, para poder tipear sin tocar el mouse.
  useEffect(() => {
    const id = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(id);
  }, []);

  const recibido = toNumber(pagaCon);
  const vuelto = recibido - total;
  // Solo se exige "paga con" en efectivo: con tarjeta se debita el importe exacto.
  const faltaImporte = cobraEnEfectivo && recibido > 0 && vuelto < 0;
  const puedeConfirmar = !isPending && !faltaImporte;

  const billetesUtiles = useMemo(
    () => BILLETES.filter((b) => b >= total).slice(0, 3),
    [total],
  );

  const manejarTecla = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') onCerrar();
    if (event.key === 'Enter' && puedeConfirmar) onConfirmar();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6"
      onKeyDown={manejarTecla}
      role="dialog"
      aria-modal="true"
      aria-label="Cobrar venta"
    >
      <div className="flex max-h-full w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Encabezado con el total, que es el dato que el cajero canta en voz alta */}
        <div className="flex items-start justify-between gap-4 border-b border-[#e5e7eb] bg-[#f8fafc] px-6 py-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
              Total a cobrar
            </p>
            <p className="mt-1 text-[40px] font-extrabold leading-none text-[#041627]">
              {formatCurrency(total)}
            </p>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="rounded-lg p-2 text-[#64748b] transition-colors hover:bg-[#e5e7eb] hover:text-[#041627]"
          >
            <X size={20} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto px-6 py-5">
          {/* Medios de pago */}
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
            Medio de pago
          </p>
          <BotonesMedioPago
            mediosPago={mediosPago}
            selectedPaymentId={selectedPaymentId}
            puedeUsarCuentaCorriente={puedeUsarCuentaCorriente}
            onSeleccionar={onSeleccionarMedioPago}
            disabled={isPending || modoDividido}
            columnas={3}
          />

          {/* Paga con + vuelto: solo tiene sentido en efectivo */}
          {cobraEnEfectivo && !modoDividido && (
            <div className="mt-5">
              <label
                htmlFor="paga-con"
                className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-[#64748b]"
              >
                Con cuánto paga
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[22px] font-semibold text-[#64748b]">
                  $
                </span>
                <input
                  id="paga-con"
                  ref={inputRef}
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.01"
                  value={pagaCon}
                  onChange={(e) => setPagaCon(e.target.value)}
                  placeholder="0"
                  disabled={isPending}
                  className="h-16 w-full rounded-xl border-2 border-[#dbe0e6] bg-white pl-10 pr-12 text-right text-[30px] font-bold text-[#041627] outline-none focus:border-[#075E54] focus:ring-4 focus:ring-[#075E54]/12"
                />
                {pagaCon && (
                  <button
                    type="button"
                    onClick={() => setPagaCon('')}
                    aria-label="Borrar importe"
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-[#94a3b8] transition-colors hover:bg-[#f1f5f9] hover:text-[#041627]"
                  >
                    <Delete size={18} />
                  </button>
                )}
              </div>

              {/* Atajos: importe justo y billetes con los que suele pagarse */}
              <div className="mt-2.5 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setPagaCon(String(total))}
                  disabled={isPending}
                  className="rounded-lg border border-[#075E54] bg-[#f0faf8] px-4 py-2 text-[13px] font-bold text-[#075E54] transition-colors hover:bg-[#e0f5f1]"
                >
                  Justo
                </button>
                {billetesUtiles.map((billete) => (
                  <button
                    key={billete}
                    type="button"
                    onClick={() => setPagaCon(String(billete))}
                    disabled={isPending}
                    className="rounded-lg border border-[#dbe0e6] bg-white px-4 py-2 text-[13px] font-semibold text-[#041627] transition-colors hover:border-[#075E54] hover:bg-[#f8fdfc]"
                  >
                    {formatCurrency(billete)}
                  </button>
                ))}
              </div>

              {/* Vuelto: el numero que el cajero necesita leer de un vistazo */}
              <div
                className={`mt-4 flex items-center justify-between rounded-xl border-2 px-5 py-4 ${
                  faltaImporte
                    ? 'border-[#f1c7c7] bg-[#fff5f5]'
                    : vuelto > 0
                      ? 'border-[#075E54] bg-[#f0faf8]'
                      : 'border-[#e5e7eb] bg-[#f8fafc]'
                }`}
              >
                <span
                  className={`text-[15px] font-bold ${
                    faltaImporte ? 'text-[#b42318]' : 'text-[#041627]'
                  }`}
                >
                  {faltaImporte ? 'Falta' : 'Vuelto'}
                </span>
                <span
                  className={`text-[34px] font-extrabold leading-none ${
                    faltaImporte
                      ? 'text-[#b42318]'
                      : vuelto > 0
                        ? 'text-[#075E54]'
                        : 'text-[#94a3b8]'
                  }`}
                >
                  {formatCurrency(Math.abs(recibido > 0 ? vuelto : 0))}
                </span>
              </div>
            </div>
          )}

          {/* Pago dividido: el caso raro queda plegado para no estorbar al comun */}
          {permitePagoMixto && (
            <div className="mt-5 border-t border-[#e5e7eb] pt-4">
              <button
                type="button"
                onClick={() => {
                  const proximo = !modoDividido;
                  setModoDividido(proximo);
                  // Al abrir la division se precarga el primer pago con el total:
                  // `construirPagos` exige que la suma cierre, y arrancar en cero
                  // obliga a tipear el importe completo antes de poder dividirlo.
                  if (proximo && paymentDrafts.length === 1 && !paymentDrafts[0].monto) {
                    onUpdatePaymentDraft(paymentDrafts[0].id, {
                      monto: String(total),
                      medioPagoId: paymentDrafts[0].medioPagoId || selectedPaymentId,
                    });
                  }
                }}
                disabled={isPending}
                className="flex items-center gap-2 text-[13px] font-bold text-[#075E54] transition-colors hover:underline"
              >
                <Split size={15} />
                {modoDividido ? 'Volver a pago simple' : 'Dividir pago entre varios medios'}
              </button>

              {modoDividido && (
                <div className="mt-3 space-y-2">
                  {paymentDrafts.map((draft) => (
                    <div key={draft.id} className="flex flex-wrap items-center gap-2">
                      <select
                        value={draft.medioPagoId}
                        onChange={(e) => onUpdatePaymentDraft(draft.id, { medioPagoId: e.target.value })}
                        disabled={isPending}
                        className="h-11 min-w-40 flex-1 rounded-lg border border-[#dbe0e6] bg-white px-3 text-[14px] text-[#041627] outline-none focus:border-[#075E54]"
                      >
                        <option value="">Medio de pago…</option>
                        {puedeUsarCuentaCorriente && (
                          <option value="CUENTA_CORRIENTE">Cuenta corriente</option>
                        )}
                        {mediosPago.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.nombre}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={draft.monto}
                        onChange={(e) => onUpdatePaymentDraft(draft.id, { monto: e.target.value })}
                        placeholder="Monto"
                        disabled={isPending}
                        className="h-11 w-32 rounded-lg border border-[#dbe0e6] bg-white px-3 text-right text-[14px] font-semibold text-[#041627] outline-none focus:border-[#075E54]"
                      />
                      <input
                        type="text"
                        value={draft.referencia}
                        onChange={(e) => onUpdatePaymentDraft(draft.id, { referencia: e.target.value })}
                        placeholder="Referencia"
                        disabled={isPending}
                        className="h-11 w-32 rounded-lg border border-[#dbe0e6] bg-white px-3 text-[14px] text-[#041627] outline-none focus:border-[#075E54]"
                      />
                      {paymentDrafts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => onRemovePaymentDraft(draft.id)}
                          aria-label="Quitar pago"
                          className="rounded-lg p-2 text-[#c4c6cd] transition-colors hover:bg-[#fff5f5] hover:text-[#b42318]"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={onAddPaymentDraft}
                      disabled={isPending}
                      className="rounded-lg border border-[#dbe0e6] bg-white px-3 py-2 text-[13px] font-semibold text-[#041627] transition-colors hover:bg-[#f8fafc]"
                    >
                      Agregar pago
                    </button>
                    <SumaDividida drafts={paymentDrafts} total={total} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="flex gap-3 border-t border-[#e5e7eb] bg-[#f8fafc] px-6 py-4">
          <button
            type="button"
            onClick={onCerrar}
            disabled={isPending}
            className="h-13 flex-1 rounded-xl border border-[#dbe0e6] bg-white px-5 py-3.5 text-[15px] font-semibold text-[#041627] transition-colors hover:bg-[#f1f5f9] disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirmar}
            disabled={!puedeConfirmar}
            className="flex h-13 flex-2 items-center justify-center gap-2 rounded-xl bg-[#0b3d2c] px-5 py-3.5 text-[16px] font-bold text-white transition-colors hover:bg-[#0a5c52] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Cobrando…
              </>
            ) : (
              <>
                <Wallet size={18} />
                {etiquetaConfirmar}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

/** Contador de la suma dividida: el backend exige que cierre contra el total. */
const SumaDividida = ({ drafts, total }: { drafts: PaymentDraft[]; total: number }) => {
  const suma = drafts.reduce((acc, d) => acc + toNumber(d.monto), 0);
  const restante = total - suma;
  const cierra = Math.abs(restante) < 0.01;

  return (
    <span className={`text-[13px] font-bold ${cierra ? 'text-[#075E54]' : 'text-[#b42318]'}`}>
      {cierra
        ? 'Suma correcta'
        : restante > 0
          ? `Faltan ${formatCurrency(restante)}`
          : `Sobran ${formatCurrency(Math.abs(restante))}`}
    </span>
  );
};
