import { Layers, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { Card, Toggle } from '../FormComponents';
import { InputFormField } from '../InputFormField';
import { ImagenesSection } from './ImagenesSection';
import { LotesSection } from './LotesSection';
import { OfertasSection } from './OfertasSection';
import { StockSection } from './StockSection';

interface Props {
  tieneVencimiento: boolean;
  sucursales?: any[];
  atributosCategoria?: any[];
}

export function VariantesSection({ tieneVencimiento, sucursales, atributosCategoria = [] }: Props) {
  const { control, register, watch, setValue } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name: 'variantes' });
  const [activeTab, setActiveTab] = useState<number>(0);

  const handleAppend = () => {
    append({
      sku: '',
      precio_extra: 0,
      activo: true,
      atributos: [{ tipo: 'color', valor: '' }],
      stock: [
        {
          sucursal_id: '',
          cantidad: 0,
          cantidad_minima: 0,
          deposito: '',
          pasillo: '',
          estante: '',
          sector: '',
          codigo_ubicacion: '',
          ubicacion_referencia: '',
        },
      ],
      imagenes: [],
      ofertas: [],
      lotes: [],
    });
    // Activar la nueva pestaña
    setActiveTab(fields.length);
  };

  const handleRemove = (index: number) => {
    remove(index);
    // Si eliminamos la pestaña activa o una anterior, ajustamos
    setActiveTab((prev) => {
      if (fields.length === 1) return 0;
      if (index <= prev) return Math.max(0, prev - 1);
      return prev;
    });
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-[#041627]">
          <Layers size={18} className="text-purple-600" />
          <h3 className="font-semibold text-lg">Variantes del Producto</h3>
        </div>
        <button
          type="button"
          onClick={handleAppend}
          className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-sm transition-colors font-medium text-sm border border-purple-200"
        >
          <Plus size={16} /> Agregar Variante
        </button>
      </div>

      {fields.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8 bg-[#fbf9fa] border border-dashed border-[#c4c6cd] rounded-sm">
          Habilite las variantes en la configuración del producto para agregar talles, colores, etc.
        </p>
      ) : (
        <>
          {/* ── Tab Bar ── */}
          <div className="flex items-end gap-1 border-b border-[#c4c6cd] overflow-x-auto pb-0">
            {fields.map((field, index) => {
              const sku = watch(`variantes.${index}.sku`);
              const isActive = watch(`variantes.${index}.activo`);
              const isSelected = activeTab === index;

              return (
                <button
                  key={field.id}
                  type="button"
                  onClick={() => setActiveTab(index)}
                  className={`
                    relative flex items-center gap-2 px-4 py-2 text-[13px] font-medium whitespace-nowrap
                    border border-b-0 rounded-t-sm transition-colors shrink-0
                    ${isSelected
                      ? 'bg-white border-[#c4c6cd] text-[#041627] -mb-px z-10'
                      : 'bg-[#fbf9fa] border-transparent text-[#595f66] hover:text-[#041627] hover:bg-[#f0eef1]'
                    }
                  `}
                >
                  {/* Indicador activo/inactivo */}
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${isActive ? 'bg-green-500' : 'bg-gray-300'}`}
                  />
                  <span>{sku?.trim() ? sku : `Variante #${index + 1}`}</span>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(index);
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleRemove(index)}
                    className="ml-1 text-red-400 hover:text-red-600 transition-colors"
                    title="Eliminar variante"
                  >
                    <Trash2 size={13} />
                  </span>
                </button>
              );
            })}
          </div>

          {/* ── Tab Content ── */}
          {fields.map((field, index) => {
            if (index !== activeTab) return null;
            const isActive = watch(`variantes.${index}.activo`);

            return (
              <div key={field.id} className="p-5 border border-t-0 border-[#c4c6cd] bg-white">
                {/* Header de la variante */}
                <div className="flex items-center justify-between mb-6">
                  <h4 className="font-medium text-[#041627] text-base">
                    {watch(`variantes.${index}.sku`)?.trim()
                      ? watch(`variantes.${index}.sku`)
                      : `Variante #${index + 1}`}
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[#44474c]">Activa</span>
                    <Toggle
                      checked={isActive}
                      onChange={(val) => setValue(`variantes.${index}.activo`, val)}
                    />
                  </div>
                </div>

                {/* SKU + Precio Extra */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <InputFormField
                    label="SKU"
                    name={`variantes.${index}.sku`}
                    registration={register(`variantes.${index}.sku`, { required: 'Requerido' })}
                    placeholder="Ej: REM-ROJ-M"
                  />
                  <InputFormField
                    label="Precio Extra"
                    name={`variantes.${index}.precio_extra`}
                    type="number"
                    prefix="$"
                    registration={register(`variantes.${index}.precio_extra`, { valueAsNumber: true })}
                    placeholder="0.00"
                  />
                </div>

                {/* Atributos */}
                <AtributosSection variantIndex={index} atributosCategoria={atributosCategoria} />

                {/* Stock, Imágenes, Ofertas, Lotes */}
                <div className="mt-6 space-y-6 border-t border-[#efedef] pt-6">
                  <StockSection namePrefix={`variantes.${index}.stock`} sucursales={sucursales} />
                  <ImagenesSection namePrefix={`variantes.${index}.imagenes`} />
                  <OfertasSection namePrefix={`variantes.${index}.ofertas`} />
                  {tieneVencimiento && (
                    <LotesSection namePrefix={`variantes.${index}.lotes`} />
                  )}
                </div>
              </div>
            );
          })}
        </>
      )}
    </Card>
  );
}

// ── AtributosSection (sin cambios) ────────────────────────────────────────────

function AtributosSection({
  variantIndex,
  atributosCategoria,
}: {
  variantIndex: number;
  atributosCategoria: any[];
}) {
  const { control, register, setValue } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: `variantes.${variantIndex}.atributos`,
  });

  if (atributosCategoria && atributosCategoria.length > 0) {
    return (
      <div className="bg-[#fbf9fa] p-4 rounded-sm border border-[#efedef]">
        <div className="mb-3">
          <span className="text-sm font-medium text-[#041627]">
            Atributos Requeridos por la Categoría
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {atributosCategoria.map((attr, attrIndex) => {
            setValue(`variantes.${variantIndex}.atributos.${attrIndex}.tipo`, attr.nombre);
            return (
              <div key={attr.id || attrIndex} className="flex flex-col gap-1">
                <label className="text-[12px] font-medium text-gray-600">
                  {attr.nombre} {attr.requerido && <span className="text-red-500">*</span>}
                </label>
                <InputFormField
                  label=""
                  name={`variantes.${variantIndex}.atributos.${attrIndex}.valor`}
                  registration={register(
                    `variantes.${variantIndex}.atributos.${attrIndex}.valor`,
                    { required: attr.requerido ? 'Este campo es obligatorio' : false }
                  )}
                  placeholder={`Ej: Escriba el ${attr.nombre.toLowerCase()}...`}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#fbf9fa] p-4 rounded-sm border border-[#efedef]">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-[#041627]">Atributos Personalizados</span>
        <button
          type="button"
          onClick={() => append({ tipo: 'color', valor: '' })}
          className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
        >
          <Plus size={14} /> Añadir Atributo
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {fields.map((field, attrIndex) => (
          <div key={field.id} className="flex gap-2 items-start">
            <InputFormField
              label=""
              name={`variantes.${variantIndex}.atributos.${attrIndex}.tipo`}
              type="select"
              registration={register(`variantes.${variantIndex}.atributos.${attrIndex}.tipo`)}
              options={['color', 'talle', 'sabor', 'material', 'peso', 'capacidad']}
            />
            <InputFormField
              label=""
              name={`variantes.${variantIndex}.atributos.${attrIndex}.valor`}
              registration={register(`variantes.${variantIndex}.atributos.${attrIndex}.valor`)}
              placeholder="Valor (Ej: Rojo, L)"
            />
            <button
              type="button"
              onClick={() => remove(attrIndex)}
              className="mt-2 text-red-500 hover:text-red-700"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
