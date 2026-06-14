import {
  DollarSign,
  History,
  Info,
  Plus,
  Printer,
  Save,
  Settings,
  ShieldAlert,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';
import '../../../index.css';
import { usePostProducts } from '../hooks/useProducts';
import ModalCategory from './CategoryProducts/ModalCategory';
import { Card, Input, Label, Toggle } from './FormComponents';
import { InputFormField } from './InputFormField';
import { ImagenesSection } from './ProductFormSections/ImagenesSection';
import { LotesSection } from './ProductFormSections/LotesSection';
import { OfertasSection } from './ProductFormSections/OfertasSection';
import { StockSection } from './ProductFormSections/StockSection';
import { VariantesSection } from './ProductFormSections/VariantesSection';
import { AtributosGeneralesSection } from './ProductFormSections/AtributosGeneralesSection';
import { UNIDADES } from './constants';
import { useGetAllProductCategoriesActives } from '../hooks/useProductCategory';
import { useGetSucursales } from '../../Sucursal/hooks/useSucursal';
import type { IProducto, IStock, IImagenLocal } from '../types/productos.type';
import { usePermisos } from '../../../store/usePermisos';
import AlertModal from '../../../components/modals/Permisos/NoAutorizado';

const defaultProductValues = {
  nombre: '',
  codigo_barras: '',
  descripcion: '',
  precio_base: '',
  precio_costo: '',
  precio_venta: '',
  unidad_venta: 'UNIDAD',
  activo: true,
  activo_pos: true,
  activo_web: false,
  tiene_variantes: false,
  tiene_vencimiento: false,
  es_fraccionable: false,
  categoria_id: null,
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
  variantes: [],
  imagenes: [],
  lotes: [],
  ofertas: [],
  atributos: [],
  todas_sucursales: true,
  sucursales_habilitadas_ids: [],
  sucursales_disponibles_ids: [],
};

export default function ProductForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const noActive = location.state?.noActive || false;
  console.log('No active param:', noActive);
  const [showModalCategory, setShowModalCategory] = useState(false);
  const [imagenesLocales, setImagenesLocales] = useState<IImagenLocal[]>([]);
  const [showNoBranchModal, setShowNoBranchModal] = useState(false);
  const { tiene } = usePermisos();
  const puedeVerCosto = tiene('productos.ver_costos');
  const puedeVerMargen = tiene('productos.ver_margenes');

  //validamos que el usuario tenga permisos para crear productos y si no tiene permisos mostramos el modal de no autorizado
  if (!tiene('productos.crear')) {
    return (
      <AlertModal
        isOpen={true}
        onClose={() => setShowNoBranchModal(false)}
        icon={ShieldAlert}
        iconBgColor="bg-red-100"
        iconColor="text-red-600"
        title="Sin permisos"
        description="No tenés autorización para crear productos. Contactá a tu administrador si creés que es un error."
        actions={[
          {
            label: 'Entendido',
            onClick: () => navigate('/productos'),
            variant: 'primary',
          },
        ]}
      />
    );
  }

  const { data: sucursales, isSuccess } = useGetSucursales();
  const sucursalesActivas = sucursales?.data ?? [];
  useEffect(() => {
    if (isSuccess && sucursalesActivas.length === 0) {
      navigate('/productos', {
        replace: true,
        state: { showNoBranchModal: true },
      });
    }
  }, [isSuccess, sucursalesActivas.length, navigate]);

  // TQUERY---------------------------------------
  const { mutate: postProducto } = usePostProducts();
  const { data: categorias } = useGetAllProductCategoriesActives(1, 1000);

  // RHF--------------------------------------------
  const methods = useForm<any>({ defaultValues: defaultProductValues });
  const {
    register,
    watch,
    setValue,
    reset,
    formState: { errors },
    handleSubmit: RHFOnSubmit,
  } = methods;

  // watch para mostrar/ocultar secciones según opciones seleccionadas
  const watchedTieneVariantes = watch('tiene_variantes');
  const watchedTieneVencimiento = watch('tiene_vencimiento');
  const watchedActivoPos = watch('activo_pos');
  const watchedActivoWeb = watch('activo_web');
  const watchedActivo = watch('activo');
  const watchedTodasSucursales = watch('todas_sucursales');
  const watchedSucursalesHabilitadas = watch('sucursales_habilitadas_ids') ?? [];
  const watchedPrecioCosto = Number(watch('precio_costo') || 0);
  const watchedPrecioVenta = Number(watch('precio_venta') || watch('precio_base') || 0);
  const margenGanancia =
    watchedPrecioCosto > 0
      ? Number((((watchedPrecioVenta - watchedPrecioCosto) / watchedPrecioCosto) * 100).toFixed(2))
      : 0;

  const todasLasCategorias = categorias?.data || [];
  // 1.- Escuchar el Id de la categoria selecciona en tiempo real
  const watchedCategoriaId = watch('categoria_id');
  // 2.- Buscar la categoria seleccionada dentro de tu lista cargada de categorias
  const categoriaSeleccionada = todasLasCategorias.find(
    (cat: any) => cat.id === watchedCategoriaId
  );
  // 3. Extraer sus atributos definidos (ej: [{ nombre: 'Sabor' }, { nombre: 'Talle' }])
  const atributosCategoria = categoriaSeleccionada?.atributos || [];

  // Efecto para auto-seleccionar la primera categoría si está vacía en el formulario y evitar desincronización
  useEffect(() => {
    if (todasLasCategorias.length > 0 && !watchedCategoriaId) {
      setValue('categoria_id', todasLasCategorias[0].id);
    }
  }, [todasLasCategorias, watchedCategoriaId, setValue]);

  useEffect(() => {
    const ids = sucursalesActivas.map((sucursal) => sucursal.id);
    setValue('sucursales_disponibles_ids', ids);
    if (ids.length > 0 && watchedSucursalesHabilitadas.length === 0) {
      setValue('sucursales_habilitadas_ids', ids);
    }
  }, [setValue, sucursalesActivas.length]);

  // 4. Determinar si la categoría seleccionada admite variantes
  const permiteVariantes =
    categoriaSeleccionada?.nombre &&
    (/ropa|calzado|indumentaria|vestimenta|prenda|zapatilla|zapato|jean|camisa|remera/i.test(
      categoriaSeleccionada.nombre
    ) ||
      atributosCategoria.some((attr: any) => /talle|talla|color/i.test(attr.nombre)));

  // Forzar tiene_variantes a false si la categoría no lo permite
  useEffect(() => {
    if (!permiteVariantes && watchedTieneVariantes) {
      setValue('tiene_variantes', false);
    }
  }, [permiteVariantes, watchedTieneVariantes, setValue]);

  // Handlers --------------------------------------
  const handleSubmit = (formData: IProducto) => {
    console.log('Datos del formulario antes de enviar:', formData);
    const data: IProducto & { imagenesLocales?: IImagenLocal[] } = {
      ...formData,
      precio_costo: formData.precio_costo ? Number(formData.precio_costo) : 0,
      precio_venta: formData.precio_venta ? Number(formData.precio_venta) : 0,
      precio_base: formData.precio_venta
        ? Number(formData.precio_venta)
        : formData.precio_base
          ? Number(formData.precio_base)
          : 0,
      margen_ganancia: margenGanancia,
      imagenesLocales: imagenesLocales.length > 0 ? imagenesLocales : undefined,
      sucursales_habilitadas_ids: formData.todas_sucursales
        ? sucursalesActivas.map((sucursal) => sucursal.id)
        : formData.sucursales_habilitadas_ids ?? [],
      sucursales_disponibles_ids: sucursalesActivas.map((sucursal) => sucursal.id),
    };

    // Si no hay categoría seleccionada, la eliminamos para evitar error de UUID en backend
    if (!data.categoria_id || data.categoria_id === '') {
      delete (data as Partial<IProducto>).categoria_id;
    }

    if (!data.codigo_barras || data.codigo_barras.trim() === '') {
      delete (data as Partial<IProducto>).codigo_barras;
    }

    // Normalizar stock sin sucursal como stock general antes de enviar.
    const normalizeStock = (stock: IStock[] = []) =>
      stock.map((item) => ({
        ...item,
        sucursal_id: item.sucursal_id || null,
        cantidad: Number(item.cantidad || 0),
        cantidad_minima: Number(item.cantidad_minima || 0),
        deposito: item.deposito?.trim?.() || null,
        pasillo: item.pasillo?.trim?.() || null,
        estante: item.estante?.trim?.() || null,
        sector: item.sector?.trim?.() || null,
        codigo_ubicacion: item.codigo_ubicacion?.trim?.() || null,
        ubicacion_referencia: item.ubicacion_referencia?.trim?.() || null,
      }));

    if (data.stock && data.stock.length > 0) {
      data.stock = normalizeStock(data.stock);
    }

    // Asegurar que precios_extra sean números en variantes
    if (data.variantes && data.variantes.length > 0) {
      data.variantes = data.variantes.map((v: any) => ({
        ...v,
        sku: v.sku?.trim() || undefined,
        precio_extra: v.precio_extra ? Number(v.precio_extra) : 0,
        stock: v.stock ? normalizeStock(v.stock) : [],
        lotes: v.lotes
          ? v.lotes.map((l: any) => ({
              ...l,
              sucursal_id: l.sucursal_id || null,
            }))
          : [],
      }));
    }

    // Limpiar lotes con fecha vacía
    if (data.tiene_variantes) {
      data.stock = [];
      data.lotes = [];
      data.ofertas = [];
      data.imagenes = [];
      data.atributos = [];
    } else {
      data.variantes = [];
      if (data.atributos && data.atributos.length > 0) {
        data.atributos = data.atributos.filter(
          (attr: any) => attr.valor && attr.valor.trim() !== ''
        );
      } else {
        data.atributos = [];
      }
    }

    if (data.lotes && data.lotes.length > 0) {
      data.lotes = data.lotes
        .filter((l: any) => l.fecha_vencimiento && l.fecha_vencimiento.trim() !== '')
        .map((l: any) => ({ ...l, sucursal_id: l.sucursal_id || null }));
    }

    // Limpiar ofertas con fechas vacías
    if (data.ofertas && data.ofertas.length > 0) {
      data.ofertas = data.ofertas.filter(
        (o: any) =>
          o.fecha_inicio && o.fecha_fin && o.fecha_inicio.trim() !== '' && o.fecha_fin.trim() !== ''
      );
    }

    postProducto(data);
    reset(defaultProductValues);
    setImagenesLocales([]);
  };

  const handlerModalCategory = (): void => {
    setShowModalCategory((prev) => !prev);
  };

  return (
    <>
      <AlertModal
        isOpen={showNoBranchModal}
        onClose={() => setShowNoBranchModal(false)}
        icon={ShieldAlert}
        iconBgColor="bg-red-100"
        iconColor="text-red-600"
        title="Sin sucursales activas"
        description="No tenés sucursales activas para asignar stock. Contactá a tu administrador para configurar al menos una sucursal activa antes de crear productos."
        actions={[
          {
            label: 'Entendido',
            onClick: () => navigate('/sucursales'),
            variant: 'primary',
          },
        ]}
      />
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
            {!tiene('productos.crear') ? (
              <button
                type="submit"
                disabled
                form="product-form"
                className="px-6 py-2 text-[13px] font-medium tracking-wide bg-[#075E54] hover:bg-[#1e8e4f] text-white rounded-sm hover:opacity-90 transition-opacity cursor-not-allowed opacity-50 flex items-center gap-1"
              >
                Guardar Producto
                <Save size={15} />
              </button>
            ) : (
              <button
                type="submit"
                form="product-form"
                className="px-6 py-2 text-[13px] font-medium tracking-wide bg-[#075E54] hover:bg-[#1e8e4f] text-white rounded-sm hover:opacity-90 transition-opacity flex items-center gap-1 cursor-pointer"
              >
                Guardar Producto
                <Save size={15} />
              </button>
            )}

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
                registration={register('nombre', {
                  required: 'El nombre es obligatorio',
                })}
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
                    {...register('categoria_id', {
                      required: 'La categoría es obligatoria',
                    })}
                    className="flex-1 h-9 border border-gray-200 rounded-sm px-2 text-[13px]"
                  >
                    {todasLasCategorias.map((categoria: any) => (
                      <option key={categoria.id} value={categoria.id}>
                        {categoria.nombre}
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
                  <span className="text-red-500 text-xs">
                    {String(errors.categoria_id.message ?? '')}
                  </span>
                )}
              </div>

              {/* Unidad de Medida — sin grid-cols-2 interno innecesario */}
              <InputFormField
                label="Unidad de Medida"
                name="unidad_venta"
                type="select"
                registration={register('unidad_venta', {
                  required: 'La unidad es obligatoria',
                })}
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
                {puedeVerCosto && (
                  <div>
                    <Label>Precio de Costo</Label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#595f66] text-sm">
                        $
                      </span>
                      <Input
                        type="number"
                        className="pl-8"
                        placeholder="0.00"
                        {...register('precio_costo', { valueAsNumber: true })}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <Label>Precio de Venta</Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#595f66] text-sm">
                      $
                    </span>
                    <Input
                      type="number"
                      className="pl-8"
                      placeholder="0.00"
                      {...register('precio_venta', { valueAsNumber: true })}
                    />
                  </div>
                </div>

                {puedeVerMargen && (
                  <div className="rounded-sm border border-[#d8dee6] bg-[#fbf9fa] px-4 py-3">
                    <p className="text-[12px] font-medium uppercase tracking-wide text-[#595f66]">
                      Margen de ganancia
                    </p>
                    <p className={`mt-1 text-xl font-bold ${margenGanancia >= 0 ? 'text-[#075E54]' : 'text-red-600'}`}>
                      {margenGanancia.toFixed(2)}%
                    </p>
                  </div>
                )}

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
                <span className="material-symbols-outlined text-orange-500">
                  <Settings />
                </span>
                <h3 className="text-lg font-semibold">Configuración Avanzada</h3>
              </div>
              <div className="flex flex-col gap-4">
                {permiteVariantes && (
                  <div className="flex items-center justify-between p-3 border border-[#efedef] rounded-sm bg-[#fbf9fa]">
                    <div>
                      <h4 className="text-sm font-semibold text-[#041627]">¿Tiene Variantes?</h4>
                      <p className="text-xs text-[#595f66] mt-1">
                        Colores, talles, etc. para esta categoría
                      </p>
                    </div>
                    <Toggle
                      checked={watchedTieneVariantes}
                      onChange={(val) => setValue('tiene_variantes', val)}
                      dark
                    />
                  </div>
                )}

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

          <Card>
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-[#041627]">
                  Sucursales del producto
                </h3>
                <p className="mt-1 text-sm text-[#595f66]">
                  Si no limitas la disponibilidad, el producto queda habilitado en todas.
                </p>
              </div>
              <Toggle
                checked={watchedTodasSucursales}
                onChange={(val) => {
                  setValue('todas_sucursales', val);
                  if (val) {
                    setValue(
                      'sucursales_habilitadas_ids',
                      sucursalesActivas.map((sucursal) => sucursal.id),
                    );
                  }
                }}
              />
            </div>

            {!watchedTodasSucursales && (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {sucursalesActivas.map((sucursal) => {
                  const selected = watchedSucursalesHabilitadas.includes(sucursal.id);
                  return (
                    <label
                      key={sucursal.id}
                      className={`flex items-center gap-3 rounded-sm border px-4 py-3 text-sm font-medium ${
                        selected
                          ? 'border-[#075E54] bg-[#DCF8C6]/50 text-[#041627]'
                          : 'border-[#c4c6cd] bg-white text-[#595f66]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        value={sucursal.id}
                        {...register('sucursales_habilitadas_ids')}
                        className="h-4 w-4"
                      />
                      {sucursal.nombre}
                    </label>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Imágenes Generales del Producto */}
          {!watchedTieneVariantes && (
            <ImagenesSection
              imagenesLocales={imagenesLocales}
              setImagenesLocales={setImagenesLocales}
            />
          )}

          {/* Si NO tiene variantes, gestionamos Stock y Ofertas de forma general */}
          {!watchedTieneVariantes && (
            <>
              <AtributosGeneralesSection atributosCategoria={atributosCategoria} />
              <StockSection namePrefix="stock" sucursales={sucursalesActivas} />
              <OfertasSection namePrefix="ofertas" />
              {watchedTieneVencimiento && <LotesSection namePrefix="lotes" />}
            </>
          )}

          {/* Si TIENE variantes, mostramos el gestor de variantes */}
          {watchedTieneVariantes && (
            <VariantesSection
              tieneVencimiento={watchedTieneVencimiento}
              sucursales={sucursalesActivas}
              atributosCategoria={atributosCategoria}
            />
          )}
        </form>
      </FormProvider>

      {/* Modal para gestión de categorías */}
      {showModalCategory && (
        <ModalCategory isActive={showModalCategory} onClose={handlerModalCategory} />
      )}
    </>
  );
}
