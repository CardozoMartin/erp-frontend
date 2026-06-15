import { ExternalLink, Loader2, QrCode, Search } from 'lucide-react';
import type { MpPosResponse, MpTestResponse } from '../../POSAuxiliares/api/posAux.api';

interface Props {
  altaBloqueada: boolean;
  posName: string; onPosNameChange: (v: string) => void;
  posExternalId: string; onPosExternalIdChange: (v: string) => void;
  category: number; onCategoryChange: (v: number) => void;
  fixedAmount: boolean; onFixedAmountChange: (v: boolean) => void;
  posResult: MpPosResponse | null;
  testResult: MpTestResponse | null;
  mpNickname: string;
  mpUserId: string;
  storeId: string;
  canUseToken: boolean;
  canCreatePos: boolean;
  isCreatingPos: boolean;
  isSearchingPos: boolean;
  busy: boolean;
  onCrearPos: () => void;
  onBuscarPos: () => void;
}

const inputClass = 'h-10 w-full rounded border border-[#c4c6cd] bg-white px-3 text-[14px] outline-none focus:border-[#075E54]';
const labelClass = 'mb-1 block text-[12px] font-semibold text-[#44474c]';

export const MpFormAltaRight = ({
  altaBloqueada,
  posName, onPosNameChange,
  posExternalId, onPosExternalIdChange,
  category, onCategoryChange,
  fixedAmount, onFixedAmountChange,
  posResult, testResult, mpNickname, mpUserId, storeId,
  canUseToken, canCreatePos,
  isCreatingPos, isSearchingPos, busy,
  onCrearPos, onBuscarPos,
}: Props) => (
  <aside className="space-y-4">
    <section className="rounded border border-[#c4c6cd] bg-[#fbf9fa]">
      <div className="border-b border-[#c4c6cd] px-4 py-3 text-[13px] font-bold uppercase tracking-wide text-[#44474c]">
        POS y QR
      </div>
      <div className="space-y-4 p-4">
        <label className="block">
          <span className={labelClass}>Nombre POS</span>
          <input value={posName} onChange={(e) => onPosNameChange(e.target.value)} disabled={altaBloqueada} className={inputClass} />
        </label>
        <label className="block">
          <span className={labelClass}>External id POS</span>
          <input value={posExternalId} onChange={(e) => onPosExternalIdChange(e.target.value)} disabled={altaBloqueada} className={inputClass} />
        </label>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="block">
            <span className={labelClass}>Categoria</span>
            <input type="number" value={category} onChange={(e) => onCategoryChange(Number(e.target.value))} disabled={altaBloqueada} className={inputClass} />
          </label>
          <label className="mt-5 flex h-10 items-center gap-2 rounded border border-[#c4c6cd] bg-white px-3 text-[13px] font-semibold text-[#041627]">
            <input type="checkbox" checked={fixedAmount} onChange={(e) => onFixedAmountChange(e.target.checked)} disabled={altaBloqueada} className="h-4 w-4 accent-[#075E54]" />
            Monto fijo
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={onCrearPos} disabled={altaBloqueada || !canCreatePos || isCreatingPos} className="flex h-9 items-center gap-2 rounded bg-[#075E54] px-4 text-[13px] font-semibold text-white hover:bg-[#0b6d62] disabled:opacity-60">
            {isCreatingPos ? <Loader2 size={15} className="animate-spin" /> : <QrCode size={15} />}
            Crear POS
          </button>
          <button type="button" onClick={onBuscarPos} disabled={altaBloqueada || !canUseToken || !posExternalId.trim() || isSearchingPos} className="flex h-9 items-center gap-2 rounded border border-[#c4c6cd] bg-white px-4 text-[13px] font-semibold text-[#041627] hover:bg-[#f4f5f6] disabled:opacity-60">
            {isSearchingPos ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
            Buscar POS
          </button>
        </div>

        {posResult ? (
          <div className="rounded border border-[#cfe2de] bg-white p-3">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-[13px] font-semibold text-[#041627]">
              <span>{posResult.name}</span>
              <span className="text-[#075E54]">{posResult.external_id}</span>
            </div>
            {posResult.qr?.image ? (
              <div className="flex flex-wrap items-start gap-3">
                <img src={posResult.qr.image} alt="QR Mercado Pago" className="h-40 w-40 rounded border border-[#c4c6cd] bg-white object-contain" />
                <div className="space-y-2">
                  <a href={posResult.qr.image} target="_blank" rel="noreferrer" className="flex h-9 items-center gap-2 rounded border border-[#c4c6cd] bg-white px-3 text-[13px] font-semibold text-[#041627] hover:bg-[#f4f5f6]">
                    <ExternalLink size={14} /> Abrir imagen
                  </a>
                  {posResult.qr.template_document ? (
                    <a href={posResult.qr.template_document} target="_blank" rel="noreferrer" className="flex h-9 items-center gap-2 rounded border border-[#c4c6cd] bg-white px-3 text-[13px] font-semibold text-[#041627] hover:bg-[#f4f5f6]">
                      <ExternalLink size={14} /> Abrir PDF
                    </a>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>

    <section className="rounded border border-[#c4c6cd] bg-[#fbf9fa]">
      <div className="border-b border-[#c4c6cd] px-4 py-3 text-[13px] font-bold uppercase tracking-wide text-[#44474c]">
        Estado
      </div>
      <div className="space-y-2 p-4 text-[13px]">
        <div className="flex justify-between gap-3 rounded border border-[#c4c6cd] bg-white px-3 py-2">
          <span className="text-[#44474c]">Usuario</span>
          <span className="font-semibold text-[#041627]">{mpNickname || mpUserId || '-'}</span>
        </div>
        <div className="flex justify-between gap-3 rounded border border-[#c4c6cd] bg-white px-3 py-2">
          <span className="text-[#44474c]">Tienda</span>
          <span className="font-semibold text-[#041627]">{storeId || '-'}</span>
        </div>
        <div className="flex justify-between gap-3 rounded border border-[#c4c6cd] bg-white px-3 py-2">
          <span className="text-[#44474c]">POS</span>
          <span className="font-semibold text-[#041627]">{posExternalId || '-'}</span>
        </div>
        <div className={`rounded border px-3 py-2 font-semibold ${testResult?.ok ? 'border-[#cfe2de] bg-[#f3fbf9] text-[#075E54]' : 'border-[#f3d19b] bg-[#fff7e8] text-[#7a4f00]'}`}>
          {testResult
            ? testResult.ok
              ? `Activo: ${testResult.mpUser || ''} - ${testResult.posNombre || ''}`
              : `Error: ${testResult.error || testResult.estado}`
            : busy
              ? 'Procesando'
              : 'Pendiente de prueba'}
        </div>
      </div>
    </section>
  </aside>
);
