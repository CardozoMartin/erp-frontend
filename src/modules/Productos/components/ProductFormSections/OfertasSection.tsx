import { Tag, Plus, Trash2 } from 'lucide-react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { Card, Toggle } from '../FormComponents';
import { InputFormField } from '../InputFormField';

interface Props {
  namePrefix: string;
}

export function OfertasSection({ namePrefix }: Props) {
  const { control, register, watch, setValue } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: namePrefix,
  });

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-[#041627]">
          <Tag size={16} className="text-green-600" />
          <h3 className="font-medium">Ofertas y Descuentos</h3>
        </div>
        <button
          type="button"
          onClick={() => append({ precio_oferta: 0, fecha_inicio: '', fecha_fin: '', activo: true })}
          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          <Plus size={16} /> Agregar Oferta
        </button>
      </div>

      <div className="space-y-4">
        {fields.map((field, index) => {
          const isActive = watch(`${namePrefix}.${index}.activo`);
          return (
            <div key={field.id} className="flex gap-4 items-start p-4 border border-[#efedef] rounded-sm bg-[#fbf9fa]">
              <div className="flex-1 grid grid-cols-4 gap-4">
                <InputFormField
                  label="Precio Oferta"
                  name={`${namePrefix}.${index}.precio_oferta`}
                  type="number"
                  prefix="$"
                  registration={register(`${namePrefix}.${index}.precio_oferta`, { valueAsNumber: true })}
                />
                <InputFormField
                  label="Inicio"
                  name={`${namePrefix}.${index}.fecha_inicio`}
                  type="text"
                  placeholder="YYYY-MM-DD"
                  registration={register(`${namePrefix}.${index}.fecha_inicio`)}
                />
                <InputFormField
                  label="Fin"
                  name={`${namePrefix}.${index}.fecha_fin`}
                  type="text"
                  placeholder="YYYY-MM-DD"
                  registration={register(`${namePrefix}.${index}.fecha_fin`)}
                />
                <div className="flex flex-col gap-2">
                  <label className="text-[13px] font-medium text-[#44474c] tracking-wide">Activo</label>
                  <Toggle
                    checked={isActive}
                    onChange={(val) => setValue(`${namePrefix}.${index}.activo`, val)}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => remove(index)}
                className="mt-6 p-2 text-red-500 hover:bg-red-50 rounded-sm transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>
          );
        })}
        {fields.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">No hay ofertas configuradas.</p>
        )}
      </div>
    </Card>
  );
}
