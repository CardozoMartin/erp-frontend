import { useState } from 'react';
import { Minus, Package, Plus, X } from 'lucide-react';

const StockQuickModal = ({ product, onClose, onSave }: any) => {
  const [stockValues, setStockValues] = useState(
    (product?.stock ?? []).map((s: any) => ({ ...s, cantidad: s.cantidad ?? 0 }))
  );

  const handleChange = (idx: number, val: any) => {
    const next = [...stockValues];
    next[idx] = { ...next[idx], cantidad: Number(val) };
    setStockValues(next);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#fbf9fa] rounded-lg w-[420px] shadow-2xl overflow-hidden">
        {/* header */}
        <div className="bg-[#075E54] text-white px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Package size={16} />
            Actualizar stock — {product?.nombre}
          </div>
          <button onClick={onClose} className="hover:text-white/70 cursor-pointer">
            <X size={16} />
          </button>
        </div>

        {/* body */}
        <div className="p-4 flex flex-col gap-3">
          {stockValues.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">
              No hay sucursales configuradas.
            </p>
          )}
          {stockValues.map((s: any, idx: number) => (
            <div
              key={idx}
              className="flex items-center justify-between bg-white border border-gray-200 rounded-md px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-[#041627]">
                  {s.sucursal_nombre ?? `Sucursal ${idx + 1}`}
                </p>
                <p className="text-[11px] text-gray-500">Mínimo: {s.cantidad_minima ?? 0} u.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleChange(idx, Math.max(0, s.cantidad - 1))}
                  className="w-7 h-7 rounded border border-gray-300 bg-white flex items-center justify-center hover:bg-gray-100 cursor-pointer"
                >
                  <Minus size={13} />
                </button>
                <input
                  type="number"
                  value={s.cantidad}
                  onChange={(e) => handleChange(idx, e.target.value)}
                  className="w-16 text-center border border-gray-300 rounded px-2 py-1 text-sm font-medium text-[#041627] bg-white"
                />
                <button
                  onClick={() => handleChange(idx, s.cantidad + 1)}
                  className="w-7 h-7 rounded border border-gray-300 bg-white flex items-center justify-center hover:bg-gray-100 cursor-pointer"
                >
                  <Plus size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* footer */}
        <div className="px-4 py-3 border-t border-gray-200 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-1.5 border border-gray-300 rounded text-sm text-gray-600 bg-white hover:bg-gray-50 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              onSave(stockValues);
              onClose();
            }}
            className="px-4 py-1.5 bg-[#075E54] text-white rounded text-sm font-medium hover:bg-[#064d45] cursor-pointer"
          >
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
}

export default StockQuickModal;
