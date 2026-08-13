import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  CloudUpload,
  Database,
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
  Play,
  RefreshCw,
  Save,
  ShieldCheck,
  Wifi,
} from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useBackupConfig, useBackupHistorial, useBackupMutations } from '../hooks/useBackup';
import type { IGuardarConfigBackupPayload, FrecuenciaBackup } from '../types/backup.type';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatBytes = (bytes: number | null) => {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const formatFecha = (iso: string) =>
  new Date(iso).toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

const HORAS = Array.from({ length: 24 }, (_, i) => ({
  value: i,
  label: `${String(i).padStart(2, '0')}:00 hs`,
}));

// ─── Sección colapsable ───────────────────────────────────────────────────────

const Seccion = ({ titulo, children, defaultOpen = true }: { titulo: string; children: React.ReactNode; defaultOpen?: boolean }) => {
  const [abierto, setAbierto] = useState(defaultOpen);
  return (
    <div className="rounded-lg border border-[#c4c6cd] bg-white">
      <button
        type="button"
        onClick={() => setAbierto(v => !v)}
        className="flex w-full items-center justify-between px-5 py-3.5 text-[14px] font-bold text-[#041627]"
      >
        {titulo}
        {abierto ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {abierto && <div className="border-t border-[#c4c6cd] px-5 py-4">{children}</div>}
    </div>
  );
};

// ─── Campo con toggle de visibilidad ─────────────────────────────────────────

const SecretInput = ({ label, placeholder, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) => {
  const [visible, setVisible] = useState(false);
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[12px] font-bold uppercase tracking-wider text-gray-500">{label}</label>
      <div className="relative">
        <input
          {...props}
          type={visible ? 'text' : 'password'}
          placeholder={placeholder}
          className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 pr-10 text-[13px] text-[#041627] outline-none focus:border-[#075E54] focus:ring-2 focus:ring-[#075E54]/15"
        />
        <button
          type="button"
          onClick={() => setVisible(v => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          {visible ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  );
};

// ─── Badge de estado ──────────────────────────────────────────────────────────

const EstadoBadge = ({ estado }: { estado: string }) => {
  if (estado === 'EXITOSO') return (
    <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-bold text-green-700">
      <CheckCircle2 size={11} /> Exitoso
    </span>
  );
  if (estado === 'FALLIDO') return (
    <span className="flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-700">
      <AlertCircle size={11} /> Fallido
    </span>
  );
  return (
    <span className="flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-[11px] font-bold text-yellow-700">
      <Loader2 size={11} className="animate-spin" /> En proceso
    </span>
  );
};

// ─── Página principal ─────────────────────────────────────────────────────────

interface FormCredenciales {
  client_id: string;
  client_secret: string;
  refresh_token: string;
}

interface FormProgramacion {
  carpeta_drive: string;
  frecuencia: FrecuenciaBackup;
  hora_backup: number;
  retener_ultimos: number;
  activo: boolean;
}

const ConfiguracionBackupPage = () => {
  const configQuery = useBackupConfig();
  const historialQuery = useBackupHistorial(15);
  const mutations = useBackupMutations();

  const config = configQuery.data;

  const credencialesForm = useForm<FormCredenciales>({
    defaultValues: { client_id: '', client_secret: '', refresh_token: '' },
  });

  const programacionForm = useForm<FormProgramacion>({
    values: {
      carpeta_drive: config?.carpeta_drive ?? '',
      frecuencia: config?.frecuencia ?? 'DIARIO',
      hora_backup: config?.hora_backup ?? 3,
      retener_ultimos: config?.retener_ultimos ?? 7,
      activo: config?.activo ?? true,
    },
  });

  const watchFrecuencia = programacionForm.watch('frecuencia');

  const guardarCredenciales = (v: FormCredenciales) => {
    const payload: IGuardarConfigBackupPayload = {};
    if (v.client_id) payload.client_id = v.client_id;
    if (v.client_secret) payload.client_secret = v.client_secret;
    if (v.refresh_token) payload.refresh_token = v.refresh_token;
    mutations.guardarConfig.mutate(payload, {
      onSuccess: () => credencialesForm.reset(),
    });
  };

  const guardarProgramacion = (v: FormProgramacion) => {
    mutations.guardarConfig.mutate({
      carpeta_drive: v.carpeta_drive || undefined,
      frecuencia: v.frecuencia,
      hora_backup: Number(v.hora_backup),
      retener_ultimos: Number(v.retener_ultimos),
      activo: v.activo,
    });
  };

  return (
    <div className="min-h-[calc(100vh-52px)] bg-[#f3f4f6] px-4 py-4">
      <div className="mx-auto max-w-[900px] space-y-4">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#c4c6cd] bg-white px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eef8f6] text-[#075E54]">
              <Database size={20} />
            </div>
            <div>
              <h1 className="text-[16px] font-bold text-[#041627]">Backup automático — Google Drive</h1>
              <p className="text-[12px] text-[#44474c]">
                Tus datos se respaldan automáticamente en tu Google Drive personal. Gratis, seguro, siempre disponible.
              </p>
            </div>
          </div>
          {config && (
            <span className={`rounded-full px-3 py-1 text-[12px] font-bold ${config.activo && config.tiene_credenciales ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {config.activo && config.tiene_credenciales ? '● Activo' : '○ Inactivo'}
            </span>
          )}
        </div>

        {/* Guía de setup */}
        <Seccion titulo="1 — Cómo obtener tus credenciales de Google" defaultOpen={!config?.tiene_credenciales}>
          <div className="space-y-3 text-[13px] text-[#44474c]">
            <p className="font-semibold text-[#041627]">Solo necesitás hacer esto una vez:</p>
            <ol className="list-decimal space-y-2 pl-5">
              <li>
                Entrá a{' '}
                <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[#075E54] underline">
                  Google Cloud Console <ExternalLink size={11} />
                </a>{' '}
                y creá un proyecto nuevo (ej: "Backup ERP").
              </li>
              <li>
                Activá la <strong>Google Drive API</strong>: en el menú izquierdo → APIs y servicios → Biblioteca → buscá "Google Drive API" → Habilitar.
              </li>
              <li>
                Creá credenciales OAuth 2.0: APIs y servicios → Credenciales → Crear credenciales → ID de cliente OAuth → Tipo: <strong>Aplicación de escritorio</strong>.
              </li>
              <li>
                Copiá el <strong>Client ID</strong> y el <strong>Client Secret</strong> que te muestra Google.
              </li>
              <li>
                Para obtener el <strong>Refresh Token</strong>, usá el{' '}
                <a href="https://developers.google.com/oauthplayground" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[#075E54] underline">
                  OAuth 2.0 Playground <ExternalLink size={11} />
                </a>
                {': '} hacé click en el ⚙️ arriba a la derecha → activá "Use your own OAuth credentials" → pegá tu Client ID y Secret → en la lista seleccioná <em>Drive API v3 → .../auth/drive</em> → Authorize → Exchange code for tokens → copiá el <strong>Refresh Token</strong>.
              </li>
            </ol>
            <p className="rounded bg-[#fffbeb] p-3 text-[#92400e]">
              ⚡ El Refresh Token no vence — lo configurás una vez y el sistema lo usa para siempre.
            </p>
          </div>
        </Seccion>

        {/* Credenciales */}
        <Seccion titulo="2 — Credenciales de Google Drive">
          <form onSubmit={credencialesForm.handleSubmit(guardarCredenciales)} className="space-y-4">
            {config?.tiene_credenciales && (
              <div className="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-2.5 text-[13px] text-green-700">
                <ShieldCheck size={16} />
                Credenciales configuradas y cifradas. Completá los campos solo si querés reemplazarlas.
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <SecretInput
                label="Client ID"
                placeholder={config?.tiene_credenciales ? '••••••• (ya configurado)' : 'Pegá tu Client ID'}
                {...credencialesForm.register('client_id')}
              />
              <SecretInput
                label="Client Secret"
                placeholder={config?.tiene_credenciales ? '••••••• (ya configurado)' : 'Pegá tu Client Secret'}
                {...credencialesForm.register('client_secret')}
              />
            </div>

            <SecretInput
              label="Refresh Token"
              placeholder={config?.tiene_credenciales ? '••••••• (ya configurado)' : 'Pegá tu Refresh Token'}
              {...credencialesForm.register('refresh_token')}
            />

            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={mutations.guardarConfig.isPending}
                className="flex h-9 items-center gap-2 rounded bg-[#075E54] px-4 text-[13px] font-semibold text-white hover:bg-[#064d45] disabled:opacity-60"
              >
                {mutations.guardarConfig.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Guardar credenciales
              </button>

              <button
                type="button"
                disabled={mutations.probarConexion.isPending || !config?.tiene_credenciales}
                onClick={() => mutations.probarConexion.mutate()}
                className="flex h-9 items-center gap-2 rounded border border-[#075E54] px-4 text-[13px] font-semibold text-[#075E54] hover:bg-[#f3fbf9] disabled:opacity-50"
              >
                {mutations.probarConexion.isPending ? <Loader2 size={14} className="animate-spin" /> : <Wifi size={14} />}
                Probar conexión
              </button>
            </div>
          </form>
        </Seccion>

        {/* Programación */}
        <Seccion titulo="3 — Programación del backup automático">
          <form onSubmit={programacionForm.handleSubmit(guardarProgramacion)} className="space-y-4">

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Frecuencia */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-bold uppercase tracking-wider text-gray-500">Frecuencia</label>
                <select
                  {...programacionForm.register('frecuencia')}
                  className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-[13px] text-[#041627] outline-none focus:border-[#075E54]"
                >
                  <option value="DIARIO">Diario</option>
                  <option value="SEMANAL">Semanal (domingos)</option>
                  <option value="MANUAL">Solo manual</option>
                </select>
              </div>

              {/* Hora */}
              {watchFrecuencia !== 'MANUAL' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold uppercase tracking-wider text-gray-500">Hora del backup</label>
                  <select
                    {...programacionForm.register('hora_backup', { valueAsNumber: true })}
                    className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-[13px] text-[#041627] outline-none focus:border-[#075E54]"
                  >
                    {HORAS.map(h => (
                      <option key={h.value} value={h.value}>{h.label}</option>
                    ))}
                  </select>
                  <p className="text-[11px] text-gray-400">Recomendado: horario de baja actividad (ej: 03:00 hs)</p>
                </div>
              )}

              {/* Retener */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-bold uppercase tracking-wider text-gray-500">Backups a conservar</label>
                <input
                  type="number"
                  min={1} max={30}
                  {...programacionForm.register('retener_ultimos', { valueAsNumber: true })}
                  className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-[13px] text-[#041627] outline-none focus:border-[#075E54]"
                />
                <p className="text-[11px] text-gray-400">Los backups más viejos se eliminan de Drive automáticamente</p>
              </div>

              {/* Carpeta Drive */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-bold uppercase tracking-wider text-gray-500">
                  ID de carpeta en Drive <span className="font-normal normal-case text-gray-400">(opcional)</span>
                </label>
                <input
                  type="text"
                  {...programacionForm.register('carpeta_drive')}
                  placeholder="Dejá vacío para guardar en raíz"
                  className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-[13px] text-[#041627] outline-none focus:border-[#075E54]"
                />
                <p className="text-[11px] text-gray-400">El ID está en la URL de Drive: drive.google.com/drive/folders/<strong>ESTE_ID</strong></p>
              </div>
            </div>

            {/* Activo toggle */}
            <div className="flex items-center gap-3 rounded-lg border border-[#c4c6cd] bg-[#f9fafb] px-4 py-3">
              <input
                type="checkbox"
                id="activo"
                {...programacionForm.register('activo')}
                className="h-4 w-4 rounded border-gray-300 accent-[#075E54]"
              />
              <label htmlFor="activo" className="cursor-pointer text-[13px] font-medium text-[#041627]">
                Backup automático activo
              </label>
            </div>

            <button
              type="submit"
              disabled={mutations.guardarConfig.isPending}
              className="flex h-9 items-center gap-2 rounded bg-[#075E54] px-4 text-[13px] font-semibold text-white hover:bg-[#064d45] disabled:opacity-60"
            >
              {mutations.guardarConfig.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Guardar programación
            </button>
          </form>
        </Seccion>

        {/* Backup manual */}
        <Seccion titulo="4 — Backup manual">
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              disabled={mutations.ejecutarBackup.isPending || !config?.tiene_credenciales}
              onClick={() => mutations.ejecutarBackup.mutate()}
              className="flex h-10 items-center gap-2 rounded-lg bg-[#075E54] px-5 text-[14px] font-semibold text-white hover:bg-[#064d45] disabled:opacity-50"
            >
              {mutations.ejecutarBackup.isPending
                ? <><Loader2 size={16} className="animate-spin" /> Iniciando…</>
                : <><Play size={16} /> Hacer backup ahora</>
              }
            </button>
            {!config?.tiene_credenciales && (
              <p className="text-[13px] text-amber-600">Configurá las credenciales primero</p>
            )}
            <button
              type="button"
              onClick={() => historialQuery.refetch()}
              className="ml-auto flex items-center gap-1.5 text-[12px] text-[#44474c] hover:text-[#075E54]"
            >
              <RefreshCw size={13} className={historialQuery.isFetching ? 'animate-spin' : ''} />
              Actualizar historial
            </button>
          </div>
        </Seccion>

        {/* Historial */}
        <Seccion titulo="Historial de backups">
          {historialQuery.isLoading ? (
            <div className="flex items-center gap-2 py-6 text-[13px] text-[#44474c]">
              <Loader2 size={16} className="animate-spin" /> Cargando…
            </div>
          ) : !historialQuery.data?.length ? (
            <div className="flex flex-col items-center gap-2 py-8 text-[#9ca3af]">
              <CloudUpload size={32} strokeWidth={1.4} />
              <p className="text-[13px]">Sin backups todavía</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-[#e5e7eb] text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    <th className="pb-2 text-left">Fecha</th>
                    <th className="pb-2 text-left">Archivo</th>
                    <th className="pb-2 text-center">Estado</th>
                    <th className="pb-2 text-center">Origen</th>
                    <th className="pb-2 text-right">Tamaño</th>
                    <th className="pb-2 text-center">Drive</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f3f4f6]">
                  {historialQuery.data.map(h => (
                    <tr key={h.id} className="hover:bg-[#f9fafb]">
                      <td className="py-2.5 text-[#44474c]">
                        <div className="flex items-center gap-1.5">
                          <Clock size={12} className="shrink-0 text-gray-400" />
                          {formatFecha(h.created_at)}
                        </div>
                      </td>
                      <td className="py-2.5 font-mono text-[11px] text-[#44474c]">
                        {h.nombre_archivo ?? '—'}
                      </td>
                      <td className="py-2.5 text-center">
                        <EstadoBadge estado={h.estado} />
                      </td>
                      <td className="py-2.5 text-center">
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${h.origen === 'AUTOMATICO' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                          {h.origen === 'AUTOMATICO' ? 'Auto' : 'Manual'}
                        </span>
                      </td>
                      <td className="py-2.5 text-right text-[#44474c]">{formatBytes(h.tamano_bytes)}</td>
                      <td className="py-2.5 text-center">
                        {h.drive_link ? (
                          <a href={h.drive_link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[#075E54] hover:underline">
                            <ExternalLink size={13} />
                          </a>
                        ) : h.error ? (
                          <span className="text-[11px] text-red-500" title={h.error}>Error</span>
                        ) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Seccion>

      </div>
    </div>
  );
};

export default ConfiguracionBackupPage;
