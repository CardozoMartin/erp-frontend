import { CheckCircle2, ImageIcon, Loader2, Save, Store } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../../../store/auth.store';
import { useConfiguracionCloudinary, usePosAuxMutation } from '../../POSAuxiliares/hooks/usePosAux';
import { dateTime } from '../../POSAuxiliares/utils/format';

const ConfiguracionCloudinaryPage = () => {
  const sucursalActiva = useAuthStore((state) => state.sucursalActiva);
  const configQuery = useConfiguracionCloudinary();
  const mutations = usePosAuxMutation();
  const [cloudName, setCloudName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [folder, setFolder] = useState('productos');

  useEffect(() => {
    if (!configQuery.data) return;
    setCloudName(configQuery.data.cloud_name ?? '');
    setApiKey(configQuery.data.api_key ?? '');
    setApiSecret('');
    setFolder(configQuery.data.carpeta_base ?? 'productos');
  }, [configQuery.data]);

  const disponible = !!configQuery.data?.disponible;

  const guardar = () => {
    if (!sucursalActiva?.id) return;
    mutations.guardarConfiguracionCloudinary.mutate({
      sucursal_id: sucursalActiva.id,
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret || undefined,
      carpeta_base: folder || 'productos',
    });
  };

  const probar = () => {
    if (!sucursalActiva?.id) return;
    mutations.probarConfiguracionCloudinary.mutate(sucursalActiva.id);
  };

  return (
    <div className="min-h-[calc(100vh-52px)] bg-[#f3f4f6] px-4 py-4">
      <section className="mx-auto max-w-[900px] rounded-lg border border-[#c4c6cd] bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#c4c6cd] px-4 py-3">
          <div>
            <div className="flex items-center gap-2 text-[15px] font-bold text-[#041627]">
              <ImageIcon size={17} className="text-[#075E54]" />
              Configuracion Cloudinary
            </div>
            <div className="mt-1 flex items-center gap-2 text-[13px] text-[#44474c]">
              <Store size={14} />
              {sucursalActiva?.nombre ?? 'Sin sucursal seleccionada'}
            </div>
          </div>
          <span
            className={`inline-flex items-center gap-1 rounded border px-3 py-1 text-[12px] font-bold ${
              disponible
                ? 'border-[#cfe2de] bg-[#f3fbf9] text-[#075E54]'
                : 'border-[#f6d58f] bg-[#fff8e6] text-[#8a5a00]'
            }`}
          >
            {disponible ? <CheckCircle2 size={14} /> : null}
            {disponible ? 'Subida habilitada' : 'Pendiente de verificacion'}
          </span>
        </div>

        {!sucursalActiva?.id ? (
          <div className="px-4 py-10 text-center text-[14px] text-[#44474c]">
            Seleccione una sucursal para configurar Cloudinary.
          </div>
        ) : configQuery.isLoading ? (
          <div className="flex items-center justify-center gap-2 px-4 py-10 text-[14px] text-[#44474c]">
            <Loader2 size={17} className="animate-spin" />
            Cargando configuracion
          </div>
        ) : (
          <div className="grid gap-4 p-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">Cloud name</span>
              <input
                value={cloudName}
                onChange={(event) => setCloudName(event.target.value)}
                className="h-10 w-full rounded border border-[#c4c6cd] px-3 text-[14px] outline-none focus:border-[#075E54]"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">API key</span>
              <input
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                className="h-10 w-full rounded border border-[#c4c6cd] px-3 text-[14px] outline-none focus:border-[#075E54]"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">API secret</span>
              <input
                type="password"
                value={apiSecret}
                onChange={(event) => setApiSecret(event.target.value)}
                placeholder={configQuery.data?.api_secret_configurado ? 'Ya configurado' : ''}
                className="h-10 w-full rounded border border-[#c4c6cd] px-3 text-[14px] outline-none focus:border-[#075E54]"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">Carpeta base</span>
              <input
                value={folder}
                onChange={(event) => setFolder(event.target.value)}
                placeholder="productos"
                className="h-10 w-full rounded border border-[#c4c6cd] px-3 text-[14px] outline-none focus:border-[#075E54]"
              />
            </label>
            <div className="flex flex-wrap items-center gap-2 md:col-span-2">
              <button
                type="button"
                onClick={guardar}
                disabled={mutations.guardarConfiguracionCloudinary.isPending}
                className="flex h-9 items-center gap-2 rounded bg-[#075E54] px-4 text-[13px] font-semibold text-white hover:bg-[#0b6d62] disabled:opacity-60"
              >
                <Save size={15} />
                Guardar
              </button>
              <button
                type="button"
                onClick={probar}
                disabled={mutations.probarConfiguracionCloudinary.isPending}
                className="flex h-9 items-center gap-2 rounded border border-[#c4c6cd] bg-white px-4 text-[13px] font-semibold text-[#041627] hover:bg-[#f4f5f6] disabled:opacity-60"
              >
                {mutations.probarConfiguracionCloudinary.isPending ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                Probar y habilitar
              </button>
              <span className="text-[12px] text-[#44474c]">
                {configQuery.data?.fuente === 'ENV'
                  ? 'Usando variables del servidor hasta guardar una configuracion por sucursal.'
                  : configQuery.data?.ultimo_test_at
                    ? `Verificado ${dateTime(configQuery.data.ultimo_test_at)}`
                    : 'Al guardar queda pendiente hasta probar la conexion.'}
              </span>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default ConfiguracionCloudinaryPage;
