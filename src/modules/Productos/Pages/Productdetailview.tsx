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
  Printer,
} from 'lucide-react';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm, FormProvider } from 'react-hook-form';
import { useProductStore } from '../store/useProductStore';
import { usePutProducts } from '../hooks/useProducts';
import { normalizeProductoPayload } from '../api/productoApi';
import FichaHistoryPanel from '../../../components/common/FichaHistoryPanel';
import StockQuickModal from '../components/ProductoDetails/StockQuickModal';
import TabResumen from '../components/ProductoDetails/TabResumen';
import TabStock from '../components/ProductoDetails/tabStock';
import TabPrecios from '../components/ProductoDetails/TabPrecios';
import TabVariantes from '../components/ProductoDetails/TabVariantes';
import TabLotes from '../components/ProductoDetails/TabLotes';
import TabImagenes from '../components/ProductoDetails/TabImagenes';
import Swal from 'sweetalert2';
import { formatStockQuantity } from '../utils/stockFormat';
import { useAuditoriaAux } from '../../POSAuxiliares/hooks/usePosAux';
import { dateTime } from '../../POSAuxiliares/utils/format';
import { useGetEmpleados } from '../../Empleados/hooks/useEmpleados';
import { usePermisos } from '../../../store/usePermisos';
import ImagenNoAvaible from '../../../../public/img/product_no_avaible.png';

export const formatPrice = (n: any) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(n ?? 0);

// ── PALETA UNIFICADA ──────────────────────────────────────────────────────────
// bg page:       #f4f5f7
// bg card:       #ffffff  /  surface: #fbf9fa
// border:        #c4c6cd  /  inner:   #e5e7eb
// text primary:  #041627
// text muted:    #44474c
// brand teal:    #0D5C63  (hover: #0a4a50)
// brand dark:    #0D3D45  (usado en footer de tabla)
// ─────────────────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'resumen',   label: 'Información General',  icon: Info },
  { id: 'stock',     label: 'Stock e Inventario',    icon: Package },
  { id: 'precios',   label: 'Tarifas y Ofertas',     icon: DollarSign },
  { id: 'variantes', label: 'Variantes',             icon: Layers },
  { id: 'lotes',     label: 'Lotes y Trazabilidad',  icon: Clock },
  { id: 'imagenes',  label: 'Galería de Imágenes',   icon: ImageIcon },
];

