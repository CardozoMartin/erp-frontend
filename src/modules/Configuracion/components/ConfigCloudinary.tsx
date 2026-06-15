import { CheckCircle2, ImageIcon, Loader2, Save } from 'lucide-react';
import { dateTime } from '../../POSAuxiliares/utils/format';

interface CloudinaryData {
  disponible?: boolean;
  fuente?: string;
  ultimo_test_at?: string;
  api_secret_configurado?: boolean;
}

interface Props {
  cloudinaryData?: CloudinaryData | null;
  cloudName: string; onCloudNameChange: (v: string) => void;
  cloudApiKey: string; onCloudApiKeyChange: (v: string) => void;
  cloudApiSecret: string; onCloudApiSecretChange: (v: string) => void;
  cloudFolder: string; onCloudFolderChange: (v: string) => void;
  isSavingCloudinary: boolean;
  isTestingCloudinary: boolean;
  hasSucursal: boolean;
  onGuardar: () => void;
  onProbar: () => void;
}

export const ConfigCloudinary = ({
  cloudinaryData, cloudName, onCloudNameChange,
  cloudApiKey, onCloudApiKeyChange,
  cloudApiSecret, onCloudApiSecretChange,
  cloudFolder, onCloudFolderChange,
  isSavingCloudinary, isTestingCloudinary, hasSucursal,
  onGuardar, onProbar,
}: Props) => {
  const disponible = !!cloudinaryData?.disponible;

  return (
    <section className="rounded border border-[#c4c6cd] bg-[#fbf9fa]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#c4c6cd] px-4 py-3">
        <div className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-wide text-[#44474c]">
          <ImageIcon size={15} className="text-[#075E54]" />
          Cloudinary e imagenes
        </div>
        <span
          className={`inline-flex items-center gap-1 rounded border px-2.5 py-1 text-[11px] font-bold ${
            disponible
              ? 'border-[#cfe2de] bg-[#f3fbf9] text-[#075E54]'
              : 'border-[#f6d58f] bg-[#fff8e6] text-[#8a5a00]'
          }`}
        >
          {disponible ? <CheckCircle2 size={13} /> : null}
          {disponible ? 'Subida habilitada' : 'Pendiente de verificacion'}
        </span>
      </div>

      <div className="grid gap-4 p-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">Cloud name</span>
          <input value={cloudName} onChange={(e) => onCloudNameChange(e.target.value)} placeholder="mi-cloud" className="h-10 w-full rounded border border-[#c4c6cd] bg-white px-3 text-[14px] text-[#041627] outline-none focus:border-[#075E54]" />
        </label>
        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">API key</span>
          <input value={cloudApiKey} onChange={(e) => onCloudApiKeyChange(e.target.value)} className="h-10 w-full rounded border border-[#c4c6cd] bg-white px-3 text-[14px] text-[#041627] outline-none focus:border-[#075E54]" />
        </label>
        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">API secret</span>
          <input type="password" value={cloudApiSecret} onChange={(e) => onCloudApiSecretChange(e.target.value)} placeholder={cloudinaryData?.api_secret_configurado ? 'Ya configurado' : ''} className="h-10 w-full rounded border border-[#c4c6cd] bg-white px-3 text-[14px] text-[#041627] outline-none focus:border-[#075E54]" />
        </label>
        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">Carpeta base</span>
          <input value={cloudFolder} onChange={(e) => onCloudFolderChange(e.target.value)} placeholder="productos" className="h-10 w-full rounded border border-[#c4c6cd] bg-white px-3 text-[14px] text-[#041627] outline-none focus:border-[#075E54]" />
        </label>

        <div className="flex flex-wrap items-center gap-2 md:col-span-2">
          <button type="button" onClick={onGuardar} disabled={!hasSucursal || isSavingCloudinary} className="flex h-9 items-center gap-2 rounded bg-[#075E54] px-4 text-[13px] font-semibold text-white hover:bg-[#0b6d62] disabled:opacity-60">
            <Save size={15} />
            Guardar Cloudinary
          </button>
          <button type="button" onClick={onProbar} disabled={!hasSucursal || isTestingCloudinary} className="flex h-9 items-center gap-2 rounded border border-[#c4c6cd] bg-white px-4 text-[13px] font-semibold text-[#041627] hover:bg-[#f4f5f6] disabled:opacity-60">
            {isTestingCloudinary ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
            Probar y habilitar
          </button>
          <span className="text-[12px] text-[#44474c]">
            {cloudinaryData?.fuente === 'ENV'
              ? 'Usando credenciales del servidor hasta que guardes una configuracion por sucursal.'
              : cloudinaryData?.ultimo_test_at
                ? `Verificado ${dateTime(cloudinaryData.ultimo_test_at)}`
                : 'Al guardar se deshabilita hasta probar la conexion.'}
          </span>
        </div>
      </div>
    </section>
  );
};
