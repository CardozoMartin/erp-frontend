import { Calendar, Plus, Trash2 } from 'lucide-react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { Card } from '../FormComponents';
import { InputFormField } from '../InputFormField';
import { DEPOSITOS } from '../constants';

interface Props {
  namePrefix: string;
}

export function LotesSection({ namePrefix }: Props) {
  const { control, register } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: namePrefix,
  });

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-[#041627]">
          <Calendar size={16} className="text-red-500" />
          <h3 className="font-medium">Lotes y Vencimientos</h3>
        </div>
        <button
          type="button"
          onClick={() => append({ sucursal_id: DEPOSITOS[0], numero_lote: '', fecha_vencimiento: '', cantidad: 0 })}
          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          <Plus size={16} /> Agregar Lote
        </button>
      </div>

      <div className="space-y-4">
        {fields.map((field, index) => (
          <div key={field.id} className="flex gap-4 items-start p-4 border border-[#efedef] rounded-sm bg-[#fbf9fa]">
            <div className="flex-1 grid grid-cols-4 gap-4">
              <InputFormField
                label="Sucursal"
                name={`${namePrefix}.${index}.sucursal_id`}
                type="select"
                registration={register(`${namePrefix}.${index}.sucursal_id`)}
                options={DEPOSITOS}
              />
              <InputFormField
                label="Nº de Lote"
                name={`${namePrefix}.${index}.numero_lote`}
                registration={register(`${namePrefix}.${index}.numero_lote`, { required: 'Requerido' })}
                placeholder="Ej: LOTE-001"
              />
              <InputFormField
                label="Vencimiento"
                name={`${namePrefix}.${index}.fecha_vencimiento`}
                type="text"
                registration={register(`${namePrefix}.${index}.fecha_vencimiento`, { required: 'Requerido' })}
                placeholder="YYYY-MM-DD"
              />
              <InputFormField
                label="Cantidad"
                name={`${namePrefix}.${index}.cantidad`}
                type="number"
                registration={register(`${namePrefix}.${index}.cantidad`, { valueAsNumber: true })}
              />
            </div>
            <button
              type="button"
              onClick={() => remove(index)}
              className="mt-6 p-2 text-red-500 hover:bg-red-50 rounded-sm transition-colors"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
        {fields.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">No hay lotes configurados.</p>
        )}
      </div>
    </Card>
  );
}
