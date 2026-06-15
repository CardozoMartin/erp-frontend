import { Eye, PackagePlus, Plus, ReceiptText, Search, Send, Truck, XCircle } from 'lucide-react';
import DataTable from '../../../../components/common/DataTable';
import type { DataTableColumn } from '../../../../components/common/DataTable';
import { money } from '../../../POSAuxiliares/utils/format';
import { dateTime } from '../../../POSAuxiliares/utils/format';
import type { IEmpleado } from '../../../Empleados/types/empleado.type';
import type { IPedidoEnvio, EstadoPedidoEnvio } from '../../types/pedido-envio.type';
import { clienteNombre, estadoClass, estadoLabel, pagoClass, pagoLabel } from '../../utils/pedidos.utils';

interface Props {
  pedidos: IPedidoEnvio[];
  isLoading: boolean;
  search: string;
  onSearchChange: (v: string) => void;
  clientesById: Map<string, { nombre?: string; apellido?: string | null; razon_social?: string | null }>;
  empleadosById: Map<string, IEmpleado>;
  puedeCrear: boolean;
  onNuevo: () => void;
  onDetalle: (pedido: IPedidoEnvio) => void;
  onEditar: (pedido: IPedidoEnvio) => void;
  onCambiarEstado: (pedido: IPedidoEnvio, estado: EstadoPedidoEnvio) => void;
}

export const PedidoLista = ({
  pedidos, isLoading, search, onSearchChange,
  clientesById, empleadosById,
  puedeCrear, onNuevo, onDetalle, onEditar, onCambiarEstado,
}: Props) => {
  const columns: DataTableColumn<IPedidoEnvio>[] = [
    { key: 'hora', header: 'Hora', render: (p) => dateTime(p.created_at) },
    {
      key: 'cliente', header: 'Cliente',
      render: (p) => (
        <div className="min-w-0">
          <div className="truncate font-bold text-[#041627]">{clienteNombre(clientesById.get(p.cliente_id))}</div>
          <div className="mt-1 truncate text-[12px] text-[#44474c]">{p.telefono_contacto || 'Sin telefono'}</div>
        </div>
      ),
    },
    {
      key: 'direccion', header: 'Direccion',
      render: (p) => (
        <div className="min-w-0">
          <div className="truncate font-semibold text-[#041627]">{p.direccion_entrega}</div>
          <div className="mt-1 truncate text-[12px] text-[#44474c]">
            {[p.barrio_entrega, p.localidad_entrega, p.codigo_postal_entrega ? `CP ${p.codigo_postal_entrega}` : null].filter(Boolean).join(' | ') || 'Sin zona'}
          </div>
        </div>
      ),
    },
    {
      key: 'estado', header: 'Estado',
      render: (p) => <span className={`rounded border px-2 py-1 text-[11px] font-semibold ${estadoClass[p.estado]}`}>{estadoLabel[p.estado]}</span>,
    },
    {
      key: 'pago', header: 'Pago',
      render: (p) => <span className={`rounded border px-2 py-1 text-[11px] font-semibold ${pagoClass[p.estado_pago]}`}>{pagoLabel[p.estado_pago]}</span>,
    },
    {
      key: 'repartidor', header: 'Asignado',
      render: (p) => p.empleado_repartidor_id ? (empleadosById.get(p.empleado_repartidor_id)?.nombreCompleto ?? 'Asignado') : 'Sin asignar',
    },
    {
      key: 'total', header: 'Total', align: 'right',
      render: (p) => <span className="font-bold text-[#041627]">{money(p.comprobante?.total ?? 0)}</span>,
    },
  ];

  return (
    <div className="min-h-[calc(100vh-52px)] bg-[#f3f4f6] px-4 py-4">
      <section className="mx-auto max-w-[1500px] rounded-lg border border-[#c4c6cd] bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#c4c6cd] px-4 py-3">
          <div>
            <div className="flex items-center gap-2 text-[18px] font-bold text-[#041627]">
              <Truck size={18} className="text-[#075E54]" />
              Pedidos de envio del dia
            </div>
            <div className="text-[13px] text-[#44474c]">Tabla operativa de pedidos creados hoy.</div>
          </div>
          <button type="button" onClick={onNuevo} disabled={!puedeCrear} className="flex h-9 items-center gap-2 rounded bg-[#075E54] px-3 text-[13px] font-semibold text-white disabled:opacity-60">
            <Plus size={15} /> Nuevo pedido
          </button>
        </div>

        <div className="border-b border-[#c4c6cd] bg-[#fbfbfc] p-3">
          <div className="relative max-w-[420px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#44474c]" />
            <input value={search} onChange={(e) => onSearchChange(e.target.value)} placeholder="Buscar cliente, direccion, estado o producto" className="h-9 w-full rounded border border-[#c4c6cd] bg-white pl-9 pr-3 text-[13px] outline-none focus:border-[#075E54]" />
          </div>
        </div>

        <DataTable
          rows={pedidos}
          columns={columns}
          getRowKey={(p) => p.id}
          isLoading={isLoading}
          loadingMessage="Cargando pedidos del dia..."
          emptyMessage="Sin pedidos de envio cargados hoy."
          emptyTitle="No hay pedidos de envio cargados"
          emptyDescription="Cuando registres pedidos para entregar, van a aparecer aca para prepararlos, asignarlos y rendirlos."
          minWidth="1120px"
          onRowClick={onDetalle}
          getContextActions={(p) => [
            { label: 'Ver detalles', icon: <Eye size={14} />, onClick: () => onDetalle(p) },
            { label: 'Editar pedido', icon: <PackagePlus size={14} />, disabled: ['ENTREGADO', 'CANCELADO'].includes(p.estado) || ['PAGADO', 'RENDIDO'].includes(p.estado_pago), onClick: () => onEditar(p) },
            { label: 'Marcar preparando', icon: <ReceiptText size={14} />, disabled: p.estado !== 'PENDIENTE', onClick: () => onCambiarEstado(p, 'PREPARANDO') },
            { label: 'Marcar en camino', icon: <Send size={14} />, disabled: ['EN_CAMINO', 'ENTREGADO', 'CANCELADO'].includes(p.estado), onClick: () => onCambiarEstado(p, 'EN_CAMINO') },
            { label: 'Cancelar pedido', icon: <XCircle size={14} />, danger: true, dividerBefore: true, disabled: ['ENTREGADO', 'CANCELADO'].includes(p.estado), onClick: () => onCambiarEstado(p, 'CANCELADO') },
          ]}
        />
      </section>
    </div>
  );
};
