import { BadgeCheck, ImagePlus, Star, Trash2, Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import type { IImagen, IImagenLocal } from '../../types/productos.type';
import { useSubirImagenProducto } from '../../hooks/useProductos';
import { toast } from 'sonner';
import { useServiciosSucursal } from '../../../POSAuxiliares/hooks/usePosAux';

type ImageRole = IImagen['rol'];

interface ModalImageUploadProps {
  productId: string | number;
  productName?: string;
  existingImages?: IImagen[];
  onClose: () => void;
  onSuccess?: () => void;
}

interface ImageUploadForm {
  defaultRole: ImageRole;
}

const IMAGE_ROLES: Array<{ value: ImageRole; label: string; hint: string }> = [
  { value: 'PRINCIPAL', label: 'Principal', hint: 'Imagen principal del producto' },
  { value: 'PRINCIPAL_POS', label: 'Principal POS', hint: 'Imagen destacada para ventas en mostrador' },
  { value: 'PRINCIPAL_WEB', label: 'Principal Web', hint: 'Imagen destacada para tienda online' },
  { value: 'GALERIA', label: 'Galeria', hint: 'Imagen adicional del catalogo' },
  { value: 'DETALLE', label: 'Detalle', hint: 'Foto de especificaciones o acercamiento' },
  { value: 'BANNER', label: 'Banner', hint: 'Imagen horizontal promocional' },
  { value: 'MINIATURA', label: 'Miniatura', hint: 'Imagen pequena de referencia' },
];

export default function ModalImageUpload({
  productId,
  productName,
  existingImages = [],
  onClose,
  onSuccess,
}: ModalImageUploadProps) {
  const [imagenesLocales, setImagenesLocales] = useState<IImagenLocal[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { register, watch } = useForm<ImageUploadForm>({
    defaultValues: { defaultRole: 'GALERIA' },
  });
  const defaultRole = watch('defaultRole');
  const { mutate: uploadImage, isPending } = useSubirImagenProducto();
  const serviciosQuery = useServiciosSucursal();
  const cloudinaryDisponible = !!serviciosQuery.data?.cloudinary.disponible;
  const currentListImage = existingImages[0];
  const currentImagesByRole = IMAGE_ROLES.map((role) => ({
    ...role,
    images: existingImages.filter((image) => image.rol === role.value),
  }));

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const nuevasImagenes: IImagenLocal[] = files.map((file, index) => ({
      file,
      preview: URL.createObjectURL(file),
      alt_text: productName || '',
      orden: imagenesLocales.length + index,
      rol: currentListImage?.rol ?? defaultRole,
      reemplazar_imagen_id: currentListImage?.id,
      reemplazar_rol: !currentListImage && defaultRole.startsWith('PRINCIPAL'),
    }));

    setImagenesLocales((prev) => [...prev, ...nuevasImagenes]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const updateImage = (index: number, values: Partial<IImagenLocal>) => {
    setImagenesLocales((prev) =>
      prev.map((image, imageIndex) => (imageIndex === index ? { ...image, ...values } : image))
    );
  };

  const removeImagen = (index: number) => {
    setImagenesLocales((prev) => prev.filter((_, imageIndex) => imageIndex !== index));
  };

  const handleUpload = async () => {
    if (imagenesLocales.length === 0) {
      toast.error('Selecciona al menos una imagen');
      return;
    }
    if (!cloudinaryDisponible) {
      toast.error('Configure y pruebe Cloudinary antes de subir imagenes');
      return;
    }

    try {
      await Promise.all(
        imagenesLocales.map(
          (image) =>
            new Promise((resolve, reject) => {
              uploadImage(
                { productoId: productId.toString(), imagen: image },
                { onSuccess: resolve, onError: reject }
              );
            })
        )
      );

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error uploading images', error);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      <div className="bg-[#fbf9fa] rounded-lg shadow-xl w-full max-w-3xl overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-[#efedef] flex justify-between items-center bg-white">
          <div className="flex items-center gap-2 text-[#041627]">
            <ImagePlus size={20} className="text-[#075E54]" />
            <div>
              <h2 className="text-lg font-semibold">Cargar imagenes</h2>
              <p className="text-xs text-gray-500">{productName || `Producto ${productId}`}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#595f66] hover:text-[#ba1a1a] transition-colors p-1 rounded hover:bg-[#fce8e8]"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[68vh] flex flex-col gap-5">
          {!cloudinaryDisponible ? (
            <div className="rounded border border-[#f6d58f] bg-[#fff8e6] px-4 py-3 text-[13px] font-semibold text-[#8a5a00]">
              Cloudinary todavia no esta habilitado. Cargue las credenciales y pruebe la conexion desde Configuracion POS.
            </div>
          ) : null}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-4">
            <div
              className="border-2 border-dashed border-[#c4c6cd] rounded-lg p-8 flex flex-col items-center justify-center bg-white hover:bg-[#f5f3f4] transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={32} className="text-[#075E54] mb-2" />
              <p className="text-[14px] font-semibold text-[#041627]">
                Seleccionar imagenes
              </p>
              <p className="text-[12px] text-[#595f66] mt-1 text-center">
                JPG, PNG, WEBP, GIF, SVG, AVIF y otros archivos de imagen hasta 10MB
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

            <div className="bg-white border border-[#efedef] rounded-lg p-4 flex flex-col gap-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                Rol por defecto
              </label>
              <select
                {...register('defaultRole')}
                className="h-10 border border-gray-300 rounded px-3 text-sm font-semibold text-[#041627] outline-none focus:border-[#075E54] focus:ring-2 focus:ring-[#075E54]/15"
              >
                {IMAGE_ROLES.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-400 leading-relaxed">
                Las imagenes nuevas se marcan con este uso, pero podes cambiarlo una por una.
              </p>
            </div>
          </div>

          {existingImages.length > 0 && (
            <div className="bg-white border border-[#efedef] rounded-lg p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-[14px] font-semibold text-[#041627]">
                    Imagenes actuales
                  </h3>
                  <p className="text-xs text-gray-400">
                    Estos son los roles ya cargados para este producto.
                  </p>
                </div>
                <span className="text-[11px] font-bold text-[#075E54] bg-[#DCF8C6]/40 px-2 py-1 rounded border border-[#DCF8C6]">
                  {existingImages.length} cargadas
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentListImage && (
                  <div className="sm:col-span-2 flex items-center gap-3 rounded border border-[#075E54]/30 bg-[#DCF8C6]/20 p-3">
                    <div className="w-16 h-16 rounded bg-white border border-[#075E54]/20 overflow-hidden shrink-0">
                      <img
                        src={currentListImage.url}
                        alt={currentListImage.alt_text || 'Imagen actual de lista'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="text-[12px] font-black uppercase tracking-wider text-[#075E54]">
                        Imagen actual en la lista
                      </p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        Si seleccionas una imagen nueva, por defecto va a sustituir solo esta imagen.
                      </p>
                    </div>
                  </div>
                )}
                {currentImagesByRole.map((role) => {
                  const firstImage = role.images[0];
                  const isPrincipal = role.value.startsWith('PRINCIPAL');

                  return (
                    <div
                      key={role.value}
                      className={`flex items-center gap-3 rounded border p-2 ${
                        firstImage
                          ? 'border-[#075E54]/25 bg-[#f8fafc]'
                          : 'border-dashed border-gray-200 bg-slate-50/60'
                      }`}
                    >
                      <div className="w-14 h-14 rounded bg-white border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
                        {firstImage?.url ? (
                          <img
                            src={firstImage.url}
                            alt={firstImage.alt_text || role.label}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImagePlus size={18} className="text-gray-300" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[12px] font-bold text-[#041627] flex items-center gap-1">
                          {role.label}
                          {firstImage && isPrincipal && (
                            <Star size={12} className="text-[#075E54] fill-[#075E54]" />
                          )}
                        </p>
                        <p className="text-[11px] text-gray-400 truncate">
                          {firstImage
                            ? role.images.length > 1
                              ? `${role.images.length} imagenes`
                              : '1 imagen cargada'
                            : 'Sin imagen'}
                        </p>
                        {firstImage && isPrincipal && (
                          <p className="text-[10px] text-amber-700 mt-0.5">
                            Una nueva imagen en este rol la reemplaza como principal.
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {imagenesLocales.length > 0 && (
            <div className="flex flex-col gap-4">
              <h3 className="text-[14px] font-semibold text-[#041627]">
                Imagenes seleccionadas ({imagenesLocales.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {imagenesLocales.map((image, index) => {
                  const role = IMAGE_ROLES.find((item) => item.value === image.rol);
                  const isPrincipal = image.rol?.startsWith('PRINCIPAL');
                  const roleHasImages = existingImages.some(
                    (existingImage) => existingImage.rol === image.rol
                  );
                  const isReplacingListImage = image.reemplazar_imagen_id === currentListImage?.id;

                  return (
                    <div
                      key={`${image.file.name}-${index}`}
                      className="flex gap-3 p-3 border border-[#efedef] rounded-lg bg-white relative group"
                    >
                      <div className="relative w-24 h-24 shrink-0 overflow-hidden rounded border border-[#efedef] bg-slate-50">
                        <img
                          src={image.preview}
                          alt="preview"
                          className="w-full h-full object-cover"
                        />
                        {isPrincipal && (
                          <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 bg-[#075E54] text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                            <Star size={10} />
                            Principal
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col flex-1 gap-2 min-w-0">
                        <select
                          value={image.rol || 'GALERIA'}
                          onChange={(event) =>
                            updateImage(index, { rol: event.target.value as ImageRole })
                          }
                          className="text-[12px] p-1.5 border border-[#c4c6cd] rounded-sm w-full outline-none focus:border-[#075E54] font-semibold"
                        >
                          {IMAGE_ROLES.map((roleOption) => (
                            <option key={roleOption.value} value={roleOption.value}>
                              {roleOption.label}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          placeholder="Texto alternativo"
                          value={image.alt_text || ''}
                          onChange={(event) => updateImage(index, { alt_text: event.target.value })}
                          className="text-[12px] p-1.5 border border-[#c4c6cd] rounded-sm w-full outline-none focus:border-[#075E54]"
                        />
                        <span className="text-[11px] text-[#595f66] flex items-start gap-1">
                          <BadgeCheck size={12} className="text-[#075E54] mt-0.5 shrink-0" />
                          {role?.hint || 'Imagen del producto'}
                        </span>
                        {roleHasImages && (
                          <div className="grid grid-cols-3 gap-1.5 mt-1">
                            {currentListImage && (
                              <button
                                type="button"
                                onClick={() =>
                                  updateImage(index, {
                                    rol: currentListImage.rol,
                                    reemplazar_imagen_id: currentListImage.id,
                                    reemplazar_rol: false,
                                  })
                                }
                                className={`text-[11px] font-bold rounded border px-2 py-1 ${
                                  isReplacingListImage
                                    ? 'bg-[#DCF8C6]/40 text-[#075E54] border-[#DCF8C6]'
                                    : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                                }`}
                              >
                                Sustituir lista
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() =>
                                updateImage(index, {
                                  reemplazar_imagen_id: undefined,
                                  reemplazar_rol: false,
                                })
                              }
                              className={`text-[11px] font-bold rounded border px-2 py-1 ${
                                !image.reemplazar_rol && !image.reemplazar_imagen_id
                                  ? 'bg-[#DCF8C6]/40 text-[#075E54] border-[#DCF8C6]'
                                  : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                              }`}
                            >
                              Agregar
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                updateImage(index, {
                                  reemplazar_imagen_id: undefined,
                                  reemplazar_rol: true,
                                })
                              }
                              className={`text-[11px] font-bold rounded border px-2 py-1 ${
                                image.reemplazar_rol
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                              }`}
                            >
                              Sustituir rol
                            </button>
                          </div>
                        )}
                        {isReplacingListImage && (
                          <p className="text-[10px] text-[#075E54] leading-tight">
                            Se borra solo la imagen actual de la lista y se usa esta nueva.
                          </p>
                        )}
                        {roleHasImages && image.reemplazar_rol && (
                          <p className="text-[10px] text-amber-700 leading-tight">
                            Se eliminan las imagenes actuales de este rol y queda esta nueva.
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => removeImagen(index)}
                        className="absolute top-2 right-2 p-1.5 bg-white rounded-full text-[#ba1a1a] opacity-0 group-hover:opacity-100 transition-opacity shadow-sm border border-[#efedef] hover:bg-[#fce8e8]"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-[#efedef] bg-white flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-[13px] font-medium border border-[#c4c6cd] rounded-sm text-[#44474c] hover:bg-[#efedef] transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleUpload}
            disabled={imagenesLocales.length === 0 || isPending || !cloudinaryDisponible}
            className="px-4 py-2 text-[13px] font-medium bg-[#075E54] text-white rounded-sm hover:bg-[#064d45] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isPending ? 'Subiendo...' : 'Subir imagenes'}
            <Upload size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
