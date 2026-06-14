import { AlertCircle, Loader2, Mail, Save, Send, ShieldCheck, Store } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useAuthStore } from '../../../store/auth.store';
import { useConfiguracionEmail, usePosAuxMutation } from '../../POSAuxiliares/hooks/usePosAux';
import type { ConfiguracionEmailPayload } from '../../POSAuxiliares/types/pos-aux.type';
import { dateTime } from '../../POSAuxiliares/utils/format';

const defaults = (sucursalId: string): ConfiguracionEmailPayload => ({
  sucursal_id: sucursalId,
  activo: false,
  proveedor: 'GMAIL',
  email_remitente: '',
  nombre_remitente: '',
  usuario: '',
  smtp_host: 'smtp.gmail.com',
  smtp_port: 465,
  seguridad: 'SSL',
  password: '',
  email_respuesta: '',
  enviar_facturas_email: true,
  enviar_facturas_automaticamente: false,
  adjuntar_pdf: true,
  copia_oculta_admin: false,
  email_copia_admin: '',
});

const textOrNull = (value?: string | null) => value?.trim() || null;

const ConfiguracionEmailPage = () => {
  const sucursalActiva = useAuthStore((state) => state.sucursalActiva);
  const configQuery = useConfiguracionEmail();
  const mutations = usePosAuxMutation();
  const [testDestino, setTestDestino] = useState('');
  const form = useForm<ConfiguracionEmailPayload>({
    defaultValues: defaults(sucursalActiva?.id ?? ''),
  });
  const proveedor = useWatch({ control: form.control, name: 'proveedor' });
  const passwordConfigurado = configQuery.data?.password_configurado;
  const emailActivo = configQuery.data?.activo === true;
  const canShowForm = !!sucursalActiva?.id && !configQuery.isLoading && !configQuery.isFetching;
  const isSaving = mutations.guardarConfiguracionEmail.isPending;
  const isTesting = mutations.probarConfiguracionEmail.isPending;

  useEffect(() => {
    if (!sucursalActiva?.id) return;
    if (configQuery.isLoading || configQuery.isFetching) return;
    if (!configQuery.data) {
      form.reset(defaults(sucursalActiva.id));
      return;
    }
    form.reset({
      sucursal_id: configQuery.data.sucursal_id,
      activo: configQuery.data.activo,
      proveedor: configQuery.data.proveedor,
      email_remitente: configQuery.data.email_remitente,
      nombre_remitente: configQuery.data.nombre_remitente ?? '',
      usuario: configQuery.data.usuario,
      smtp_host: configQuery.data.smtp_host,
      smtp_port: Number(configQuery.data.smtp_port ?? 465),
      seguridad: configQuery.data.seguridad,
      password: '',
      email_respuesta: configQuery.data.email_respuesta ?? '',
      enviar_facturas_email: configQuery.data.enviar_facturas_email,
      enviar_facturas_automaticamente: configQuery.data.enviar_facturas_automaticamente,
      adjuntar_pdf: configQuery.data.adjuntar_pdf,
      copia_oculta_admin: configQuery.data.copia_oculta_admin,
      email_copia_admin: configQuery.data.email_copia_admin ?? '',
    });
    setTestDestino(configQuery.data.email_remitente);
  }, [
    configQuery.data,
    configQuery.isFetching,
    configQuery.isLoading,
    form,
    sucursalActiva?.id,
  ]);

  useEffect(() => {
    if (proveedor !== 'GMAIL') return;
    form.setValue('smtp_host', 'smtp.gmail.com');
    form.setValue('smtp_port', 465);
    form.setValue('seguridad', 'SSL');
  }, [form, proveedor]);

  const onSubmit = (values: ConfiguracionEmailPayload) => {
    const payload: ConfiguracionEmailPayload = {
      ...values,
      sucursal_id: sucursalActiva?.id ?? values.sucursal_id,
      email_remitente: values.email_remitente.trim().toLowerCase(),
      nombre_remitente: textOrNull(values.nombre_remitente),
      usuario: values.usuario.trim(),
      smtp_host: values.smtp_host.trim(),
      smtp_port: Number(values.smtp_port),
      password: values.password?.trim() || undefined,
      email_respuesta: textOrNull(values.email_respuesta),
      email_copia_admin: textOrNull(values.email_copia_admin),
    };
    mutations.guardarConfiguracionEmail.mutate(payload);
  };

  const handleTest = () => {
    if (!sucursalActiva?.id || !testDestino.trim()) return;
    mutations.probarConfiguracionEmail.mutate({
      sucursalId: sucursalActiva.id,
      destino: testDestino.trim(),
    });
  };

  return (
    <div className="min-h-[calc(100vh-52px)] bg-[#f3f4f6] px-4 py-4">
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="mx-auto max-w-[1180px] rounded-lg border border-[#c4c6cd] bg-white shadow-sm"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#c4c6cd] px-4 py-3">
          <div>
            <div className="flex items-center gap-2 text-[15px] font-bold text-[#041627]">
              <Mail size={17} className="text-[#075E54]" />
              Configuracion Email por sucursal
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-[13px] text-[#44474c]">
              <Store size={14} />
              {sucursalActiva?.nombre ?? 'Sin sucursal seleccionada'}
              {configQuery.data?.updated_at ? (
                <span>Actualizado {dateTime(configQuery.data.updated_at)}</span>
              ) : null}
              {passwordConfigurado ? (
                <span className="inline-flex items-center gap-1 rounded border border-[#cfe2de] bg-[#f3fbf9] px-2 py-0.5 text-[12px] font-semibold text-[#075E54]">
                  <ShieldCheck size={13} />
                  Clave guardada
                </span>
              ) : null}
              {emailActivo ? (
                <span className="inline-flex items-center gap-1 rounded border border-[#cfe2de] bg-[#f3fbf9] px-2 py-0.5 text-[12px] font-semibold text-[#075E54]">
                  <ShieldCheck size={13} />
                  Sistema configurado para enviar email
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded border border-[#f3d19b] bg-[#fff7e8] px-2 py-0.5 text-[12px] font-semibold text-[#7a4f00]">
                  <AlertCircle size={13} />
                  Pendiente de prueba
                </span>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={!canShowForm || isSaving}
            className="flex h-9 items-center gap-2 rounded bg-[#075E54] px-4 text-[13px] font-semibold text-white hover:bg-[#0b6d62] disabled:opacity-60"
          >
            {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            Guardar configuracion
          </button>
        </div>

        {!sucursalActiva?.id ? (
          <div className="flex items-center justify-center px-4 py-12 text-[14px] text-[#44474c]">
            Seleccione una sucursal para configurar el email.
          </div>
        ) : !canShowForm ? (
          <div className="flex items-center justify-center gap-2 px-4 py-12 text-[14px] text-[#44474c]">
            <Loader2 size={17} className="animate-spin" />
            Cargando configuracion de email
          </div>
        ) : (
          <div className="grid gap-4 p-4 lg:grid-cols-[1fr_0.85fr]">
            <section className="rounded border border-[#c4c6cd] bg-[#fbf9fa]">
              <div className="border-b border-[#c4c6cd] px-4 py-3 text-[13px] font-bold uppercase tracking-wide text-[#44474c]">
                Credenciales de envio
              </div>
              <div className="grid gap-4 p-4 md:grid-cols-2">
                <div
                  className={`rounded border px-3 py-2 text-[13px] font-semibold md:col-span-2 ${
                    emailActivo
                      ? 'border-[#cfe2de] bg-[#f3fbf9] text-[#075E54]'
                      : 'border-[#f3d19b] bg-[#fff7e8] text-[#7a4f00]'
                  }`}
                >
                  {emailActivo
                    ? 'Configuracion verificada. Los envios del sistema estan habilitados.'
                    : 'Guarde la configuracion y envie un correo de prueba. Si la prueba sale bien, los envios se habilitan automaticamente.'}
                </div>

                <label className="block">
                  <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">
                    Proveedor
                  </span>
                  <select
                    {...form.register('proveedor')}
                    className="h-10 w-full rounded border border-[#c4c6cd] bg-white px-3 text-[14px] outline-none focus:border-[#075E54]"
                  >
                    <option value="GMAIL">Gmail</option>
                    <option value="SMTP">SMTP personalizado</option>
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">
                    Email remitente
                  </span>
                  <input
                    type="email"
                    {...form.register('email_remitente', { required: true })}
                    className="h-10 w-full rounded border border-[#c4c6cd] bg-white px-3 text-[14px] outline-none focus:border-[#075E54]"
                    placeholder="ventas@empresa.com"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">
                    Nombre remitente
                  </span>
                  <input
                    {...form.register('nombre_remitente')}
                    className="h-10 w-full rounded border border-[#c4c6cd] bg-white px-3 text-[14px] outline-none focus:border-[#075E54]"
                    placeholder="Mi comercio"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">
                    Usuario SMTP
                  </span>
                  <input
                    {...form.register('usuario', { required: true })}
                    className="h-10 w-full rounded border border-[#c4c6cd] bg-white px-3 text-[14px] outline-none focus:border-[#075E54]"
                    placeholder="usuario@gmail.com"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">
                    Host SMTP
                  </span>
                  <input
                    {...form.register('smtp_host', { required: true })}
                    disabled={proveedor === 'GMAIL'}
                    className="h-10 w-full rounded border border-[#c4c6cd] bg-white px-3 text-[14px] outline-none focus:border-[#075E54] disabled:bg-[#f1f5f9]"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">
                    Puerto
                  </span>
                  <input
                    type="number"
                    {...form.register('smtp_port', { valueAsNumber: true })}
                    disabled={proveedor === 'GMAIL'}
                    className="h-10 w-full rounded border border-[#c4c6cd] bg-white px-3 text-[14px] outline-none focus:border-[#075E54] disabled:bg-[#f1f5f9]"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">
                    Seguridad
                  </span>
                  <select
                    {...form.register('seguridad')}
                    disabled={proveedor === 'GMAIL'}
                    className="h-10 w-full rounded border border-[#c4c6cd] bg-white px-3 text-[14px] outline-none focus:border-[#075E54] disabled:bg-[#f1f5f9]"
                  >
                    <option value="SSL">SSL/TLS</option>
                    <option value="STARTTLS">STARTTLS</option>
                    <option value="NINGUNA">Sin cifrado</option>
                  </select>
                </label>

                <label className="block md:col-span-2">
                  <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">
                    {passwordConfigurado
                      ? 'Nueva contrasena de aplicacion'
                      : 'Contrasena de aplicacion'}
                  </span>
                  <input
                    type="password"
                    autoComplete="new-password"
                    {...form.register('password')}
                    className="h-10 w-full rounded border border-[#c4c6cd] bg-white px-3 text-[14px] outline-none focus:border-[#075E54]"
                    placeholder={
                      passwordConfigurado
                        ? 'Dejar vacio para conservar la clave actual'
                        : 'Clave SMTP o app password de Gmail'
                    }
                  />
                </label>
              </div>
            </section>

            <aside className="space-y-4">
              <section className="rounded border border-[#c4c6cd] bg-[#fbf9fa]">
                <div className="border-b border-[#c4c6cd] px-4 py-3 text-[13px] font-bold uppercase tracking-wide text-[#44474c]">
                  Comprobantes
                </div>
                <div className="space-y-3 p-4">
                  <label className="flex items-center gap-2 rounded border border-[#c4c6cd] bg-white px-3 py-2 text-[13px] font-semibold text-[#041627]">
                    <input
                      type="checkbox"
                      {...form.register('enviar_facturas_email')}
                      className="h-4 w-4 accent-[#075E54]"
                    />
                    Permitir enviar facturas por email
                  </label>
                  <label className="flex items-center gap-2 rounded border border-[#c4c6cd] bg-white px-3 py-2 text-[13px] font-semibold text-[#041627]">
                    <input
                      type="checkbox"
                      {...form.register('enviar_facturas_automaticamente')}
                      className="h-4 w-4 accent-[#075E54]"
                    />
                    Enviar automaticamente al emitir
                  </label>
                  <label className="flex items-center gap-2 rounded border border-[#c4c6cd] bg-white px-3 py-2 text-[13px] font-semibold text-[#041627]">
                    <input
                      type="checkbox"
                      {...form.register('adjuntar_pdf')}
                      className="h-4 w-4 accent-[#075E54]"
                    />
                    Adjuntar PDF del comprobante
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">
                      Responder a
                    </span>
                    <input
                      type="email"
                      {...form.register('email_respuesta')}
                      className="h-10 w-full rounded border border-[#c4c6cd] bg-white px-3 text-[14px] outline-none focus:border-[#075E54]"
                      placeholder="administracion@empresa.com"
                    />
                  </label>

                  <label className="flex items-center gap-2 rounded border border-[#c4c6cd] bg-white px-3 py-2 text-[13px] font-semibold text-[#041627]">
                    <input
                      type="checkbox"
                      {...form.register('copia_oculta_admin')}
                      className="h-4 w-4 accent-[#075E54]"
                    />
                    Enviar copia oculta administrativa
                  </label>
                  <input
                    type="email"
                    {...form.register('email_copia_admin')}
                    className="h-10 w-full rounded border border-[#c4c6cd] bg-white px-3 text-[14px] outline-none focus:border-[#075E54]"
                    placeholder="copia@empresa.com"
                  />
                </div>
              </section>

              <section className="rounded border border-[#c4c6cd] bg-[#fbf9fa]">
                <div className="border-b border-[#c4c6cd] px-4 py-3 text-[13px] font-bold uppercase tracking-wide text-[#44474c]">
                  Prueba
                </div>
                <div className="space-y-3 p-4">
                  <input
                    type="email"
                    value={testDestino}
                    onChange={(event) => setTestDestino(event.target.value)}
                    className="h-10 w-full rounded border border-[#c4c6cd] bg-white px-3 text-[14px] outline-none focus:border-[#075E54]"
                    placeholder="destino@correo.com"
                  />
                  <button
                    type="button"
                    onClick={handleTest}
                    disabled={isTesting || !configQuery.data || !testDestino.trim()}
                    className="flex h-10 w-full items-center justify-center gap-2 rounded bg-[#075E54] px-4 text-[13px] font-semibold text-white hover:bg-[#0b6d62] disabled:opacity-60"
                  >
                    {isTesting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                    Enviar correo de prueba
                  </button>
                  {!emailActivo ? (
                    <div className="rounded border border-[#f3d19b] bg-[#fff7e8] px-3 py-2 text-[12px] font-semibold text-[#7a4f00]">
                      Los botones de enviar email del sistema quedan bloqueados hasta que esta prueba sea exitosa.
                    </div>
                  ) : null}
                  {configQuery.data?.ultimo_test_at ? (
                    <div className="text-[12px] text-[#44474c]">
                      Ultima prueba: {dateTime(configQuery.data.ultimo_test_at)}
                    </div>
                  ) : null}
                </div>
              </section>
            </aside>
          </div>
        )}
      </form>
    </div>
  );
};

export default ConfiguracionEmailPage;
