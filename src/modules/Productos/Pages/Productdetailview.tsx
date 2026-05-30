import {
  Box,
  ChevronRight,
  Clock,
  DollarSign,
  Image as ImageIcon,
  Info,
  Layers,
  Package,
  Star,
  Camera,
  Trash2,
  Check,
  RotateCcw,
  Printer
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm, FormProvider } from 'react-hook-form';
import { useProductStore } from '../store/useProductStore';
import { usePutProducts } from '../hooks/useProducts';
import { normalizeProductoPayload } from '../api/productoApi';
import StockQuickModal from '../components/ProductoDetails/StockQuickModal';
import TabResumen from '../components/ProductoDetails/TabResumen';
import TabStock from '../components/ProductoDetails/tabStock';
import TabPrecios from '../components/ProductoDetails/TabPrecios';
import TabVariantes from '../components/ProductoDetails/TabVariantes';
import TabLotes from '../components/ProductoDetails/TabLotes';
import TabImagenes from '../components/ProductoDetails/TabImagenes';
import Swal from 'sweetalert2';
import { formatStockQuantity } from '../utils/stockFormat';


export const formatPrice = (n: any) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(n ?? 0);

const TABS = [
  { id: 'resumen', label: 'Información General', icon: Info },
  { id: 'stock', label: 'Stock e Inventario', icon: Package },
  { id: 'precios', label: 'Tarifas y Ofertas', icon: DollarSign },
  { id: 'variantes', label: 'Variantes', icon: Layers },
  { id: 'lotes', label: 'Lotes y Trazabilidad', icon: Clock },
  { id: 'imagenes', label: 'Galería de Imágenes', icon: ImageIcon },
];


