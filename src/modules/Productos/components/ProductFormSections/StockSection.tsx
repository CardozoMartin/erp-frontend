import { PackageSearch, Plus, Trash2 } from 'lucide-react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { Card } from '../FormComponents';
import { InputFormField } from '../InputFormField';
import { DEPOSITOS } from '../constants';

interface Props {
  namePrefix: string;
}

export function StockSection({ namePrefix }: Props) {
  const { control, register } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: namePrefix,
  });

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-[#041627]">
          <PackageSearch size={16} className="text_color" />
          <h3 className="font-medium">Stock por Sucursal</h3>
        </div>
        <button
          type="button"
          onClick={() => append({ sucursal_id: DEPOSITOS[0], cantidad: 0, cantidad_minima: 0 })}
          className="flex items-center gap-1 text-sm text_color hover:text-blue-700 font-medium cursor-pointer transition-colors"
        >
          <Plus size={16} /> Agregar Sucursal
        </button>
      </div>

      <div className="space-y-4">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="flex gap-4 items-start p-4 border border-[#efedef] rounded-sm bg-[#fbf9fa]"
          >
            <div className="flex-1 grid grid-cols-3 gap-4">
              <InputFormField
                label="Sucursal"
                name={`${namePrefix}.${index}.sucursal_id`}
                type="select"
                registration={register(`${namePrefix}.${index}.sucursal_id`)}
                options={DEPOSITOS}
              />
              <InputFormField
                label="Cantidad"
                name={`${namePrefix}.${index}.cantidad`}
                type="number"
                registration={register(`${namePrefix}.${index}.cantidad`, { valueAsNumber: true })}
              />
              <InputFormField
                label="Cantidad Mínima"
                name={`${namePrefix}.${index}.cantidad_minima`}
                type="number"
                registration={register(`${namePrefix}.${index}.cantidad_minima`, {
                  valueAsNumber: true,
                })}
              />
            </div>
            {fields.length > 1 && (
              <button
                type="button"
                onClick={() => remove(index)}
                className="mt-6 p-2 text-red-500 hover:bg-red-50 rounded-sm transition-colors"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
