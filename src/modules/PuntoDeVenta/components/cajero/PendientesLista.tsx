import { Clock, Lock, ReceiptText, Search } from 'lucide-react';
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
    <section className="border-b border-[#c4c6cd] lg:border-b-0 lg:border-r">
      {/* Encabezado */}
      <div className="flex items-center justify-between border-b border-[#c4c6cd] bg-[#fbf9fa] px-4 py-3">
        <div className="flex items-center gap-2 text-[14px] font-semibold text-[#041627]">
          <ReceiptText size={16} className="text-[#075E54]" />
          Ventas pendientes
        </div>
        <span className="rounded border border-[#cfe2de] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#075E54]">
          {ventasPendientes.length} pendientes
        </span>
      </div>

      {/* Buscador y resumen */}
      <div className="border-b border-[#c4c6cd] bg-white px-3 py-3">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#44474c]" />
          <input
            type="text"
            value={pendingSearch}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Buscar venta, estado o producto"
            className="h-9 w-full rounded border border-[#c4c6cd] bg-white pl-9 pr-3 text-[13px] text-[#041627] outline-none focus:border-[#075E54]"
          />
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2 text-[12px]">
          <div className="rounded border border-[#e5e7eb] bg-[#f8fafc] px-3 py-2">
            <span className="block text-[#44474c]">Total pendiente</span>
            <strong className="text-[#041627]">{formatCurrency(totalPendiente)}</strong>
          </div>
          <div className="rounded border border-[#e5e7eb] bg-[#f8fafc] px-3 py-2">
            <span className="block text-[#44474c]">Caja destino</span>
            <strong className="text-[#041627]">
              {cajaAbierta ? cajaAbierta.id.slice(0, 8) : 'Sin caja'}
            </strong>
          </div>
        </div>
      </div>

      {/* Lista de ventas */}
      <div className="max-h-[650px] overflow-auto p-3">
        {!cajaAbierta ? (
          <div className="rounded border border-dashed border-[#c4c6cd] bg-white px-4 py-8 text-center text-[14px] text-[#44474c]">
            Abra una caja para cobrar ventas pendientes.
          </div>
        ) : ventasPendientes.length === 0 ? (
          <div className="rounded border border-dashed border-[#c4c6cd] bg-white px-4 py-8 text-center text-[14px] text-[#44474c]">
            No hay ventas pendientes de cobro.
          </div>
        ) : (
          <div className="space-y-2">
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
                  className={`w-full rounded border px-3 py-3 text-left transition-colors ${
                    tomadaPorOtro
                      ? 'cursor-not-allowed border-[#e5e7eb] bg-[#f4f5f6] opacity-70'
                      : selectedPendienteId === venta.id
                        ? 'border-[#075E54] bg-[#eef8f6]'
                        : 'border-[#e5e7eb] bg-white hover:bg-[#f8fafc]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-[14px] font-bold text-[#041627]">{venta.numero}</span>
                        {tomadaPorOtro && (
                          <span className="flex shrink-0 items-center gap-1 rounded bg-[#fff3cd] px-1.5 py-0.5 text-[10px] font-semibold text-[#856404]">
                            <Lock size={9} />
                            En cobro
                          </span>
                        )}
                      </div>
                      <div className="text-[12px] text-[#44474c]">
                        {venta.items?.length ?? 0} productos | {venta.estado}
                      </div>
                      {tomadaPorOtro && venta.tomada_por?.nombreCompleto && (
                        <div className="mt-0.5 text-[11px] font-medium text-[#856404]">
                          {venta.tomada_por.nombreCompleto}
                        </div>
                      )}
                      <div className="mt-1 flex items-center gap-1 text-[11px] text-[#44474c]">
                        <Clock size={12} />
                        {new Date(venta.created_at).toLocaleString('es-AR')}
                      </div>
                    </div>
                    <div className="text-right text-[15px] font-bold text-[#041627]">
                      {formatCurrency(toNumber(venta.total))}
                    </div>
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
