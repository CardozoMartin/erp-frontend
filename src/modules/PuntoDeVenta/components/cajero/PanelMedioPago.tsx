import { Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { IMedioPago } from '../../types/pos.type';
import type { PaymentDraft } from '../../utils/pos.utils';
import { formatCurrency, toNumber } from '../../utils/pos.utils';
import { BotonesMedioPago } from '../shared/BotonesMedioPago';

interface Props {
  total: number;
  mediosPago: IMedioPago[];
  selectedPaymentId: string;
  medioPagoSugeridoId?: string | null;
  paymentDrafts: PaymentDraft[];
  permitePagoMixto: boolean;
  puedeUsarCuentaCorriente: boolean;
  disabled?: boolean;
  onSeleccionarMedioPago: (id: string) => void;
  onAgregarDraft: () => void;
  onActualizarDraft: (id: string, patch: Partial<PaymentDraft>) => void;
  onQuitarDraft: (id: string) => void;
}

/** Sugerencias de billete por encima del total, para el ingreso rapido. */
const sugerenciasEfectivo = (total: number): number[] => {
  if (total <= 0) return [];
  const billetes = [1000, 2000, 5000, 10000, 20000];
  const candidatos = new Set<number>();

  // Redondeo al proximo mil, util cuando el total tiene centavos
  const proximoMil = Math.ceil(total / 1000) * 1000;
  if (proximoMil > total) candidatos.add(proximoMil);

  for (const billete of billetes) {
    const multiplo = Math.ceil(total / billete) * billete;
    if (multiplo > total) candidatos.add(multiplo);
  }

  return [...candidatos].sort((a, b) => a - b).slice(0, 2);
};

const esMedioEfectivo = (medio: IMedioPago | undefined) =>
  !!medio &&
  (medio.tipo?.toLowerCase() === 'efectivo' ||
    medio.nombre.toLowerCase().includes('efectivo'));

export const PanelMedioPago = ({
  total,
  mediosPago,
  selectedPaymentId,
  medioPagoSugeridoId,
  paymentDrafts,
  permitePagoMixto,
  puedeUsarCuentaCorriente,
  disabled = false,
  onSeleccionarMedioPago,
  onAgregarDraft,
  onActualizarDraft,
  onQuitarDraft,
}: Props) => {
  // El monto recibido es una ayuda de caja para calcular el vuelto: NO viaja al
  // backend. `construirPagos` cobra el total exacto en pago simple, y en pago
  // mixto exige que la suma de los drafts sea igual al total; mandar lo que
  // entrego el cliente haria fallar el cobro por diferencia.
  const [montoRecibidoTexto, setMontoRecibidoTexto] = useState('');
  const montoRecibido = toNumber(montoRecibidoTexto);
  const vuelto = montoRecibido > 0 ? montoRecibido - total : 0;
  const faltante = montoRecibido > 0 && montoRecibido < total ? total - montoRecibido : 0;

  const nombrePorId = (id: string) =>
    id === 'CUENTA_CORRIENTE'
      ? 'Cuenta corriente'
      : (mediosPago.find((m) => m.id === id)?.nombre ?? 'Medio de pago');

  const medioSeleccionado = mediosPago.find((m) => m.id === selectedPaymentId);
  const sugerencias = useMemo(() => sugerenciasEfectivo(total), [total]);

  // Un solo pago se muestra como el bloque "Pago 1" del disenio; recien al
  // agregar un segundo pago aparecen los selectores por fila.
  const pagoUnico = paymentDrafts.length <= 1;
  const draftPrincipal = paymentDrafts[0];
  const medioDelPrincipal = draftPrincipal?.medioPagoId
    ? mediosPago.find((m) => m.id === draftPrincipal.medioPagoId)
    : medioSeleccionado;
  const mostrarVuelto = pagoUnico && esMedioEfectivo(medioDelPrincipal);
  const sumaDrafts = paymentDrafts.reduce((suma, d) => suma + toNumber(d.monto), 0);
  const diferenciaMixto = total - sumaDrafts;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Encabezado */}
      <div className="border-b border-[#e5e7eb] px-5 py-4">
        <h2 className="text-[19px] font-bold text-[#041627]">Medio de Pago</h2>
        <p className="mt-0.5 text-[13px] text-[#64748b]">
          Seleccione el método y monto recibido
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-5 py-4">
        {/* Metodos disponibles */}
        <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
          Métodos disponibles
        </div>
        <BotonesMedioPago
          mediosPago={mediosPago}
          selectedPaymentId={
            pagoUnico && draftPrincipal?.medioPagoId
              ? draftPrincipal.medioPagoId
              : selectedPaymentId
          }
          puedeUsarCuentaCorriente={puedeUsarCuentaCorriente}
          medioPagoSugeridoId={medioPagoSugeridoId}
          columnas={2}
          onSeleccionar={(id) => {
            onSeleccionarMedioPago(id);
            // Mantiene el pago en linea con el metodo elegido arriba
            if (pagoUnico && draftPrincipal) {
              onActualizarDraft(draftPrincipal.id, { medioPagoId: id });
            }
          }}
          disabled={disabled}
        />

        {/* ── Pago unico: bloque con monto recibido y vuelto ─────────────── */}
        {pagoUnico && draftPrincipal && (
          <div className="mt-5 rounded-xl border border-[#dfe4f2] bg-[#f5f7fc] p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[13.5px] font-semibold text-[#041627]">
                Pago 1: {nombrePorId(draftPrincipal.medioPagoId || selectedPaymentId)}
              </span>
              {permitePagoMixto && (
                <button
                  type="button"
                  onClick={onAgregarDraft}
                  disabled={disabled}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[12px] font-semibold text-[#075E54] transition-colors hover:bg-white disabled:opacity-50"
                >
                  <Plus size={13} />
                  Dividir pago
                </button>
              )}
            </div>

            {mostrarVuelto ? (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-[12px] text-[#475569]">
                      Monto Recibido
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-[#64748b]">
                        $
                      </span>
                      <input
                        type="number"
                        min={0}
                        inputMode="decimal"
                        value={montoRecibidoTexto}
                        disabled={disabled}
                        onChange={(e) => setMontoRecibidoTexto(e.target.value)}
                        placeholder="0"
                        className="h-12 w-full rounded-lg border-2 border-[#075E54] bg-white pl-7 pr-3 text-right text-[16px] font-semibold text-[#041627] outline-none focus:ring-2 focus:ring-[#075E54]/15 disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[12px] text-[#475569]">
                      {faltante > 0 ? 'Falta' : 'Vuelto'}
                    </label>
                    <div
                      className={`flex h-12 items-center justify-end rounded-lg border px-3 text-[16px] font-bold ${
                        faltante > 0
                          ? 'border-[#f1c7c7] bg-[#fff5f5] text-[#b42318]'
                          : 'border-[#dbe0e6] bg-[#e8ecf7] text-[#041627]'
                      }`}
                    >
                      {faltante > 0
                        ? formatCurrency(faltante)
                        : formatCurrency(Math.max(0, vuelto))}
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="mb-2 text-[12.5px] text-[#475569]">Ingreso rápido</div>
                  <div className="flex flex-wrap gap-2">
                    {sugerencias.map((monto) => (
                      <button
                        key={monto}
                        type="button"
                        disabled={disabled}
                        onClick={() => setMontoRecibidoTexto(String(monto))}
                        className="h-10 min-w-23 flex-1 rounded-lg border border-[#dbe0e6] bg-white px-3 text-[13.5px] font-medium text-[#041627] transition-colors hover:border-[#075E54] hover:bg-[#f3fbf9] disabled:opacity-50"
                      >
                        {formatCurrency(monto)}
                      </button>
                    ))}
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => setMontoRecibidoTexto(String(total))}
                      className="h-10 min-w-23 flex-1 rounded-lg border border-[#dbe0e6] bg-white px-3 text-[13.5px] font-bold text-[#075E54] transition-colors hover:border-[#075E54] hover:bg-[#f3fbf9] disabled:opacity-50"
                    >
                      Exacto
                    </button>
                  </div>
                </div>

                <p className="mt-3 text-[11.5px] text-[#64748b]">
                  El monto recibido solo calcula el vuelto. Se cobra el total de{' '}
                  {formatCurrency(total)}.
                </p>
              </>
            ) : (
              <>
                {/* Medios no-efectivo: no hay vuelto, pero si referencia */}
                <div className="flex items-center justify-between rounded-lg border border-[#dbe0e6] bg-white px-3.5 py-3">
                  <span className="text-[13px] text-[#475569]">A cobrar</span>
                  <span className="text-[18px] font-bold text-[#041627]">
                    {formatCurrency(total)}
                  </span>
                </div>
                <input
                  value={draftPrincipal.referencia}
                  disabled={disabled}
                  onChange={(e) =>
                    onActualizarDraft(draftPrincipal.id, { referencia: e.target.value })
                  }
                  placeholder="Referencia / N° de operación (opcional)"
                  className="mt-2 h-11 w-full rounded-lg border border-[#dbe0e6] bg-white px-3.5 text-[13.5px] outline-none focus:border-[#075E54] disabled:opacity-50"
                />
              </>
            )}
          </div>
        )}

        {/* ── Pago dividido: una fila por pago ───────────────────────────── */}
        {!pagoUnico && (
          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
                Pagos ({paymentDrafts.length})
              </span>
              <button
                type="button"
                onClick={onAgregarDraft}
                disabled={disabled}
                className="inline-flex items-center gap-1 rounded-lg border border-[#dbe0e6] bg-white px-2.5 py-1 text-[12px] font-semibold text-[#041627] transition-colors hover:bg-[#f8fafc] disabled:opacity-50"
              >
                <Plus size={13} />
                Agregar pago
              </button>
            </div>

            <div className="space-y-2">
              {paymentDrafts.map((draft, indice) => (
                <div
                  key={draft.id}
                  className="rounded-xl border border-[#dfe4f2] bg-[#f5f7fc] p-3"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[12.5px] font-semibold text-[#041627]">
                      Pago {indice + 1}
                    </span>
                    <button
                      type="button"
                      aria-label={`Quitar pago ${indice + 1}`}
                      onClick={() => onQuitarDraft(draft.id)}
                      disabled={disabled}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[#b42318] transition-colors hover:bg-[#fff5f5] disabled:opacity-50"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-[1fr_130px]">
                    <select
                      value={draft.medioPagoId || selectedPaymentId}
                      disabled={disabled}
                      onChange={(e) =>
                        onActualizarDraft(draft.id, { medioPagoId: e.target.value })
                      }
                      className="h-10 rounded-lg border border-[#dbe0e6] bg-white px-3 text-[13.5px] outline-none focus:border-[#075E54] disabled:opacity-50"
                    >
                      {puedeUsarCuentaCorriente && (
                        <option value="CUENTA_CORRIENTE">Cuenta corriente</option>
                      )}
                      {mediosPago.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.nombre}
                        </option>
                      ))}
                    </select>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-[#64748b]">
                        $
                      </span>
                      <input
                        type="number"
                        min={0}
                        value={draft.monto}
                        disabled={disabled}
                        onChange={(e) => onActualizarDraft(draft.id, { monto: e.target.value })}
                        placeholder="0"
                        className="h-10 w-full rounded-lg border border-[#dbe0e6] bg-white pl-6 pr-3 text-right text-[13.5px] font-semibold outline-none focus:border-[#075E54] disabled:opacity-50"
                      />
                    </div>
                  </div>
                  <input
                    value={draft.referencia}
                    disabled={disabled}
                    onChange={(e) => onActualizarDraft(draft.id, { referencia: e.target.value })}
                    placeholder="Referencia (opcional)"
                    className="mt-2 h-10 w-full rounded-lg border border-[#dbe0e6] bg-white px-3 text-[13.5px] outline-none focus:border-[#075E54] disabled:opacity-50"
                  />
                </div>
              ))}
            </div>

            {/* La suma debe coincidir con el total o el backend rechaza el cobro */}
            <div
              className={`mt-3 flex items-center justify-between rounded-lg border px-3.5 py-2.5 text-[13px] ${
                Math.abs(diferenciaMixto) < 0.01
                  ? 'border-[#cfe2de] bg-[#f3fbf9] text-[#075E54]'
                  : 'border-[#f1c7c7] bg-[#fff5f5] text-[#b42318]'
              }`}
            >
              <span className="font-medium">
                {Math.abs(diferenciaMixto) < 0.01
                  ? 'Los pagos cubren el total'
                  : diferenciaMixto > 0
                    ? 'Falta asignar'
                    : 'Excede el total'}
              </span>
              <span className="font-bold">
                {Math.abs(diferenciaMixto) < 0.01
                  ? formatCurrency(total)
                  : formatCurrency(Math.abs(diferenciaMixto))}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
