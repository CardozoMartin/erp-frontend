import { ArrowDownCircle, Loader2, Lock, PackageMinus, ReceiptText, Truck, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { TipoEmisionFiscal } from '../types/pos.type';
import type { IListaPrecioPos } from '../types/pos.type';
import type { ICaja } from '../../Cajas/types/caja.type';
import { describePriceList } from '../utils/pos.utils';

interface Props {
  sucursalNombre: string;
  empleadoNombre: string;
  cajaAbierta: ICaja | null | undefined;
  listasPrecio: IListaPrecioPos[];
  listasPrecioLoading: boolean;
  selectedListaId: string;
  selectedLista: IListaPrecioPos | undefined;
  selectedClienteId: string;
  clientes: { id: string; nombre: string; apellido?: string | null; razon_social?: string | null }[];
  tipoFiscal: TipoEmisionFiscal;
  emitirTicket: boolean;
  montoInicial: string;
  posAccess: ReturnType<typeof import('../utils/posAccess').getPosAccessRules>;
  muestraControlesCobro: boolean;
  permiteCobroDirecto: boolean;
  usaFlujoSeparado: boolean;
  puedeVerDetallesConfigPos: boolean;
  configFetching: boolean;
  abrirCajaIsPending: boolean;
  onClienteChange: (id: string) => void;
  onListaChange: (id: string) => void;
  onTipoFiscalChange: (tipo: TipoEmisionFiscal) => void;
  onEmitirTicketChange: (value: boolean) => void;
  onMontoInicialChange: (value: string) => void;
  onAbrirCaja: () => void;
}

export default function PosHeader({
  sucursalNombre,
  empleadoNombre,
  cajaAbierta,
  listasPrecio,
  listasPrecioLoading,
  selectedListaId,
  selectedLista,
  selectedClienteId,
  clientes,
  tipoFiscal,
  emitirTicket,
  montoInicial,
  posAccess,
  muestraControlesCobro,
  permiteCobroDirecto,
  usaFlujoSeparado,
  puedeVerDetallesConfigPos,
  configFetching,
  abrirCajaIsPending,
  onClienteChange,
  onListaChange,
  onTipoFiscalChange,
  onEmitirTicketChange,
  onMontoInicialChange,
  onAbrirCaja,
}: Props) {
  return (
    <>
      <div className="border-b border-[#c4c6cd] px-4 py-3">
        <div className="grid gap-3 xl:grid-cols-[auto_minmax(190px,1fr)_minmax(190px,1fr)_auto] xl:items-end">
          <Link
            to="/pedidos-envio"
            className="inline-flex h-9.5 items-center justify-center gap-2 rounded border border-[#cfe2de] bg-[#f3fbf9] px-3 text-[13px] font-semibold text-[#075E54] hover:bg-[#eef8f6]"
          >
            <Truck size={15} />
            Cargar pedido con envio
          </Link>

          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[#44474c]">
              Sucursal
            </label>
            <input
              value={sucursalNombre}
              readOnly
              className="w-full rounded border border-[#c4c6cd] bg-[#f8f9fa] px-3 py-2 text-[14px] text-[#041627] outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[#44474c]">
              Vendedor
            </label>
            <input
              value={empleadoNombre}
              readOnly
              className="w-full rounded border border-[#c4c6cd] bg-[#f8f9fa] px-3 py-2 text-[14px] text-[#041627] outline-none"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:min-w-75 xl:justify-self-end">
            {muestraControlesCobro ? (
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[#44474c]">
                  Ticket
                </label>
                <select
                  value={tipoFiscal}
                  onChange={(event) => onTipoFiscalChange(event.target.value as TipoEmisionFiscal)}
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
                    onChange={(event) => onEmitirTicketChange(event.target.checked)}
                    className="h-4 w-4 accent-[#075E54]"
                  />
                  Emitir
                </label>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(220px,1fr)_minmax(220px,1fr)] xl:max-w-195">
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[#44474c]">
              Cliente
            </label>
            <select
              value={selectedClienteId}
              onChange={(event) => onClienteChange(event.target.value)}
              className="w-full rounded border border-[#c4c6cd] bg-white px-3 py-2 text-[14px] text-[#041627] outline-none focus:border-[#075E54]"
            >
              <option value="">Consumidor final</option>
              {clientes.map((cliente) => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.razon_social || `${cliente.nombre} ${cliente.apellido ?? ''}`.trim()}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[#44474c]">
              Lista precio
            </label>
            <select
              value={selectedListaId}
              onChange={(event) => onListaChange(event.target.value)}
              className="w-full rounded border border-[#c4c6cd] bg-white px-3 py-2 text-[14px] text-[#041627] outline-none focus:border-[#075E54]"
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
            {selectedLista ? (
              <div className="mt-1 truncate text-[11px] text-[#44474c]">
                {selectedLista.descripcion || describePriceList(selectedLista)}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#c4c6cd] bg-[#f8fafc] px-4 py-2">
        <div>
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[#44474c]">
            Caja
          </label>
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
        {cajaAbierta && posAccess.puedeCobrar ? (
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
        {configFetching && puedeVerDetallesConfigPos ? (
          <span className="flex items-center gap-1 text-[12px] text-[#44474c]">
            <Loader2 size={13} className="animate-spin" />
            Actualizando configuracion
          </span>
        ) : null}
      </div>

      {!cajaAbierta && posAccess.puedeAbrirCaja && (permiteCobroDirecto || usaFlujoSeparado) ? (
        <div className="flex flex-wrap items-end gap-3 border-b border-[#c4c6cd] bg-[#fff7e8] px-4 py-3">
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[#7a4f00]">
              Monto inicial
            </label>
            <input
              type="number"
              min={0}
              value={montoInicial}
              onChange={(event) => onMontoInicialChange(event.target.value)}
              className="w-40 rounded border border-[#e3bf7a] bg-white px-3 py-2 text-[14px] text-[#041627] outline-none focus:border-[#075E54]"
            />
          </div>
          <button
            type="button"
            onClick={onAbrirCaja}
            disabled={abrirCajaIsPending}
            className="flex items-center gap-2 rounded bg-[#075E54] px-4 py-2 text-[14px] font-semibold text-white hover:bg-[#0b6d62] disabled:opacity-60"
          >
            {abrirCajaIsPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Wallet size={16} />
            )}
            Abrir caja
          </button>
        </div>
      ) : null}
    </>
  );
}
