import { formatPrice } from '../../Pages/Productdetailview';
import { VariantesSection } from '../ProductFormSections/VariantesSection';
import { useFormContext } from 'react-hook-form';
import { useGetSucursales } from '../../../Sucursal/hooks/useSucursal';
import { useGetAllProductCategoriesActives } from '../../hooks/useProductCategory';
import { Layers, Layers3, Tags, Box, Info } from 'lucide-react';

const TabVariantes = ({ product, isEditing }: any) => {
  const formContext = useFormContext<any>();
  const watch = formContext?.watch;
  const { data: sucursales } = useGetSucursales();
  const { data: categorias } = useGetAllProductCategoriesActives(1, 1000);
  
  const watchedTieneVencimiento = watch ? watch('tiene_vencimiento') : product?.tiene_vencimiento;
  const watchedCategoriaId = watch ? watch('categoria_id') : product?.categoria_id;
  const watchedTieneVariantes = watch ? watch('tiene_variantes') : product?.tiene_variantes;
  const todasLasCategorias = categorias?.data || [];
  const categoriaSeleccionada = todasLasCategorias.find((cat: any) => cat.id === watchedCategoriaId);
  const atributosCategoria = categoriaSeleccionada?.atributos || [];
  const sucursalesActivas = sucursales?.data ?? [];

  if (!watchedTieneVariantes) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-3 bg-slate-50 border border-slate-200/50 rounded-lg p-8 max-w-lg mx-auto my-4 shadow-sm">
        <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center text-gray-400 border border-gray-200 shadow-inner">
          <Layers size={26} className="stroke-[1.5]" />
        </div>
        <h4 className="text-base font-bold text-[#041627]">Variantes Desactivadas</h4>
        <p className="text-xs text-gray-500 max-w-sm leading-relaxed">
          Este producto no tiene activada la gestión de variantes. Puedes habilitar las variantes en la pestaña de <strong>Información General</strong>.
        </p>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="p-4 bg-white rounded border border-slate-100">
        <div className="flex items-center gap-2 mb-4 bg-slate-50 p-3 rounded text-xs text-gray-500 border border-slate-150">
          <Info size={14} className="text-[#075E54] shrink-0" />
          <span>Configura las combinaciones de atributos (ej. Talle y Color). Podrás definir códigos de barra, SKU, y precios adicionales para cada variante creada.</span>
        </div>
        <VariantesSection 
          tieneVencimiento={watchedTieneVencimiento}
          sucursales={sucursalesActivas}
          atributosCategoria={atributosCategoria}
        />
      </div>
    );
  }

  const variantes = product?.variantes ?? [];

  return (
    <div className="flex flex-col gap-5 pt-3">
      
      {/* Header Info */}
      <div className="border-b border-slate-100 pb-3">
        <p className="text-sm font-extrabold text-[#041627] uppercase tracking-wider flex items-center gap-1.5">
          <Layers3 size={15} className="text-[#075E54]" />
          Matriz de Variantes y Atributos
        </p>
        <p className="text-xs text-gray-400 mt-0.5">Gestión detallada de SKUs, recargos y stock por cada combinación.</p>
      </div>

      {/* Grid of Variants (Lectura Premium) */}
      <div className="flex flex-col gap-3">
        {variantes.map((v: any, idx: number) => {
          const variantStock = (v.stock ?? []).reduce((a: number, s: any) => a + (s.cantidad ?? 0), 0);
          const hasPriceExtra = v.precio_extra > 0;
          
          return (
            <div
              key={idx}
              className="bg-white border border-slate-200 hover:border-[#075E54]/40 hover:shadow-md transition-all rounded-lg p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
            >
              {/* Combinación & SKU */}
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-slate-50 text-gray-500 rounded-md border border-slate-100 shrink-0 mt-0.5">
                  <Tags size={18} className="text-[#075E54]" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {v.atributos?.map((a: any, aIdx: number) => (
                      <span key={aIdx} className="text-xs font-bold text-gray-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                        {a.nombre}: <span className="text-[#075E54]">{a.valor}</span>
                      </span>
                    )) ?? <span className="text-sm font-bold text-[#041627]">Variante #{idx + 1}</span>}
                  </div>
                  {v.sku && (
                    <p className="text-[11px] text-gray-400 font-mono font-semibold mt-1.5 flex items-center gap-1">
                      <span className="font-bold text-gray-500 uppercase tracking-widest text-[9px]">SKU:</span>
                      {v.sku}
                    </p>
                  )}
                </div>
              </div>

              {/* Extra Price & Stock */}
              <div className="flex items-center gap-6 sm:text-right w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-slate-50 pt-3 sm:pt-0">
                {/* Precio Extra */}
                {hasPriceExtra ? (
                  <div className="flex flex-col sm:items-end">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none">Recargo</span>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 mt-1 flex items-center">
                      +{formatPrice(v.precio_extra)}
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col sm:items-end">
                    <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest leading-none">Recargo</span>
                    <span className="text-xs text-gray-400 mt-1 italic">Sin recargo</span>
                  </div>
                )}

                {/* Stock Disponible */}
                <div className="flex flex-col sm:items-end">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none">Existencias</span>
                  <div className="flex items-center gap-1 mt-1">
                    <Box size={12} className="text-gray-400" />
                    <span className="text-base font-black text-[#075E54]">
                      {variantStock} <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">U</span>
                    </span>
                  </div>
                </div>
              </div>

            </div>
          );
        })}

        {variantes.length === 0 && (
          <div className="text-center py-16 border border-dashed border-gray-200 rounded-lg bg-slate-50 text-gray-400 flex flex-col items-center justify-center gap-2">
            <Layers size={36} className="opacity-25 text-gray-400 stroke-[1.5]" />
            <p className="text-sm font-medium">No hay combinaciones de variantes configuradas aún.</p>
            <p className="text-xs text-gray-400">Presiona el botón "Editar Ficha" en la cabecera para agregar variantes.</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default TabVariantes;
