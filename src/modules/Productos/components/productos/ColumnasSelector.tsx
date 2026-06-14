import { Columns3, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import type { DefinicionColumna, ProductoColumnaKey } from '../../utils/columnas.utils';
import { COLUMNAS_DEFAULT } from '../../utils/columnas.utils';

interface Props {
  disponibles: DefinicionColumna[];
  visibles: ProductoColumnaKey[];
  puedeConfigurar: boolean;
  onCambiar: (columnas: ProductoColumnaKey[]) => void;
}

export const ColumnasSelector = ({ disponibles, visibles, puedeConfigurar, onCambiar }: Props) => {
  const [menuAbierto, setMenuAbierto] = useState(false);

  const seleccionadas = disponibles.filter((c) => visibles.includes(c.key));
  const sensiblesVisibles = seleccionadas.filter((c) => c.sensitive).length;

  const manejarToggle = (key: ProductoColumnaKey) => {
    const siguientes = visibles.includes(key)
      ? visibles.filter((k) => k !== key)
      : [...visibles, key];
    onCambiar(siguientes);
  };

  return (
    <div className="px-4 py-3 bg-white border-b border-[#d7d9de] flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-[13px] text-[#44474c]">
        <Columns3 size={16} className="text-[#075E54]" />
        <span>
          Vista: {seleccionadas.length} columnas
          {sensiblesVisibles > 0 ? `, ${sensiblesVisibles} sensibles` : ''}
        </span>
      </div>

      {puedeConfigurar && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuAbierto((prev) => !prev)}
            className="h-8 px-3 border border-[#c4c6cd] bg-white text-[#041627] hover:bg-[#f5f7f8] text-[13px] font-medium flex items-center gap-2"
          >
            <SlidersHorizontal size={15} />
            Columnas
          </button>

          {menuAbierto && (
            <div className="absolute right-0 top-10 z-40 w-72 border border-[#c4c6cd] bg-white shadow-xl">
              <div className="px-4 py-3 border-b border-[#e4e6ea]">
                <p className="text-[13px] font-semibold text-[#041627]">Datos visibles</p>
                <p className="text-[12px] text-[#59616b] mt-0.5">
                  Esta vista queda guardada para la tabla de productos.
                </p>
              </div>
              <div className="py-1 max-h-80 overflow-y-auto">
                {disponibles.map((col) => (
                  <label
                    key={col.key}
                    className="px-4 py-2 flex items-center justify-between gap-3 hover:bg-[#f5f7f8] cursor-pointer"
                  >
                    <span className="flex items-center gap-2 text-[13px] text-[#2f343a]">
                      <input
                        type="checkbox"
                        checked={visibles.includes(col.key)}
                        onChange={() => manejarToggle(col.key)}
                        className="h-4 w-4 accent-[#075E54]"
                      />
                      {col.label}
                    </span>
                    {col.sensitive && (
                      <span className="text-[10px] font-semibold uppercase text-[#8a5a00] bg-[#fff4d6] px-2 py-0.5">
                        sensible
                      </span>
                    )}
                  </label>
                ))}
              </div>
              <div className="px-4 py-3 border-t border-[#e4e6ea] flex justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onCambiar(COLUMNAS_DEFAULT)}
                  className="text-[12px] font-medium text-[#44474c] hover:text-[#041627]"
                >
                  Vista operativa
                </button>
                <button
                  type="button"
                  onClick={() => setMenuAbierto(false)}
                  className="px-3 py-1.5 bg-[#041627] text-white text-[12px] font-medium"
                >
                  Aplicar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
