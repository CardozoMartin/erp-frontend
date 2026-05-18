import { Image as ImageIcon, Trash2, Upload } from 'lucide-react';
import { useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { Card } from '../FormComponents';
import type { IImagenLocal } from '../../types/productos.type';

interface Props {
  imagenesLocales?: IImagenLocal[];
  setImagenesLocales?: React.Dispatch<React.SetStateAction<IImagenLocal[]>>;
  namePrefix?: string;
}

export function ImagenesSection({ imagenesLocales, setImagenesLocales, namePrefix }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formContext = useFormContext();
  const localFieldName = namePrefix?.replace(/\.imagenes$/, '.imagenesLocales');
  const imagenesFormulario = (localFieldName ? formContext.watch(localFieldName) ?? [] : []) as IImagenLocal[];
  const imagenesActuales: IImagenLocal[] = imagenesLocales ?? imagenesFormulario;

  const setImagenesActuales = (updater: (prev: IImagenLocal[]) => IImagenLocal[]) => {
    if (setImagenesLocales) {
      setImagenesLocales(updater);
      return;
    }
    if (localFieldName) {
      formContext.setValue(localFieldName, updater(imagenesActuales), {
        shouldDirty: true,
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const nuevasImagenes: IImagenLocal[] = files.map((file, index) => ({
      file,
      preview: URL.createObjectURL(file),
      alt_text: '',
      orden: imagenesActuales.length + index,
    }));

    setImagenesActuales((prev) => [...prev, ...nuevasImagenes]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImagen = (index: number) => {
    setImagenesActuales((prev) => prev.filter((_, i) => i !== index));
  };

  const updateAltText = (index: number, alt_text: string) => {
    setImagenesActuales((prev) =>
      prev.map((img, i) => (i === index ? { ...img, alt_text } : img))
    );
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-[#041627]">
          <ImageIcon size={16} className="text-[#075E54]" />
          <h3 className="font-medium">Imágenes del Producto</h3>
        </div>
      </div>

      <div className="space-y-4">
        <div 
          className="border-2 border-dashed border-[#c4c6cd] rounded-lg p-6 flex flex-col items-center justify-center bg-[#fbf9fa] hover:bg-[#f5f3f4] transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload size={24} className="text-[#595f66] mb-2" />
          <p className="text-[13px] font-medium text-[#041627]">
            Haz clic para seleccionar imágenes
          </p>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            accept="image/*"
            className="hidden"
          />
        </div>

        {imagenesActuales.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {imagenesActuales.map((img, index) => (
              <div key={index} className="flex gap-3 p-3 border border-[#efedef] rounded-lg bg-white relative group">
                <img
                  src={img.preview}
                  alt="preview"
                  className="w-20 h-20 object-cover rounded border border-[#efedef]"
                />
                <div className="flex flex-col flex-1 gap-2">
                  <input
                    type="text"
                    placeholder="Texto alternativo (opcional)"
                    value={img.alt_text || ''}
                    onChange={(e) => updateAltText(index, e.target.value)}
                    className="text-[12px] p-1.5 border border-[#c4c6cd] rounded-sm w-full outline-none focus:border-[#075E54]"
                  />
                  <span className="text-[11px] text-[#595f66]">Orden: {img.orden}</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeImagen(index)}
                  className="absolute top-2 right-2 p-1.5 bg-white rounded-full text-[#ba1a1a] opacity-0 group-hover:opacity-100 transition-opacity shadow-sm border border-[#efedef] hover:bg-[#fce8e8]"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
