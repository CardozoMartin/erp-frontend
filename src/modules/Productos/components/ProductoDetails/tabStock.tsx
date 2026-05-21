import { AlertTriangle, Package, MapPin, Layers, Building2, HelpCircle } from 'lucide-react';
import { StockSection } from '../ProductFormSections/StockSection';
import { useGetSucursales } from '../../../Sucursal/hooks/useSucursal';
import { useFormContext } from 'react-hook-form';

const TabStock = ({ product, onOpenStockModal, isEditing }: any) => {
  const { data: sucursales } = useGetSucursales();
  const sucursalesActivas = sucursales?.data ?? [];
  const formContext = useFormContext();
  const watchedTieneVariantes = formContext ? formContext.watch('tiene_variantes') : product?.tiene_variantes;

  // Si tiene variantes habilitadas, no gestionamos stock general
  if (watchedTieneVariantes) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-3 bg-slate-50 border border-slate-200/50 rounded-lg p-8 max-w-lg mx-auto my-4 shadow-sm">
        <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 border border-amber-200 shadow-inner">
          <Layers size={26} className="stroke-[1.5]" />
        </div>
        <h4 className="text-base font-bold text-[#041627]">Stock Gestionado por Variantes</h4>
        <p className="text-xs text-gray-500 max-w-sm leading-relaxed">
          Este producto tiene la configuración de variantes activa. Las cantidades de inventario deben configurarse individualmente en la pestaña de <strong>Variantes</strong>.
        </p>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="p-4 bg-white rounded border border-slate-100">
        <div className="flex items-center gap-2 mb-4 bg-slate-50 p-3 rounded text-xs text-gray-500 border border-slate-150">
          <HelpCircle size={14} className="text-[#075E54] shrink-0" />
          <span>Configura las cantidades reales e inventario mínimo para cada una de tus sucursales habilitadas. Dejar la sucursal vacía actuará como stock general.</span>
        </div>
        <StockSection namePrefix="stock" sucursales={sucursalesActivas} />
      </div>
    );
  }

  const stocks = product?.stock ?? [];

  return (
    <div className="flex flex-col gap-5 pt-3">
      
      {/* Header and Quick Action */}
      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
        <div>
          <p className="text-sm font-extrabold text-[#041627] uppercase tracking-wider flex items-center gap-1.5">
            <Building2 size={15} className="text-[#075E54]" />
            Inventario por Sucursal
          </p>
          <p className="text-xs text-gray-400 mt-0.5">Control de existencias físicas en tiempo real.</p>
        </div>
        <button
          type="button"
          onClick={onOpenStockModal}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#075E54] hover:bg-[#064d45] text-white text-xs font-bold rounded shadow-sm hover:shadow transition cursor-pointer"
        >
          <Package size={13} />
          Ajuste Rápido de Stock
        </button>
      </div>

      {/* Branch Stocks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stocks.map((s: any, idx: number) => {
          const bajo = (s.cantidad ?? 0) <= (s.cantidad_minima ?? 0);
          return (
            <div
              key={idx}
              className={`bg-white border rounded-lg p-5 flex justify-between items-center transition-all hover:shadow-md
                ${bajo 
                  ? 'border-rose-300 bg-rose-50/20 shadow-[0_2px_12px_rgba(239,68,68,0.03)]' 
                  : 'border-slate-200 hover:border-[#075E54]/40'}`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-md shrink-0 mt-0.5
                  ${bajo ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-gray-500'}`}>
                  <MapPin size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#041627]">
                    {s.sucursal_nombre ?? `Sucursal ${idx + 1}`}
                  </p>
                  <p className="text-[11px] text-gray-400 font-semibold mt-0.5">
                    Stock Mínimo: <span className="font-bold text-gray-600">{s.cantidad_minima ?? 0} U</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {bajo && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 uppercase tracking-wider animate-pulse">
                    <AlertTriangle size={10} /> Stock Bajo
                  </span>
                )}
                <div className="text-right">
                  <p className={`text-3xl font-black tracking-tight leading-none ${bajo ? 'text-rose-600' : 'text-[#075E54]'}`}>
                    {s.cantidad ?? 0}
                  </p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">unidades</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {stocks.length === 0 && (
        <div className="text-center py-16 border border-dashed border-gray-200 rounded-lg bg-slate-50 text-gray-400 flex flex-col items-center justify-center gap-2">
          <Package size={36} className="opacity-25 text-gray-400 stroke-[1.5]" />
          <p className="text-sm font-medium">No se registran existencias configuradas para este producto.</p>
          <p className="text-xs text-gray-400">Presiona el botón de ajuste rápido para agregar stock.</p>
        </div>
      )}
    </div>
  );
}

export default TabStock;
