import { RefreshCw, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { IListaPrecioPos, TipoEmisionFiscal } from '../../types/pos.type';
import { describePriceList } from '../../utils/pos.utils';

interface Props {
  sucursalNombre: string;
  empleadoNombre: string;
  muestraControlesCobro: boolean;
  tipoFiscal: TipoEmisionFiscal;
  emitirTicket: boolean;
  selectedClienteId: string;
  clientes: { id: string; nombre: string; apellido?: string | null; razon_social?: string | null }[];
  listasPrecio: IListaPrecioPos[];
  listasPrecioLoading: boolean;
  selectedListaId: string;
  selectedLista: IListaPrecioPos | undefined;
  /** La sucursal habilito envios: sin esto no se muestra el acceso */
  permiteEnvios?: boolean;
  rolPosElegido?: 'vendedor' | 'cajero' | null;
  onCambiarRol?: () => void;
  onTipoFiscalChange: (tipo: TipoEmisionFiscal) => void;
  onEmitirTicketChange: (value: boolean) => void;
  onClienteChange: (id: string) => void;
  onListaChange: (id: string) => void;
}

const etiqueta = 'mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#64748b]';
const campoLectura =
  'h-11 w-full rounded-lg border border-[#dbe0e6] bg-[#f8fafc] px-3.5 text-[14.5px] font-medium text-[#041627] outline-none';
const campoSelect =
  'h-11 w-full rounded-lg border border-[#dbe0e6] bg-white px-3.5 text-[14.5px] text-[#041627] outline-none transition-colors focus:border-[#075E54] focus:ring-2 focus:ring-[#075E54]/10';

export const PosCamposVenta = ({
  sucursalNombre,
  empleadoNombre,
  muestraControlesCobro,
  tipoFiscal,
  emitirTicket,
  selectedClienteId,
  clientes,
  listasPrecio,
  listasPrecioLoading,
  selectedListaId,
  selectedLista,
  permiteEnvios = false,
  rolPosElegido,
  onCambiarRol,
  onTipoFiscalChange,
  onEmitirTicketChange,
  onClienteChange,
  onListaChange,
}: Props) => {
  return (
    <div className="rounded-xl border border-[#e5e7eb] bg-white p-5">
      <div className="grid gap-x-5 gap-y-4 md:grid-cols-2">
        {/* Sucursal */}
        <div>
          <label className={etiqueta}>Sucursal</label>
          <input value={sucursalNombre} readOnly className={campoLectura} />
        </div>

        {/* Empleado + rol activo */}
        <div>
          <div className="mb-1.5 flex items-center gap-3">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
              {rolPosElegido ? (rolPosElegido === 'vendedor' ? 'Vendedor' : 'Cajero') : 'Empleado'}
            </label>
            {rolPosElegido && onCambiarRol && (
              <button
                type="button"
                onClick={onCambiarRol}
                className="flex items-center gap-1 text-[11px] font-semibold text-[#075E54] transition-colors hover:text-[#0b6d62] hover:underline"
              >
                <RefreshCw size={11} />
                Cambiar rol
              </button>
            )}
          </div>
          <div className="relative">
            <input value={empleadoNombre} readOnly className={`${campoLectura} pr-28`} />
            {rolPosElegido && (
              <span
                className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                  rolPosElegido === 'vendedor'
                    ? 'bg-[#075E54] text-white'
                    : 'bg-[#e65100] text-white'
                }`}
              >
                {rolPosElegido}
              </span>
            )}
          </div>
        </div>

        {/* Cliente */}
        <div>
          <label className={etiqueta}>Cliente</label>
          <select
            value={selectedClienteId}
            onChange={(e) => onClienteChange(e.target.value)}
            className={campoSelect}
          >
            <option value="">Consumidor final</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.razon_social || `${c.nombre} ${c.apellido ?? ''}`.trim()}
              </option>
            ))}
          </select>
        </div>

        {/* Lista de precio */}
        <div>
          <label className={etiqueta}>Lista precio</label>
          <select
            value={selectedListaId}
            onChange={(e) => onListaChange(e.target.value)}
            className={campoSelect}
          >
            <option value="">
              {listasPrecioLoading
                ? 'Cargando listas'
                : listasPrecio.length
                  ? 'Precio base'
                  : 'Sin listas activas'}
            </option>
            {listasPrecio.map((lista) => (
              <option key={lista.id} value={lista.id}>
                {lista.nombre} - {describePriceList(lista)}
              </option>
            ))}
          </select>
          {selectedLista && (
            <p className="mt-1.5 truncate text-[11.5px] text-[#64748b]">
              {selectedLista.descripcion || describePriceList(selectedLista)}
            </p>
          )}
        </div>
      </div>

      {/* Controles fiscales y acceso a pedidos con envio */}
      <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-[#eef1f6] pt-4">
        {muestraControlesCobro && (
          <>
            <div className="w-[170px]">
              <label className={etiqueta}>Comprobante</label>
              <select
                value={tipoFiscal}
                onChange={(e) => onTipoFiscalChange(e.target.value as TipoEmisionFiscal)}
                className={campoSelect}
              >
                <option value="TICKET">Ticket</option>
                <option value="FACTURA_A">Factura A</option>
                <option value="FACTURA_B">Factura B</option>
                <option value="FACTURA_C">Factura C</option>
              </select>
            </div>
            <label className="flex h-11 cursor-pointer items-center gap-2 rounded-lg border border-[#dbe0e6] bg-white px-4 text-[14px] font-medium text-[#041627] transition-colors hover:bg-[#f8fafc]">
              <input
                type="checkbox"
                checked={emitirTicket}
                onChange={(e) => onEmitirTicketChange(e.target.checked)}
                className="h-4 w-4 accent-[#075E54]"
              />
              Emitir comprobante
            </label>
          </>
        )}

        {/* Acceso al seguimiento. La carga se hace con el boton "Enviar a
            domicilio" del carrito, que no obliga a salir del POS. */}
        {permiteEnvios && (
          <Link
            to="/pedidos-envio"
            className="ml-auto inline-flex h-11 items-center gap-2 rounded-lg border border-[#cfe2de] bg-[#f3fbf9] px-4 text-[13.5px] font-semibold text-[#075E54] transition-colors hover:bg-[#eef8f6]"
          >
            <Truck size={16} />
            Ver envíos
          </Link>
        )}
      </div>
    </div>
  );
};
