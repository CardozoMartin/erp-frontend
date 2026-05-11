import { Image as ImageIcon, Plus, Trash2 } from 'lucide-react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { Card } from '../FormComponents';
import { InputFormField } from '../InputFormField';

interface Props {
  namePrefix: string; // e.g., 'imagenes' or 'variantes.0.imagenes'
}

export function ImagenesSection({ namePrefix }: Props) {
  const { control, register } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: namePrefix,
  });

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-[#041627]">
          <ImageIcon size={16} className="text_color" />
          <h3 className="font-medium">Imágenes</h3>
        </div>
        <button
          type="button"
          onClick={() =>
            append({ rol: 'GALERIA', url: '', alt_text: '', orden: fields.length + 1 })
          }
          className="flex items-center gap-1 text-sm text_color hover:text-blue-700 font-medium cursor-pointer transition-colors"
        >
          <Plus size={16} /> Agregar
        </button>
      </div>

      <div className="space-y-4">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="flex gap-4 items-start p-4 border border-[#efedef] rounded-sm bg-[#fbf9fa]"
          >
            <div className="flex-1 grid grid-cols-2 gap-4">
              <InputFormField
                label="URL de Imagen"
                name={`${namePrefix}.${index}.url`}
                registration={register(`${namePrefix}.${index}.url`, { required: 'Requerido' })}
                placeholder="https://..."
              />
              <InputFormField
                label="Rol"
                name={`${namePrefix}.${index}.rol`}
                type="select"
                registration={register(`${namePrefix}.${index}.rol`)}
                options={['PRINCIPAL', 'GALERIA', 'DETALLE', 'BANNER', 'MINIATURA']}
              />
              <InputFormField
                label="Texto Alternativo (Alt)"
                name={`${namePrefix}.${index}.alt_text`}
                registration={register(`${namePrefix}.${index}.alt_text`)}
              />
              <InputFormField
                label="Orden"
                name={`${namePrefix}.${index}.orden`}
                type="number"
                registration={register(`${namePrefix}.${index}.orden`)}
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
          <p className="text-sm text-gray-500 text-center py-4">No hay imágenes configuradas.</p>
        )}
      </div>
    </Card>
  );
}
