import { Image as ImageIcon, Info, Eye } from 'lucide-react';
import type { IProducto } from '../../types/productos.type';
import { ImagenesSection } from '../ProductFormSections/ImagenesSection';
import { useFormContext } from 'react-hook-form';
import Swal from 'sweetalert2';
import { useServiciosSucursal } from '../../../POSAuxiliares/hooks/usePosAux';

interface TabImagenesProps {
  product: IProducto | null;
  isEditing?: boolean;
  imagenesLocales?: any[];
  setImagenesLocales?: any;
}

const TabImagenes = ({ product, isEditing, imagenesLocales = [], setImagenesLocales }: TabImagenesProps) => {
  const formContext = useFormContext();
  const serviciosQuery = useServiciosSucursal();
  const cloudinaryDisponible = !!serviciosQuery.data?.cloudinary.disponible;
  const watchedTieneVariantes = formContext ? formContext.watch('tiene_variantes') : product?.tiene_variantes;

  if (watchedTieneVariantes) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-3 bg-slate-50 border border-slate-200/50 rounded-lg p-8 max-w-lg mx-auto my-4 shadow-sm">
        <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 border border-amber-200 shadow-inner">
          <ImageIcon size={26} className="stroke-[1.5]" />
        </div>
        <h4 className="text-base font-bold text-[#041627]">Galería de Imágenes por Variante</h4>
        <p className="text-xs text-gray-500 max-w-sm leading-relaxed">
          Este producto tiene la configuración de variantes activa. Las imágenes individuales deben cargarse directamente en la pestaña de <strong>Variantes</strong>.
        </p>
      </div>
    );
  }

  if (isEditing && setImagenesLocales && cloudinaryDisponible) {
    return (
      <div className="p-4 bg-white rounded border border-slate-100">
        <div className="flex items-center gap-2 mb-4 bg-slate-50 p-3 rounded text-xs text-gray-500 border border-slate-150">
          <Info size={14} className="text-[#075E54] shrink-0" />
          <span>Sube múltiples imágenes para armar la galería de este producto. Arrastra y suelta archivos o haz clic en el recuadro para cargarlos.</span>
        </div>
        <ImagenesSection imagenesLocales={imagenesLocales} setImagenesLocales={setImagenesLocales} />
      </div>
    );
  }

  const imagenes = product?.imagenes ?? [];

  const handlePreviewImage = (url: string, index: number) => {
    Swal.fire({
      imageUrl: url,
      imageAlt: `Imagen ${index + 1} - ${product?.nombre}`,
      showCloseButton: true,
      showConfirmButton: false,
      background: '#fff',
      customClass: {
        image: 'max-h-[80vh] object-contain rounded-md'
      }
    });
  };

  return (
    <div className="flex flex-col gap-5 pt-3">
      
      {/* Header Info */}
      <div className="border-b border-slate-100 pb-3">
        <p className="text-sm font-extrabold text-[#041627] uppercase tracking-wider flex items-center gap-1.5">
          <ImageIcon size={15} className="text-[#075E54]" />
          Galería Fotográfica de Catálogo
        </p>
        <p className="text-xs text-gray-400 mt-0.5">Imágenes descriptivas e ilustrativas para facturación y tienda online.</p>
      </div>

      {/* Gallery Grid */}
      {imagenes.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-200 rounded-lg bg-slate-50 text-gray-400 flex flex-col items-center justify-center gap-2">
          <ImageIcon size={36} className="opacity-25 text-gray-400 stroke-[1.5]" />
          <p className="text-sm font-medium">No se registran imágenes cargadas para este producto.</p>
          <p className="text-xs text-gray-400">Puedes cargar fotos presionando el botón "Editar Ficha" en la cabecera.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {imagenes.map((img: any, idx: number) => {
            const url = img.url ?? img;
            return (
              <div
                key={idx}
                onClick={() => handlePreviewImage(url, idx)}
                className="border border-slate-200 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden aspect-square cursor-zoom-in relative group flex items-center justify-center"
              >
                {/* Image element with smooth scale animation */}
                <img
                  src={url}
                  alt={`Imagen descriptiva ${idx + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Overlaid preview badge on hover */}
                <div className="absolute inset-0 bg-black/35 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="p-2.5 bg-white rounded-full text-[#075E54] shadow flex items-center justify-center translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                    <Eye size={18} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

export default TabImagenes;
