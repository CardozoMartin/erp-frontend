import { CheckCircle2, FileText, ImageIcon, Loader2, Printer, ReceiptText, Save, Settings, Store, ToggleLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useAuthStore } from '../../../store/auth.store';
import { useConfiguracionCloudinary, useConfiguracionPos, usePosAuxMutation } from '../../POSAuxiliares/hooks/usePosAux';
import type { ConfiguracionPosPayload } from '../../POSAuxiliares/types/pos-aux.type';
import { dateTime } from '../../POSAuxiliares/utils/format';

const defaultValues = (sucursalId: string): ConfiguracionPosPayload => ({
  sucursal_id: sucursalId,
  cotizacion_vigencia_horas: 24,
  modo_pos: 'SIMPLE',
  descuento_stock: 'AL_COBRAR',
  permitir_pago_mixto: true,
  permitir_listas_precio: false,
  permitir_cotizaciones: false,
  prefijo_ticket: 'TKT',
  prefijo_cotizacion: 'PRE',
  prefijo_remito: 'REM',
  prefijo_nota_credito: 'NCA',
  punto_venta_arca: '',
  permitir_cuenta_corriente: false,
  formato_impresion_comprobante: 'TICKET_80MM',
  imprimir_automaticamente: true,
  diseno_comprobante: 'BASICO',
  nombre_fantasia_ticket: '',
  razon_social_ticket: '',
  cuit_ticket: '',
  ingresos_brutos_ticket: '',
  inicio_actividades_ticket: '',
  domicilio_ticket: '',
  telefono_ticket: '',
  email_ticket: '',
  web_ticket: '',
  mensaje_ticket: 'Gracias por su compra',
  mensaje_boleta: 'Conserve este comprobante. Gracias por elegirnos.',
  mostrar_detalle_productos: true,
  mostrar_descuentos: true,
  mostrar_recargos: true,
  mostrar_observaciones: true,
  mostrar_datos_fiscales: true,
});

const textOrEmpty = (value?: string | null) => value ?? '';
const textOrNull = (value?: string | null) => value?.trim() || null;

const designOptions = [
  {
    value: 'BASICO',
    label: 'Basico termico',
    description: 'Lineal, rapido y muy legible para impresoras de calor.',
  },
  {
    value: 'WAVE',
    label: 'Wave',
    description: 'Encabezado con banda curva tipo Odoo y mayor presencia visual.',
  },
  {
    value: 'CLASICO',
    label: 'Clasico',
    description: 'Orden administrativo formal para boletas y facturas comunes.',
  },
] as const;

const sampleItems = [
  { name: 'Fanta naranja 2L', qty: 2, price: '$2.100', total: '$4.200' },
  { name: 'Pan lactal', qty: 1, price: '$1.650', total: '$1.650' },
  { name: 'Yerba suave 1kg', qty: 1, price: '$3.300', total: '$3.300' },
];

