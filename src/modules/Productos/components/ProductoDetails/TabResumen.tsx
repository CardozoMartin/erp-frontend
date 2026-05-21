import { useFormContext } from 'react-hook-form';
import { formatPrice } from '../../Pages/Productdetailview';
import { InputFormField } from '../InputFormField';
import { Toggle } from '../FormComponents';
import { useGetAllProductCategoriesActives } from '../../hooks/useProductCategory';
import { UNIDADES } from '../constants';
import { AtributosGeneralesSection } from '../ProductFormSections/AtributosGeneralesSection';

const TabResumen = ({ product, isEditing }: any) => {
  const { register, watch, setValue, formState: { errors } } = useFormContext<any>();
  const { data: categorias } = useGetAllProductCategoriesActives(1, 1000);
  const todasLasCategorias = categorias?.data || [];
  
  const watchedCategoriaId = watch('categoria_id');
  const categoriaSeleccionada = todasLasCategorias.find((cat: any) => cat.id === watchedCategoriaId);
  const atributosCategoria = categoriaSeleccionada?.atributos || [];
  
  const watchedTieneVariantes = watch('tiene_variantes');
  const watchedTieneVencimiento = watch('tiene_vencimiento');

  if (isEditing) {
    return (
      <div className="flex flex-col gap-6 bg-white p-6 rounded-md border border-gray-200">
        <h3 className="text-lg font-semibold text-[#041627] border-b pb-2">Información Básica</h3>
        <div className="grid grid-cols-2 gap-6">
          <InputFormField
            label="Nombre del Producto"
            name="nombre"
            registration={register('nombre', { required: 'El nombre es obligatorio' })}
            error={errors.nombre?.message as string}
          />
          <InputFormField
            label="Código de Barras"
            name="codigo_barras"
            registration={register('codigo_barras')}
          />
        </div>
        <div className="grid grid-cols-3 gap-6">
          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-medium text-gray-600">Categoría</label>
            <select
              {...register('categoria_id')}
              className="h-9 border border-gray-200 rounded-sm px-2 text-[13px]"
            >
              {todasLasCategorias.map((cat: any) => (
                <option key={cat.id} value={cat.id}>{cat.nombre}</option>
              ))}
            </select>
          </div>
          <InputFormField
            label="Unidad de Medida"
            name="unidad_venta"
            type="select"
            registration={register('unidad_venta', { required: 'La unidad es obligatoria' })}
            options={UNIDADES}
          />
          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-medium text-gray-600">Precio Base ($)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
              <input
                type="number"
                {...register('precio_base', { valueAsNumber: true })}
                placeholder="0.00"
                className="w-full h-9 border border-gray-200 rounded-sm pl-7 pr-3 text-[13px]"
              />
            </div>
          </div>
        </div>
        <InputFormField
          label="Descripción"
          name="descripcion"
          type="textarea"
          registration={register('descripcion')}
          rows={3}
        />

        <h3 className="text-lg font-semibold text-[#041627] border-b pb-2 mt-2">Canales de Venta</h3>
        <div className="grid grid-cols-3 gap-6">
          <div className="flex items-center justify-between p-3 border border-[#efedef] rounded-sm bg-[#fbf9fa]">
            <span className="text-[13px] font-medium text-[#041627]">Activo General</span>
            <Toggle checked={watch('activo')} onChange={(val) => setValue('activo', val)} />
          </div>
          <div className="flex items-center justify-between p-3 border border-[#efedef] rounded-sm bg-[#fbf9fa]">
            <span className="text-[13px] font-medium text-[#041627]">Punto de Venta (POS)</span>
            <Toggle checked={watch('activo_pos')} onChange={(val) => setValue('activo_pos', val)} />
          </div>
          <div className="flex items-center justify-between p-3 border border-[#efedef] rounded-sm bg-[#fbf9fa]">
            <span className="text-[13px] font-medium text-[#041627]">Tienda Web</span>
            <Toggle checked={watch('activo_web')} onChange={(val) => setValue('activo_web', val)} />
          </div>
        </div>

        <h3 className="text-lg font-semibold text-[#041627] border-b pb-2 mt-2">Configuración Avanzada</h3>
        <div className="grid grid-cols-3 gap-6">
          <div className="flex items-center justify-between p-3 border border-[#efedef] rounded-sm bg-[#fbf9fa]">
            <div><h4 className="text-sm font-semibold text-[#041627]">¿Tiene Variantes?</h4></div>
            <Toggle checked={watchedTieneVariantes} onChange={(val) => setValue('tiene_variantes', val)} dark />
          </div>
          <div className="flex items-center justify-between p-3 border border-[#efedef] rounded-sm bg-[#fbf9fa]">
            <div><h4 className="text-sm font-semibold text-[#041627]">¿Controla Vencimiento?</h4></div>
            <Toggle checked={watchedTieneVencimiento} onChange={(val) => setValue('tiene_vencimiento', val)} dark />
          </div>
          <div className="flex items-center justify-between p-3 border border-[#efedef] rounded-sm bg-[#fbf9fa]">
            <div><h4 className="text-sm font-semibold text-[#041627]">¿Es Fraccionable?</h4></div>
            <Toggle checked={watch('es_fraccionable')} onChange={(val) => setValue('es_fraccionable', val)} dark />
          </div>
        </div>

        {!watchedTieneVariantes && atributosCategoria.length > 0 && (
          <div className="mt-2">
            <h3 className="text-lg font-semibold text-[#041627] border-b pb-2 mb-4">Atributos de Categoría</h3>
            <AtributosGeneralesSection atributosCategoria={atributosCategoria} />
          </div>
        )}
      </div>
    );
  }
  return (
    <div className="flex flex-col md:flex-row gap-12 bg-transparent pt-4">
      <div className="flex-1 flex flex-col gap-5">
        <div className="flex items-start border-b border-gray-100 pb-2">
          <span className="w-48 text-[13px] font-bold text-gray-700 uppercase tracking-wide">Categoría</span>
          <span className="flex-1 text-[13px] text-[#041627]">{product?.categoria?.nombre ?? product?.categoria_id ?? '—'}</span>
        </div>
        <div className="flex items-start border-b border-gray-100 pb-2">
          <span className="w-48 text-[13px] font-bold text-gray-700 uppercase tracking-wide">Unidad de venta</span>
          <span className="flex-1 text-[13px] text-[#041627]">{product?.unidad_venta ?? '—'}</span>
        </div>
        <div className="flex items-start border-b border-gray-100 pb-2">
          <span className="w-48 text-[13px] font-bold text-gray-700 uppercase tracking-wide">Precio base</span>
          <span className="flex-1 text-[13px] text-[#041627]">{formatPrice(product?.precio_base)}</span>
        </div>
        <div className="flex items-start border-b border-gray-100 pb-2">
          <span className="w-48 text-[13px] font-bold text-gray-700 uppercase tracking-wide">Controla vencimiento</span>
          <span className="flex-1 text-[13px] text-[#041627]">{product?.tiene_vencimiento ? 'Sí' : 'No'}</span>
        </div>
        <div className="flex items-start border-b border-gray-100 pb-2">
          <span className="w-48 text-[13px] font-bold text-gray-700 uppercase tracking-wide">Es fraccionable</span>
          <span className="flex-1 text-[13px] text-[#041627]">{product?.es_fraccionable ? 'Sí' : 'No'}</span>
        </div>
        <div className="flex items-start border-b border-gray-100 pb-2">
          <span className="w-48 text-[13px] font-bold text-gray-700 uppercase tracking-wide">Tiene variantes</span>
          <span className="flex-1 text-[13px] text-[#041627]">{product?.tiene_variantes ? 'Sí' : 'No'}</span>
        </div>
      </div>

      {/* Columna Derecha */}
      <div className="flex-1 flex flex-col gap-5">
        <div className="flex items-start border-b border-gray-100 pb-2">
          <span className="w-48 text-[13px] font-bold text-gray-700 uppercase tracking-wide">Código de barras</span>
          <span className="flex-1 text-[13px] text-[#041627]">{product?.codigo_barras ?? '—'}</span>
        </div>
        <div className="flex items-start border-b border-gray-100 pb-2">
          <span className="w-48 text-[13px] font-bold text-gray-700 uppercase tracking-wide">Atributos</span>
          <span className="flex-1 text-[13px] text-[#041627]">
            {(product?.atributos ?? []).length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {product.atributos.map((a: any, idx: number) => (
                  <span key={idx} className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-sm text-xs">
                    {a.nombre}: {a.valor}
                  </span>
                ))}
              </div>
            ) : (
              '—'
            )}
          </span>
        </div>
        <div className="flex items-start border-b border-gray-100 pb-2">
          <span className="w-48 text-[13px] font-bold text-gray-700 uppercase tracking-wide">Descripción</span>
          <span className="flex-1 text-[13px] text-[#041627] leading-relaxed whitespace-pre-wrap">
            {product?.descripcion ?? '—'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TabResumen;
