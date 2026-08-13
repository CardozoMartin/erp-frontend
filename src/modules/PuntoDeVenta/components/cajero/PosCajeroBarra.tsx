import {
  ArrowDownCircle,
  Loader2,
  Lock,
  PackageMinus,
  ReceiptText,
  RefreshCw,
  Store,
  Wallet,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ICaja } from '../../../Cajas/types/caja.type';

interface Props {
  sucursalNombre: string;
  empleadoNombre: string;
  cajaAbierta: ICaja | null | undefined;
  usaFlujoSeparado: boolean;
  puedeCobrar: boolean;
  puedeVerDetallesConfigPos: boolean;
  configFetching: boolean;
  rolPosElegido?: 'vendedor' | 'cajero' | null;
  onCambiarRol?: () => void;
}

const accion =
  'flex h-9 items-center gap-1.5 rounded-lg border border-[#dbe0e6] bg-white px-3 text-[12.5px] font-semibold text-[#041627] transition-colors hover:bg-[#f8fafc]';

/**
 * Cabecera del cajero. A diferencia de la del vendedor no lleva cliente, lista
 * de precio ni tipo de comprobante: esos datos ya vienen definidos en la venta
 * que se esta cobrando, y el cajero no deberia poder cambiarlos desde aca.
 */
export const PosCajeroBarra = ({
  sucursalNombre,
  empleadoNombre,
  cajaAbierta,
  usaFlujoSeparado,
  puedeCobrar,
  puedeVerDetallesConfigPos,
  configFetching,
  rolPosElegido,
  onCambiarRol,
}: Props) => {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-xl border border-[#e5e7eb] bg-white px-5 py-3.5">
      {/* Sucursal */}
      <div className="flex items-center gap-2 text-[14px] font-semibold text-[#041627]">
        <Store size={16} className="text-[#075E54]" />
        {sucursalNombre}
      </div>

      <span className="hidden h-5 w-px bg-[#e5e7eb] sm:block" />

      {/* Empleado y rol */}
      <div className="flex items-center gap-2">
        <span className="text-[14px] text-[#041627]">{empleadoNombre}</span>
        {rolPosElegido && (
          <span className="rounded-md bg-[#e65100] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
            {rolPosElegido}
          </span>
        )}
        {rolPosElegido && onCambiarRol && (
          <button
            type="button"
            onClick={onCambiarRol}
            className="flex items-center gap-1 text-[11.5px] font-semibold text-[#075E54] transition-colors hover:underline"
          >
            <RefreshCw size={11} />
            Cambiar rol
          </button>
        )}
      </div>

      <span className="hidden h-5 w-px bg-[#e5e7eb] sm:block" />

      {/* Estado de caja */}
      <div className="flex items-center gap-2">
        <Wallet size={16} className={cajaAbierta ? 'text-[#075E54]' : 'text-[#b42318]'} />
        <span
          className={`text-[13.5px] font-medium ${
            cajaAbierta ? 'text-[#041627]' : 'text-[#b42318]'
          }`}
        >
          {cajaAbierta
            ? `Caja abierta ${cajaAbierta.id.slice(0, 8)}`
            : usaFlujoSeparado
              ? 'Sin caja abierta'
              : 'Sin caja abierta'}
        </span>
      </div>

      {configFetching && puedeVerDetallesConfigPos && (
        <span className="flex items-center gap-1 text-[12px] text-[#64748b]">
          <Loader2 size={13} className="animate-spin" />
          Actualizando
        </span>
      )}

      {/* Acciones de caja */}
      {cajaAbierta && puedeCobrar && (
        <div className="ml-auto flex flex-wrap gap-2">
          <Link to="/punto-venta/ventas-caja" className={accion} title="Ver ventas de esta caja">
            <ReceiptText size={14} />
            Ventas
          </Link>
          <Link to="/caja/movimientos?panel=egreso" className={accion}>
            <ArrowDownCircle size={14} />
            Egresos
          </Link>
          <Link to="/caja/movimientos?panel=consumo" className={accion}>
            <PackageMinus size={14} />
            Consumos
          </Link>
          <Link to={`/caja/${cajaAbierta.id}/cierre`} className={accion}>
            <Lock size={14} />
            Cierre
          </Link>
        </div>
      )}
    </div>
  );
};
