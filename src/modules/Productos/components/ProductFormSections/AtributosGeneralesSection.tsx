import { useEffect } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { Card } from '../FormComponents';
import { InputFormField } from '../InputFormField';
import { ListFilter } from 'lucide-react';

interface Props {
  atributosCategoria?: any[];
}

export function AtributosGeneralesSection({ atributosCategoria = [] }: Props) {
  const { control, register, getValues } = useFormContext();
  const { fields, replace } = useFieldArray({
    control,
    name: 'atributos',
  });

  useEffect(() => {
    if (atributosCategoria && atributosCategoria.length > 0) {
      const currentAttrs = getValues('atributos') || [];
      // Sincronizar los atributos del formulario con las definiciones de la categoría activa
      const newAttrs = atributosCategoria.map((catAttr) => {
        const existing = currentAttrs.find((a: any) => a.tipo === catAttr.nombre);
        return {
          tipo: catAttr.nombre,
          valor: existing ? existing.valor : '',
        };
      });
      replace(newAttrs);
    } else {
      replace([]);
    }
  }, [atributosCategoria, replace]);

  if (!atributosCategoria || atributosCategoria.length === 0) {
    return null;
  }

  return (
    <Card>
      <div className="flex items-center gap-2 text-[#041627] mb-4">
        <ListFilter size={18} className="text-blue-600" />
        <h3 className="font-semibold text-lg">Especificaciones del Producto ({atributosCategoria[0]?.categoria?.nombre || 'Categoría'})</h3>
      </div>

      <div className="bg-[#fbf9fa] p-5 rounded-sm border border-[#efedef]">
        <div className="mb-4">
          <span className="text-sm font-medium text-gray-700">
            Ingresa las especificaciones requeridas para esta categoría:
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {fields.map((field, index) => {
            const catAttr = atributosCategoria[index];
            const nombreAttr = field.tipo;
            const esRequerido = catAttr?.requerido ?? false;

            return (
              <div key={field.id} className="flex flex-col gap-1">
                <label className="text-sm font-medium text-[#44474c] mb-1">
                  {nombreAttr} {esRequerido && <span className="text-red-500">*</span>}
                </label>
                <InputFormField
                  label=""
                  name={`atributos.${index}.valor`}
                  registration={register(`atributos.${index}.valor`, {
                    required: esRequerido ? 'Este campo es obligatorio' : false,
                  })}
                  placeholder={`Ej: Escriba el ${nombreAttr.toLowerCase()}...`}
                />
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
