import { AlertTriangle, Package } from 'lucide-react';
import { StockSection } from '../ProductFormSections/StockSection';
import { useGetSucursales } from '../../../Sucursal/hooks/useSucursal';
import { useFormContext } from 'react-hook-form';

const TabStock = ({ product, onOpenStockModal, isEditing }: any) => {
  const { data: sucursales } = useGetSucursales();
  const sucursalesActivas = sucursales?.data ?? [];
  const formContext = useFormContext();
  const watchedTieneVariantes = formContext ? formContext.watch('tiene_variantes') : product?.tiene_variantes;

  if (watchedTieneVariantes) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-white border border-gray-200 rounded-lg p-6 text-center gap-3">
        <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 border border-amber-200">
          <AlertTriangle size={24} />
        </div>
        <h4 className="text-base font-semibold text-[#041627]">Stock gestionado por variante</h4>
        <p className="text-sm text-gray-500 max-w-md">
          Este producto tiene variantes habilitadas. El stock de cada variante debe gestionarse individualmente desde la pestaña de <strong>Variantes</strong>.
        </p>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="bg-white p-6 rounded-md border border-gray-200">
        <StockSection namePrefix="stock" sucursales={sucursalesActivas} />
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <p className="text-sm font-semibold text-[#041627]">Stock por sucursal</p>
        <button
          onClick={onOpenStockModal}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-700 text-white text-sm font-medium rounded hover:bg-blue-800 cursor-pointer"
        >
          <Package size={14} /> Actualizar stock
        </button>
      </div>

      {(product?.stock ?? []).map((s: any, idx: number) => {
        const bajo = (s.cantidad ?? 0) <= (s.cantidad_minima ?? 0);
        return (
          <div
            key={idx}
            className={`bg-white border rounded-lg px-5 py-4 flex justify-between items-center
              ${bajo ? 'border-amber-300' : 'border-gray-200'}`}
          >
            <div>
              <p className="text-base font-medium text-[#041627]">
                {s.sucursal_nombre ?? `Sucursal ${idx + 1}`}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Cantidad mínima: {s.cantidad_minima ?? 0} unidades
              </p>
            </div>
            <div className="flex items-center gap-3">
              {bajo && (
                <span className="flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                  <AlertTriangle size={11} /> Stock bajo
                </span>
              )}
              <div className="text-right">
                <p className={`text-3xl font-bold ${bajo ? 'text-amber-700' : 'text-[#075E54]'}`}>
                  {s.cantidad ?? 0}
                </p>
                <p className="text-[11px] text-gray-400">unidades</p>
              </div>
            </div>
          </div>
        );
      })}

      {(product?.stock ?? []).length === 0 && (
        <div className="text-center py-16 text-gray-400 text-sm">
          No hay stock configurado para este producto.
        </div>
      )}
    </div>
  );
}

export default TabStock;