export function StatusBadge({ active, labelOn = 'Activo', labelOff = 'Inactivo' }: any) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide transition-all
        ${active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}
    >
      <span className={`w-2 h-2 rounded-full ${active ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
      {active ? labelOn : labelOff}
    </span>
  );
}

const getProductFormDefaults = (product: any) => ({
  nombre: product.nombre,
  codigo_barras: product.codigo_barras ?? '',
  descripcion: product.descripcion ?? '',
  precio_base: product.precio_base,
  unidad_venta: product.unidad_venta,
  activo: product.activo,
  activo_pos: product.activo_pos,
  activo_web: product.activo_web,
  tiene_variantes: product.tiene_variantes,
  tiene_vencimiento: product.tiene_vencimiento,
  es_fraccionable: product.es_fraccionable,
  categoria_id: product.categoria_id ?? '',
  stock: (product.stock?.length ?? 0) > 0 ? product.stock : [{ sucursal_id: '', cantidad: 0, cantidad_minima: 0 }],
  variantes: product.variantes ?? [],
  imagenes: product.imagenes ?? [],
  lotes: product.lotes ?? [],
  ofertas: product.ofertas ?? [],
  atributos: product.atributos ?? [],
});



export default function ProductDetailView() {
  const navigate = useNavigate();
  const location = useLocation();
  const { product, setProduct } = useProductStore();
  const [activeTab, setActiveTab] = useState('resumen');
  const [showStockModal, setShowStockModal] = useState(false);
  const [isEditing, setIsEditing] = useState(location.state?.isEditing ?? false);
  const [imagenesLocales, setImagenesLocales] = useState<any[]>([]);
  const [isFavorite, setIsFavorite] = useState(() => {
    if (product?.id) {
      return localStorage.getItem(`prod_fav_${product.id}`) === 'true';
    }
    return false;
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { mutate: putProducto } = usePutProducts();
  const methods = useForm<any>({ defaultValues: product || {} });
  const { register, reset, watch, handleSubmit, setValue } = methods;

  const watchedNombre = watch('nombre') || product?.nombre;
  const watchedCodigoBarras = watch('codigo_barras') || product?.codigo_barras;
  const watchedActivo = watch('activo') ?? product?.activo;
  const watchedActivoPos = watch('activo_pos') ?? product?.activo_pos;
  const watchedActivoWeb = watch('activo_web') ?? product?.activo_web;
  const watchedPrecioBase = watch('precio_base') ?? product?.precio_base;
  const watchedTieneVariantes = watch('tiene_variantes') ?? product?.tiene_variantes;

  useEffect(() => {
    if (product) {
      reset(getProductFormDefaults(product));
      setIsFavorite(localStorage.getItem(`prod_fav_${product.id}`) === 'true');
    }
  }, [product, reset]);

  const toggleFavorite = () => {
    if (product?.id) {
      const next = !isFavorite;
      setIsFavorite(next);
      localStorage.setItem(`prod_fav_${product.id}`, String(next));
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: next ? 'success' : 'info',
        title: next ? '¡Añadido a favoritos!' : 'Quitado de favoritos',
        showConfirmButton: false,
        timer: 1500,
        background: '#fff',
        color: '#041627'
      });
    }
  };

  // Manejar el cambio de la imagen principal en el encabezado
  const handlePrincipalImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const preview = URL.createObjectURL(file);
      // Creamos la imagen en el array local
      const newImg = { file, preview, orden: 0, alt_text: watchedNombre };
      setImagenesLocales((prev) => [newImg, ...prev]);
    }
  };

  const removePrincipalImage = () => {
    Swal.fire({
      title: '¿Quitar imagen?',
      text: 'Se removerá la imagen principal seleccionada.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#075E54',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, quitar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        setImagenesLocales([]);
        // Si el producto original tenía imágenes, podemos limpiar la primera
        if (product?.imagenes && product.imagenes.length > 0) {
          setValue('imagenes', product.imagenes.slice(1));
        }
      }
    });
  };

  const onSubmit = (formData: any) => {
    const data = normalizeProductoPayload({
      ...formData,
      imagenesLocales: imagenesLocales.length > 0 ? imagenesLocales : undefined,
      id: product?.id,
    });

    putProducto(data, {
      onSuccess: (res: any) => {
        setIsEditing(false);
        setImagenesLocales([]);
        const productoActualizado = res?.data ?? res;
        if (productoActualizado?.id) {
          setProduct(productoActualizado);
        }
        Swal.fire({ icon: 'success', title: '¡Guardado!', text: 'Los cambios han sido guardados con éxito.', timer: 2000, showConfirmButton: false });
      },
      onError: (error: any) => {
        const data = error?.response?.data;
        const mensaje =
          (Array.isArray(data?.message) ? data.message.join('\n') : data?.message) ||
          data?.mensaje ||
          'Ocurrió un error al guardar los cambios. Verificá los datos e intentá nuevamente.';
        Swal.fire({
          icon: 'error',
          title: 'Error al guardar',
          text: mensaje,
          confirmButtonColor: '#075E54',
        });
      },
    });
  };

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center py-28 text-gray-400 gap-4 bg-[#f8fafc] min-h-screen">
        <Box size={56} className="opacity-20 stroke-[1.5] text-[#075E54]" />
        <p className="text-sm font-medium">No hay ningún producto seleccionado.</p>
        <button
          onClick={() => navigate('/productos')}
          className="px-6 py-2.5 bg-[#075E54] text-white rounded-md text-sm font-semibold hover:bg-[#064d45] transition shadow-md cursor-pointer"
        >
          Volver a productos
        </button>
      </div>
    );
  }

  const totalStock = (product.stock ?? []).reduce((a: number, s: any) => a + Number(s.cantidad ?? 0), 0);

  const handleSaveStock = (newStock: any) => {
    putProducto(normalizeProductoPayload({ id: product.id, stock: newStock }), {
      onSuccess: (res: any) => {
        const productoActualizado = res?.data ?? res;
        setProduct(productoActualizado?.id ? productoActualizado : { ...product, stock: newStock });
        Swal.fire({
          icon: 'success',
          title: '¡Stock actualizado!',
          text: 'Se han guardado los cambios en el inventario.',
          timer: 2000,
          showConfirmButton: false,
        });
      },
      onError: (error: any) => {
        const data = error?.response?.data;
        const mensaje =
          (Array.isArray(data?.message) ? data.message.join('\n') : data?.message) ||
          data?.mensaje ||
          'No se pudo actualizar el stock.';
        Swal.fire({
          icon: 'error',
          title: 'Error al actualizar stock',
          text: mensaje,
          confirmButtonColor: '#075E54',
        });
      },
    });
  };

  // Determinar la imagen a mostrar en la cabecera
  const principalImage = imagenesLocales.length > 0
    ? imagenesLocales[0].preview
    : (product.imagenes && product.imagenes.length > 0)
      ? (product.imagenes[0].url ?? product.imagenes[0])
      : null;

  return (
    <FormProvider {...methods}>
      {showStockModal && (
        <StockQuickModal
          product={product}
          onClose={() => setShowStockModal(false)}
          onSave={handleSaveStock}
        />
      )}

      <div className="flex flex-col min-h-screen bg-[#f3f4f6]" style={{ fontFamily: 'Inter, sans-serif' }}>
        {/* ── STICKY TOP ACTION BAR (Odoo Style) ── */}
        <div className="top-16 z-20 bg-white border-b border-[#e2e8f0] px-8 py-3 flex items-center justify-between shadow-sm">
          {/* Breadcrumbs */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1 text-[13px] text-gray-500 font-medium">
              <span
                className="text-[#075E54] cursor-pointer hover:underline hover:text-[#064d45] transition-colors"
                onClick={() => navigate('/productos')}
              >
                Productos
              </span>
              <ChevronRight size={14} className="text-gray-400" />
              <span className="text-[#041627] font-semibold truncate max-w-[280px]">{product.nombre}</span>
            </div>
            {/* Action Buttons */}
            <div className="flex items-center gap-2 mt-1">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSubmit(onSubmit)}
                    className="px-5 py-1.5 bg-[#075E54] text-white text-[13px] font-semibold rounded hover:bg-[#064d45] transition shadow-sm cursor-pointer flex items-center gap-1.5"
                  >
                    <Check size={14} /> Guardar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      reset(getProductFormDefaults(product));
                      setImagenesLocales([]);
                      setIsEditing(false);
                    }}
                    className="px-5 py-1.5 border border-gray-300 bg-white text-gray-700 text-[13px] font-semibold rounded hover:bg-gray-50 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <RotateCcw size={14} /> Descartar
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-5 py-1.5 bg-[#075E54] text-white text-[13px] font-semibold rounded hover:bg-[#064d45] transition shadow-sm cursor-pointer"
                  >
                    Editar Ficha
                  </button>
                  <button
                    onClick={() => setShowStockModal(true)}
                    className="px-4 py-1.5 border border-gray-300 bg-white text-[#041627] text-[13px] font-semibold rounded hover:bg-gray-50 transition cursor-pointer"
                  >
                    Actualizar cantidad
                  </button>
                  <button className="px-4 py-1.5 border border-gray-300 bg-white text-[#041627] text-[13px] font-semibold rounded hover:bg-gray-50 transition cursor-pointer">
                    Reabastecer
                  </button>
                  <button className="px-4 py-1.5 border border-gray-300 bg-white text-[#041627] text-[13px] font-semibold rounded hover:bg-gray-50 transition cursor-pointer flex items-center gap-1.5">
                    <Printer size={13} /> Etiquetas
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Odoo Style Status info or actions (Visual only) */}
          <div className="hidden sm:flex items-center gap-4 text-xs font-semibold text-gray-500">
            <span className="flex items-center gap-1 bg-slate-100 px-3 py-1.5 rounded text-[#041627]">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Sincronizado con POS
            </span>
          </div>
        </div>

        {/* ── MAIN ODOO DOCUMENT SHEET (.o_form_sheet) ── */}
        <main className="flex-1 w-full max-w-[1480px] mx-auto px-4 py-6">
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,980px)_360px] gap-6 items-start">
            <div className="bg-white border border-[#e2e8f0] rounded-md shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-8 relative min-h-[550px] flex flex-col gap-6">

            {/* ── ROW 1: STAR, TITLE AREA & IMAGE & SMART BUTTONS ── */}
            <div className="flex flex-col lg:flex-row justify-between gap-6 items-start">

              {/* Left Title Area */}
              <div className="flex-1 flex flex-col gap-3 w-full">

                {/* Favorite Star & Product Label */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleFavorite}
                    className="p-1 rounded-full hover:bg-amber-50 text-gray-300 hover:text-amber-400 transition cursor-pointer"
                    title={isFavorite ? 'Quitar de favoritos' : 'Marcar como favorito'}
                  >
                    <Star
                      size={24}
                      className={isFavorite ? 'fill-amber-400 stroke-amber-400 scale-110 transition-transform' : 'stroke-gray-400'}
                    />
                  </button>
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest bg-gray-100 px-2 py-0.5 rounded">
                    Ficha de Producto
                  </span>
                </div>

                {/* Big Title */}
                <div className="w-full">
                  {isEditing ? (
                    <input
                      type="text"
                      placeholder="Nombre del producto..."
                      {...register('nombre', { required: true })}
                      className="text-3xl font-bold text-[#041627] bg-[#f8fafc] border-b-2 border-[#075E54] focus:outline-none w-full px-2 py-1 placeholder:opacity-50"
                    />
                  ) : (
                    <h1 className="text-3xl font-extrabold text-[#041627] tracking-tight leading-tight flex items-center gap-3">
                      {watchedNombre}
                    </h1>
                  )}
                </div>

                {/* Barcode/Code Block */}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-semibold text-gray-400">Código de Barras:</span>
                  {isEditing ? (
                    <input
                      type="text"
                      placeholder="Código de barras..."
                      {...register('codigo_barras')}
                      className="text-xs font-mono text-[#041627] bg-slate-50 border border-gray-200 rounded px-2 py-0.5 w-64 focus:border-[#075E54] outline-none"
                    />
                  ) : (
                    <span className="text-xs font-mono font-semibold text-gray-600 bg-slate-100 px-2 py-0.5 rounded">
                      {watchedCodigoBarras || 'SIN CÓDIGO'}
                    </span>
                  )}
                </div>

                {/* Odoo Style Quick Checkbox Badges */}
                <div className="flex flex-wrap items-center gap-4 mt-3">
                  <label className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold select-none cursor-pointer transition
                    ${watchedActivo
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
                    {isEditing ? (
                      <input
                        type="checkbox"
                        {...register('activo')}
                        className="accent-[#075E54] w-4 h-4 rounded cursor-pointer"
                      />
                    ) : (
                      <input
                        type="checkbox"
                        checked={!!watchedActivo}
                        readOnly
                        disabled
                        className="accent-[#075E54] w-4 h-4 rounded cursor-pointer disabled:opacity-80"
                      />
                    )}
                    <span>Activo General</span>
                  </label>

                  <label className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold select-none cursor-pointer transition
                    ${watchedActivoPos
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
                    {isEditing ? (
                      <input
                        type="checkbox"
                        {...register('activo_pos')}
                        className="accent-[#075E54] w-4 h-4 rounded cursor-pointer"
                      />
                    ) : (
                      <input
                        type="checkbox"
                        checked={!!watchedActivoPos}
                        readOnly
                        disabled
                        className="accent-[#075E54] w-4 h-4 rounded cursor-pointer disabled:opacity-80"
                      />
                    )}
                    <span>Vender en POS</span>
                  </label>

                  <label className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold select-none cursor-pointer transition
                    ${watchedActivoWeb
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
                    {isEditing ? (
                      <input
                        type="checkbox"
                        {...register('activo_web')}
                        className="accent-[#075E54] w-4 h-4 rounded cursor-pointer"
                      />
                    ) : (
                      <input
                        type="checkbox"
                        checked={!!watchedActivoWeb}
                        readOnly
                        disabled
                        className="accent-[#075E54] w-4 h-4 rounded cursor-pointer disabled:opacity-80"
                      />
                    )}
                    <span>Vender en Tienda Web</span>
                  </label>
                </div>
              </div>

              {/* Right Side: Image Upload & Smart Buttons */}
              <div className="flex flex-col lg:flex-row items-end lg:items-start gap-4 shrink-0 w-full lg:w-auto">

                {/* Odoo Style Smart Buttons (inside the sheet) */}
                <div className="grid grid-cols-2 sm:flex sm:flex-row border border-gray-200 rounded divide-x divide-gray-200 overflow-hidden bg-white shadow-sm shrink-0 w-full sm:w-auto">
                  <div className="flex flex-col items-center justify-center p-3 text-center min-w-[90px] hover:bg-slate-50 transition cursor-pointer">
                    <DollarSign size={16} className="text-[#075E54] mb-1" />
                    <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider leading-none">Precio</span>
                    <span className="text-sm font-bold text-[#041627] mt-1">{formatPrice(watchedPrecioBase)}</span>
                  </div>
                  <div className="flex flex-col items-center justify-center p-3 text-center min-w-[90px] hover:bg-slate-50 transition cursor-pointer">
                    <Package size={16} className="text-[#075E54] mb-1" />
                    <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider leading-none">Stock Total</span>
                    <span className="text-sm font-bold text-[#041627] mt-1">
                      {watchedTieneVariantes
                        ? 'VARIOS'
                        : `${formatStockQuantity(totalStock, product.unidad_venta, product.es_fraccionable)} U`}
                    </span>
                  </div>
                  <div className="flex flex-col items-center justify-center p-3 text-center min-w-[90px] hover:bg-slate-50 transition cursor-pointer">
                    <div className="w-4 h-4 flex items-center justify-center mb-1">
                      <span className={`w-2.5 h-2.5 rounded-full ${watchedActivo ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                    </div>
                    <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider leading-none">Estado</span>
                    <span className="text-sm font-bold text-[#041627] mt-1">{watchedActivo ? 'Activo' : 'Inactivo'}</span>
                  </div>
                  {watchedTieneVariantes && (
                    <div className="flex flex-col items-center justify-center p-3 text-center min-w-[90px] hover:bg-slate-50 transition cursor-pointer">
                      <Layers size={16} className="text-amber-500 mb-1" />
                      <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider leading-none">Variantes</span>
                      <span className="text-sm font-bold text-[#041627] mt-1">{(product.variantes ?? []).length} items</span>
                    </div>
                  )}
                </div>

                {/* Main Product Image Container */}
                <div className="relative group w-32 h-32 border-2 border-dashed border-gray-200 rounded-lg bg-slate-50 shadow-sm flex items-center justify-center p-1 overflow-hidden shrink-0 mt-2 lg:mt-0">
                  {principalImage ? (
                    <>
                      <img src={principalImage} alt={product.nombre} className="w-full h-full object-contain" />
                      {isEditing && (
                        <div className="absolute inset-0 bg-black/55 flex flex-col items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="p-1.5 bg-[#075E54] text-white rounded-full hover:bg-[#064d45] transition cursor-pointer"
                            title="Cambiar imagen"
                          >
                            <Camera size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={removePrincipalImage}
                            className="p-1.5 bg-rose-600 text-white rounded-full hover:bg-rose-700 transition cursor-pointer"
                            title="Quitar imagen"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center text-center justify-center text-gray-300 gap-1 p-2">
                      <ImageIcon size={32} className="stroke-[1.5]" />
                      {isEditing && (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-[10px] text-[#075E54] hover:underline font-bold transition cursor-pointer"
                        >
                          Cargar
                        </button>
                      )}
                    </div>
                  )}

                  {/* Input de archivo oculto */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePrincipalImageChange}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </div>
            </div>

            <div className="w-full h-px bg-slate-100 my-2" />

            {/* ── TABS SELECTOR (Inside Sheet) ── */}
            <div className="flex border-b border-gray-100 overflow-x-auto scrollbar-none gap-2 bg-slate-50/50 p-1 rounded-t-md">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-2 px-5 py-3 text-[13px] font-semibold whitespace-nowrap border-b-2 transition-all cursor-pointer rounded-t
                    ${
                      activeTab === id
                        ? 'text-[#075E54] border-[#075E54] bg-white shadow-sm'
                        : 'text-gray-500 border-transparent hover:text-[#041627] hover:bg-slate-50'
                    }`}
                >
                  <Icon size={14} className={activeTab === id ? 'text-[#075E54]' : 'text-gray-400'} />
                  {label}
                </button>
              ))}
            </div>

            {/* ── TAB CONTENT AREA (Inside Sheet) ── */}
            <div className="flex-1 bg-white pt-2">
              {activeTab === 'resumen' && <TabResumen product={product} isEditing={isEditing} />}
              {activeTab === 'stock' && (
                <TabStock product={product} onOpenStockModal={() => setShowStockModal(true)} isEditing={isEditing} />
              )}
              {activeTab === 'precios' && <TabPrecios product={product} isEditing={isEditing} />}
              {activeTab === 'variantes' && <TabVariantes product={product} isEditing={isEditing} />}
              {activeTab === 'lotes' && <TabLotes product={product} isEditing={isEditing} />}
              {activeTab === 'imagenes' && <TabImagenes product={product} isEditing={isEditing} imagenesLocales={imagenesLocales} setImagenesLocales={setImagenesLocales} />}
            </div>

            </div>
            <aside className="hidden xl:flex min-h-[550px] flex-col rounded-md border border-[#e2e8f0] bg-[#f8fafc] shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 bg-white">
                <h2 className="text-sm font-extrabold text-[#041627] uppercase tracking-wider">
                  Historial
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  Movimientos y actualizaciones del producto
                </p>
              </div>

              <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-10">
                <div className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                  <Clock size={20} className="text-[#075E54] stroke-[1.75]" />
                </div>
                <p className="text-sm font-bold text-[#041627] mt-4">
                  Sin movimientos cargados
                </p>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                  Acá se verá el registro de cambios, ajustes de stock, precios, ofertas e imágenes.
                </p>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </FormProvider>
  );
}