export function StatusBadge({ active, labelOn = 'Activo', labelOff = 'Inactivo' }: any) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide transition-all border
        ${active
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
          : 'bg-rose-50 text-rose-700 border-rose-200'
        }`}
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
  precio_costo: product.precio_costo ?? 0,
  precio_venta: product.precio_venta ?? product.precio_base ?? 0,
  unidad_venta: product.unidad_venta,
  activo: product.activo,
  activo_pos: product.activo_pos,
  activo_web: product.activo_web,
  tiene_variantes: product.tiene_variantes,
  tiene_vencimiento: product.tiene_vencimiento,
  es_fraccionable: product.es_fraccionable,
  categoria_id: product.categoria_id ?? '',
  stock:
    (product.stock?.length ?? 0) > 0
      ? product.stock
      : [{ sucursal_id: '', cantidad: 0, cantidad_minima: 0, deposito: '', pasillo: '', estante: '', sector: '', codigo_ubicacion: '', ubicacion_referencia: '' }],
  variantes: product.variantes ?? [],
  imagenes: product.imagenes ?? [],
  lotes: product.lotes ?? [],
  ofertas: product.ofertas ?? [],
  atributos: product.atributos ?? [],
});

const removeUneditedRelationFields = (data: Record<string, unknown>, activeTab: string) => {
  const relationFieldsByTab: Record<string, string[]> = {
    stock: ['stock'], precios: ['ofertas'], variantes: ['variantes'],
    lotes: ['lotes'], imagenes: ['imagenes'], resumen: ['atributos'],
  };
  const fieldsToKeep = new Set(relationFieldsByTab[activeTab] ?? []);
  ['stock', 'ofertas', 'variantes', 'lotes', 'imagenes', 'atributos'].forEach((field) => {
    if (!fieldsToKeep.has(field)) delete data[field];
  });
};

const productHistoryLabels: Record<string, string> = {
  CREAR_PRODUCTO: 'Creo el producto',
  ACTUALIZAR_PRODUCTO: 'Actualizo la ficha',
  ACTUALIZAR_STOCK_PRODUCTO: 'Actualizo stock',
  AJUSTAR_STOCK_PRODUCTO: 'Ajusto stock',
  CAMBIAR_ESTADO_PRODUCTO_SUCURSAL: 'Cambio disponibilidad',
  ELIMINAR_PRODUCTO: 'Elimino el producto',
};

const fieldLabels: Record<string, string> = {
  nombre: 'Nombre', codigo_barras: 'Codigo de barras', descripcion: 'Descripcion',
  precio_base: 'Precio base', precio_costo: 'Precio costo', precio_venta: 'Precio venta',
  margen_ganancia: 'Margen', unidad_venta: 'Unidad de venta', activo: 'Activo',
  activo_pos: 'Activo POS', activo_web: 'Activo web', tiene_variantes: 'Tiene variantes',
  tiene_vencimiento: 'Tiene vencimiento', es_fraccionable: 'Fraccionable',
  categoria_id: 'Categoria', marca_id: 'Marca', stock: 'Stock', precios: 'Precios',
  lotes: 'Lotes', ofertas: 'Ofertas', imagenes: 'Imagenes', variantes: 'Variantes', atributos: 'Atributos',
};

const formatHistoryValue = (value: any) => {
  if (value === null || value === undefined || value === '') return 'vacio';
  if (typeof value === 'boolean') return value ? 'Si' : 'No';
  if (Array.isArray(value)) return `${value.length} item(s)`;
  if (typeof value === 'object') return 'datos actualizados';
  return String(value);
};

const productChanges = (before?: Record<string, any> | null, after?: Record<string, any> | null) => {
  if (!before && after) return ['Alta inicial del producto'];
  if (!before || !after) return [];
  return Object.keys(fieldLabels)
    .filter((key) => JSON.stringify(before[key] ?? null) !== JSON.stringify(after[key] ?? null))
    .map((key) => `${fieldLabels[key]}: ${formatHistoryValue(before[key])} -> ${formatHistoryValue(after[key])}`);
};

export default function ProductDetailView() {
  const navigate = useNavigate();
  const location = useLocation();
  const { product, setProduct } = useProductStore();
  const [activeTab, setActiveTab] = useState('resumen');
  const [showStockModal, setShowStockModal] = useState(false);
  const [isEditing, setIsEditing] = useState(location.state?.isEditing ?? false);
  const [imagenesLocales, setImagenesLocales] = useState<any[]>([]);
  const [isFavorite, setIsFavorite] = useState(() =>
    product?.id ? localStorage.getItem(`prod_fav_${product.id}`) === 'true' : false
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { mutate: putProducto } = usePutProducts();

  const historialQuery = useAuditoriaAux(
    { page: 1, limit: 30, modulo: 'productos', entidad: 'producto', entidad_id: product?.id ?? '' },
    !!product?.id
  );
  const empleadosQuery = useGetEmpleados(1, 100, !!product?.id);
  const methods = useForm<any>({ defaultValues: product || {} });
  const { register, reset, watch, handleSubmit, setValue } = methods;

  const watchedNombre       = watch('nombre')         || product?.nombre;
  const watchedCodigoBarras = watch('codigo_barras')  || product?.codigo_barras;
  const watchedActivo       = watch('activo')         ?? product?.activo;
  const watchedActivoPos    = watch('activo_pos')     ?? product?.activo_pos;
  const watchedActivoWeb    = watch('activo_web')     ?? product?.activo_web;
  const watchedPrecioBase   = watch('precio_base')    ?? product?.precio_base;
  const watchedPrecioCosto  = Number(watch('precio_costo') ?? product?.precio_costo ?? 0);
  const watchedPrecioVenta  = Number(watch('precio_venta') ?? product?.precio_venta ?? watchedPrecioBase ?? 0);
  const watchedMargen       = watchedPrecioCosto > 0
    ? Number((((watchedPrecioVenta - watchedPrecioCosto) / watchedPrecioCosto) * 100).toFixed(2))
    : 0;
  const watchedTieneVariantes = watch('tiene_variantes') ?? product?.tiene_variantes;

  const empleadosById = useMemo(() => {
    const empleados = empleadosQuery.data?.data ?? [];
    return new Map(empleados.map((e) => [e.id, e]));
  }, [empleadosQuery.data]);

  const historialProducto = historialQuery.data?.data ?? [];
  const { tiene } = usePermisos();
  const canEdit = tiene('productos.editar');

  useEffect(() => {
    if (product) {
      reset(getProductFormDefaults(product));
      setIsFavorite(localStorage.getItem(`prod_fav_${product.id}`) === 'true');
    }
  }, [product, reset]);

  const toggleFavorite = () => {
    if (!product?.id) return;
    const next = !isFavorite;
    setIsFavorite(next);
    localStorage.setItem(`prod_fav_${product.id}`, String(next));
    Swal.fire({
      toast: true, position: 'top-end',
      icon: next ? 'success' : 'info',
      title: next ? '¡Añadido a favoritos!' : 'Quitado de favoritos',
      showConfirmButton: false, timer: 1500,
      background: '#fff', color: '#041627',
    });
  };

  const handlePrincipalImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const preview = URL.createObjectURL(file);
      setImagenesLocales((prev) => [{ file, preview, orden: 0, alt_text: watchedNombre }, ...prev]);
    }
  };

  const removePrincipalImage = () => {
    Swal.fire({
      title: '¿Quitar imagen?', text: 'Se removerá la imagen principal seleccionada.',
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#0D5C63', cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, quitar', cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        setImagenesLocales([]);
        if (product?.imagenes?.length > 0) setValue('imagenes', product.imagenes.slice(1));
      }
    });
  };

  const onSubmit = (formData: any) => {
    const data = normalizeProductoPayload({
      ...formData,
      precio_base: formData.precio_venta ?? formData.precio_base,
      margen_ganancia: watchedMargen,
      imagenesLocales: imagenesLocales.length > 0 ? imagenesLocales : undefined,
      id: product?.id,
    });
    removeUneditedRelationFields(data, activeTab);

    putProducto(data, {
      onSuccess: (res: any) => {
        setIsEditing(false);
        setImagenesLocales([]);
        const productoActualizado = res?.data ?? res;
        if (productoActualizado?.id) setProduct(productoActualizado);
        Swal.fire({ icon: 'success', title: '¡Guardado!', text: 'Los cambios han sido guardados con éxito.', timer: 2000, showConfirmButton: false });
      },
      onError: (error: any) => {
        const d = error?.response?.data;
        const mensaje = (Array.isArray(d?.message) ? d.message.join('\n') : d?.message) || d?.mensaje || 'Ocurrió un error al guardar los cambios.';
        Swal.fire({ icon: 'error', title: 'Error al guardar', text: mensaje, confirmButtonColor: '#0D5C63' });
      },
    });
  };

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center py-28 text-[#44474c] gap-4 bg-[#f4f5f7] min-h-screen">
        <Box size={56} className="opacity-20 stroke-[1.5] text-[#0D5C63]" />
        <p className="text-sm font-medium">No hay ningún producto seleccionado.</p>
        <button
          onClick={() => navigate('/productos')}
          className="px-6 py-2.5 bg-[#0D5C63] text-white rounded-md text-sm font-semibold hover:bg-[#0a4a50] transition shadow-sm cursor-pointer"
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
        Swal.fire({ icon: 'success', title: '¡Stock actualizado!', text: 'Se han guardado los cambios en el inventario.', timer: 2000, showConfirmButton: false });
      },
      onError: (error: any) => {
        const d = error?.response?.data;
        const mensaje = (Array.isArray(d?.message) ? d.message.join('\n') : d?.message) || d?.mensaje || 'No se pudo actualizar el stock.';
        Swal.fire({ icon: 'error', title: 'Error al actualizar stock', text: mensaje, confirmButtonColor: '#0D5C63' });
      },
    });
  };

  const principalImage =
    imagenesLocales.length > 0
      ? imagenesLocales[0].preview
      : product.imagenes?.length > 0
        ? (product.imagenes[0].url ?? product.imagenes[0])
        : null;

  return (
    <FormProvider {...methods}>
      {showStockModal && (
        <StockQuickModal product={product} onClose={() => setShowStockModal(false)} onSave={handleSaveStock} />
      )}

      <div className="flex flex-col min-h-screen bg-[#f4f5f7]" style={{ fontFamily: 'Inter, sans-serif' }}>

        {/* ── ACTION BAR ─────────────────────────────────────────────────────── */}
        <div className="top-16 z-20 bg-white border-b border-[#c4c6cd] px-8 py-3 flex items-center justify-between shadow-sm">
          <div className="flex flex-col gap-1">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1 text-[13px] text-[#44474c] font-medium">
              <span
                className="text-[#0D5C63] cursor-pointer hover:underline hover:text-[#0a4a50] transition-colors"
                onClick={() => navigate('/productos')}
              >
                Productos
              </span>
              <ChevronRight size={14} className="text-[#44474c]" />
              <span className="text-[#041627] font-semibold truncate max-w-[280px]">{product.nombre}</span>
            </div>

            {/* Botones de acción */}
            {canEdit && (
              <div className="flex items-center gap-2 mt-1">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSubmit(onSubmit)}
                      className="px-5 py-1.5 bg-[#0D5C63] text-white text-[13px] font-semibold rounded hover:bg-[#0a4a50] transition shadow-sm cursor-pointer flex items-center gap-1.5"
                    >
                      <Check size={14} /> Guardar
                    </button>
                    <button
                      type="button"
                      onClick={() => { reset(getProductFormDefaults(product)); setImagenesLocales([]); setIsEditing(false); }}
                      className="px-5 py-1.5 border border-[#c4c6cd] bg-white text-[#041627] text-[13px] font-semibold rounded hover:bg-[#fbf9fa] transition cursor-pointer flex items-center gap-1.5"
                    >
                      <RotateCcw size={14} /> Descartar
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-5 py-1.5 bg-[#0D5C63] text-white text-[13px] font-semibold rounded hover:bg-[#0a4a50] transition shadow-sm cursor-pointer"
                    >
                      Editar Ficha
                    </button>
                    <button
                      onClick={() => setShowStockModal(true)}
                      className="px-4 py-1.5 border border-[#c4c6cd] bg-white text-[#041627] text-[13px] font-semibold rounded hover:bg-[#fbf9fa] transition cursor-pointer"
                    >
                      Actualizar cantidad
                    </button>
                    <button className="px-4 py-1.5 border border-[#c4c6cd] bg-white text-[#041627] text-[13px] font-semibold rounded hover:bg-[#fbf9fa] transition cursor-pointer">
                      Reabastecer
                    </button>
                    <button className="px-4 py-1.5 border border-[#c4c6cd] bg-white text-[#041627] text-[13px] font-semibold rounded hover:bg-[#fbf9fa] transition cursor-pointer flex items-center gap-1.5">
                      <Printer size={13} /> Etiquetas
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Indicador de sincronización */}
          <div className="hidden sm:flex items-center gap-4 text-xs font-semibold text-[#44474c]">
            <span className="flex items-center gap-1.5 bg-[#fbf9fa] border border-[#c4c6cd] px-3 py-1.5 rounded text-[#041627]">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Sincronizado con POS
            </span>
          </div>
        </div>

        {/* ── MAIN SHEET ─────────────────────────────────────────────────────── */}
        <main className="flex-1 w-full max-w-[1480px] mx-auto px-4 py-6">
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,980px)_360px] gap-6 items-start">

            {/* ── CARD PRINCIPAL ─────────────────────────────────────────────── */}
            <div className="bg-white border border-[#c4c6cd] rounded-lg shadow-sm p-8 relative min-h-[550px] flex flex-col gap-6">

              {/* ROW 1: título + smart buttons + imagen */}
              <div className="flex flex-col lg:flex-row justify-between gap-6 items-start">

                {/* Left: título, código, toggles */}
                <div className="flex-1 flex flex-col gap-3 w-full">
                  {/* Favorito + etiqueta */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={toggleFavorite}
                      className="p-1 rounded-full hover:bg-amber-50 text-[#44474c] hover:text-amber-400 transition cursor-pointer"
                      title={isFavorite ? 'Quitar de favoritos' : 'Marcar como favorito'}
                    >
                      <Star
                        size={24}
                        className={isFavorite ? 'fill-amber-400 stroke-amber-400 scale-110 transition-transform' : 'stroke-[#44474c]'}
                      />
                    </button>
                    <span className="text-[11px] font-bold text-[#44474c] uppercase tracking-widest bg-[#fbf9fa] border border-[#c4c6cd] px-2 py-0.5 rounded">
                      Ficha de Producto
                    </span>
                  </div>

                  {/* Nombre */}
                  <div className="w-full">
                    {isEditing ? (
                      <input
                        type="text"
                        placeholder="Nombre del producto..."
                        {...register('nombre', { required: true })}
                        className="text-3xl font-bold text-[#041627] bg-[#fbf9fa] border-b-2 border-[#0D5C63] focus:outline-none w-full px-2 py-1 placeholder:opacity-50"
                      />
                    ) : (
                      <h1 className="text-3xl font-extrabold text-[#041627] tracking-tight leading-tight">
                        {watchedNombre}
                      </h1>
                    )}
                  </div>

                  {/* Código de barras */}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-semibold text-[#44474c]">Código de Barras:</span>
                    {isEditing ? (
                      <input
                        type="text"
                        placeholder="Código de barras..."
                        {...register('codigo_barras')}
                        className="text-xs font-mono text-[#041627] bg-[#fbf9fa] border border-[#c4c6cd] rounded px-2 py-0.5 w-64 focus:border-[#0D5C63] outline-none"
                      />
                    ) : (
                      <span className="text-xs font-mono font-semibold text-[#44474c] bg-[#fbf9fa] border border-[#c4c6cd] px-2 py-0.5 rounded">
                        {watchedCodigoBarras || 'SIN CÓDIGO'}
                      </span>
                    )}
                  </div>

                  {/* Toggles de estado */}
                  <div className="flex flex-wrap items-center gap-4 mt-3">
                    {[
                      { key: 'activo',      label: 'Activo General',      val: watchedActivo },
                      { key: 'activo_pos',  label: 'Vender en POS',       val: watchedActivoPos },
                      { key: 'activo_web',  label: 'Vender en Tienda Web', val: watchedActivoWeb },
                    ].map(({ key, label, val }) => (
                      <label
                        key={key}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold select-none cursor-pointer transition
                          ${val
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                            : 'bg-[#fbf9fa] border-[#c4c6cd] text-[#44474c]'
                          }`}
                      >
                        {isEditing ? (
                          <input type="checkbox" {...register(key)} className="accent-[#0D5C63] w-4 h-4 rounded cursor-pointer" />
                        ) : (
                          <input type="checkbox" checked={!!val} readOnly disabled className="accent-[#0D5C63] w-4 h-4 rounded disabled:opacity-80" />
                        )}
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Right: smart buttons + imagen */}
                <div className="flex flex-col lg:flex-row items-end lg:items-start gap-4 shrink-0 w-full lg:w-auto">

                  {/* Smart buttons: precio / stock / estado / variantes */}
                  <div className="grid grid-cols-2 sm:flex sm:flex-row border border-[#c4c6cd] rounded divide-x divide-[#c4c6cd] overflow-hidden bg-white shadow-sm shrink-0 w-full sm:w-auto">
                    {[
                      {
                        icon: <DollarSign size={16} className="text-[#0D5C63] mb-1" />,
                        label: 'Precio',
                        value: formatPrice(watchedPrecioBase),
                      },
                      {
                        icon: <Package size={16} className="text-[#0D5C63] mb-1" />,
                        label: 'Stock Total',
                        value: watchedTieneVariantes
                          ? 'VARIOS'
                          : `${formatStockQuantity(totalStock, product.unidad_venta, product.es_fraccionable)} U`,
                      },
                      {
                        icon: (
                          <span className={`w-2.5 h-2.5 rounded-full mb-1 ${watchedActivo ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                        ),
                        label: 'Estado',
                        value: watchedActivo ? 'Activo' : 'Inactivo',
                      },
                    ].map(({ icon, label, value }) => (
                      <div key={label} className="flex flex-col items-center justify-center p-3 text-center min-w-[90px] hover:bg-[#fbf9fa] transition cursor-pointer">
                        {icon}
                        <span className="text-[9px] text-[#44474c] uppercase font-bold tracking-wider leading-none">{label}</span>
                        <span className="text-sm font-bold text-[#041627] mt-1">{value}</span>
                      </div>
                    ))}

                    {watchedTieneVariantes && (
                      <div className="flex flex-col items-center justify-center p-3 text-center min-w-[90px] hover:bg-[#fbf9fa] transition cursor-pointer">
                        <Layers size={16} className="text-amber-500 mb-1" />
                        <span className="text-[9px] text-[#44474c] uppercase font-bold tracking-wider leading-none">Variantes</span>
                        <span className="text-sm font-bold text-[#041627] mt-1">{(product.variantes ?? []).length} items</span>
                      </div>
                    )}
                  </div>

                  {/* Imagen principal */}
                  <div className="relative group w-32 h-32 border-2 border-dashed border-[#c4c6cd] rounded-lg bg-[#fbf9fa] shadow-sm flex items-center justify-center p-1 overflow-hidden shrink-0 mt-2 lg:mt-0">
                    {principalImage ? (
                      <>
                        <img src={principalImage} alt={product.nombre} className="w-full h-full object-contain" />
                        {isEditing && (
                          <div className="absolute inset-0 bg-black/55 flex flex-col items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button type="button" onClick={() => fileInputRef.current?.click()} className="p-1.5 bg-[#0D5C63] text-white rounded-full hover:bg-[#0a4a50] transition cursor-pointer" title="Cambiar imagen">
                              <Camera size={14} />
                            </button>
                            <button type="button" onClick={removePrincipalImage} className="p-1.5 bg-rose-600 text-white rounded-full hover:bg-rose-700 transition cursor-pointer" title="Quitar imagen">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex flex-col items-center text-center justify-center text-[#44474c] gap-1 p-2">
                        <img src={ImagenNoAvaible} alt="Sin imagen" className="w-60 h-60 object-contain opacity-50" />
                        {isEditing && (
                          <button type="button" onClick={() => fileInputRef.current?.click()} className="text-[10px] text-[#0D5C63] hover:underline font-bold transition cursor-pointer">
                            Cargar
                          </button>
                        )}
                      </div>
                    )}
                    <input type="file" ref={fileInputRef} onChange={handlePrincipalImageChange} accept="image/*" className="hidden" />
                  </div>
                </div>
              </div>

              {/* Divisor */}
              <div className="w-full h-px bg-[#e5e7eb]" />

              {/* ── TABS ───────────────────────────────────────────────────── */}
              <div className="flex border-b border-[#c4c6cd] overflow-x-auto scrollbar-none gap-1 bg-[#fbf9fa] p-1 rounded-t-md">
                {TABS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActiveTab(id)}
                    className={`flex items-center gap-2 px-5 py-2.5 text-[13px] font-semibold whitespace-nowrap border-b-2 transition-all cursor-pointer rounded-t
                      ${activeTab === id
                        ? 'text-[#0D5C63] border-[#0D5C63] bg-white shadow-sm'
                        : 'text-[#44474c] border-transparent hover:text-[#041627] hover:bg-white'
                      }`}
                  >
                    <Icon size={14} className={activeTab === id ? 'text-[#0D5C63]' : 'text-[#44474c]'} />
                    {label}
                  </button>
                ))}
              </div>

              {/* ── CONTENIDO DE TAB ACTIVO ─────────────────────────────────── */}
              <div className="flex-1 bg-white pt-2">
                {activeTab === 'resumen'   && <TabResumen   product={product} isEditing={isEditing} />}
                {activeTab === 'stock'     && <TabStock     product={product} onOpenStockModal={() => setShowStockModal(true)} isEditing={isEditing} />}
                {activeTab === 'precios'   && <TabPrecios   product={product} isEditing={isEditing} />}
                {activeTab === 'variantes' && <TabVariantes product={product} isEditing={isEditing} />}
                {activeTab === 'lotes'     && <TabLotes     product={product} isEditing={isEditing} />}
                {activeTab === 'imagenes'  && <TabImagenes  product={product} isEditing={isEditing} imagenesLocales={imagenesLocales} setImagenesLocales={setImagenesLocales} />}
              </div>
            </div>

            {/* ── PANEL HISTORIAL ─────────────────────────────────────────── */}
            <FichaHistoryPanel
              title="Historial"
              subtitle="Movimientos y actualizaciones del producto"
              events={historialProducto}
              isLoading={historialQuery.isLoading}
              labels={productHistoryLabels}
              maxChanges={6}
              emptyDescription="Aca se vera el registro de cambios, ajustes de stock, precios, ofertas e imagenes."
              getActorName={(evento: any) => {
                const empleado = evento.empleado_id ? empleadosById.get(evento.empleado_id) : null;
                return empleado?.nombreCompleto ?? 'Sistema';
              }}
              getChanges={(evento: any) => productChanges(evento.antes, evento.despues)}
            />
          </div>
        </main>
      </div>
    </FormProvider>
  );
}