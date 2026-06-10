import { PackageSearch, Plus, Trash2 } from 'lucide-react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { Card } from '../FormComponents';
import { InputFormField } from '../InputFormField';

interface Props {
  namePrefix: string;
  sucursales?: any[];
}

const emptyStockRow = {
  sucursal_id: '',
  cantidad: 0,
  cantidad_minima: 0,
  deposito: '',
  pasillo: '',
  estante: '',
  sector: '',
  codigo_ubicacion: '',
  ubicacion_referencia: '',
};

export function StockSection({ namePrefix, sucursales }: Props) {
  const { control, register } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: namePrefix,
  });

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[#041627]">
          <PackageSearch size={16} className="text_color" />
          <h3 className="font-medium">Stock</h3>
        </div>
        <button
          type="button"
          onClick={() => append(emptyStockRow)}
          className="flex cursor-pointer items-center gap-1 text-sm font-medium text_color transition-colors hover:text-blue-700"
        >
          <Plus size={16} /> Agregar Stock
        </button>
      </div>

      <div className="space-y-4">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="flex items-start gap-4 rounded-sm border border-[#efedef] bg-[#fbf9fa] p-4"
          >
            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <InputFormField
                  label="Sucursal (opcional)"
                  name={`${namePrefix}.${index}.sucursal_id`}
                  type="select"
                  registration={register(`${namePrefix}.${index}.sucursal_id`)}
                  options={(sucursales ?? []).map((sucursal) => ({
                    value: sucursal.id,
                    label: sucursal.nombre,
                  }))}
                  emptyLabel="Stock general"
                />
                <InputFormField
                  label="Cantidad"
                  name={`${namePrefix}.${index}.cantidad`}
                  type="number"
                  registration={register(`${namePrefix}.${index}.cantidad`, {
                    valueAsNumber: true,
                  })}
                />
                <InputFormField
                  label="Cantidad Minima"
                  name={`${namePrefix}.${index}.cantidad_minima`}
                  type="number"
                  registration={register(`${namePrefix}.${index}.cantidad_minima`, {
                    valueAsNumber: true,
                  })}
                />
              </div>

              <div className="rounded-sm border border-[#d8dee6] bg-white p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h4 className="text-[12px] font-bold uppercase tracking-wide text-[#041627]">
                    Deposito y ubicacion
                  </h4>
                  <span className="text-[11px] font-medium text-[#595f66]">
                    Datos visibles en el POS
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <InputFormField
                    label="Deposito"
                    name={`${namePrefix}.${index}.deposito`}
                    registration={register(`${namePrefix}.${index}.deposito`)}
                    placeholder="Ej: Deposito principal"
                  />
                  <InputFormField
                    label="Pasillo"
                    name={`${namePrefix}.${index}.pasillo`}
                    registration={register(`${namePrefix}.${index}.pasillo`)}
                    placeholder="Ej: Pasillo 3"
                  />
                  <InputFormField
                    label="Estante"
                    name={`${namePrefix}.${index}.estante`}
                    registration={register(`${namePrefix}.${index}.estante`)}
                    placeholder="Ej: Estante B"
                  />
                  <InputFormField
                    label="Sector"
                    name={`${namePrefix}.${index}.sector`}
                    registration={register(`${namePrefix}.${index}.sector`)}
                    placeholder="Ej: Fondo / frio"
                  />
                  <InputFormField
                    label="Codigo ubicacion"
                    name={`${namePrefix}.${index}.codigo_ubicacion`}
                    registration={register(`${namePrefix}.${index}.codigo_ubicacion`)}
                    placeholder="Ej: A3-B2"
                  />
                  <InputFormField
                    label="Referencia"
                    name={`${namePrefix}.${index}.ubicacion_referencia`}
                    registration={register(`${namePrefix}.${index}.ubicacion_referencia`)}
                    placeholder="Ej: Al final, mano derecha"
                  />
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => remove(index)}
              className="mt-6 rounded-sm p-2 text-red-500 transition-colors hover:bg-red-50"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
        {fields.length === 0 && (
          <p className="rounded-sm border border-dashed border-[#c4c6cd] bg-[#fbf9fa] py-4 text-center text-sm text-gray-500">
            Este producto no gestiona stock o es un servicio.
          </p>
        )}
      </div>
    </Card>
  );
}
