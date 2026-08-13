import { X, Tag, Calendar, DollarSign, Percent, AlertCircle, Package } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useCrearOferta } from '../../hooks/useProductos';
import type { IOferta } from '../../types/productos.type';

interface Props {
  productoId: string;
  productoNombre: string;
  precioVenta: number;
  ofertasExistentes?: IOferta[];
  varianteId?: string | null;
  onClose: () => void;
}

interface FormValues {
  porcentaje: number;
  precio_oferta: number;
  fecha_inicio: string;
  fecha_fin: string;
  activo: boolean;
  con_limite: boolean;
  cantidad_maxima: number;
}

type Modo = 'porcentaje' | 'precio';

const formatMoneda = (valor: number) =>
  valor.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

const getOfertaVigenteLocal = (ofertas?: IOferta[], varianteId?: string | null): IOferta | null => {
  if (!ofertas?.length) return null;
  const ahora = new Date();
  return ofertas.find(o => {
    if (!o.activo) return false;
    const inicio = new Date(o.fecha_inicio);
    const fin = new Date(o.fecha_fin);
    const enRango = inicio <= ahora && fin >= ahora;
    const coincideVariante = varianteId ? o.variante_id === varianteId : !o.variante_id;
    const noAgotada = !o.cantidad_maxima || (o.cantidad_vendida ?? 0) < o.cantidad_maxima;
    return enRango && coincideVariante && noAgotada;
  }) ?? null;
};

