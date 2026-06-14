import { ArrowDownCircle, Loader2, Lock, PackageMinus, ReceiptText, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ICaja } from '../../../Cajas/types/caja.type';

interface Props {
  cajaAbierta: ICaja | null | undefined;
  usaFlujoSeparado: boolean;
  puedeCobrar: boolean;
  puedeVerDetallesConfigPos: boolean;
  configFetching: boolean;
}

export const PosCajaBarra = ({
  cajaAbierta,
  usaFlujoSeparado,
  puedeCobrar,
  puedeVerDetallesConfigPos,
  configFetching,
}: Props) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#c4c6cd] bg-[#f8fafc] px-4 py-2">
      {/* Estado de la caja */}
      <div>
        <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[#44474c]">Caja</label>
        <div className="grid grid-cols-[1fr_2.375rem] gap-2">
          <div className="flex h-9.5 items-center gap-2 rounded border border-[#c4c6cd] bg-[#f8f9fa] px-3 text-[14px] text-[#041627]">
            <Wallet size={15} className={cajaAbierta ? 'text-[#075E54]' : 'text-[#b42318]'} />
            <span className="truncate">
              {cajaAbierta
                ? `Abierta ${cajaAbierta.id.slice(0, 8)}`
                : usaFlujoSeparado
                  ? 'Venta pendiente de cobro'
                  : 'Sin caja abierta'}
            </span>
          </div>
          {cajaAbierta ? (
            <Link
              to="/punto-venta/ventas-caja"
              title="Ver ventas de esta caja"
              className="inline-flex h-9.5 items-center justify-center rounded border border-[#c4c6cd] bg-white text-[#075E54] hover:bg-[#f3fbf9]"
            >
              <ReceiptText size={16} />
            </Link>
          ) : (
            <button
              type="button"
              title="Abra una caja para ver sus ventas"
              disabled
              className="inline-flex h-9.5 items-center justify-center rounded border border-[#c4c6cd] bg-[#f8f9fa] text-[#9ca3af]"
            >
              <ReceiptText size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Acciones rápidas de caja */}
      {cajaAbierta && puedeCobrar ? (
        <div className="flex flex-wrap gap-2">
          <Link
            to={`/caja/${cajaAbierta.id}/cierre`}
            className="flex h-8 items-center gap-2 rounded border border-[#c4c6cd] bg-white px-3 text-[12px] font-semibold text-[#041627] hover:bg-[#f4f5f6]"
          >
            <Lock size={14} />
            Cierre
          </Link>
          <Link
            to="/caja/movimientos?panel=egreso"
            className="flex h-8 items-center gap-2 rounded border border-[#c4c6cd] bg-white px-3 text-[12px] font-semibold text-[#041627] hover:bg-[#f4f5f6]"
          >
            <ArrowDownCircle size={14} />
            Egresos
          </Link>
          <Link
            to="/caja/movimientos?panel=consumo"
            className="flex h-8 items-center gap-2 rounded border border-[#c4c6cd] bg-white px-3 text-[12px] font-semibold text-[#041627] hover:bg-[#f4f5f6]"
          >
            <PackageMinus size={14} />
            Consumos
          </Link>
        </div>
      ) : null}

      {/* Indicador de config sincronizando */}
      {configFetching && puedeVerDetallesConfigPos ? (
        <span className="flex items-center gap-1 text-[12px] text-[#44474c]">
          <Loader2 size={13} className="animate-spin" />
          Actualizando configuración
        </span>
      ) : null}
    </div>
  );
};
