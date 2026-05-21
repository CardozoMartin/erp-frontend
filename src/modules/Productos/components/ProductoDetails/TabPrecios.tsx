import { Tag, AlertTriangle } from 'lucide-react';
import { formatPrice } from '../../Pages/Productdetailview';
import { OfertasSection } from '../ProductFormSections/OfertasSection';
import { useFormContext } from 'react-hook-form';

const TabPrecios = ({ product, isEditing }: any) => {
  const formContext = useFormContext();
  const watchedTieneVariantes = formContext ? formContext.watch('tiene_variantes') : product?.tiene_variantes;

  if (watchedTieneVariantes) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-white border border-gray-200 rounded-lg p-6 text-center gap-3">
        <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 border border-amber-200">
          <AlertTriangle size={24} />
        </div>
        <h4 className="text-base font-semibold text-[#041627]">Precios y ofertas gestionados por variante</h4>
        <p className="text-sm text-gray-500 max-w-md">
          Este producto tiene variantes habilitadas. Los precios base y las ofertas de cada variante deben gestionarse individualmente desde la pestaña de <strong>Variantes</strong>.
        </p>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="bg-white p-6 rounded-md border border-gray-200">
        <OfertasSection namePrefix="ofertas" />
      </div>
    );
  }
  const ofertas = product?.ofertas ?? [];
  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <p className="text-sm font-semibold text-[#041627] mb-2">Precio base</p>
        <p className="text-4xl font-bold text-[#075E54]">{formatPrice(product?.precio_base)}</p>
        <p className="text-xs text-gray-400 mt-1">por {product?.unidad_venta ?? 'unidad'}</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <p className="text-sm font-semibold text-[#041627] mb-4 flex items-center gap-1.5">
          <Tag size={14} /> Ofertas activas
        </p>
        {ofertas.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No hay ofertas configuradas.</p>
        ) : (
          ofertas.map((o: any, idx: number) => (
            <div
              key={idx}
              className="flex justify-between items-center px-4 py-3 bg-green-50 rounded-md mb-2 last:mb-0 border border-green-200"
            >
              <div>
                <p className="text-sm font-medium text-green-800">
                  {o.nombre ?? `Oferta ${idx + 1}`}
                </p>
                <p className="text-[11px] text-gray-500">
                  {o.fecha_inicio} → {o.fecha_fin}
                </p>
              </div>
              <p className="text-base font-semibold text-green-700">{formatPrice(o.precio)}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default TabPrecios;
