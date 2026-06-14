import type { TipoEmisionFiscal, IListaPrecioPos } from '../types/pos.type';
import type { ICaja } from '../../Cajas/types/caja.type';
import type { PosAccessRules } from '../utils/posAccess';
import { PosHeaderCampos } from './header/PosHeaderCampos';
import { PosCajaBarra } from './header/PosCajaBarra';
import { PosAbrirCaja } from './header/PosAbrirCaja';

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
  posAccess: PosAccessRules;
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
      {/* 1.- Campos principales: sucursal, vendedor, cliente, lista de precio, tipo fiscal */}
      <PosHeaderCampos
        sucursalNombre={sucursalNombre}
        empleadoNombre={empleadoNombre}
        muestraControlesCobro={muestraControlesCobro}
        tipoFiscal={tipoFiscal}
        emitirTicket={emitirTicket}
        selectedClienteId={selectedClienteId}
        clientes={clientes}
        listasPrecio={listasPrecio}
        listasPrecioLoading={listasPrecioLoading}
        selectedListaId={selectedListaId}
        selectedLista={selectedLista}
        onTipoFiscalChange={onTipoFiscalChange}
        onEmitirTicketChange={onEmitirTicketChange}
        onClienteChange={onClienteChange}
        onListaChange={onListaChange}
      />

      {/* 2.- Barra de estado de caja con acciones rápidas */}
      <PosCajaBarra
        cajaAbierta={cajaAbierta}
        usaFlujoSeparado={usaFlujoSeparado}
        puedeCobrar={posAccess.puedeCobrar}
        puedeVerDetallesConfigPos={puedeVerDetallesConfigPos}
        configFetching={configFetching}
      />

      {/* 3.- Panel de apertura de caja (visible solo si no hay caja abierta y tiene permiso) */}
      {!cajaAbierta && posAccess.puedeAbrirCaja && (permiteCobroDirecto || usaFlujoSeparado) ? (
        <PosAbrirCaja
          montoInicial={montoInicial}
          abrirCajaIsPending={abrirCajaIsPending}
          onMontoChange={onMontoInicialChange}
          onAbrirCaja={onAbrirCaja}
        />
      ) : null}
    </>
  );
}
