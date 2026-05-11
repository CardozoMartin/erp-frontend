import { DollarSign, History, Info, Plus, Printer, Save, X } from 'lucide-react';
import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import '../../../index.css';
import { usePostProducts } from '../hooks/useProducts';
import type { IProducto } from '../types/productos.type';
import ModalCategory from './CategoryProducts/ModalCategory';
import { Card, Input, Label, Toggle } from './FormComponents';
import { InputFormField } from './InputFormField';
import { ImagenesSection } from './ProductFormSections/ImagenesSection';
import { LotesSection } from './ProductFormSections/LotesSection';
import { OfertasSection } from './ProductFormSections/OfertasSection';
import { StockSection } from './ProductFormSections/StockSection';
import { VariantesSection } from './ProductFormSections/VariantesSection';
import { CATEGORIAS, UNIDADES } from './constants';

const defaultProductValues = {
  nombre: '',
  codigo_barras: '',
  descripcion: '',
  precio_base: '',
  unidad_venta: 'UNIDAD',
  activo: true,
  activo_pos: true,
  activo_web: false,
  tiene_variantes: false,
  tiene_vencimiento: false,
  es_fraccionable: false,
  categoria_id: null,
  stock: [{ sucursal_id: null, cantidad: 0, cantidad_minima: 0 }],
  variantes: [],
  imagenes: [],
  lotes: [],
  ofertas: [],
};

