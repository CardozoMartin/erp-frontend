import { CreditCard, Eye, Plus, Search, UserRound, Wallet } from 'lucide-react';
import DataTable from '../../../components/common/DataTable';
import type { DataTableColumn } from '../../../components/common/DataTable';
import type { ICliente } from '../types/cliente.type';
import { clienteNombre, money } from '../utils/clientes.utils';

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
        <div className="truncate font-bold text-[#041627]">{clienteNombre(cliente)}</div>
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
    render: (cliente) =>
      cliente.cuentaCorriente ? (
        <span
          className={`font-bold ${
            Number(cliente.cuentaCorriente.saldo) > 0 ? 'text-[#b42318]' : 'text-[#075E54]'
          }`}
        >
          {money(cliente.cuentaCorriente.saldo)}
        </span>
      ) : (
        <span className="text-[12px] text-[#9ca3af]">Sin cuenta</span>
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
  return (
    <div className="min-h-[calc(100vh-52px)] bg-[#f3f4f6] px-4 py-4">
      <section className="mx-auto max-w-[1500px] rounded-lg border border-[#c4c6cd] bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-[#c4c6cd] px-4 py-3">
          <div className="flex items-center gap-2 text-[15px] font-bold text-[#041627]">
            <UserRound size={17} className="text-[#075E54]" />
            Clientes
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
          rows={clientes}
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
