import { Plus, Search } from 'lucide-react';
import DataTable from '../../../../components/common/DataTable';
import type { DataTableColumn } from '../../../../components/common/DataTable';
import type { IProducto } from '../../../Productos/types/productos.type';
import type { IListaPrecioPos } from '../../types/pos.type';
import { applyPriceList, formatCurrency, getProductCode, getStockForBranch, getStockLocationForBranch } from '../../utils/pos.utils';

interface Props {
  productos: IProducto[];
  cargando: boolean;
  sucursalId: string | null | undefined;
  busqueda: string;
  selectedLista: IListaPrecioPos | undefined;
  puedeVender: boolean;
  onBusquedaChange: (valor: string) => void;
  onAgregar: (producto: IProducto) => void;
}

export const ProductosBuscador = ({
  productos,
  cargando,
  sucursalId,
  busqueda,
  selectedLista,
  puedeVender,
  onBusquedaChange,
  onAgregar,
}: Props) => {
  const columnas: DataTableColumn<IProducto>[] = [
    {
      key: 'producto',
      header: 'Producto',
      render: p => <span className="font-medium text-[#041627]">{p.nombre}</span>,
    },
    {
      key: 'codigo',
      header: 'Codigo',
      render: p => getProductCode(p),
    },
    {
      key: 'stock',
      header: 'Stock',
      align: 'right',
      render: p => getStockForBranch(p, sucursalId),
    },
    {
      key: 'ubicacion',
      header: 'Ubicacion',
      render: p => (
        <span className="block max-w-[240px] whitespace-normal text-[12px] leading-snug text-[#44474c]">
          {getStockLocationForBranch(p, sucursalId)}
        </span>
      ),
    },
    {
      key: 'precio',
      header: 'Precio',
      align: 'right',
      render: p => (
        <span className="font-semibold text-[#041627]">
          {formatCurrency(applyPriceList(Number(p.precio_venta ?? p.precio_base ?? 0), selectedLista))}
        </span>
      ),
    },
    {
      key: 'accion',
      header: 'Accion',
      align: 'center',
      render: p => {
        const stock = getStockForBranch(p, sucursalId);
        return (
          <button
            type="button"
            onClick={() => onAgregar(p)}
            disabled={stock <= 0 || !puedeVender}
            className="inline-flex items-center gap-1 rounded border border-[#c4c6cd] bg-white px-3 py-1.5 text-[12px] font-medium text-[#075E54] hover:bg-[#f3fbf9] disabled:text-[#9ca3af]"
          >
            <Plus size={14} />
            Agregar
          </button>
        );
      },
    },
  ];

  return (
    <section className="border-b border-[#c4c6cd] lg:border-b-0 lg:border-r">
      {/* Buscador */}
      <div className="border-b border-[#c4c6cd] bg-[#fbf9fa] px-4 py-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#44474c]" />
          <input
            type="text"
            value={busqueda}
            onChange={e => onBusquedaChange(e.target.value)}
            placeholder="Buscar producto por nombre, codigo o ubicacion"
            className="w-full rounded border border-[#c4c6cd] bg-white py-2 pl-10 pr-3 text-[14px] text-[#041627] outline-none focus:border-[#075E54]"
          />
        </div>
      </div>

      {/* Tabla de productos */}
      <div className="max-h-[600px] overflow-auto">
        <DataTable
          rows={productos}
          columns={columnas}
          getRowKey={p => p.id ?? p.codigo_barras ?? p.nombre}
          isLoading={cargando}
          loadingMessage="Cargando productos"
          emptyMessage="No se encontraron productos."
          getContextActions={p => [
            {
              label: 'Agregar',
              icon: <Plus size={14} />,
              disabled: getStockForBranch(p, sucursalId) <= 0 || !puedeVender,
              onClick: () => onAgregar(p),
            },
          ]}
        />
      </div>
    </section>
  );
};