export default function ProductForm() {
  const navigate = useNavigate();
  const [showModalCategory, setShowModalCategory] = useState(false);

  //TQUERY---------------------------------------
  const { mutate: postProducto } = usePostProducts();

  //RHF--------------------------------------------
  const methods = useForm({ defaultValues: defaultProductValues });
  const {
    register,
    watch,
    setValue,
    formState: { errors },
    handleSubmit: RHFOnSubmit,
  } = methods;

  //watch para mostrar/ocultar secciones según opciones seleccionadas
  const watchedTieneVariantes = watch('tiene_variantes');
  const watchedTieneVencimiento = watch('tiene_vencimiento');
  const watchedActivoPos = watch('activo_pos');
  const watchedActivoWeb = watch('activo_web');
  const watchedActivo = watch('activo');

  //Handlers --------------------------------------
  const handleSubmit = (formData: any) => {
    const data: IProducto = {
      ...formData,
      precio_base: formData.precio_base ? Number(formData.precio_base) : 0,
    };
    postProducto(data);
  };

  const handlerModalCategory = (): void => {
    setShowModalCategory((prev) => !prev);
  };

  return (
    <>
      <FormProvider {...methods}>
        {/* ── Header ── */}
        <header className=" top-16 z-10 bg-[#fbf9fa] border-b border-[#c4c6cd] px-6 py-3 flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight text-[#041627]">
            Añadir Nuevo Producto
          </h2>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-2 text-[13px] font-medium tracking-wide border bg-red-600 border-[#f33333] text-[#ffffff] rounded-sm hover:bg-[#cc0505] transition-colors cursor-pointer flex items-center gap-1"
            >
              Cancelar
              <X size={15} />
            </button>
            <button
              type="submit"
              form="product-form"
              className="px-6 py-2 text-[13px] font-medium tracking-wide bg-[#075E54] hover:bg-[#1e8e4f] text-white rounded-sm hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-1"
            >
              Guardar Producto
              <Save size={15} />
            </button>
            <div className="w-px h-8 bg-[#c4c6cd]" />
            <button
              type="button"
              className="p-2 text-[#595f66] hover:text-[#041627] hover:bg-[#DCF8C6] transition-colors cursor-pointer"
            >
              <History size={20} />
            </button>
            <button
              type="button"
              className="p-2 text-[#595f66] hover:text-[#041627] hover:bg-[#DCF8C6] transition-colors cursor-pointer"
            >
              <Printer size={20} />
            </button>
          </div>
        </header>

        <form
          id="product-form"
          className="max-w-[1280px] mx-auto px-6 py-6 flex flex-col gap-6 "
          onSubmit={RHFOnSubmit(handleSubmit)}
        >
          {/* ── Información Básica ── */}
          <Card>
            <div className="flex items-center gap-2 text-[#041627] mb-6">
              <Info />
              <h3 className="text-lg font-semibold">Información Básica</h3>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <InputFormField
                label="Nombre del Producto"
                name="nombre"
                registration={register('nombre', { required: 'El nombre es obligatorio' })}
                error={errors.nombre?.message as string}
                placeholder="Ej: Taladro Inalámbrico XYZ"
              />
              <InputFormField
                label="Código de Barras"
                name="codigo_barras"
                registration={register('codigo_barras')}
                placeholder="Ej: 7798102030057"
              />
            </div>

            <div className="grid grid-cols-3 gap-6 mb-6">
              {/* Categoría con botón inline */}
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-medium text-gray-600">Categoría</label>
                <div className="flex items-center gap-1.5">
                  <select
                    {...register('categoria_id', { required: 'La categoría es obligatoria' })}
                    className="flex-1 h-9 border border-gray-200 rounded-sm px-2 text-[13px]"
                  >
                    {CATEGORIAS.map((categoria: string) => (
                      <option key={categoria} value={categoria}>
                        {categoria}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="h-8 px-2 text-[13px] font-medium  hover:border hover:border-[#111111] text-white rounded-sm flex items-center gap-1 whitespace-nowrap cursor-pointer text_color"
                    onClick={handlerModalCategory}
                  >
                    <Plus size={14} /> Categoría
                  </button>
                </div>
                {errors.categoria_id && (
                  <span className="text-red-500 text-xs">{errors.categoria_id.message}</span>
                )}
              </div>

              {/* Unidad de Medida — sin grid-cols-2 interno innecesario */}
              <InputFormField
                label="Unidad de Medida"
                name="unidad_venta"
                type="select"
                registration={register('unidad_venta', { required: 'La unidad es obligatoria' })}
                error={errors.unidad_venta?.message as string}
                options={UNIDADES}
              />

              {/* Toggle */}
              <div className="flex flex-col justify-center gap-2 px-4 border border-[#efedef] rounded-sm bg-[#fbf9fa]">
                <div className="flex justify-between items-center">
                  <span className="text-[13px] font-medium tracking-wide text-[#041627]">
                    Estado General Activo
                  </span>
                  <Toggle checked={watchedActivo} onChange={(val) => setValue('activo', val)} />
                </div>
              </div>
            </div>

            <InputFormField
              label="Descripción"
              name="descripcion"
              type="textarea"
              registration={register('descripcion')}
              placeholder="Descripción detallada del producto..."
              rows={4}
            />
          </Card>

          <div className="grid grid-cols-2 gap-6">
            {/* Precios y Canales */}
            <Card>
              <div className="flex items-center gap-2 text-[#041627] mb-6">
                <DollarSign className="text_color" />
                <h3 className="text-lg font-semibold">Precios y Canales</h3>
              </div>
              <div className="flex flex-col gap-6">
                <div>
                  <Label>Precio Base Regular</Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#595f66] text-sm">
                      $
                    </span>
                    <Input
                      type="number"
                      className="pl-8"
                      placeholder="0.00"
                      {...register('precio_base', { valueAsNumber: true })}
                    />
                  </div>
                </div>

                <div className="p-4 border border-[#efedef] rounded-sm bg-[#fbf9fa] flex flex-col gap-4">
                  <h4 className="text-sm font-semibold text-[#041627]">
                    Disponibilidad en Canales
                  </h4>
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-medium tracking-wide text-[#44474c]">
                      Punto de Venta (POS)
                    </span>
                    <Toggle
                      checked={watchedActivoPos}
                      onChange={(val) => setValue('activo_pos', val)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-medium tracking-wide text-[#44474c]">
                      Tienda Online (Web)
                    </span>
                    <Toggle
                      checked={watchedActivoWeb}
                      onChange={(val) => setValue('activo_web', val)}
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Configuraciones Generales */}
            <Card>
              <div className="flex items-center gap-2 text-[#041627] mb-6">
                <span className="material-symbols-outlined text-orange-500">settings</span>
                <h3 className="text-lg font-semibold">Configuración Avanzada</h3>
              </div>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between p-3 border border-[#efedef] rounded-sm bg-[#fbf9fa]">
                  <div>
                    <h4 className="text-sm font-semibold text-[#041627]">¿Tiene Variantes?</h4>
                    <p className="text-xs text-[#595f66] mt-1">Colores, talles, sabores, etc.</p>
                  </div>
                  <Toggle
                    checked={watchedTieneVariantes}
                    onChange={(val) => setValue('tiene_variantes', val)}
                    dark
                  />
                </div>

                <div className="flex items-center justify-between p-3 border border-[#efedef] rounded-sm bg-[#fbf9fa]">
                  <div>
                    <h4 className="text-sm font-semibold text-[#041627]">¿Controla Vencimiento?</h4>
                    <p className="text-xs text-[#595f66] mt-1">Habilita la gestión de lotes</p>
                  </div>
                  <Toggle
                    checked={watchedTieneVencimiento}
                    onChange={(val) => setValue('tiene_vencimiento', val)}
                    dark
                  />
                </div>

                <div className="flex items-center justify-between p-3 border border-[#efedef] rounded-sm bg-[#fbf9fa]">
                  <div>
                    <h4 className="text-sm font-semibold text-[#041627]">¿Es Fraccionable?</h4>
                    <p className="text-xs text-[#595f66] mt-1">
                      Permite venta en decimales (ej. 1.5 kg)
                    </p>
                  </div>
                  <Toggle
                    checked={watch('es_fraccionable')}
                    onChange={(val) => setValue('es_fraccionable', val)}
                    dark
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* Imágenes Generales del Producto */}
          {!watchedTieneVariantes && <ImagenesSection namePrefix="imagenes" />}

          {/* Si NO tiene variantes, gestionamos Stock y Ofertas de forma general */}
          {!watchedTieneVariantes && (
            <>
              <StockSection namePrefix="stock" />
              <OfertasSection namePrefix="ofertas" />
              {watchedTieneVencimiento && <LotesSection namePrefix="lotes" />}
            </>
          )}

          {/* Si TIENE variantes, mostramos el gestor de variantes que incluye sus propios atributos, stock, imagenes, ofertas y lotes */}
          {watchedTieneVariantes && <VariantesSection tieneVencimiento={watchedTieneVencimiento} />}
        </form>
      </FormProvider>

      {/* Modal para gestión de categorías (placeholder) */}
      {showModalCategory && (
        <ModalCategory isActive={showModalCategory} onClose={handlerModalCategory} />
      )}
    </>
  );
}