export const ModalOfertaRapida = ({
  productoId,
  productoNombre,
  precioVenta,
  ofertasExistentes,
  varianteId,
  onClose,
}: Props) => {
  const { mutate: crearOferta, isPending } = useCrearOferta();
  const [modo, setModo] = useState<Modo>('porcentaje');
  const ofertaVigente = getOfertaVigenteLocal(ofertasExistentes, varianteId);
  const hoy = new Date().toISOString().split('T')[0];

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      porcentaje: 10,
      precio_oferta: precioVenta > 0 ? Math.round(precioVenta * 0.9) : 0,
      fecha_inicio: hoy,
      fecha_fin: '',
      activo: true,
      con_limite: false,
      cantidad_maxima: 20,
    },
  });

  const porcentaje = Number(watch('porcentaje') || 0);
  const precioOferta = Number(watch('precio_oferta') || 0);
  const fechaInicio = watch('fecha_inicio');
  const conLimite = watch('con_limite');

  // precio final según el modo activo
  const precioFinal = modo === 'porcentaje'
    ? precioVenta > 0 ? Math.round(precioVenta * (1 - porcentaje / 100)) : 0
    : precioOferta;

  const descuentoPct = modo === 'porcentaje'
    ? porcentaje
    : precioVenta > 0 && precioOferta > 0 && precioOferta < precioVenta
      ? Math.round((1 - precioOferta / precioVenta) * 100)
      : 0;

  // sincronizar el otro campo cuando cambia el modo
  const cambiarModo = (nuevo: Modo) => {
    if (nuevo === 'precio' && modo === 'porcentaje') {
      setValue('precio_oferta', precioVenta > 0 ? Math.round(precioVenta * (1 - porcentaje / 100)) : 0);
    }
    if (nuevo === 'porcentaje' && modo === 'precio') {
      const pct = precioVenta > 0 && precioOferta > 0
        ? Math.round((1 - precioOferta / precioVenta) * 100)
        : 10;
      setValue('porcentaje', Math.max(1, pct));
    }
    setModo(nuevo);
  };

  const precioInvalido = precioFinal <= 0 || (precioVenta > 0 && precioFinal >= precioVenta);

  const manejarGuardar = (valores: FormValues) => {
    if (precioFinal <= 0) return;
    crearOferta(
      {
        producto_id: productoId,
        variante_id: varianteId ?? null,
        precio_oferta: precioFinal,
        fecha_inicio: valores.fecha_inicio,
        fecha_fin: valores.fecha_fin,
        activo: valores.activo,
        cantidad_maxima: valores.con_limite ? Number(valores.cantidad_maxima) : null,
      },
      { onSuccess: onClose },
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <form
        onSubmit={handleSubmit(manejarGuardar)}
        className="w-full max-w-125 overflow-hidden rounded-lg bg-[#fbf9fa] shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between bg-[#075E54] px-4 py-3 text-white">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Tag size={16} />
            Nueva oferta
          </div>
          <button type="button" onClick={onClose} className="hover:text-white/70">
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-4 p-5">
          {/* Aviso oferta vigente */}
          {ofertaVigente && (
            <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-3 text-[12px] text-amber-800">
              <AlertCircle size={15} className="mt-0.5 shrink-0 text-amber-600" />
              <div>
                <p className="font-bold">Este producto ya tiene una oferta vigente</p>
                <p className="mt-0.5">
                  Precio en oferta actual:{' '}
                  <strong>{formatMoneda(Number(ofertaVigente.precio_oferta))}</strong>
                  {ofertaVigente.cantidad_maxima && (
                    <span className="ml-2 text-amber-700">
                      ({ofertaVigente.cantidad_vendida ?? 0}/{ofertaVigente.cantidad_maxima} unidades vendidas)
                    </span>
                  )}
                </p>
                <p className="mt-1 text-amber-700">
                  Debés eliminarla desde la ficha del producto antes de crear una nueva.
                </p>
              </div>
            </div>
          )}

          {/* Producto */}
          <div className="rounded-md border border-gray-200 bg-white px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Producto</p>
            <p className="mt-0.5 text-base font-bold text-[#041627]">{productoNombre}</p>
            {precioVenta > 0 && (
              <p className="mt-0.5 text-[12px] text-gray-500">
                Precio de venta actual:{' '}
                <span className="font-semibold">{formatMoneda(precioVenta)}</span>
              </p>
            )}
          </div>

          {/* Selector de modo */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => cambiarModo('porcentaje')}
              className={`flex items-center justify-center gap-2 rounded border py-2 text-[13px] font-semibold transition ${
                modo === 'porcentaje'
                  ? 'border-[#075E54] bg-[#075E54] text-white'
                  : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Percent size={14} />
              Por porcentaje
            </button>
            <button
              type="button"
              onClick={() => cambiarModo('precio')}
              className={`flex items-center justify-center gap-2 rounded border py-2 text-[13px] font-semibold transition ${
                modo === 'precio'
                  ? 'border-[#075E54] bg-[#075E54] text-white'
                  : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <DollarSign size={14} />
              Precio fijo
            </button>
          </div>

          {/* Input según modo */}
          {modo === 'porcentaje' ? (
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-bold uppercase tracking-wider text-gray-500">
                Descuento (%)
              </label>
              <div className="relative">
                <Percent size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="number"
                  min={1}
                  max={99}
                  step={1}
                  {...register('porcentaje', {
                    required: 'Requerido',
                    min: { value: 1, message: 'Mínimo 1%' },
                    max: { value: 99, message: 'Máximo 99%' },
                    valueAsNumber: true,
                  })}
                  className="h-10 w-full rounded border border-gray-300 bg-white pl-8 pr-3 text-sm font-semibold text-[#041627] outline-none focus:border-[#075E54] focus:ring-2 focus:ring-[#075E54]/15"
                />
              </div>
              {errors.porcentaje && (
                <p className="text-[11px] text-red-500">{errors.porcentaje.message}</p>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-bold uppercase tracking-wider text-gray-500">
                Precio de oferta
              </label>
              <div className="relative">
                <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="number"
                  min={0.01}
                  step={0.01}
                  {...register('precio_oferta', {
                    required: 'Requerido',
                    min: { value: 0.01, message: 'Debe ser mayor a 0' },
                    valueAsNumber: true,
                  })}
                  className="h-10 w-full rounded border border-gray-300 bg-white pl-8 pr-3 text-sm font-semibold text-[#041627] outline-none focus:border-[#075E54] focus:ring-2 focus:ring-[#075E54]/15"
                />
              </div>
              {errors.precio_oferta && (
                <p className="text-[11px] text-red-500">{errors.precio_oferta.message}</p>
              )}
            </div>
          )}

          {/* Preview del resultado */}
          {precioVenta > 0 && precioFinal > 0 && !precioInvalido && (
            <div className="flex items-center justify-between rounded-md border border-green-200 bg-green-50 px-4 py-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-green-600">
                  Precio en oferta
                </p>
                <p className="mt-0.5 text-2xl font-black text-green-700">
                  {formatMoneda(precioFinal)}
                </p>
              </div>
              {descuentoPct > 0 && (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-600 text-white">
                  <span className="text-[13px] font-black leading-none">-{descuentoPct}%</span>
                </div>
              )}
            </div>
          )}

          {precioInvalido && precioVenta > 0 && precioFinal > 0 && (
            <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-700">
              <AlertCircle size={13} className="shrink-0" />
              El precio de oferta debe ser menor al precio de venta
            </div>
          )}

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-bold uppercase tracking-wider text-gray-500">
                Fecha inicio
              </label>
              <div className="relative">
                <Calendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  {...register('fecha_inicio', { required: 'Requerido' })}
                  className="h-10 w-full rounded border border-gray-300 bg-white pl-8 pr-3 text-sm text-[#041627] outline-none focus:border-[#075E54] focus:ring-2 focus:ring-[#075E54]/15"
                />
              </div>
              {errors.fecha_inicio && (
                <p className="text-[11px] text-red-500">{errors.fecha_inicio.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-bold uppercase tracking-wider text-gray-500">
                Fecha fin
              </label>
              <div className="relative">
                <Calendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  min={fechaInicio}
                  {...register('fecha_fin', { required: 'Requerido' })}
                  className="h-10 w-full rounded border border-gray-300 bg-white pl-8 pr-3 text-sm text-[#041627] outline-none focus:border-[#075E54] focus:ring-2 focus:ring-[#075E54]/15"
                />
              </div>
              {errors.fecha_fin && (
                <p className="text-[11px] text-red-500">{errors.fecha_fin.message}</p>
              )}
            </div>
          </div>

          {/* Límite de unidades */}
          <div className="rounded-md border border-gray-200 bg-white p-3 flex flex-col gap-2">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                {...register('con_limite')}
                className="h-4 w-4 rounded border-gray-300 accent-[#075E54]"
              />
              <div className="flex items-center gap-2">
                <Package size={14} className="text-gray-400" />
                <span className="text-[13px] font-medium text-gray-700">
                  Limitar cantidad de unidades en oferta
                </span>
              </div>
            </label>
            {conLimite && (
              <div className="flex items-center gap-2 pl-7">
                <span className="text-[12px] text-gray-500 whitespace-nowrap">Máximo de unidades:</span>
                <input
                  type="number"
                  min={1}
                  step={1}
                  {...register('cantidad_maxima', {
                    required: conLimite ? 'Requerido' : false,
                    min: { value: 1, message: 'Mínimo 1 unidad' },
                    valueAsNumber: true,
                  })}
                  className="h-8 w-28 rounded border border-gray-300 bg-white px-2 text-sm font-semibold text-[#041627] outline-none focus:border-[#075E54]"
                />
                {errors.cantidad_maxima && (
                  <p className="text-[11px] text-red-500">{errors.cantidad_maxima.message}</p>
                )}
              </div>
            )}
          </div>

          {/* Activo */}
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              {...register('activo')}
              className="h-4 w-4 rounded border-gray-300 accent-[#075E54]"
            />
            <span className="text-[13px] font-medium text-gray-700">
              Activar oferta inmediatamente
            </span>
          </label>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-gray-200 bg-white px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-gray-300 bg-white px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isPending || precioInvalido || precioFinal <= 0}
            className="rounded bg-[#075E54] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#064d45] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? 'Guardando...' : 'Crear oferta'}
          </button>
        </div>
      </form>
    </div>
  );
};
