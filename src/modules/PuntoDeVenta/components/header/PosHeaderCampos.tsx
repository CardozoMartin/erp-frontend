import { Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { TipoEmisionFiscal, IListaPrecioPos } from '../../types/pos.type';
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
  onTipoFiscalChange: (tipo: TipoEmisionFiscal) => void;
  onEmitirTicketChange: (value: boolean) => void;
  onClienteChange: (id: string) => void;
  onListaChange: (id: string) => void;
}

export const PosHeaderCampos = ({
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
  onTipoFiscalChange,
  onEmitirTicketChange,
  onClienteChange,
  onListaChange,
}: Props) => {
  return (
    <div className="border-b border-[#c4c6cd] px-4 py-3">
      <div className="grid gap-3 xl:grid-cols-[auto_minmax(190px,1fr)_minmax(190px,1fr)_auto] xl:items-end">
        {/* Acceso rápido a pedidos con envío */}
        <Link
          to="/pedidos-envio"
          className="inline-flex h-9.5 items-center justify-center gap-2 rounded border border-[#cfe2de] bg-[#f3fbf9] px-3 text-[13px] font-semibold text-[#075E54] hover:bg-[#eef8f6]"
        >
          <Truck size={15} />
          Cargar pedido con envío
        </Link>

        {/* Sucursal (solo lectura) */}
        <div>
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[#44474c]">Sucursal</label>
          <input
            value={sucursalNombre}
            readOnly
            className="w-full rounded border border-[#c4c6cd] bg-[#f8f9fa] px-3 py-2 text-[14px] text-[#041627] outline-none"
          />
        </div>

        {/* Vendedor (solo lectura) */}
        <div>
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[#44474c]">Vendedor</label>
          <input
            value={empleadoNombre}
            readOnly
            className="w-full rounded border border-[#c4c6cd] bg-[#f8f9fa] px-3 py-2 text-[14px] text-[#041627] outline-none"
          />
        </div>

        {/* Tipo fiscal + emitir ticket */}
        <div className="grid gap-3 sm:grid-cols-2 xl:min-w-75 xl:justify-self-end">
          {muestraControlesCobro ? (
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[#44474c]">Ticket</label>
              <select
                value={tipoFiscal}
                onChange={e => onTipoFiscalChange(e.target.value as TipoEmisionFiscal)}
                className="w-full rounded border border-[#c4c6cd] bg-white px-3 py-2 text-[14px] text-[#041627] outline-none focus:border-[#075E54]"
              >
                <option value="TICKET">Ticket</option>
                <option value="FACTURA_A">Factura A</option>
                <option value="FACTURA_B">Factura B</option>
                <option value="FACTURA_C">Factura C</option>
              </select>
            </div>
          ) : null}
          {muestraControlesCobro ? (
            <div className="flex items-end">
              <label className="flex h-9.5 w-full items-center justify-center gap-2 rounded border border-[#c4c6cd] bg-white px-3 text-[13px] font-medium text-[#041627]">
                <input
                  type="checkbox"
                  checked={emitirTicket}
                  onChange={e => onEmitirTicketChange(e.target.checked)}
                  className="h-4 w-4 accent-[#075E54]"
                />
                Emitir
              </label>
            </div>
          ) : null}
        </div>
      </div>

      {/* Cliente y lista de precios */}
      <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(220px,1fr)_minmax(220px,1fr)] xl:max-w-195">
        <div>
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[#44474c]">Cliente</label>
          <select
            value={selectedClienteId}
            onChange={e => onClienteChange(e.target.value)}
            className="w-full rounded border border-[#c4c6cd] bg-white px-3 py-2 text-[14px] text-[#041627] outline-none focus:border-[#075E54]"
          >
            <option value="">Consumidor final</option>
            {clientes.map(c => (
              <option key={c.id} value={c.id}>
                {c.razon_social || `${c.nombre} ${c.apellido ?? ''}`.trim()}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[#44474c]">Lista precio</label>
          <select
            value={selectedListaId}
            onChange={e => onListaChange(e.target.value)}
            className="w-full rounded border border-[#c4c6cd] bg-white px-3 py-2 text-[14px] text-[#041627] outline-none focus:border-[#075E54]"
          >
            <option value="">
              {listasPrecioLoading ? 'Cargando listas' : listasPrecio.length ? 'Precio base' : 'Sin listas activas'}
            </option>
            {listasPrecio.map(lista => (
              <option key={lista.id} value={lista.id}>
                {lista.nombre} - {describePriceList(lista)}
              </option>
            ))}
          </select>
          {selectedLista ? (
            <div className="mt-1 truncate text-[11px] text-[#44474c]">
              {selectedLista.descripcion || describePriceList(selectedLista)}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