const ConfiguracionPosPage = () => {
  const sucursalActiva = useAuthStore((state) => state.sucursalActiva);
  const configQuery = useConfiguracionPos();
  const cloudinaryQuery = useConfiguracionCloudinary();
  const mutations = usePosAuxMutation();
  const form = useForm<ConfiguracionPosPayload>({
    defaultValues: defaultValues(sucursalActiva?.id ?? ''),
  });
  const canShowForm = !!sucursalActiva?.id && !configQuery.isLoading && !configQuery.isFetching;
  const watchedFormato = useWatch({ control: form.control, name: 'formato_impresion_comprobante' });
  const watchedDiseno = useWatch({ control: form.control, name: 'diseno_comprobante' });
  const watchedModoPos = useWatch({ control: form.control, name: 'modo_pos' });
  const watchedDescuentoStock = useWatch({ control: form.control, name: 'descuento_stock' });
  const watchedNombre = useWatch({ control: form.control, name: 'nombre_fantasia_ticket' });
  const watchedRazonSocial = useWatch({ control: form.control, name: 'razon_social_ticket' });
  const watchedDomicilio = useWatch({ control: form.control, name: 'domicilio_ticket' });
  const watchedCuit = useWatch({ control: form.control, name: 'cuit_ticket' });
  const watchedMensajeTicket = useWatch({ control: form.control, name: 'mensaje_ticket' });
  const watchedMensajeBoleta = useWatch({ control: form.control, name: 'mensaje_boleta' });
  const [cloudName, setCloudName] = useState('');
  const [cloudApiKey, setCloudApiKey] = useState('');
  const [cloudApiSecret, setCloudApiSecret] = useState('');
  const [cloudFolder, setCloudFolder] = useState('productos');
  const isThermalPreview = watchedFormato === 'TICKET_80MM' || watchedFormato === 'TICKET_58MM';
  const previewStoreName =
    watchedNombre?.trim() ||
    watchedRazonSocial?.trim() ||
    sucursalActiva?.nombre ||
    'Mi tienda';
  const previewMessage = isThermalPreview ? watchedMensajeTicket : watchedMensajeBoleta;
  const stockOptions =
    watchedModoPos === 'CON_DESPACHO'
      ? [{ value: 'AL_DESPACHAR', label: 'Al despachar' }]
      : [{ value: 'AL_COBRAR', label: 'Al cobrar' }];

  useEffect(() => {
    if (!sucursalActiva?.id) return;
    if (configQuery.isLoading || configQuery.isFetching) return;
    if (configQuery.data) {
      form.reset({
        sucursal_id: configQuery.data.sucursal_id,
        cotizacion_vigencia_horas: Number(configQuery.data.cotizacion_vigencia_horas ?? 24),
        modo_pos: configQuery.data.modo_pos,
        descuento_stock: configQuery.data.descuento_stock,
        permitir_pago_mixto: configQuery.data.permitir_pago_mixto,
        permitir_listas_precio: configQuery.data.permitir_listas_precio ?? false,
        permitir_cotizaciones: configQuery.data.permitir_cotizaciones ?? false,
        prefijo_ticket: configQuery.data.prefijo_ticket,
        prefijo_cotizacion: configQuery.data.prefijo_cotizacion,
        prefijo_remito: configQuery.data.prefijo_remito,
        prefijo_nota_credito: configQuery.data.prefijo_nota_credito,
        punto_venta_arca: configQuery.data.punto_venta_arca ?? '',
        permitir_cuenta_corriente: configQuery.data.permitir_cuenta_corriente,
        formato_impresion_comprobante: configQuery.data.formato_impresion_comprobante ?? 'TICKET_80MM',
        imprimir_automaticamente: configQuery.data.imprimir_automaticamente ?? true,
        diseno_comprobante: configQuery.data.diseno_comprobante ?? 'BASICO',
        nombre_fantasia_ticket: textOrEmpty(configQuery.data.nombre_fantasia_ticket),
        razon_social_ticket: textOrEmpty(configQuery.data.razon_social_ticket),
        cuit_ticket: textOrEmpty(configQuery.data.cuit_ticket),
        ingresos_brutos_ticket: textOrEmpty(configQuery.data.ingresos_brutos_ticket),
        inicio_actividades_ticket: textOrEmpty(configQuery.data.inicio_actividades_ticket),
        domicilio_ticket: textOrEmpty(configQuery.data.domicilio_ticket),
        telefono_ticket: textOrEmpty(configQuery.data.telefono_ticket),
        email_ticket: textOrEmpty(configQuery.data.email_ticket),
        web_ticket: textOrEmpty(configQuery.data.web_ticket),
        mensaje_ticket: textOrEmpty(configQuery.data.mensaje_ticket),
        mensaje_boleta: textOrEmpty(configQuery.data.mensaje_boleta),
        mostrar_detalle_productos: configQuery.data.mostrar_detalle_productos ?? true,
        mostrar_descuentos: configQuery.data.mostrar_descuentos ?? true,
        mostrar_recargos: configQuery.data.mostrar_recargos ?? true,
        mostrar_observaciones: configQuery.data.mostrar_observaciones ?? true,
        mostrar_datos_fiscales: configQuery.data.mostrar_datos_fiscales ?? true,
      });
    } else if (configQuery.isError) {
      form.reset(defaultValues(sucursalActiva.id));
    }
  }, [
    configQuery.data,
    configQuery.error,
    configQuery.isError,
    configQuery.isFetching,
    configQuery.isLoading,
    form,
    sucursalActiva?.id,
  ]);

  useEffect(() => {
    if (!cloudinaryQuery.data) return;
    setCloudName(cloudinaryQuery.data.cloud_name ?? '');
    setCloudApiKey(cloudinaryQuery.data.api_key ?? '');
    setCloudApiSecret('');
    setCloudFolder(cloudinaryQuery.data.carpeta_base ?? 'productos');
  }, [cloudinaryQuery.data]);

  useEffect(() => {
    if (watchedModoPos === 'CON_DESPACHO') {
      if (watchedDescuentoStock !== 'AL_DESPACHAR') {
        form.setValue('descuento_stock', 'AL_DESPACHAR', { shouldDirty: true });
      }
      return;
    }
    if (watchedDescuentoStock !== 'AL_COBRAR') {
      form.setValue('descuento_stock', 'AL_COBRAR', { shouldDirty: true });
    }
  }, [form, watchedDescuentoStock, watchedModoPos]);

  const onSubmit = (values: ConfiguracionPosPayload) => {
    const payload: ConfiguracionPosPayload = {
      ...values,
      sucursal_id: sucursalActiva?.id ?? values.sucursal_id,
      cotizacion_vigencia_horas: Number(values.cotizacion_vigencia_horas),
      descuento_stock:
        values.modo_pos === 'CON_DESPACHO' ? 'AL_DESPACHAR' : 'AL_COBRAR',
      punto_venta_arca: values.punto_venta_arca?.trim() || null,
      nombre_fantasia_ticket: textOrNull(values.nombre_fantasia_ticket),
      razon_social_ticket: textOrNull(values.razon_social_ticket),
      cuit_ticket: textOrNull(values.cuit_ticket),
      ingresos_brutos_ticket: textOrNull(values.ingresos_brutos_ticket),
      inicio_actividades_ticket: textOrNull(values.inicio_actividades_ticket),
      domicilio_ticket: textOrNull(values.domicilio_ticket),
      telefono_ticket: textOrNull(values.telefono_ticket),
      email_ticket: textOrNull(values.email_ticket),
      web_ticket: textOrNull(values.web_ticket),
      mensaje_ticket: textOrNull(values.mensaje_ticket),
      mensaje_boleta: textOrNull(values.mensaje_boleta),
      prefijo_ticket: values.prefijo_ticket.trim().toUpperCase(),
      prefijo_cotizacion: values.prefijo_cotizacion.trim().toUpperCase(),
      prefijo_remito: values.prefijo_remito.trim().toUpperCase(),
      prefijo_nota_credito: values.prefijo_nota_credito.trim().toUpperCase(),
    };

    if (configQuery.data) {
      mutations.actualizarConfiguracionPos.mutate(payload);
      return;
    }
    mutations.crearConfiguracionPos.mutate(payload);
  };

  const isSaving =
    mutations.crearConfiguracionPos.isPending ||
    mutations.actualizarConfiguracionPos.isPending;
  const cloudinaryDisponible = !!cloudinaryQuery.data?.disponible;
  const guardarCloudinary = () => {
    if (!sucursalActiva?.id) return;
    mutations.guardarConfiguracionCloudinary.mutate({
      sucursal_id: sucursalActiva.id,
      cloud_name: cloudName,
      api_key: cloudApiKey,
      api_secret: cloudApiSecret || undefined,
      carpeta_base: cloudFolder || 'productos',
    });
  };
  const probarCloudinary = () => {
    if (!sucursalActiva?.id) return;
    mutations.probarConfiguracionCloudinary.mutate(sucursalActiva.id);
  };

  return (
    <div className="min-h-[calc(100vh-52px)] bg-[#f3f4f6] px-4 py-4">
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="mx-auto max-w-[1200px] rounded-lg border border-[#c4c6cd] bg-white shadow-sm"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#c4c6cd] px-4 py-3">
          <div>
            <div className="flex items-center gap-2 text-[15px] font-bold text-[#041627]">
              <Settings size={17} className="text-[#075E54]" />
              Configuracion POS por sucursal
            </div>
            <div className="mt-1 flex items-center gap-2 text-[13px] text-[#44474c]">
              <Store size={14} />
              {sucursalActiva?.nombre ?? 'Sin sucursal seleccionada'}
              {configQuery.data?.updated_at ? (
                <span>Actualizado {dateTime(configQuery.data.updated_at)}</span>
              ) : null}
            </div>
          </div>

          <button
            type="submit"
            disabled={!canShowForm || isSaving}
            className="flex h-9 items-center gap-2 rounded bg-[#075E54] px-4 text-[13px] font-semibold text-white hover:bg-[#0b6d62] disabled:opacity-60"
          >
            <Save size={15} />
            {configQuery.data ? 'Guardar cambios' : 'Crear configuracion'}
          </button>
        </div>

        {!sucursalActiva?.id ? (
          <div className="flex items-center justify-center px-4 py-12 text-[14px] text-[#44474c]">
            Seleccione una sucursal para configurar el POS.
          </div>
        ) : !canShowForm ? (
          <div className="flex items-center justify-center gap-2 px-4 py-12 text-[14px] text-[#44474c]">
            <Loader2 size={17} className="animate-spin" />
            Cargando configuracion de la sucursal
          </div>
        ) : (
        <div className="grid gap-4 p-4 lg:grid-cols-[1fr_0.9fr]">
          <section className="rounded border border-[#c4c6cd] bg-[#fbf9fa]">
            <div className="border-b border-[#c4c6cd] px-4 py-3 text-[13px] font-bold uppercase tracking-wide text-[#44474c]">
              Operacion de venta
            </div>
            <div className="grid gap-4 p-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">
                  Modo POS
                </span>
                <select
                  {...form.register('modo_pos')}
                  className="h-10 w-full rounded border border-[#c4c6cd] bg-white px-3 text-[14px] text-[#041627] outline-none focus:border-[#075E54]"
                >
                  <option value="SIMPLE">Simple: vende y cobra</option>
                  <option value="MULTICAJA">Multicaja independiente</option>
                  <option value="CAJA_CENTRALIZADA">Caja centralizada</option>
                  <option value="CON_DESPACHO">Con despacho</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">
                  Descuento de stock
                </span>
                <select
                  {...form.register('descuento_stock')}
                  className="h-10 w-full rounded border border-[#c4c6cd] bg-white px-3 text-[14px] text-[#041627] outline-none focus:border-[#075E54]"
                >
                  {stockOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">
                  Vigencia cotizacion en horas
                </span>
                <input
                  type="number"
                  min={1}
                  {...form.register('cotizacion_vigencia_horas', { valueAsNumber: true })}
                  className="h-10 w-full rounded border border-[#c4c6cd] bg-white px-3 text-[14px] text-[#041627] outline-none focus:border-[#075E54]"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">
                  Punto venta ARCA
                </span>
                <input
                  maxLength={4}
                  placeholder="0001"
                  {...form.register('punto_venta_arca')}
                  className="h-10 w-full rounded border border-[#c4c6cd] bg-white px-3 text-[14px] text-[#041627] outline-none focus:border-[#075E54]"
                />
              </label>
            </div>
          </section>

          <section className="rounded border border-[#c4c6cd] bg-[#fbf9fa]">
            <div className="border-b border-[#c4c6cd] px-4 py-3 text-[13px] font-bold uppercase tracking-wide text-[#44474c]">
              Opciones comerciales
            </div>
            <div className="space-y-3 p-4">
              <label className="flex items-center justify-between gap-3 rounded border border-[#c4c6cd] bg-white px-3 py-3">
                <span className="flex items-center gap-2 text-[14px] font-semibold text-[#041627]">
                  <ToggleLeft size={16} className="text-[#075E54]" />
                  Permitir pago mixto
                </span>
                <input
                  type="checkbox"
                  {...form.register('permitir_pago_mixto')}
                  className="h-4 w-4 accent-[#075E54]"
                />
              </label>

              <label className="flex items-center justify-between gap-3 rounded border border-[#c4c6cd] bg-white px-3 py-3">
                <span className="flex items-center gap-2 text-[14px] font-semibold text-[#041627]">
                  <ToggleLeft size={16} className="text-[#075E54]" />
                  Usar listas de precio
                </span>
                <input
                  type="checkbox"
                  {...form.register('permitir_listas_precio')}
                  className="h-4 w-4 accent-[#075E54]"
                />
              </label>

              <label className="flex items-center justify-between gap-3 rounded border border-[#c4c6cd] bg-white px-3 py-3">
                <span className="flex items-center gap-2 text-[14px] font-semibold text-[#041627]">
                  <ToggleLeft size={16} className="text-[#075E54]" />
                  Permitir cotizaciones
                </span>
                <input
                  type="checkbox"
                  {...form.register('permitir_cotizaciones')}
                  className="h-4 w-4 accent-[#075E54]"
                />
              </label>

              <label className="flex items-center justify-between gap-3 rounded border border-[#c4c6cd] bg-white px-3 py-3">
                <span className="flex items-center gap-2 text-[14px] font-semibold text-[#041627]">
                  <ToggleLeft size={16} className="text-[#075E54]" />
                  Permitir cuenta corriente
                </span>
                <input
                  type="checkbox"
                  {...form.register('permitir_cuenta_corriente')}
                  className="h-4 w-4 accent-[#075E54]"
                />
              </label>
            </div>
          </section>

          <section className="rounded border border-[#c4c6cd] bg-[#fbf9fa] lg:col-span-2">
            <div className="border-b border-[#c4c6cd] px-4 py-3 text-[13px] font-bold uppercase tracking-wide text-[#44474c]">
              Numeracion y prefijos
            </div>
            <div className="grid gap-4 p-4 md:grid-cols-4">
              <label className="block">
                <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">
                  Ticket
                </span>
                <input
                  maxLength={20}
                  {...form.register('prefijo_ticket')}
                  className="h-10 w-full rounded border border-[#c4c6cd] bg-white px-3 text-[14px] font-semibold uppercase text-[#041627] outline-none focus:border-[#075E54]"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">
                  Cotizacion
                </span>
                <input
                  maxLength={20}
                  {...form.register('prefijo_cotizacion')}
                  className="h-10 w-full rounded border border-[#c4c6cd] bg-white px-3 text-[14px] font-semibold uppercase text-[#041627] outline-none focus:border-[#075E54]"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">
                  Remito
                </span>
                <input
                  maxLength={20}
                  {...form.register('prefijo_remito')}
                  className="h-10 w-full rounded border border-[#c4c6cd] bg-white px-3 text-[14px] font-semibold uppercase text-[#041627] outline-none focus:border-[#075E54]"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">
                  Nota credito
                </span>
                <input
                  maxLength={20}
                  {...form.register('prefijo_nota_credito')}
                  className="h-10 w-full rounded border border-[#c4c6cd] bg-white px-3 text-[14px] font-semibold uppercase text-[#041627] outline-none focus:border-[#075E54]"
                />
              </label>
            </div>
          </section>

          <section className="rounded border border-[#c4c6cd] bg-[#fbf9fa] lg:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#c4c6cd] px-4 py-3">
              <div className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-wide text-[#44474c]">
                <ImageIcon size={15} className="text-[#075E54]" />
                Cloudinary e imagenes
              </div>
              <span
                className={`inline-flex items-center gap-1 rounded border px-2.5 py-1 text-[11px] font-bold ${
                  cloudinaryDisponible
                    ? 'border-[#cfe2de] bg-[#f3fbf9] text-[#075E54]'
                    : 'border-[#f6d58f] bg-[#fff8e6] text-[#8a5a00]'
                }`}
              >
                {cloudinaryDisponible ? <CheckCircle2 size={13} /> : null}
                {cloudinaryDisponible ? 'Subida habilitada' : 'Pendiente de verificacion'}
              </span>
            </div>
            <div className="grid gap-4 p-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">
                  Cloud name
                </span>
                <input
                  value={cloudName}
                  onChange={(event) => setCloudName(event.target.value)}
                  placeholder="mi-cloud"
                  className="h-10 w-full rounded border border-[#c4c6cd] bg-white px-3 text-[14px] text-[#041627] outline-none focus:border-[#075E54]"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">
                  API key
                </span>
                <input
                  value={cloudApiKey}
                  onChange={(event) => setCloudApiKey(event.target.value)}
                  className="h-10 w-full rounded border border-[#c4c6cd] bg-white px-3 text-[14px] text-[#041627] outline-none focus:border-[#075E54]"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">
                  API secret
                </span>
                <input
                  type="password"
                  value={cloudApiSecret}
                  onChange={(event) => setCloudApiSecret(event.target.value)}
                  placeholder={cloudinaryQuery.data?.api_secret_configurado ? 'Ya configurado' : ''}
                  className="h-10 w-full rounded border border-[#c4c6cd] bg-white px-3 text-[14px] text-[#041627] outline-none focus:border-[#075E54]"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">
                  Carpeta base
                </span>
                <input
                  value={cloudFolder}
                  onChange={(event) => setCloudFolder(event.target.value)}
                  placeholder="productos"
                  className="h-10 w-full rounded border border-[#c4c6cd] bg-white px-3 text-[14px] text-[#041627] outline-none focus:border-[#075E54]"
                />
              </label>
              <div className="flex flex-wrap items-center gap-2 md:col-span-2">
                <button
                  type="button"
                  onClick={guardarCloudinary}
                  disabled={!sucursalActiva?.id || mutations.guardarConfiguracionCloudinary.isPending}
                  className="flex h-9 items-center gap-2 rounded bg-[#075E54] px-4 text-[13px] font-semibold text-white hover:bg-[#0b6d62] disabled:opacity-60"
                >
                  <Save size={15} />
                  Guardar Cloudinary
                </button>
                <button
                  type="button"
                  onClick={probarCloudinary}
                  disabled={!sucursalActiva?.id || mutations.probarConfiguracionCloudinary.isPending}
                  className="flex h-9 items-center gap-2 rounded border border-[#c4c6cd] bg-white px-4 text-[13px] font-semibold text-[#041627] hover:bg-[#f4f5f6] disabled:opacity-60"
                >
                  {mutations.probarConfiguracionCloudinary.isPending ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                  Probar y habilitar
                </button>
                <span className="text-[12px] text-[#44474c]">
                  {cloudinaryQuery.data?.fuente === 'ENV'
                    ? 'Usando credenciales del servidor hasta que guardes una configuracion por sucursal.'
                    : cloudinaryQuery.data?.ultimo_test_at
                      ? `Verificado ${dateTime(cloudinaryQuery.data.ultimo_test_at)}`
                      : 'Al guardar se deshabilita hasta probar la conexion.'}
                </span>
              </div>
            </div>
          </section>

          <section className="rounded border border-[#c4c6cd] bg-[#fbf9fa] lg:col-span-2">
            <div className="flex items-center gap-2 border-b border-[#c4c6cd] px-4 py-3 text-[13px] font-bold uppercase tracking-wide text-[#44474c]">
              <ReceiptText size={15} className="text-[#075E54]" />
              Comprobante impreso
            </div>
            <div className="grid gap-4 p-4 lg:grid-cols-[1fr_0.9fr]">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block md:col-span-2">
                  <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">
                    Nombre visible de la tienda
                  </span>
                  <input
                    maxLength={120}
                    placeholder={sucursalActiva?.nombre ?? 'Mi tienda'}
                    {...form.register('nombre_fantasia_ticket')}
                    className="h-10 w-full rounded border border-[#c4c6cd] bg-white px-3 text-[14px] font-semibold text-[#041627] outline-none focus:border-[#075E54]"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">
                    Razon social
                  </span>
                  <input
                    maxLength={160}
                    {...form.register('razon_social_ticket')}
                    className="h-10 w-full rounded border border-[#c4c6cd] bg-white px-3 text-[14px] text-[#041627] outline-none focus:border-[#075E54]"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">
                    CUIT
                  </span>
                  <input
                    maxLength={20}
                    placeholder="20-00000000-0"
                    {...form.register('cuit_ticket')}
                    className="h-10 w-full rounded border border-[#c4c6cd] bg-white px-3 text-[14px] text-[#041627] outline-none focus:border-[#075E54]"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">
                    Ingresos brutos
                  </span>
                  <input
                    maxLength={80}
                    {...form.register('ingresos_brutos_ticket')}
                    className="h-10 w-full rounded border border-[#c4c6cd] bg-white px-3 text-[14px] text-[#041627] outline-none focus:border-[#075E54]"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">
                    Inicio actividades
                  </span>
                  <input
                    maxLength={20}
                    placeholder="01/01/2026"
                    {...form.register('inicio_actividades_ticket')}
                    className="h-10 w-full rounded border border-[#c4c6cd] bg-white px-3 text-[14px] text-[#041627] outline-none focus:border-[#075E54]"
                  />
                </label>
                <label className="block md:col-span-2">
                  <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">
                    Domicilio comercial
                  </span>
                  <input
                    maxLength={180}
                    {...form.register('domicilio_ticket')}
                    className="h-10 w-full rounded border border-[#c4c6cd] bg-white px-3 text-[14px] text-[#041627] outline-none focus:border-[#075E54]"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">
                    Telefono
                  </span>
                  <input
                    maxLength={80}
                    {...form.register('telefono_ticket')}
                    className="h-10 w-full rounded border border-[#c4c6cd] bg-white px-3 text-[14px] text-[#041627] outline-none focus:border-[#075E54]"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">
                    Email
                  </span>
                  <input
                    maxLength={120}
                    {...form.register('email_ticket')}
                    className="h-10 w-full rounded border border-[#c4c6cd] bg-white px-3 text-[14px] text-[#041627] outline-none focus:border-[#075E54]"
                  />
                </label>
                <label className="block md:col-span-2">
                  <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">
                    Web o redes
                  </span>
                  <input
                    maxLength={120}
                    placeholder="instagram.com/mitienda"
                    {...form.register('web_ticket')}
                    className="h-10 w-full rounded border border-[#c4c6cd] bg-white px-3 text-[14px] text-[#041627] outline-none focus:border-[#075E54]"
                  />
                </label>
              </div>

              <div className="space-y-4">
                <label className="block">
                  <span className="mb-1 flex items-center gap-2 text-[12px] font-semibold text-[#44474c]">
                    <Printer size={14} className="text-[#075E54]" />
                    Formato por defecto
                  </span>
                  <select
                    {...form.register('formato_impresion_comprobante')}
                    className="h-10 w-full rounded border border-[#c4c6cd] bg-white px-3 text-[14px] text-[#041627] outline-none focus:border-[#075E54]"
                  >
                    <option value="TICKET_80MM">Ticket termico 80 mm</option>
                    <option value="TICKET_58MM">Ticket termico 58 mm</option>
                    <option value="BOLETA_A4">Boleta / hoja A4</option>
                  </select>
                </label>

                <div>
                  <span className="mb-2 block text-[12px] font-semibold text-[#44474c]">
                    Diseno visual
                  </span>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {designOptions.map((option) => (
                      <label
                        key={option.value}
                        className={`cursor-pointer rounded border bg-white p-3 transition ${
                          watchedDiseno === option.value
                            ? 'border-[#075E54] shadow-[0_0_0_2px_rgba(7,94,84,0.12)]'
                            : 'border-[#c4c6cd] hover:border-[#075E54]/50'
                        }`}
                      >
                        <input
                          type="radio"
                          value={option.value}
                          {...form.register('diseno_comprobante')}
                          className="sr-only"
                        />
                        <span className="block text-[13px] font-bold text-[#041627]">
                          {option.label}
                        </span>
                        <span className="mt-1 block text-[11px] leading-snug text-[#44474c]">
                          {option.description}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <label className="flex items-center justify-between gap-3 rounded border border-[#c4c6cd] bg-white px-3 py-3">
                  <span className="flex items-center gap-2 text-[14px] font-semibold text-[#041627]">
                    <Printer size={16} className="text-[#075E54]" />
                    Imprimir al finalizar venta
                  </span>
                  <input
                    type="checkbox"
                    {...form.register('imprimir_automaticamente')}
                    className="h-4 w-4 accent-[#075E54]"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">
                    Mensaje para ticket
                  </span>
                  <textarea
                    rows={3}
                    maxLength={400}
                    {...form.register('mensaje_ticket')}
                    className="w-full rounded border border-[#c4c6cd] bg-white px-3 py-2 text-[14px] text-[#041627] outline-none focus:border-[#075E54]"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 flex items-center gap-2 text-[12px] font-semibold text-[#44474c]">
                    <FileText size={14} className="text-[#075E54]" />
                    Mensaje para boleta A4
                  </span>
                  <textarea
                    rows={3}
                    maxLength={400}
                    {...form.register('mensaje_boleta')}
                    className="w-full rounded border border-[#c4c6cd] bg-white px-3 py-2 text-[14px] text-[#041627] outline-none focus:border-[#075E54]"
                  />
                </label>

                <div className="grid gap-2 sm:grid-cols-2">
                  {[
                    ['mostrar_detalle_productos', 'Detalle productos'],
                    ['mostrar_datos_fiscales', 'Datos fiscales'],
                    ['mostrar_descuentos', 'Descuentos'],
                    ['mostrar_recargos', 'Recargos'],
                    ['mostrar_observaciones', 'Observaciones'],
                  ].map(([name, label]) => (
                    <label key={name} className="flex items-center justify-between gap-2 rounded border border-[#c4c6cd] bg-white px-3 py-2 text-[13px] font-semibold text-[#041627]">
                      {label}
                      <input
                        type="checkbox"
                        {...form.register(name as keyof ConfiguracionPosPayload)}
                        className="h-4 w-4 accent-[#075E54]"
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-[#c4c6cd] bg-white px-4 py-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <div className="text-[13px] font-bold uppercase tracking-wide text-[#44474c]">
                    Vista previa
                  </div>
                  <div className="text-[12px] text-[#44474c]">
                    Simula el comprobante que se imprimira desde el POS.
                  </div>
                </div>
                <span className="rounded border border-[#cfe2de] bg-[#f3fbf9] px-2.5 py-1 text-[11px] font-bold text-[#075E54]">
                  {watchedFormato === 'BOLETA_A4' ? 'A4' : watchedFormato === 'TICKET_58MM' ? '58 mm' : '80 mm'}
                </span>
              </div>

              <div className="overflow-auto rounded border border-[#e5e7eb] bg-[#f3f4f6] p-4">
                <div
                  className={`mx-auto overflow-hidden bg-white text-[#111827] shadow-sm ${
                    isThermalPreview
                      ? watchedFormato === 'TICKET_58MM'
                        ? 'w-[230px] font-mono text-[10px]'
                        : 'w-[310px] font-mono text-[11px]'
                      : 'w-full max-w-[720px] text-[12px]'
                  } ${
                    watchedDiseno === 'WAVE'
                      ? 'rounded-t-2xl'
                      : watchedDiseno === 'CLASICO'
                        ? 'border border-[#111827]'
                        : 'border border-dashed border-[#9ca3af]'
                  }`}
                >
                  <div
                    className={`relative px-4 py-4 ${
                      watchedDiseno === 'WAVE'
                        ? 'bg-[#075E54] text-white'
                        : watchedDiseno === 'CLASICO'
                          ? 'border-b-2 border-[#111827]'
                          : 'border-b border-dashed border-[#111827] text-center'
                    }`}
                  >
                    {watchedDiseno === 'WAVE' ? (
                      <div className="absolute bottom-[-18px] left-0 h-9 w-full rounded-[0_0_50%_50%] bg-[#075E54]" />
                    ) : null}
                    <div className="relative">
                      <div className={`${isThermalPreview ? 'text-center text-[16px]' : 'text-[22px]'} font-black uppercase`}>
                        {previewStoreName}
                      </div>
                      <div className={`${isThermalPreview ? 'text-center text-[10px]' : 'mt-1 text-[12px]'} opacity-80`}>
                        {watchedDomicilio || 'Domicilio comercial'}
                      </div>
                      <div className={`${isThermalPreview ? 'text-center text-[10px]' : 'text-[12px]'} opacity-80`}>
                        CUIT {watchedCuit || '20-00000000-0'}
                      </div>
                    </div>
                  </div>

                  <div className={`${watchedDiseno === 'WAVE' ? 'pt-8' : 'pt-4'} px-4 pb-4`}>
                    <div className={`${isThermalPreview ? 'text-center' : 'flex items-center justify-between'} font-bold uppercase`}>
                      <span>Ticket</span>
                      <span>Nro. TKT-000123</span>
                    </div>
                    <div className={`mt-3 grid gap-1 ${isThermalPreview ? '' : 'grid-cols-3'}`}>
                      <div>Fecha: 01/06/2026 14:32</div>
                      <div>Cliente: Consumidor final</div>
                      <div>Caja: Mostrador</div>
                    </div>

                    <div className="mt-4 border-t border-[#d1d5db] pt-3">
                      {sampleItems.map((item) => (
                        <div
                          key={item.name}
                          className={`grid gap-2 border-b border-[#e5e7eb] py-2 ${
                            isThermalPreview ? 'grid-cols-[1fr_auto]' : 'grid-cols-[1fr_60px_90px_90px]'
                          }`}
                        >
                          <div className="font-semibold">{item.name}</div>
                          {isThermalPreview ? (
                            <div className="text-right">
                              <div>x{item.qty}</div>
                              <strong>{item.total}</strong>
                            </div>
                          ) : (
                            <>
                              <div className="text-right">x{item.qty}</div>
                              <div className="text-right">{item.price}</div>
                              <div className="text-right font-bold">{item.total}</div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="ml-auto mt-4 max-w-[260px] space-y-1">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <strong>$9.150</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Descuento</span>
                        <strong>$0</strong>
                      </div>
                      <div className="flex justify-between border-t border-[#111827] pt-2 text-[16px] font-black">
                        <span>Total</span>
                        <span>$9.150</span>
                      </div>
                    </div>

                    {previewMessage ? (
                      <div className={`mt-4 whitespace-pre-wrap border-t border-dashed border-[#9ca3af] pt-3 ${isThermalPreview ? 'text-center' : ''}`}>
                        {previewMessage}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
        )}
      </form>
    </div>
  );
};

export default ConfiguracionPosPage;
