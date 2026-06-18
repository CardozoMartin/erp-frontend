import { AlertTriangle, CreditCard, Eye, Plus, Search, ShieldOff, UserRound, Wallet } from 'lucide-react';
import { useState } from 'react';
import DataTable from '../../../components/common/DataTable';
import type { DataTableColumn } from '../../../components/common/DataTable';
import type { ICliente } from '../types/cliente.type';
import { clienteNombre, money } from '../utils/clientes.utils';

type FiltroEstado = 'activos' | 'inactivos' | 'todos';

const FILTROS: { valor: FiltroEstado; label: string }[] = [
  { valor: 'activos',   label: 'Activos' },
  { valor: 'inactivos', label: 'Inactivos' },
  { valor: 'todos',     label: 'Todos' },
];

interface Props {
  clientes: ICliente[];
  isLoading: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  onSelectCliente: (cliente: ICliente) => void;
  onNuevoCliente: () => void;
  onVerCuenta: (cliente: ICliente) => void;
}

const clientesColumns: DataTableColumn<ICliente>[] = [
  {
    key: 'cliente',
    header: 'Cliente',
    render: (cliente) => (
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate font-bold text-[#041627]">{clienteNombre(cliente)}</span>
          {cliente.accion_legal && (
            <span className="flex items-center gap-1 rounded-full bg-[#FCEBEB] px-2 py-0.5 text-[10px] font-bold text-[#A32D2D]">
              <AlertTriangle size={10} /> Acción Legal
            </span>
          )}
          {cliente.bloqueado && !cliente.accion_legal && (
            <span className="flex items-center gap-1 rounded-full bg-[#FFF3CD] px-2 py-0.5 text-[10px] font-bold text-[#856404]">
              <ShieldOff size={10} /> Bloqueado
            </span>
          )}
        </div>
        <div className="mt-1 text-[12px] text-[#44474c]">{cliente.tipo}</div>
      </div>
    ),
  },
  {
    key: 'documento',
    header: 'Documento',
    render: (cliente) => cliente.cuit || cliente.dni || '-',
  },
  {
    key: 'contacto',
    header: 'Contacto',
    render: (cliente) => (
      <div className="space-y-1 text-[12px] text-[#44474c]">
        <div>{cliente.telefono || '-'}</div>
        <div className="truncate">{cliente.email || ''}</div>
      </div>
    ),
  },
  {
    key: 'cuenta',
    header: 'Cuenta',
    align: 'right',
    render: (cliente) => {
      if (!cliente.cuentaCorriente) return <span className="text-[12px] text-[#9ca3af]">Sin cuenta</span>;
      const suspendida = !cliente.cuentaCorriente.activa;
      return (
        <div className="text-right">
          <span className={`font-bold ${Number(cliente.cuentaCorriente.saldo) > 0 ? 'text-[#b42318]' : 'text-[#075E54]'}`}>
            {money(cliente.cuentaCorriente.saldo)}
          </span>
          {suspendida && (
            <div className="mt-0.5 text-[10px] font-bold text-[#856404]">Suspendida</div>
          )}
        </div>
      );
    },
  },
  {
    key: 'estado',
    header: 'Estado',
    align: 'center',
    render: (cliente) => (
      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
        cliente.activo ? 'bg-[#e6f4ea] text-[#1e7e34]' : 'bg-[#fce8e8] text-[#ba1a1a]'
      }`}>
        {cliente.activo ? 'Activo' : 'Inactivo'}
      </span>
    ),
  },
];

export default function ClientesListSection({
  clientes,
  isLoading,
  search,
  onSearchChange,
  onSelectCliente,
  onNuevoCliente,
  onVerCuenta,
}: Props) {
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('activos');

  const clientesFiltrados = clientes.filter((c) => {
    if (filtroEstado === 'activos')   return c.activo;
    if (filtroEstado === 'inactivos') return !c.activo;
    return true;
  });

  return (
    <div className="min-h-[calc(100vh-52px)] bg-[#f3f4f6] px-4 py-4">
      <section className="mx-auto max-w-[1500px] rounded-lg border border-[#c4c6cd] bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-[#c4c6cd] px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-[15px] font-bold text-[#041627]">
              <UserRound size={17} className="text-[#075E54]" />
              Clientes
            </div>
            <div className="flex items-center gap-1 rounded-lg border border-[#c4c6cd] bg-white p-1">
              {FILTROS.map(({ valor, label }) => (
                <button
                  key={valor}
                  type="button"
                  onClick={() => setFiltroEstado(valor)}
                  className={`rounded-md px-3 py-1 text-[12px] font-semibold transition-colors ${
                    filtroEstado === valor
                      ? 'bg-[#041627] text-white'
                      : 'text-[#44474c] hover:bg-[#efedef]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={onNuevoCliente}
            className="flex h-9 items-center gap-2 rounded bg-[#075E54] px-3 text-[13px] font-semibold text-white hover:bg-[#0b6d62]"
          >
            <Plus size={15} />
            Nuevo
          </button>
        </div>

        <div className="border-b border-[#c4c6cd] bg-[#fbfbfc] p-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#44474c]" />
            <input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Buscar cliente, CUIT, DNI o telefono"
              className="h-9 w-full rounded border border-[#c4c6cd] bg-white pl-9 pr-3 text-[13px] outline-none focus:border-[#075E54]"
            />
          </div>
        </div>

        <DataTable
          rows={clientesFiltrados}
          columns={clientesColumns}
          getRowKey={(cliente) => cliente.id}
          isLoading={isLoading}
          loadingMessage="Cargando clientes..."
          emptyMessage="Sin clientes cargados."
          minWidth="920px"
          onRowClick={onSelectCliente}
          getContextActions={(cliente) => [
            {
              label: 'Ver detalles',
              icon: <Eye size={14} />,
              onClick: () => onSelectCliente(cliente),
            },
            {
              label: 'Ver cuenta corriente',
              icon: <Wallet size={14} />,
              disabled: !cliente.cuentaCorriente,
              onClick: () => onVerCuenta(cliente),
            },
            {
              label: 'Nueva venta POS',
              icon: <CreditCard size={14} />,
              dividerBefore: true,
            },
          ]}
        />
      </section>
    </div>
  );
}
