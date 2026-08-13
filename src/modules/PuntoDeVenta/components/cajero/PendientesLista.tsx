import { Clock, CreditCard, Lock, ReceiptText, Search, UserCircle2 } from 'lucide-react';
import type { IComprobantePos } from '../../types/pos.type';
import { formatCurrency, toNumber } from '../../utils/pos.utils';
import type { ICaja } from '../../../Cajas/types/caja.type';
import { useAuthStore } from '../../../../store/auth.store';

interface Props {
  ventasPendientes: IComprobantePos[];
  pendingSearch: string;
  selectedPendienteId: string | null;
  totalPendiente: number;
  cajaAbierta: ICaja | null | undefined;
  onSearchChange: (value: string) => void;
  onSelectPendiente: (id: string) => void;
}

export const PendientesLista = ({
  ventasPendientes,
  pendingSearch,
  selectedPendienteId,
  totalPendiente,
  cajaAbierta,
  onSearchChange,
  onSelectPendiente,
}: Props) => {
  const empleadoId = useAuthStore(s => s.empleado?.id);
  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-[#e5e7eb] bg-white">
      {/* Encabezado */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div className="flex items-center gap-2.5 text-[17px] font-bold text-[#041627]">
          <ReceiptText size={19} className="text-[#075E54]" />
          Ventas pendientes de cobro
        </div>
        <span className="rounded-md border border-[#cfe2de] bg-[#f3fbf9] px-2.5 py-1 text-[12px] font-semibold text-[#075E54]">
          {ventasPendientes.length} pendientes
        </span>
      </div>

      {/* Buscador y resumen */}
      <div className="px-5 pb-4">
        <div className="relative">
          <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748b]" />
          <input
            type="text"
            value={pendingSearch}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Buscar por número, cliente o producto"
            className="h-11 w-full rounded-xl border border-[#dbe0e6] bg-white pl-11 pr-4 text-[14.5px] text-[#041627] outline-none transition-colors placeholder:text-[#94a3b8] focus:border-[#075E54] focus:ring-2 focus:ring-[#075E54]/10"
          />
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-[#e5e7eb] bg-[#f8fafc] px-4 py-3">
            <span className="block text-[11.5px] font-semibold uppercase tracking-wider text-[#64748b]">
              Total pendiente
            </span>
            <strong className="text-[18px] font-bold text-[#041627]">
              {formatCurrency(totalPendiente)}
            </strong>
          </div>
          <div className="rounded-xl border border-[#e5e7eb] bg-[#f8fafc] px-4 py-3">
            <span className="block text-[11.5px] font-semibold uppercase tracking-wider text-[#64748b]">
              Caja destino
            </span>
            <strong className="text-[18px] font-bold text-[#041627]">
              {cajaAbierta ? `Caja ${cajaAbierta.id.slice(0, 8)}` : 'Sin caja'}
            </strong>
          </div>
        </div>
      </div>

      {/* Lista de ventas */}
      <div className="min-h-0 flex-1 overflow-auto px-5 pb-5">
        {!cajaAbierta ? (
          <div className="rounded-xl border border-dashed border-[#dbe0e6] bg-white px-4 py-12 text-center text-[14px] text-[#64748b]">
            Abrí una caja para cobrar ventas pendientes.
          </div>
        ) : ventasPendientes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#dbe0e6] bg-white px-4 py-12 text-center text-[14px] text-[#64748b]">
            No hay ventas pendientes de cobro.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {ventasPendientes.map(venta => {
              const tomadaPorOtro =
                !!venta.tomada_por_cajero_id &&
                venta.tomada_por_cajero_id !== empleadoId;
              return (
                <button
                  key={venta.id}
                  type="button"
                  disabled={tomadaPorOtro}
                  onClick={() => !tomadaPorOtro && onSelectPendiente(venta.id)}
                  className={`flex w-full flex-col rounded-xl border p-4 text-left transition-all ${
                    tomadaPorOtro
                      ? 'cursor-not-allowed border-[#e5e7eb] bg-[#f4f5f6] opacity-75'
                      : selectedPendienteId === venta.id
                        ? 'border-[#075E54] bg-[#eef8f6] shadow-sm'
                        : 'border-[#e5e7eb] bg-white hover:-translate-y-0.5 hover:border-[#075E54] hover:shadow-md hover:shadow-[#075E54]/10'
                  }`}
                >
                  {/* Numero y bloqueo por otro cajero */}
                  <div className="flex items-center gap-2">
                    <span className="truncate text-[15.5px] font-bold text-[#041627]">
                      {venta.numero}
                    </span>
                    {tomadaPorOtro && (
                      <span className="ml-auto flex shrink-0 items-center gap-1 rounded-md bg-[#fff3cd] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#856404]">
                        <Lock size={9} />
                        En cobro
                      </span>
                    )}
                  </div>

                  {/* A quien pertenece la venta: sin esto el cajero elige
                      entre numeros sueltos sin saber de quien es cada uno. */}
                  <div className="mt-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-[#041627]">
                    <UserCircle2 size={13} className="shrink-0 text-[#075E54]" />
                    <span className="truncate">
                      {venta.cliente_nombre ?? 'Consumidor final'}
                    </span>
                  </div>

                  {venta.vendedor?.nombreCompleto && (
                    <div className="mt-0.5 truncate text-[12px] text-[#64748b]">
                      Vendió: {venta.vendedor.nombreCompleto}
                    </div>
                  )}

                  <div className="mt-1 text-[12px] text-[#64748b]">
                    {venta.items?.length ?? 0}{' '}
                    {(venta.items?.length ?? 0) === 1 ? 'producto' : 'productos'}
                  </div>

                  {venta.medio_pago_sugerido_nombre && (
                    <div className="mt-2 inline-flex w-fit items-center gap-1 rounded-md bg-[#fffbeb] px-2 py-0.5 text-[10.5px] font-semibold text-[#92400e]">
                      <CreditCard size={10} />
                      {venta.medio_pago_sugerido_nombre}
                    </div>
                  )}

                  {tomadaPorOtro && venta.tomada_por?.nombreCompleto && (
                    <div className="mt-1 text-[11.5px] font-medium text-[#856404]">
                      Tomada por {venta.tomada_por.nombreCompleto}
                    </div>
                  )}

                  {/* Fecha y total */}
                  <div className="mt-3 flex items-end justify-between gap-2 border-t border-[#eef1f6] pt-3">
                    <span className="flex items-center gap-1 text-[11.5px] text-[#64748b]">
                      <Clock size={12} />
                      {new Date(venta.created_at).toLocaleString('es-AR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span className="text-[18px] font-bold text-[#041627]">
                      {formatCurrency(toNumber(venta.total))}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
