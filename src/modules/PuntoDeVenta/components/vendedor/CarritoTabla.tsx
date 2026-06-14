import { Calculator, Minus, Plus, Trash2 } from 'lucide-react';
import DataTable from '../../../../components/common/DataTable';
import type { DataTableColumn } from '../../../../components/common/DataTable';
import type { ICartItem, IListaPrecioPos } from '../../types/pos.type';
import { describePriceList, formatCurrency } from '../../utils/pos.utils';

interface Props {
  cartItems: ICartItem[];
  selectedLista: IListaPrecioPos | undefined;
  subtotal: number;
  total: number;
  onCambiarCantidad: (productoId: string | undefined, delta: number) => void;
  onQuitar: (productoId: string | undefined) => void;
}

export const CarritoTabla = ({
  cartItems,
  selectedLista,
  subtotal,
  total,
  onCambiarCantidad,
  onQuitar,
}: Props) => {
  const columnas: DataTableColumn<ICartItem>[] = [
    {
      key: 'producto',
      header: 'Producto',
      render: item => <span className="font-medium text-[#041627]">{item.producto.nombre}</span>,
    },
    {
      key: 'cantidad',
      header: 'Cant.',
      align: 'center',
      render: item => (
        <div className="flex items-center justify-center gap-1">
          <button
            type="button"
            onClick={() => onCambiarCantidad(item.producto.id, -1)}
            className="inline-flex h-7 w-7 items-center justify-center rounded border border-[#c4c6cd] bg-white text-[#041627] hover:bg-[#f4f5f6]"
          >
            <Minus size={13} />
          </button>
          <span className="inline-flex h-7 min-w-9 items-center justify-center rounded border border-[#e5e7eb] bg-[#f8fafc] px-2 text-[13px]">
            {item.cantidad}
          </span>
          <button
            type="button"
            onClick={() => onCambiarCantidad(item.producto.id, 1)}
            className="inline-flex h-7 w-7 items-center justify-center rounded border border-[#c4c6cd] bg-white text-[#041627] hover:bg-[#f4f5f6]"
          >
            <Plus size={13} />
          </button>
        </div>
      ),
    },
    {
      key: 'total',
      header: 'Total',
      align: 'right',
      render: item => (
        <span className="font-semibold text-[#041627]">
          {formatCurrency(item.precioUnitario * item.cantidad)}
        </span>
      ),
    },
    {
      key: 'quitar',
      header: 'Quitar',
      align: 'center',
      render: item => (
        <button
          type="button"
          onClick={() => onQuitar(item.producto.id)}
          className="inline-flex h-8 w-8 items-center justify-center rounded border border-[#f1c7c7] bg-[#fff5f5] text-[#b42318] hover:bg-[#fdecec]"
        >
          <Trash2 size={14} />
        </button>
      ),
    },
  ];

  return (
    <>
      {/* Encabezado del carrito */}
      <div className="border-b border-[#c4c6cd] bg-[#fbf9fa] px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[14px] font-semibold text-[#041627]">
            <Calculator size={16} className="text-[#075E54]" />
            Carrito
          </div>
          <span className="rounded border border-[#cfe2de] bg-[#f3fbf9] px-2.5 py-1 text-[11px] font-medium text-[#075E54]">
            {cartItems.length} items
          </span>
        </div>
      </div>

      {/* Tabla de items */}
      <div className="max-h-[360px] flex-1 overflow-auto">
        <DataTable
          rows={cartItems}
          columns={columnas}
          getRowKey={item => item.producto.id ?? item.producto.nombre}
          emptyMessage="Carrito vacío."
          getContextActions={item => [
            { label: 'Sumar unidad', icon: <Plus size={14} />, onClick: () => onCambiarCantidad(item.producto.id, 1) },
            { label: 'Restar unidad', icon: <Minus size={14} />, onClick: () => onCambiarCantidad(item.producto.id, -1) },
            { label: 'Quitar producto', icon: <Trash2 size={14} />, danger: true, dividerBefore: true, onClick: () => onQuitar(item.producto.id) },
          ]}
        />
      </div>

      {/* Totales */}
      <div className="space-y-2 border-t border-[#c4c6cd] bg-[#fbf9fa] px-4 pt-4">
        {selectedLista ? (
          <div className="rounded border border-[#cfe2de] bg-white px-3 py-2 text-[12px] text-[#075E54]">
            <span className="font-semibold">{selectedLista.nombre}</span>
            <span className="ml-1 text-[#44474c]">{describePriceList(selectedLista)}</span>
          </div>
        ) : null}
        <div className="flex items-center justify-between text-[14px] text-[#44474c]">
          <span>Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex items-center justify-between text-[18px] font-bold text-[#041627]">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>
    </>
  );
};
