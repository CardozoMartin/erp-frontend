import { useFormContext } from 'react-hook-form';
import { formatPrice } from '../../Pages/Productdetailview';
import { Toggle } from '../FormComponents';
import { useGetAllProductCategoriesActives } from '../../hooks/useProductCategory';
import { ALICUOTAS_IVA, UNIDADES } from '../constants';
import { AtributosGeneralesSection } from '../ProductFormSections/AtributosGeneralesSection';
import {
  Tag,
  Ruler,
  Percent,
  DollarSign,
  Clock,
  Scale,
  Layers,
  FileText,
  Bookmark,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { usePermisos } from '../../../../store/usePermisos';

const TabResumen = ({ product, isEditing }: any) => {
  const { register, watch, setValue } = useFormContext<any>();
  const { tiene } = usePermisos();
  const { data: categorias } = useGetAllProductCategoriesActives(1, 1000);
  const todasLasCategorias = categorias?.data || [];
  const puedeVerCosto = tiene('productos.ver_costos');
  const puedeVerMargen = tiene('productos.ver_margenes');

  const watchedCategoriaId = watch('categoria_id') || product?.categoria_id;
  const categoriaSeleccionada = todasLasCategorias.find((cat: any) => cat.id === watchedCategoriaId);
  const atributosCategoria = categoriaSeleccionada?.atributos || [];

  const watchedTieneVariantes = watch('tiene_variantes');
  const watchedTieneVencimiento = watch('tiene_vencimiento');
  const watchedEsFraccionable = watch('es_fraccionable');
  const watchedPrecioCosto = Number(watch('precio_costo') ?? product?.precio_costo ?? 0);
  const watchedPrecioVenta = Number(watch('precio_venta') ?? product?.precio_venta ?? product?.precio_base ?? 0);
  const margen =
    product?.margen_ganancia ??
    (watchedPrecioCosto > 0 ? ((watchedPrecioVenta - watchedPrecioCosto) / watchedPrecioCosto) * 100 : 0);

  // Helper de badge Sí / No
  const renderBooleanBadge = (val: boolean) => (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold
      ${val ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>
      {val ? <CheckCircle2 size={12} className="text-emerald-500" /> : <XCircle size={12} className="text-slate-300" />}
      {val ? 'Sí' : 'No'}
    </span>
  );

  return (
    <div className="py-4">
      {/* ── SECTIONS GRID (Odoo 2-Column Sheet) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6">

        {/* LEFT COLUMN: Datos de Facturación / Venta */}
        <div className="flex flex-col gap-5">
          <h3 className="text-xs font-bold text-[#075E54] uppercase tracking-wider border-b border-slate-100 pb-1 flex items-center gap-1.5">
            <Bookmark size={12} />
            Datos de Catálogo
          </h3>

          {/* Categoría */}
          <div className="flex items-center justify-between min-h-[40px] py-1 border-b border-slate-50">
            <span className="text-[13px] text-gray-500 font-semibold flex items-center gap-2">
              <Tag size={14} className="text-gray-400" />
              Categoría
            </span>
            <div className="w-2/3 flex justify-end">
              {isEditing ? (
                <select
                  {...register('categoria_id')}
                  className="w-full max-w-[280px] h-9 border border-gray-300 rounded px-2.5 text-sm bg-white focus:ring-2 focus:ring-[#075E54]/20 focus:border-[#075E54] outline-none text-[#041627] font-semibold"
                >
                  <option value="">Seleccionar categoría...</option>
                  {todasLasCategorias.map((cat: any) => (
                    <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                  ))}
                </select>
              ) : (
                <span className="text-sm font-bold text-[#041627] bg-[#DCF8C6]/30 text-[#075E54] px-3 py-1 rounded border border-[#DCF8C6]">
                  {categoriaSeleccionada?.nombre ?? product?.categoria?.nombre ?? 'Sin Categoría'}
                </span>
              )}
            </div>
          </div>

          {/* Unidad de Medida */}
          <div className="flex items-center justify-between min-h-[40px] py-1 border-b border-slate-50">
            <span className="text-[13px] text-gray-500 font-semibold flex items-center gap-2">
              <Ruler size={14} className="text-gray-400" />
              Unidad de Medida
            </span>
            <div className="w-2/3 flex justify-end">
              {isEditing ? (
                <select
                  {...register('unidad_venta', { required: 'La unidad es obligatoria' })}
                  className="w-full max-w-[280px] h-9 border border-gray-300 rounded px-2.5 text-sm bg-white focus:ring-2 focus:ring-[#075E54]/20 focus:border-[#075E54] outline-none text-[#041627] font-semibold"
                >
                  {UNIDADES.map((u: any) => {
                    const val = typeof u === 'string' ? u : u.value;
                    const lbl = typeof u === 'string' ? u : u.label;
                    return <option key={val} value={val}>{lbl}</option>;
                  })}
                </select>
              ) : (
                <span className="text-sm font-bold text-[#041627]">
                  {product?.unidad_venta ?? 'UNIDAD'}
                </span>
              )}
            </div>
          </div>

          {/* Alicuota de IVA — se usa al facturar A/B; la Factura C no discrimina */}
          <div className="flex items-center justify-between min-h-[40px] py-1 border-b border-slate-50">
            <span className="text-[13px] text-gray-500 font-semibold flex items-center gap-2">
              <Percent size={14} className="text-gray-400" />
              Alícuota de IVA
            </span>
            <div className="w-2/3 flex justify-end">
              {isEditing ? (
                <select
                  {...register('alicuota_iva')}
                  className="w-full max-w-[280px] h-9 border border-gray-300 rounded px-2.5 text-sm bg-white focus:ring-2 focus:ring-[#075E54]/20 focus:border-[#075E54] outline-none text-[#041627] font-semibold"
                >
                  {ALICUOTAS_IVA.map((a) => (
                    <option key={a.value} value={a.value}>{a.label}</option>
                  ))}
                </select>
              ) : (
                <span className="text-sm font-bold text-[#041627]">
                  {Number(product?.alicuota_iva ?? 21)}%
                </span>
              )}
            </div>
          </div>

          {puedeVerCosto && (
            <div className="flex items-center justify-between min-h-[40px] py-1 border-b border-slate-50">
              <span className="text-[13px] text-gray-500 font-semibold flex items-center gap-2">
                <DollarSign size={14} className="text-gray-400" />
                Precio de Costo
              </span>
              <div className="w-2/3 flex justify-end">
                {isEditing ? (
                  <div className="relative w-full max-w-[280px]">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">$</span>
                    <input
                      type="number"
                      step="any"
                      placeholder="0.00"
                      {...register('precio_costo', { valueAsNumber: true })}
                      className="w-full h-9 border border-gray-300 rounded pl-7 pr-3 text-sm focus:ring-2 focus:ring-[#075E54]/20 focus:border-[#075E54] outline-none text-[#041627] font-semibold bg-white"
                    />
                  </div>
                ) : (
                  <span className="text-lg font-black text-[#44474c]">
                    {formatPrice(product?.precio_costo)}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Precio Venta */}
          <div className="flex items-center justify-between min-h-[40px] py-1 border-b border-slate-50">
            <span className="text-[13px] text-gray-500 font-semibold flex items-center gap-2">
              <DollarSign size={14} className="text-gray-400" />
              Precio de Venta
            </span>
            <div className="w-2/3 flex justify-end">
              {isEditing ? (
                <div className="relative w-full max-w-[280px]">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">$</span>
                  <input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    {...register('precio_venta', { valueAsNumber: true })}
                    className="w-full h-9 border border-gray-300 rounded pl-7 pr-3 text-sm focus:ring-2 focus:ring-[#075E54]/20 focus:border-[#075E54] outline-none text-[#041627] font-semibold bg-white"
                  />
                </div>
              ) : (
                <span className="text-lg font-black text-[#075E54]">
                  {formatPrice(product?.precio_venta ?? product?.precio_base)}
                </span>
              )}
            </div>
          </div>
          {puedeVerMargen && (
            <div className="flex items-center justify-between min-h-[40px] py-1 border-b border-slate-50">
              <span className="text-[13px] text-gray-500 font-semibold flex items-center gap-2">
                <DollarSign size={14} className="text-gray-400" />
                Margen de Ganancia
              </span>
              <span className={`text-lg font-black ${Number(margen) >= 0 ? 'text-[#075E54]' : 'text-red-600'}`}>
                {Number(margen).toFixed(2)}%
              </span>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Propiedades Logísticas / Avanzadas */}
        <div className="flex flex-col gap-5">
          <h3 className="text-xs font-bold text-[#075E54] uppercase tracking-wider border-b border-slate-100 pb-1 flex items-center gap-1.5">
            <Scale size={12} />
            Características del Producto
          </h3>

          {/* ¿Tiene Variantes? */}
          <div className="flex items-center justify-between min-h-[40px] py-1 border-b border-slate-50">
            <span className="text-[13px] text-gray-500 font-semibold flex items-center gap-2">
              <Layers size={14} className="text-gray-400" />
              ¿Posee Variantes?
            </span>
            <div className="w-2/3 flex justify-end">
              {isEditing ? (
                <Toggle checked={watchedTieneVariantes} onChange={(val) => setValue('tiene_variantes', val)} dark />
              ) : (
                renderBooleanBadge(product?.tiene_variantes)
              )}
            </div>
          </div>

          {/* ¿Controla Vencimiento? */}
          <div className="flex items-center justify-between min-h-[40px] py-1 border-b border-slate-50">
            <span className="text-[13px] text-gray-500 font-semibold flex items-center gap-2">
              <Clock size={14} className="text-gray-400" />
              ¿Controla Vencimiento?
            </span>
            <div className="w-2/3 flex justify-end">
              {isEditing ? (
                <Toggle checked={watchedTieneVencimiento} onChange={(val) => setValue('tiene_vencimiento', val)} dark />
              ) : (
                renderBooleanBadge(product?.tiene_vencimiento)
              )}
            </div>
          </div>

          {/* ¿Es Fraccionable? */}
          <div className="flex items-center justify-between min-h-[40px] py-1 border-b border-slate-50">
            <span className="text-[13px] text-gray-500 font-semibold flex items-center gap-2">
              <Scale size={14} className="text-gray-400" />
              ¿Es Venta Fraccionable?
            </span>
            <div className="w-2/3 flex justify-end">
              {isEditing ? (
                <Toggle checked={watchedEsFraccionable} onChange={(val) => setValue('es_fraccionable', val)} dark />
              ) : (
                renderBooleanBadge(product?.es_fraccionable)
              )}
            </div>
          </div>
        </div>

      </div>

      {/* ── FULL WIDTH DESCRIPTION & ATTRIBUTES ── */}
      <div className="mt-8 flex flex-col gap-6">

        {/* Descripción */}
        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
            <FileText size={13} />
            Descripción e Notas Internas
          </h3>
          {isEditing ? (
            <textarea
              rows={3}
              placeholder="Añadir notas del producto, especificaciones, etc..."
              {...register('descripcion')}
              className="w-full p-3 border border-gray-300 bg-white rounded text-sm focus:ring-2 focus:ring-[#075E54]/20 focus:border-[#075E54] outline-none text-[#041627]"
            />
          ) : (
            <div className="p-4 bg-slate-50 border border-slate-200/60 rounded text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {product?.descripcion || <span className="text-gray-400 italic">No hay ninguna descripción configurada para este producto.</span>}
            </div>
          )}
        </div>

        {/* Atributos de Categoría (Inline) */}
        {!watchedTieneVariantes && atributosCategoria.length > 0 && (
          <div className="border-t border-slate-100 pt-4 flex flex-col gap-3">
            <h3 className="text-xs font-bold text-[#075E54] uppercase tracking-wider flex items-center gap-1.5">
              <Layers size={13} />
              Valores de Atributos de Categoría
            </h3>
            {isEditing ? (
              <AtributosGeneralesSection atributosCategoria={atributosCategoria} />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {(product?.atributos ?? []).map((a: any, idx: number) => (
                  <div key={idx} className="flex flex-col gap-0.5 px-4 py-2 bg-slate-50/60 rounded border border-slate-100">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{a.nombre}</span>
                    <span className="text-sm font-semibold text-[#041627]">{a.valor}</span>
                  </div>
                ))}
                {(product?.atributos ?? []).length === 0 && (
                  <span className="text-sm text-gray-400 italic">No hay valores especificados para los atributos de la categoría.</span>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default TabResumen;
