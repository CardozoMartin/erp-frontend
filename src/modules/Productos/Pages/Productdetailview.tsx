import {
  AlertTriangle,
  Box,
  ChevronRight,
  Clock,
  DollarSign,
  Image,
  Info,
  Layers,
  Package,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm, FormProvider } from 'react-hook-form';
import { useProductStore } from '../store/useProductStore';
import { usePutProducts } from '../hooks/useProducts';
import Swal from 'sweetalert2';

/* ─── helpers ─── */
export const formatPrice = (n: any) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(n ?? 0);

const TABS = [
  { id: 'resumen', label: 'Resumen', icon: Info },
  { id: 'stock', label: 'Stock', icon: Package },
  { id: 'precios', label: 'Precios y Ofertas', icon: DollarSign },
  { id: 'variantes', label: 'Variantes', icon: Layers },
  { id: 'lotes', label: 'Lotes', icon: Clock },
  { id: 'imagenes', label: 'Imágenes', icon: Image },
];

/* ─── StatusBadge ─── */
export function StatusBadge({ active, labelOn = 'Activo', labelOff = 'Inactivo' }: any) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium
        ${active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-green-500' : 'bg-red-500'}`} />
      {active ? labelOn : labelOff}
    </span>
  );
}

import StockQuickModal from '../components/ProductoDetails/StockQuickModal';
import TabResumen from '../components/ProductoDetails/TabResumen';
import TabStock from '../components/ProductoDetails/tabStock';
import TabPrecios from '../components/ProductoDetails/TabPrecios';
import TabVariantes from '../components/ProductoDetails/TabVariantes';
import TabLotes from '../components/ProductoDetails/TabLotes';
import TabImagenes from '../components/ProductoDetails/TabImagenes';

