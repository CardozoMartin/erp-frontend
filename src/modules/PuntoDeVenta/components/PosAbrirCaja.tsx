import { Info, Loader2, Lock, RefreshCw, Store } from 'lucide-react';
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
  rolPosElegido?: 'vendedor' | 'cajero' | null;
  onCambiarRol?: () => void;
  onAbrir: (montoInicial: number, descripcion?: string) => void;
}

const etiqueta = 'mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#64748b]';
const campoLectura =
  'h-11 w-full rounded-lg border border-[#dbe0e6] bg-[#f8fafc] px-3.5 text-[14.5px] font-medium text-[#041627] outline-none';

export const PosAbrirCaja = ({
  empleadoNombre,
  sucursalNombre,
  modoPos,
  descripcionModo,
  isPending,
  rolPosElegido,
  onCambiarRol,
  onAbrir,
}: Props) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: { monto_inicial: 0, descripcion: '' },
  });

  const manejarSubmit = (valores: FormValues) => {
    onAbrir(Number(valores.monto_inicial), valores.descripcion || undefined);
  };

  return (
    <div className="min-h-[calc(100vh-52px)] bg-[#f5f7fc] px-4 py-8">
      <div className="mx-auto w-full max-w-3xl">
        {/* Titulo */}
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-[30px] font-bold tracking-tight text-[#041627]">
              Gestión de Caja
            </h1>
            <p className="mt-1 text-[14.5px] text-[#64748b]">
              Iniciá tu turno abriendo la caja correspondiente.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-lg bg-[#e8ecf7] px-3.5 py-2 text-[13px] font-medium text-[#041627]">
            <Store size={15} />
            Sucursal: {sucursalNombre || 'Sin sucursal'}
          </span>
        </div>

        {/* Tarjeta */}
        <form
          onSubmit={handleSubmit(manejarSubmit)}
          className="overflow-hidden rounded-xl border border-[#dfe4f2] bg-white"
        >
          <div className="flex items-center gap-2.5 border-b border-[#e5e7eb] bg-[#f5f7fc] px-6 py-4">
            <Lock size={19} className="text-[#075E54]" />
            <h2 className="text-[18px] font-bold text-[#041627]">Apertura de Caja</h2>
            {modoPos && (
              <span className="ml-auto rounded-md bg-[#eef8f6] px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wider text-[#075E54]">
                {MODO_LABEL[modoPos]}
              </span>
            )}
          </div>

          <div className="px-6 py-5">
            <div className="grid gap-x-5 gap-y-4 md:grid-cols-2">
              {/* Sucursal: viene del turno, no se elige aca */}
              <div>
                <label className={etiqueta}>Sucursal</label>
                <input value={sucursalNombre} readOnly className={campoLectura} />
              </div>

              {/* Empleado que abre la caja */}
              <div>
                <div className="mb-1.5 flex items-center gap-3">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
                    {rolPosElegido === 'vendedor' ? 'Vendedor' : 'Cajero'}
                  </label>
                  {rolPosElegido && onCambiarRol && (
                    <button
                      type="button"
                      onClick={onCambiarRol}
                      className="flex items-center gap-1 text-[11px] font-semibold text-[#075E54] transition-colors hover:underline"
                    >
                      <RefreshCw size={11} />
                      Cambiar rol
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input value={empleadoNombre} readOnly className={`${campoLectura} pr-24`} />
                  {rolPosElegido && (
                    <span
                      className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white ${
                        rolPosElegido === 'vendedor' ? 'bg-[#075E54]' : 'bg-[#e65100]'
                      }`}
                    >
                      {rolPosElegido}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {descripcionModo && (
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-[#fde68a] bg-[#fffbeb] px-3.5 py-2.5">
                <Info size={14} className="mt-0.5 shrink-0 text-[#d97706]" />
                <p className="text-[12.5px] text-[#92400e]">{descripcionModo}</p>
              </div>
            )}

            {/* Monto inicial + accion */}
            <div className="mt-5 rounded-xl border border-[#dfe4f2] bg-[#f5f7fc] p-5">
              <label className={etiqueta}>Monto inicial en caja</label>
              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[14px] text-[#64748b]">
                    $
                  </span>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    autoFocus
                    {...register('monto_inicial', {
                      min: { value: 0, message: 'El monto no puede ser negativo' },
                      valueAsNumber: true,
                    })}
                    placeholder="0"
                    className="h-12 w-full rounded-lg border border-[#dbe0e6] bg-white pl-8 pr-3.5 text-[16px] font-semibold text-[#041627] outline-none focus:border-[#075E54] focus:ring-2 focus:ring-[#075E54]/15"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isPending}
                  className="flex h-12 items-center justify-center gap-2 rounded-lg bg-[#0b3d2c] px-8 text-[15px] font-semibold text-white transition-colors hover:bg-[#0a5c52] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isPending ? (
                    <>
                      <Loader2 size={17} className="animate-spin" />
                      Abriendo…
                    </>
                  ) : (
                    <>
                      <Lock size={17} />
                      Abrir caja
                    </>
                  )}
                </button>
              </div>

              {errors.monto_inicial && (
                <p className="mt-1.5 text-[11.5px] text-[#b42318]">
                  {errors.monto_inicial.message}
                </p>
              )}

              {/* Observacion opcional: queda en la auditoria de la caja */}
              <input
                type="text"
                {...register('descripcion')}
                maxLength={200}
                placeholder="Observación (opcional). Ej: Turno mañana, fondo de cambio…"
                className="mt-3 h-11 w-full rounded-lg border border-[#dbe0e6] bg-white px-3.5 text-[14px] text-[#041627] outline-none focus:border-[#075E54] focus:ring-2 focus:ring-[#075E54]/15"
              />
            </div>
          </div>
        </form>

        <p className="mt-4 flex items-center justify-center gap-1.5 text-[13px] text-[#64748b]">
          <Info size={14} />
          Asegurate de contar el efectivo inicial antes de proceder.
        </p>
      </div>
    </div>
  );
};
