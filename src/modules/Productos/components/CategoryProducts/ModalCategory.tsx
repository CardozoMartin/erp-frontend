import { X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import {
  useGetAllProductCategoriesActives,
  usePostCategoryProduct,
  usePutProductCategory,
} from '../../hooks/useProductCategory';

import { useEffect } from 'react';
import { useCategoryStore } from '../../store/useStoreCategoryProducts';
import type { IProductoCategory } from '../../types/producto.category.type';
import { InputFormField } from '../InputFormField';

const COLORS = [
  { value: '#1a73e8', label: 'Azul' },
  { value: '#0f9d58', label: 'Verde' },
  { value: '#f4b400', label: 'Amarillo' },
  { value: '#e53935', label: 'Rojo' },
  { value: '#e65100', label: 'Naranja' },
  { value: '#212121', label: 'Negro' },
  { value: '#8e24aa', label: 'Morado' },
];

interface ModalCategoryProps {
  isActive: boolean;
  onClose: () => void;
}

const ModalCategory = ({ isActive, onClose }: ModalCategoryProps) => {
  //Zustand store
  const { category } = useCategoryStore();

  //TQuery--------------------------------------------
  const { mutate: createCategoryMutation, isPending } = usePostCategoryProduct();
  const { mutate: updateCategoryMutation } = usePutProductCategory(
    Number(category?.id ?? 0)
  );
  const { data: categoriesData } = useGetAllProductCategoriesActives(1, 100);
  const productCategories = Array.isArray(categoriesData)
    ? categoriesData
    : categoriesData?.data && Array.isArray(categoriesData.data)
      ? categoriesData.data
      : [];

  //RHF------------------------------------------
  const {
    register,
    formState: { errors },
    setValue,
    watch,
    handleSubmit: RHFSubmit,
  } = useForm({
    defaultValues: {
      nombre: '',
      descripcion: '',
      color_identificador: COLORS[0].value,
      padre_id: '',
    },
  });

  //Si cateogry existe y esta para editar cargamos los datos en los campos
  useEffect(() => {
    if (category) {
      // Modo edición: cargar los datos de la categoría en el formulario
      setValue('nombre', category.name || '');
      setValue('descripcion', category.description || '');
      setValue('color_identificador', category.color_identificador || COLORS[0].value);
      setValue('padre_id', category.padre_id ? String(category.padre_id) : '');
    } else {
      // Modo nuevo: limpiar el formulario
      setValue('nombre', '');
      setValue('descripcion', '');
      setValue('color_identificador', COLORS[0].value);
      setValue('padre_id', '');
    }
  }, [category, setValue]);

  const watchedColor = watch('color_identificador');
  const watchedNombre = watch('nombre');

  //Handlers-------------------------------
  const handleSubmit = (formData: any) => {
    const data: IProductoCategory = {
      nombre: formData.nombre,
      descripcion: formData.descripcion,
      color_identificador: formData.color_identificador,
      padre_id: formData.padre_id ? Number(formData.padre_id) : undefined,
    };

    if (category) {
      //Si category existe, estamos editando, por lo que llamamos a la mutacion de update
      updateCategoryMutation(data);
    } else {
      //Si no existe category, estamos creando una nueva categoria, por lo que llamamos a la mutacion de create
      createCategoryMutation(data);
    }
  };

  if (!isActive) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-sm shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-[15px] font-semibold text-[#041627]">
            {category ? 'Editar Categoría' : 'Nueva Categoría'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form className="px-6 py-5 flex flex-col gap-4" onSubmit={RHFSubmit(handleSubmit)}>
          {/* Nombre */}
          <div className="flex flex-col gap-1.5">
            <InputFormField
              label="Nombre del Producto"
              name="nombre"
              registration={register('nombre', { required: 'El nombre es obligatorio' })}
              error={errors.nombre?.message as string}
              placeholder="Ej: Taladro Inalámbrico XYZ"
            />
          </div>

          {/* Padre */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-[#041627]">Categoría Padre</label>
            <select
              {...register('padre_id')}
              className="border border-gray-300 rounded-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccionar categoría padre</option>
              {productCategories?.map((category: any) => (
                <option key={category.id} value={category.id}>
                  {category.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Descripción */}
          <div className="flex flex-col gap-1.5">
            <InputFormField
              label="Descripción"
              name="descripcion"
              type="textarea"
              registration={register('descripcion')}
              placeholder="Descripción detallada del producto..."
              rows={4}
            />
          </div>

          {/* Color Identificador */}
          <div className="flex flex-col gap-2">
            <label className="text-[12px] font-medium text-[#041627]">Color Identificador</label>
            <div className="flex items-center gap-2">
              {COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  title={color.label}
                  onClick={() => setValue('color_identificador', color.value)}
                  className="w-7 h-7 rounded-sm cursor-pointer transition-transform hover:scale-110"
                  style={{
                    backgroundColor: color.value,
                    outline:
                      watchedColor === color.value
                        ? `2px solid ${color.value}`
                        : '2px solid transparent',
                    outlineOffset: '2px',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-[12px] font-medium tracking-wide text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
            >
              CANCELAR
            </button>
            <button
              type="submit"
              disabled={isPending || !watchedNombre.trim()}
              className="px-5 py-2 text-[12px] font-medium tracking-wide bg-[#1a73e8] hover:bg-[#1557b0] disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-sm transition-colors cursor-pointer"
            >
              GUARDAR CATEGORÍA
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalCategory;
