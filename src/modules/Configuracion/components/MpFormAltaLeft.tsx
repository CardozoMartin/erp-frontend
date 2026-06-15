import { Loader2, Save, Search, Store } from 'lucide-react';
import type { MpStoreResponse } from '../../POSAuxiliares/api/posAux.api';

interface Props {
  altaBloqueada: boolean;
  accessToken: string; onAccessTokenChange: (v: string) => void;
  mpUserId: string; onMpUserIdChange: (v: string) => void;
  mpNickname: string; onMpNicknameChange: (v: string) => void;
  storeName: string; onStoreNameChange: (v: string) => void;
  storeExternalId: string; onStoreExternalIdChange: (v: string) => void;
  storeId: string; onStoreIdChange: (v: string) => void;
  streetName: string; onStreetNameChange: (v: string) => void;
  streetNumber: string; onStreetNumberChange: (v: string) => void;
  cityName: string; onCityNameChange: (v: string) => void;
  stateName: string; onStateNameChange: (v: string) => void;
  latitude: string; onLatitudeChange: (v: string) => void;
  longitude: string; onLongitudeChange: (v: string) => void;
  openHour: string; onOpenHourChange: (v: string) => void;
  closeHour: string; onCloseHourChange: (v: string) => void;
  reference: string; onReferenceChange: (v: string) => void;
  storeResult: MpStoreResponse | null;
  canUseToken: boolean;
  canCreateStore: boolean;
  canSearchStore: boolean;
  isReadingUser: boolean;
  isCreatingStore: boolean;
  isSearchingStore: boolean;
  onLeerUsuario: () => void;
  onCrearStore: () => void;
  onBuscarStore: () => void;
}

const inputClass = 'h-10 w-full rounded border border-[#c4c6cd] bg-white px-3 text-[14px] outline-none focus:border-[#075E54]';
const labelClass = 'mb-1 block text-[12px] font-semibold text-[#44474c]';

