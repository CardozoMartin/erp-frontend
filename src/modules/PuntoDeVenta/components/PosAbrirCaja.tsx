import { DollarSign, Info, KeyRound, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import type { ModoPosSucursal } from '../../POSAuxiliares/types/pos-aux.type';

const MODO_LABEL: Record<ModoPosSucursal, string> = {
  SIMPLE: 'Modo Simple',
  MULTICAJA: 'Modo Multicaja',
  CAJA_CENTRALIZADA: 'Caja Centralizada',
  CON_DESPACHO: 'Con Despacho',
};

interface FormValues {
  monto_inicial: number;
  descripcion: string;
}

interface Props {
  empleadoNombre: string;
  sucursalNombre: string;
  modoPos?: ModoPosSucursal;
  descripcionModo?: string;
  isPending: boolean;
  onAbrir: (montoInicial: number, descripcion?: string) => void;
}

export const PosAbrirCaja = ({ empleadoNombre, sucursalNombre, modoPos, descripcionModo, isPending, onAbrir }: Props) => {
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    defaultValues: { monto_inicial: 0, descripcion: '' },
  });

  const manejarSubmit = (valores: FormValues) => {
    onAbrir(Number(valores.monto_inicial), valores.descripcion || undefined);
  };

  return (
    <div className="flex min-h-[calc(100vh-52px)] items-center justify-center bg-[#f3f4f6] px-4 py-8">
      <div className="w-full max-w-md rounded-xl border border-[#c4c6cd] bg-white shadow-lg overflow-hidden">

        {/* Header */}
        <div className="bg-[#075E54] px-6 py-5 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
              <KeyRound size={20} />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70">
                Punto de venta
              </p>
              <h2 className="text-[17px] font-bold leading-tight">Abrí tu caja para comenzar</h2>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="flex items-center gap-3 border-b border-[#e5e7eb] bg-[#f9fafb] px-6 py-3">
          <div className="flex-1 text-[13px] text-[#44474c]">
            <span className="font-semibold text-[#041627]">{empleadoNombre}</span>
            {' · '}
            {sucursalNombre}
          </div>
          {modoPos && (
            <span className="shrink-0 rounded bg-[#eef8f6] px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[#075E54]">
              {MODO_LABEL[modoPos]}
            </span>
          )}
        </div>

        {/* Descripción del modo */}
        {descripcionModo && (
          <div className="flex items-start gap-2 border-b border-[#e5e7eb] bg-[#fffbeb] px-6 py-3">
            <Info size={14} className="mt-0.5 shrink-0 text-[#d97706]" />
            <p className="text-[12px] text-[#92400e]">{descripcionModo}</p>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit(manejarSubmit)} className="flex flex-col gap-5 p-6">
          <p className="text-[13px] text-[#44474c] leading-relaxed">
            {modoPos === 'SIMPLE'
              ? 'En modo Simple, solo puede haber una caja abierta por sucursal. Ingresá el efectivo inicial para tu turno.'
              : modoPos === 'MULTICAJA'
              ? 'Cada cajero opera con su propia caja. Ingresá el efectivo inicial con el que arrancás tu turno.'
              : 'Para cobrar ventas pendientes necesitás una caja abierta. Ingresá el efectivo inicial de tu turno.'}
          </p>

          {/* Monto inicial */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-bold uppercase tracking-wider text-gray-500">
              Efectivo inicial en caja
            </label>
            <div className="relative">
              <DollarSign size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="number"
                min={0}
                step={0.01}
                {...register('monto_inicial', {
                  min: { value: 0, message: 'El monto no puede ser negativo' },
                  valueAsNumber: true,
                })}
                className="h-11 w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-[15px] font-semibold text-[#041627] outline-none focus:border-[#075E54] focus:ring-2 focus:ring-[#075E54]/15"
                placeholder="0"
              />
            </div>
            {errors.monto_inicial && (
              <p className="text-[11px] text-red-500">{errors.monto_inicial.message}</p>
            )}
            <p className="text-[11px] text-gray-400">
              Podés poner 0 si no tenés efectivo inicial. Este monto queda registrado en la auditoría.
            </p>
          </div>

          {/* Descripción opcional */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-bold uppercase tracking-wider text-gray-500">
              Observación <span className="font-normal normal-case text-gray-400">(opcional)</span>
            </label>
            <input
              type="text"
              {...register('descripcion')}
              maxLength={200}
              placeholder="Ej: Turno mañana, fondo de cambio…"
              className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-[14px] text-[#041627] outline-none focus:border-[#075E54] focus:ring-2 focus:ring-[#075E54]/15"
            />
          </div>

          {/* Botón */}
          <button
            type="submit"
            disabled={isPending}
            className="mt-1 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#075E54] text-[14px] font-semibold text-white transition hover:bg-[#064d45] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Abriendo caja…
              </>
            ) : (
              <>
                <KeyRound size={16} />
                Abrir caja y comenzar
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