/* ─────────────────────────────────────────────
   COMPONENTE PRINCIPAL
───────────────────────────────────────────── */
export default function ProductDetailView() {
  const navigate = useNavigate();
  const location = useLocation();
  const { product, setProduct } = useProductStore();
  const [activeTab, setActiveTab] = useState('resumen');
  const [showStockModal, setShowStockModal] = useState(false);
  const [isEditing, setIsEditing] = useState(location.state?.isEditing ?? false);
  const [imagenesLocales, setImagenesLocales] = useState<any[]>([]);
  
  const { mutate: putProducto } = usePutProducts();
  const methods = useForm<any>({ defaultValues: product || {} });
  const { register, reset, watch, handleSubmit } = methods;

  const watchedNombre = watch('nombre') || product?.nombre;
  const watchedCodigoBarras = watch('codigo_barras') || product?.codigo_barras;
  const watchedActivo = watch('activo') ?? product?.activo;
  const watchedActivoPos = watch('activo_pos') ?? product?.activo_pos;
  const watchedActivoWeb = watch('activo_web') ?? product?.activo_web;
  const watchedPrecioBase = watch('precio_base') ?? product?.precio_base;

  useEffect(() => {
    if (product) {
      reset({
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
        categoria_id: product.categoria_id ?? null,
        stock: (product.stock?.length ?? 0) > 0 ? product.stock : [{ sucursal_id: '', cantidad: 0, cantidad_minima: 0 }],
        variantes: product.variantes ?? [],
        imagenes: product.imagenes ?? [],
        lotes: product.lotes ?? [],
        ofertas: product.ofertas ?? [],
        atributos: product.atributos ?? [],
      });
    }
  }, [product, reset]);

  const onSubmit = (formData: any) => {
    const data = {
      ...formData,
      precio_base: formData.precio_base ? Number(formData.precio_base) : 0,
      imagenesLocales: imagenesLocales.length > 0 ? imagenesLocales : undefined,
      id: product?.id,
    };

    if (!data.categoria_id || data.categoria_id === '') delete data.categoria_id;
    if (!data.codigo_barras || data.codigo_barras.trim() === '') delete data.codigo_barras;

    const normalizeStock = (stock: any[] = []) => stock.map((item) => ({
      ...item,
      sucursal_id: item.sucursal_id || null,
      cantidad: Number(item.cantidad || 0),
      cantidad_minima: Number(item.cantidad_minima || 0),
    }));

    if (data.stock && data.stock.length > 0) data.stock = normalizeStock(data.stock);

    if (data.variantes && data.variantes.length > 0) {
      data.variantes = data.variantes.map((v: any) => ({
        ...v,
        sku: v.sku?.trim() || undefined,
        precio_extra: v.precio_extra ? Number(v.precio_extra) : 0,
        stock: v.stock ? normalizeStock(v.stock) : [],
        lotes: v.lotes ? v.lotes.map((l: any) => ({ ...l, sucursal_id: l.sucursal_id || null })) : [],
      }));
    }

    if (data.tiene_variantes) {
      data.stock = []; data.lotes = []; data.ofertas = []; data.imagenes = []; data.atributos = [];
    } else {
      data.variantes = [];
      data.atributos = (data.atributos && data.atributos.length > 0) ? data.atributos.filter((attr: any) => attr.valor && attr.valor.trim() !== '') : [];
    }

    if (data.lotes && data.lotes.length > 0) {
      data.lotes = data.lotes.filter((l: any) => l.fecha_vencimiento && l.fecha_vencimiento.trim() !== '').map((l: any) => ({ ...l, sucursal_id: l.sucursal_id || null }));
    }

    if (data.ofertas && data.ofertas.length > 0) {
      data.ofertas = data.ofertas.filter((o: any) => o.fecha_inicio && o.fecha_fin && o.fecha_inicio.trim() !== '' && o.fecha_fin.trim() !== '');
    }

    putProducto(data, {
      onSuccess: (res: any) => {
        setIsEditing(false);
        setImagenesLocales([]);
        if (res?.data) {
          setProduct(res.data);
        }
        Swal.fire({ icon: 'success', title: '¡Guardado!', text: 'Los cambios han sido guardados.', timer: 2000, showConfirmButton: false });
      }
    });
  };

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-400 gap-4">
        <Box size={48} className="opacity-30" />
        <p className="text-sm">No hay producto seleccionado.</p>
        <button
          onClick={() => navigate('/productos')}
          className="px-5 py-2 bg-[#075E54] text-white rounded text-sm font-medium hover:bg-[#064d45] cursor-pointer"
        >
          Volver a productos
        </button>
      </div>
    );
  }

  const totalStock = (product.stock ?? []).reduce((a: number, s: any) => a + (s.cantidad ?? 0), 0);

  const handleSaveStock = (newStock: any) => {
    setProduct({ ...product, stock: newStock });
    // Conectar acá tu mutation: putProducto({ ...product, stock: newStock })
    Swal.fire({
      icon: 'success',
      title: '¡Stock actualizado!',
      timer: 2000,
      showConfirmButton: false,
    });
  };

  return (
    <FormProvider {...methods}>
      {showStockModal && (
        <StockQuickModal
          product={product}
          onClose={() => setShowStockModal(false)}
          onSave={handleSaveStock}
        />
      )}

      <div className="flex flex-col min-h-screen bg-[#fbf9fa]">
        {/* ── TOP ACTION BAR ── */}
        <div className="sticky top-16 z-10 bg-white border-b border-[#c4c6cd] px-6 py-2 flex flex-col gap-2">
          {/* Breadcrumbs & Stat Buttons */}
          <div className="flex justify-between items-start w-full">
            <div className="flex items-center gap-1 text-[13px] text-gray-500 mb-2">
              <span
                className="text-[#075E54] cursor-pointer hover:underline"
                onClick={() => navigate('/productos')}
              >
                Productos
              </span>
              <ChevronRight size={14} />
              <span className="text-[#041627] font-medium truncate max-w-[300px]">{product.nombre}</span>
            </div>

            {/* Stat Buttons (Odoo style) */}
            <div className="flex border border-gray-200 rounded-sm divide-x divide-gray-200 overflow-hidden bg-white shadow-sm">
              <div className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 cursor-pointer">
                <DollarSign size={16} className="text-[#075E54]" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-500 uppercase leading-tight">Precio</span>
                  <span className="text-[12px] font-semibold text-[#041627] leading-tight">{formatPrice(watchedPrecioBase)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 cursor-pointer">
                <Package size={16} className="text-[#075E54]" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-500 uppercase leading-tight">Disponible</span>
                  <span className="text-[12px] font-semibold text-[#041627] leading-tight">{totalStock} U</span>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 cursor-pointer">
                <AlertTriangle size={16} className="text-amber-500" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-500 uppercase leading-tight">Estado</span>
                  <span className="text-[12px] font-semibold text-[#041627] leading-tight">{watchedActivo ? 'Activo' : 'Inactivo'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowStockModal(true)}
              className="px-3 py-1.5 bg-[#075E54] text-white text-[13px] font-medium rounded-sm hover:bg-[#064d45] cursor-pointer"
            >
              Actualizar cantidad
            </button>
            <button className="px-3 py-1.5 border border-[#c4c6cd] bg-white text-[#041627] text-[13px] font-medium rounded-sm hover:bg-gray-50 cursor-pointer">
              Reabastecer
            </button>
            <button className="px-3 py-1.5 border border-[#c4c6cd] bg-white text-[#041627] text-[13px] font-medium rounded-sm hover:bg-gray-50 cursor-pointer">
              Imprimir etiquetas
            </button>
            {isEditing ? (
              <div className="flex gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => {
                    reset({
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
                      categoria_id: product.categoria_id ?? null,
                      stock: (product.stock?.length ?? 0) > 0 ? product.stock : [{ sucursal_id: '', cantidad: 0, cantidad_minima: 0 }],
                      variantes: product.variantes ?? [],
                      imagenes: product.imagenes ?? [],
                      lotes: product.lotes ?? [],
                      ofertas: product.ofertas ?? [],
                      atributos: product.atributos ?? [],
                    });
                    setImagenesLocales([]);
                    setIsEditing(false);
                  }}
                  className="px-3 py-1.5 border border-red-200 bg-red-50 text-red-700 text-[13px] font-medium rounded-sm hover:bg-red-100 cursor-pointer"
                >
                  Descartar
                </button>
                <button
                  onClick={handleSubmit(onSubmit)}
                  className="px-3 py-1.5 bg-[#075E54] text-white text-[13px] font-medium rounded-sm hover:bg-[#064d45] cursor-pointer"
                >
                  Guardar Cambios
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-3 py-1.5 border border-[#c4c6cd] bg-white text-[#041627] text-[13px] font-medium rounded-sm hover:bg-gray-50 cursor-pointer ml-auto"
              >
                Editar
              </button>
            )}
          </div>
        </div>

        {/* ── PRODUCT TITLE AREA ── */}
        <div className="px-6 py-6 bg-white flex justify-between items-start border-b border-[#c4c6cd]">
          <div className="flex flex-col gap-2 max-w-3xl">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Producto</span>
            <div className="flex items-center gap-3">
              <span className="text-yellow-400 text-3xl">★</span>
              <h1 className="text-3xl font-semibold text-[#041627] tracking-tight leading-tight">
                {watchedNombre}
              </h1>
            </div>
            {watchedCodigoBarras && (
              <span className="text-sm text-gray-500 ml-10">[{watchedCodigoBarras}]</span>
            )}
            
            <div className="flex items-center gap-6 mt-4 ml-10 text-sm font-medium text-gray-600">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isEditing ? undefined : watchedActivo}
                  {...(isEditing ? register('activo') : {})}
                  readOnly={!isEditing}
                  className="accent-[#075E54] w-4 h-4"
                />
                Activo General
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isEditing ? undefined : watchedActivoPos}
                  {...(isEditing ? register('activo_pos') : {})}
                  readOnly={!isEditing}
                  className="accent-[#075E54] w-4 h-4"
                />
                Punto de Venta
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isEditing ? undefined : watchedActivoWeb}
                  {...(isEditing ? register('activo_web') : {})}
                  readOnly={!isEditing}
                  className="accent-[#075E54] w-4 h-4"
                />
                Tienda Web
              </label>
            </div>
          </div>

          {/* Product Image Placeholder */}
          <div className="w-32 h-32 border border-gray-200 rounded-md bg-white shadow-sm flex items-center justify-center p-1 overflow-hidden shrink-0">
             {product.imagenes && product.imagenes.length > 0 ? (
                <img src={product.imagenes[0].url ?? product.imagenes[0]} alt={product.nombre} className="w-full h-full object-contain" />
             ) : (
                <Image size={48} className="text-gray-200" />
             )}
          </div>
        </div>

        {/* ── PESTAÑAS ── */}
        <div className="flex border-b border-[#c4c6cd] px-6 bg-[#fbf9fa] overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium whitespace-nowrap border-b-2 transition-colors cursor-pointer
                ${
                  activeTab === id
                    ? 'text-[#075E54] border-[#075E54]'
                    : 'text-gray-500 border-transparent hover:text-[#041627]'
                }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* ── CONTENIDO ── */}
        <main className="max-w-[1100px] w-full mx-auto px-6 py-5 flex-1">
          {activeTab === 'resumen' && <TabResumen product={product} isEditing={isEditing} />}
          {activeTab === 'stock' && (
            <TabStock product={product} onOpenStockModal={() => setShowStockModal(true)} isEditing={isEditing} />
          )}
          {activeTab === 'precios' && <TabPrecios product={product} isEditing={isEditing} />}
          {activeTab === 'variantes' && <TabVariantes product={product} isEditing={isEditing} />}
          {activeTab === 'lotes' && <TabLotes product={product} isEditing={isEditing} />}
          {activeTab === 'imagenes' && <TabImagenes product={product} isEditing={isEditing} imagenesLocales={imagenesLocales} setImagenesLocales={setImagenesLocales} />}
        </main>
      </div>
    </FormProvider>
  );
}