export const MpFormAltaLeft = ({
  altaBloqueada,
  accessToken, onAccessTokenChange,
  mpUserId, onMpUserIdChange,
  mpNickname, onMpNicknameChange,
  storeName, onStoreNameChange,
  storeExternalId, onStoreExternalIdChange,
  storeId, onStoreIdChange,
  streetName, onStreetNameChange,
  streetNumber, onStreetNumberChange,
  cityName, onCityNameChange,
  stateName, onStateNameChange,
  latitude, onLatitudeChange,
  longitude, onLongitudeChange,
  openHour, onOpenHourChange,
  closeHour, onCloseHourChange,
  reference, onReferenceChange,
  storeResult,
  canUseToken, canCreateStore, canSearchStore,
  isReadingUser, isCreatingStore, isSearchingStore,
  onLeerUsuario, onCrearStore, onBuscarStore,
}: Props) => (
  <div className="space-y-4">
    <section className="rounded border border-[#c4c6cd] bg-[#fbf9fa]">
      <div className="border-b border-[#c4c6cd] px-4 py-3 text-[13px] font-bold uppercase tracking-wide text-[#44474c]">
        Credencial
      </div>
      <div className="grid gap-4 p-4 md:grid-cols-[1fr_auto]">
        <label className="block">
          <span className={labelClass}>Access token</span>
          <input type="password" autoComplete="off" value={accessToken} onChange={(e) => onAccessTokenChange(e.target.value)} disabled={altaBloqueada} placeholder="APP_USR-..." className={inputClass} />
        </label>
        <button type="button" onClick={onLeerUsuario} disabled={altaBloqueada || !canUseToken || isReadingUser} className="mt-5 flex h-10 items-center justify-center gap-2 rounded bg-[#075E54] px-4 text-[13px] font-semibold text-white hover:bg-[#0b6d62] disabled:opacity-60">
          {isReadingUser ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
          Leer usuario
        </button>
        <label className="block">
          <span className={labelClass}>MP user id</span>
          <input value={mpUserId} onChange={(e) => onMpUserIdChange(e.target.value)} disabled={altaBloqueada} className={inputClass} />
        </label>
        <label className="block">
          <span className={labelClass}>Usuario</span>
          <input value={mpNickname} onChange={(e) => onMpNicknameChange(e.target.value)} disabled={altaBloqueada} className={inputClass} />
        </label>
      </div>
    </section>

    <section className="rounded border border-[#c4c6cd] bg-[#fbf9fa]">
      <div className="border-b border-[#c4c6cd] px-4 py-3 text-[13px] font-bold uppercase tracking-wide text-[#44474c]">
        Tienda
      </div>
      <div className="grid gap-4 p-4 md:grid-cols-2">
        <label className="block">
          <span className={labelClass}>Nombre</span>
          <input value={storeName} onChange={(e) => onStoreNameChange(e.target.value)} disabled={altaBloqueada} className={inputClass} />
        </label>
        <label className="block">
          <span className={labelClass}>External id tienda</span>
          <input value={storeExternalId} onChange={(e) => onStoreExternalIdChange(e.target.value)} disabled={altaBloqueada} className={inputClass} />
        </label>
        <label className="block">
          <span className={labelClass}>Calle</span>
          <input value={streetName} onChange={(e) => onStreetNameChange(e.target.value)} disabled={altaBloqueada} className={inputClass} />
        </label>
        <label className="block">
          <span className={labelClass}>Numero</span>
          <input value={streetNumber} onChange={(e) => onStreetNumberChange(e.target.value)} disabled={altaBloqueada} className={inputClass} />
        </label>
        <label className="block">
          <span className={labelClass}>Ciudad</span>
          <input value={cityName} onChange={(e) => onCityNameChange(e.target.value)} disabled={altaBloqueada} className={inputClass} />
        </label>
        <label className="block">
          <span className={labelClass}>Provincia</span>
          <input value={stateName} onChange={(e) => onStateNameChange(e.target.value)} disabled={altaBloqueada} className={inputClass} />
        </label>
        <label className="block">
          <span className={labelClass}>Latitud</span>
          <input value={latitude} onChange={(e) => onLatitudeChange(e.target.value)} disabled={altaBloqueada} className={inputClass} />
        </label>
        <label className="block">
          <span className={labelClass}>Longitud</span>
          <input value={longitude} onChange={(e) => onLongitudeChange(e.target.value)} disabled={altaBloqueada} className={inputClass} />
        </label>
        <label className="block">
          <span className={labelClass}>Apertura lunes</span>
          <input type="time" value={openHour} onChange={(e) => onOpenHourChange(e.target.value)} disabled={altaBloqueada} className={inputClass} />
        </label>
        <label className="block">
          <span className={labelClass}>Cierre lunes</span>
          <input type="time" value={closeHour} onChange={(e) => onCloseHourChange(e.target.value)} disabled={altaBloqueada} className={inputClass} />
        </label>
        <label className="block md:col-span-2">
          <span className={labelClass}>Referencia</span>
          <input value={reference} onChange={(e) => onReferenceChange(e.target.value)} disabled={altaBloqueada} className={inputClass} />
        </label>

        <div className="flex flex-wrap items-center gap-2 md:col-span-2">
          <button type="button" onClick={onCrearStore} disabled={altaBloqueada || !canCreateStore || isCreatingStore} className="flex h-9 items-center gap-2 rounded bg-[#075E54] px-4 text-[13px] font-semibold text-white hover:bg-[#0b6d62] disabled:opacity-60">
            {isCreatingStore ? <Loader2 size={15} className="animate-spin" /> : <Store size={15} />}
            Crear tienda
          </button>
          <button type="button" onClick={onBuscarStore} disabled={altaBloqueada || !canSearchStore || isSearchingStore} className="flex h-9 items-center gap-2 rounded border border-[#c4c6cd] bg-white px-4 text-[13px] font-semibold text-[#041627] hover:bg-[#f4f5f6] disabled:opacity-60">
            {isSearchingStore ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
            Buscar tienda
          </button>
          <input value={storeId} onChange={(e) => onStoreIdChange(e.target.value)} className="h-9 min-w-[220px] rounded border border-[#c4c6cd] bg-white px-3 text-[13px] outline-none focus:border-[#075E54]" placeholder="Store id" />
          {storeResult?.status ? (
            <span className="text-[12px] font-semibold text-[#075E54]">{storeResult.status}</span>
          ) : null}
        </div>
      </div>
    </section>
  </div>
);
