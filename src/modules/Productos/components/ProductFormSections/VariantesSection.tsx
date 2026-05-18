import { Layers, Plus, Trash2 } from 'lucide-react';
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
}

export function VariantesSection({ tieneVencimiento, sucursales }: Props) {
  const { control, register, watch, setValue } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'variantes',
  });

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-[#041627]">
          <Layers size={18} className="text-purple-600" />
          <h3 className="font-semibold text-lg">Variantes del Producto</h3>
        </div>
        <button
          type="button"
          onClick={() => append({
            sku: '',
            precio_extra: 0,
            activo: true,
            atributos: [{ tipo: 'color', valor: '' }],
            stock: [{ sucursal_id: '', cantidad: 0, cantidad_minima: 0 }],
            imagenes: [],
            ofertas: [],
            lotes: []
          })}
          className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-sm transition-colors font-medium text-sm border border-purple-200"
        >
          <Plus size={16} /> Agregar Variante
        </button>
      </div>

      <div className="space-y-8">
        {fields.map((field, index) => {
          const isActive = watch(`variantes.${index}.activo`);
          return (
            <div key={field.id} className="p-5 border border-[#c4c6cd] rounded-sm bg-white shadow-sm relative">
              <div className="absolute top-4 right-4 flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[#44474c]">Activa</span>
                  <Toggle
                    checked={isActive}
                    onChange={(val) => setValue(`variantes.${index}.activo`, val)}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-sm transition-colors"
                  title="Eliminar variante"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <h4 className="font-medium text-[#041627] mb-4 text-base">Variante #{index + 1}</h4>

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

              {/* Nested Atributos */}
              <AtributosSection variantIndex={index} />

              <div className="mt-8 space-y-6 border-t border-[#efedef] pt-6">
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
        {fields.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-8 bg-[#fbf9fa] border border-dashed border-[#c4c6cd] rounded-sm">
            Habilite las variantes en la configuración del producto para agregar talles, colores, etc.
          </p>
        )}
      </div>
    </Card>
  );
}

function AtributosSection({ variantIndex }: { variantIndex: number }) {
  const { control, register } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: `variantes.${variantIndex}.atributos`,
  });

  return (
    <div className="bg-[#fbf9fa] p-4 rounded-sm border border-[#efedef]">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-[#041627]">Atributos</span>
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
