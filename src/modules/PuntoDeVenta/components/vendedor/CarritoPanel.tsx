import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
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

export const CarritoPanel = ({
  cartItems,
  selectedLista,
  subtotal,
  total,
  onCambiarCantidad,
  onQuitar,
}: Props) => {
  const cantidadItems = cartItems.reduce((suma, item) => suma + item.cantidad, 0);

  return (
    <>
      {/* Encabezado */}
      <div className="flex items-center justify-between gap-3 border-b border-[#e5e7eb] px-5 py-4">
        <div className="flex items-center gap-2.5 text-[16px] font-bold text-[#041627]">
          <ShoppingCart size={19} className="text-[#075E54]" />
          Carrito
        </div>
        <span className="rounded-md bg-[#eef2fb] px-2.5 py-1 font-mono text-[12px] font-semibold text-[#475569]">
          {cantidadItems} {cantidadItems === 1 ? 'item' : 'items'}
        </span>
      </div>

      {/* Items */}
      <div className="min-h-0 flex-1 overflow-auto">
        {cartItems.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 py-16 text-center text-[#94a3b8]">
            <ShoppingCart size={34} strokeWidth={1.3} />
            <p className="text-[14px] font-semibold text-[#64748b]">El carrito está vacío</p>
            <p className="text-[12.5px]">Tocá un producto para agregarlo</p>
          </div>
        ) : (
          <ul className="divide-y divide-[#e5e7eb]">
            {cartItems.map((item) => (
              <li
                key={item.producto.id ?? item.producto.nombre}
                className="group grid grid-cols-[1fr_auto_auto] items-center gap-3 px-5 py-3.5"
              >
                {/* Nombre y precio unitario */}
                <div className="min-w-0">
                  <p className="line-clamp-2 text-[14px] font-semibold leading-snug text-[#041627]">
                    {item.producto.nombre}
                  </p>
                  <p className="mt-0.5 text-[12.5px] text-[#64748b]">
                    {formatCurrency(item.precioUnitario)}
                  </p>
                </div>

                {/* Stepper de cantidad */}
                <div className="flex items-center gap-1 rounded-lg border border-[#dbe0e6] bg-[#f8fafc] p-0.5">
                  <button
                    type="button"
                    aria-label={`Quitar una unidad de ${item.producto.nombre}`}
                    onClick={() => onCambiarCantidad(item.producto.id, -1)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[#475569] transition-colors hover:bg-white hover:text-[#041627]"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="min-w-7 text-center font-mono text-[14px] font-semibold text-[#041627]">
                    {item.cantidad}
                  </span>
                  <button
                    type="button"
                    aria-label={`Agregar una unidad de ${item.producto.nombre}`}
                    onClick={() => onCambiarCantidad(item.producto.id, 1)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[#475569] transition-colors hover:bg-white hover:text-[#041627]"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                {/* Total de la linea + quitar */}
                <div className="flex items-center gap-1.5">
                  <span className="min-w-[76px] text-right text-[15px] font-bold text-[#041627]">
                    {formatCurrency(item.precioUnitario * item.cantidad)}
                  </span>
                  <button
                    type="button"
                    aria-label={`Quitar ${item.producto.nombre} del carrito`}
                    onClick={() => onQuitar(item.producto.id)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[#c4c6cd] transition-colors hover:bg-[#fff5f5] hover:text-[#b42318] group-hover:text-[#94a3b8]"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Totales */}
      <div className="border-t border-[#e5e7eb] px-5 py-4">
        {selectedLista && (
          <div className="mb-3 rounded-lg border border-[#cfe2de] bg-[#f3fbf9] px-3 py-2 text-[12px] text-[#075E54]">
            <span className="font-semibold">{selectedLista.nombre}</span>
            <span className="ml-1 text-[#44474c]">{describePriceList(selectedLista)}</span>
          </div>
        )}
        <div className="flex items-center justify-between text-[14px] text-[#475569]">
          <span>Subtotal</span>
          <span className="font-medium text-[#041627]">{formatCurrency(subtotal)}</span>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-[#e5e7eb] pt-3">
          <span className="text-[17px] font-bold text-[#041627]">Total</span>
          <span className="text-[22px] font-extrabold text-[#041627]">
            {formatCurrency(total)}
          </span>
        </div>
      </div>
    </>
  );
};
