import { Loader2, Save, Settings, Store } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useAuthStore } from '../../../store/auth.store';
import { useConfiguracionCloudinary, useConfiguracionPos, usePosAuxMutation } from '../../POSAuxiliares/hooks/usePosAux';
import type { ConfiguracionPosPayload } from '../../POSAuxiliares/types/pos-aux.type';
import { dateTime } from '../../POSAuxiliares/utils/format';
import { ConfigCloudinary } from '../components/ConfigCloudinary';
import { ConfigPosComprobante } from '../components/ConfigPosComprobante';
import { ConfigPosOperacion } from '../components/ConfigPosOperacion';
import { ComprobantePreview } from '../components/ComprobantePreview';

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

const ConfiguracionPosPage = () => {
  const sucursalActiva = useAuthStore((state) => state.sucursalActiva);
  const configQuery = useConfiguracionPos();
  const cloudinaryQuery = useConfiguracionCloudinary();
  const mutations = usePosAuxMutation();

  const form = useForm<ConfiguracionPosPayload>({
    defaultValues: defaultValues(sucursalActiva?.id ?? ''),
  });

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

  const canShowForm = !!sucursalActiva?.id && !configQuery.isLoading && !configQuery.isFetching;
  const isThermalPreview = watchedFormato === 'TICKET_80MM' || watchedFormato === 'TICKET_58MM';
  const previewStoreName = watchedNombre?.trim() || watchedRazonSocial?.trim() || sucursalActiva?.nombre || 'Mi tienda';
  const previewMessage = isThermalPreview ? watchedMensajeTicket : watchedMensajeBoleta;
  const stockOptions =
    watchedModoPos === 'CON_DESPACHO'
      ? [{ value: 'AL_DESPACHAR', label: 'Al despachar' }]
      : [{ value: 'AL_COBRAR', label: 'Al cobrar' }];

  const isSaving = mutations.crearConfiguracionPos.isPending || mutations.actualizarConfiguracionPos.isPending;

  // Sincronizar form con datos del servidor
  useEffect(() => {
    if (!sucursalActiva?.id || configQuery.isLoading || configQuery.isFetching) return;
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
  }, [configQuery.data, configQuery.error, configQuery.isError, configQuery.isFetching, configQuery.isLoading, form, sucursalActiva?.id]);

  // Sincronizar estado Cloudinary
  useEffect(() => {
    if (!cloudinaryQuery.data) return;
    setCloudName(cloudinaryQuery.data.cloud_name ?? '');
    setCloudApiKey(cloudinaryQuery.data.api_key ?? '');
    setCloudApiSecret('');
    setCloudFolder(cloudinaryQuery.data.carpeta_base ?? 'productos');
  }, [cloudinaryQuery.data]);

  // Forzar descuento_stock según modo_pos
  useEffect(() => {
    if (watchedModoPos === 'CON_DESPACHO') {
      if (watchedDescuentoStock !== 'AL_DESPACHAR') form.setValue('descuento_stock', 'AL_DESPACHAR', { shouldDirty: true });
      return;
    }
    if (watchedDescuentoStock !== 'AL_COBRAR') form.setValue('descuento_stock', 'AL_COBRAR', { shouldDirty: true });
  }, [form, watchedDescuentoStock, watchedModoPos]);

  const onSubmit = (values: ConfiguracionPosPayload) => {
    const payload: ConfiguracionPosPayload = {
      ...values,
      sucursal_id: sucursalActiva?.id ?? values.sucursal_id,
      cotizacion_vigencia_horas: Number(values.cotizacion_vigencia_horas),
      descuento_stock: values.modo_pos === 'CON_DESPACHO' ? 'AL_DESPACHAR' : 'AL_COBRAR',
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
    if (configQuery.data) { mutations.actualizarConfiguracionPos.mutate(payload); return; }
    mutations.crearConfiguracionPos.mutate(payload);
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
          <div className="space-y-4 p-4">
            <ConfigPosOperacion
              register={form.register}
              watchedModoPos={watchedModoPos}
              stockOptions={stockOptions}
            />

            <ConfigCloudinary
              cloudinaryData={cloudinaryQuery.data}
              cloudName={cloudName} onCloudNameChange={setCloudName}
              cloudApiKey={cloudApiKey} onCloudApiKeyChange={setCloudApiKey}
              cloudApiSecret={cloudApiSecret} onCloudApiSecretChange={setCloudApiSecret}
              cloudFolder={cloudFolder} onCloudFolderChange={setCloudFolder}
              isSavingCloudinary={mutations.guardarConfiguracionCloudinary.isPending}
              isTestingCloudinary={mutations.probarConfiguracionCloudinary.isPending}
              hasSucursal={!!sucursalActiva?.id}
              onGuardar={() => {
                if (!sucursalActiva?.id) return;
                mutations.guardarConfiguracionCloudinary.mutate({
                  sucursal_id: sucursalActiva.id,
                  cloud_name: cloudName,
                  api_key: cloudApiKey,
                  api_secret: cloudApiSecret || undefined,
                  carpeta_base: cloudFolder || 'productos',
                });
              }}
              onProbar={() => { if (sucursalActiva?.id) mutations.probarConfiguracionCloudinary.mutate(sucursalActiva.id); }}
            />

            <ConfigPosComprobante
              register={form.register}
              watchedDiseno={watchedDiseno}
              sucursalNombre={sucursalActiva?.nombre}
            />

            <ComprobantePreview
              formato={watchedFormato}
              diseno={watchedDiseno}
              storeName={previewStoreName}
              domicilio={watchedDomicilio ?? ''}
              cuit={watchedCuit ?? ''}
              mensaje={previewMessage ?? ''}
            />
          </div>
        )}
      </form>
    </div>
  );
};

export default ConfiguracionPosPage;
