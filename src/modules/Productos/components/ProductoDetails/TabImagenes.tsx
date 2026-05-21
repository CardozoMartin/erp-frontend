import { Image, AlertTriangle } from 'lucide-react';
import type { IProducto } from '../../types/productos.type';
import { ImagenesSection } from '../ProductFormSections/ImagenesSection';
import { useFormContext } from 'react-hook-form';

interface TabImagenesProps {
  product: IProducto | null;
  isEditing?: boolean;
  imagenesLocales?: any[];
  setImagenesLocales?: any;
}

const TabImagenes = ({ product, isEditing, imagenesLocales = [], setImagenesLocales }: TabImagenesProps) => {
  const formContext = useFormContext();
  const watchedTieneVariantes = formContext ? formContext.watch('tiene_variantes') : product?.tiene_variantes;

  if (watchedTieneVariantes) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-white border border-gray-200 rounded-lg p-6 text-center gap-3">
        <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 border border-amber-200">
          <AlertTriangle size={24} />
        </div>
        <h4 className="text-base font-semibold text-[#041627]">Imágenes gestionadas por variante</h4>
        <p className="text-sm text-gray-500 max-w-md">
          Este producto tiene variantes habilitadas. Las imágenes de cada variante deben gestionarse individualmente desde la pestaña de <strong>Variantes</strong>.
        </p>
      </div>
    );
  }

  if (isEditing && setImagenesLocales) {
    return (
      <div className="bg-white p-6 rounded-md border border-gray-200">
        <ImagenesSection imagenesLocales={imagenesLocales} setImagenesLocales={setImagenesLocales} />
      </div>
    );
  }

  const imagenes = product?.imagenes ?? [];
  return imagenes.length === 0 ? (
    <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
      <Image size={40} className="opacity-30" />
      <p className="text-sm">No hay imágenes cargadas para este producto.</p>
    </div>
  ) : (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3">
      {imagenes.map((img: any, idx: number) => (
        <div
          key={idx}
          className="border border-gray-200 rounded-lg overflow-hidden aspect-square bg-gray-50 flex items-center justify-center"
        >
          <img
            src={img.url ?? img}
            alt={`Imagen ${idx + 1}`}
            className="w-full h-full object-cover"
          />
        </div>
      ))}
    </div>
  );
};

export default TabImagenes;
