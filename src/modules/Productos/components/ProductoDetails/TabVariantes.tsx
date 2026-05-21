import { formatPrice } from '../../Pages/Productdetailview';
import { VariantesSection } from '../ProductFormSections/VariantesSection';
import { useFormContext } from 'react-hook-form';
import { useGetSucursales } from '../../../Sucursal/hooks/useSucursal';
import { useGetAllProductCategoriesActives } from '../../hooks/useProductCategory';

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
      <div className="text-center py-20 text-gray-400 text-sm bg-white border border-gray-200 rounded-lg p-5">
        Este producto no tiene variantes habilitadas. Habilítalas en la pestaña <strong>Resumen</strong> para gestionar variantes.
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="bg-white p-6 rounded-md border border-gray-200">
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
    <div className="flex flex-col gap-3">
      {variantes.map((v: any, idx: number) => (
        <div
          key={idx}
          className="bg-white border border-gray-200 rounded-lg px-5 py-4 flex justify-between items-center"
        >
          <div>
            <p className="text-sm font-medium text-[#041627]">
              {v.atributos?.map((a: any) => a.valor).join(' / ') ?? `Variante ${idx + 1}`}
            </p>
            {v.sku && <p className="text-[11px] text-gray-500 mt-0.5">SKU: {v.sku}</p>}
          </div>
          <div className="flex items-center gap-4">
            {v.precio_extra > 0 && (
              <span className="text-xs text-gray-500">+{formatPrice(v.precio_extra)}</span>
            )}
            <div className="text-right">
              <p className="text-xl font-semibold text-[#075E54]">
                {(v.stock ?? []).reduce((a: number, s: any) => a + (s.cantidad ?? 0), 0)} u.
              </p>
            </div>
          </div>
        </div>
      ))}
      {variantes.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-12">No hay variantes cargadas aún.</p>
      )}
    </div>
  );
};

export default TabVariantes;
