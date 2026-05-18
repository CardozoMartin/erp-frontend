import { ImagePlus, X, Trash2, Upload } from 'lucide-react';
import { useState, useRef } from 'react';
import type { IImagenLocal } from '../../types/productos.type';
import { useUploadImage } from '../../hooks/useProducts';
import { toast } from 'sonner';

interface ModalImageUploadProps {
  productId: string | number;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ModalImageUpload({ productId, onClose, onSuccess }: ModalImageUploadProps) {
  const [imagenesLocales, setImagenesLocales] = useState<IImagenLocal[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { mutate: uploadImage, isPending } = useUploadImage();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const nuevasImagenes: IImagenLocal[] = files.map((file, index) => ({
      file,
      preview: URL.createObjectURL(file),
      alt_text: '',
      orden: imagenesLocales.length + index + 1,
    }));

    setImagenesLocales((prev) => [...prev, ...nuevasImagenes]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImagen = (index: number) => {
    setImagenesLocales((prev) => prev.filter((_, i) => i !== index));
  };

  const updateAltText = (index: number, alt_text: string) => {
    setImagenesLocales((prev) =>
      prev.map((img, i) => (i === index ? { ...img, alt_text } : img))
    );
  };

  const handleUpload = async () => {
    if (imagenesLocales.length === 0) {
      toast.error('Selecciona al menos una imagen');
      return;
    }

    try {
      // Subir imágenes una por una o en paralelo
      await Promise.all(
        imagenesLocales.map((img) =>
          new Promise((resolve, reject) => {
            uploadImage(
              { productoId: productId.toString(), imagen: img },
              { onSuccess: resolve, onError: reject }
            );
          })
        )
      );
      
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error('Error uploading images', error);
      // El toast de error ya se maneja en el hook, pero podríamos añadir lógica extra aquí
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#efedef] flex justify-between items-center bg-[#fbf9fa]">
          <div className="flex items-center gap-2 text-[#041627]">
            <ImagePlus size={20} className="text-[#075E54]" />
            <h2 className="text-lg font-semibold">Cargar Imágenes al Producto</h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#595f66] hover:text-[#ba1a1a] transition-colors p-1 rounded hover:bg-[#fce8e8]"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[60vh] flex flex-col gap-6">
          <div 
            className="border-2 border-dashed border-[#c4c6cd] rounded-lg p-8 flex flex-col items-center justify-center bg-[#fbf9fa] hover:bg-[#f5f3f4] transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={32} className="text-[#595f66] mb-2" />
            <p className="text-[14px] font-medium text-[#041627]">
              Haz clic para seleccionar imágenes
            </p>
            <p className="text-[12px] text-[#595f66] mt-1">
              PNG, JPG, WEBP hasta 5MB
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

          {imagenesLocales.length > 0 && (
            <div className="flex flex-col gap-4">
              <h3 className="text-[14px] font-semibold text-[#041627]">
                Imágenes seleccionadas ({imagenesLocales.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {imagenesLocales.map((img, index) => (
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
                      onClick={() => removeImagen(index)}
                      className="absolute top-2 right-2 p-1.5 bg-white rounded-full text-[#ba1a1a] opacity-0 group-hover:opacity-100 transition-opacity shadow-sm border border-[#efedef] hover:bg-[#fce8e8]"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#efedef] bg-[#fbf9fa] flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-[13px] font-medium border border-[#c4c6cd] rounded-sm text-[#44474c] hover:bg-[#efedef] transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleUpload}
            disabled={imagenesLocales.length === 0 || isPending}
            className="px-4 py-2 text-[13px] font-medium bg-[#075E54] text-white rounded-sm hover:bg-[#1e8e4f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isPending ? 'Subiendo...' : 'Subir Imágenes'}
            <Upload size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
