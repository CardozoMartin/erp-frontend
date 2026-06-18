import { AlertTriangle, CreditCard, Mail, MapPin, Phone, Save, ShieldCheck, ShieldOff, UserRound, Wallet } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import FichaHistoryPanel from '../../../components/common/FichaHistoryPanel';
import type { ICliente } from '../types/cliente.type';
import type { IEmpleado } from '../../Empleados/types/empleado.type';
import {
  clienteChanges,
  clienteHistoryLabels,
  clienteNombre,
  money,
  type ClienteFormValues,
} from '../utils/clientes.utils';

interface Props {
  form: UseFormReturn<ClienteFormValues>;
  creating: boolean;
  selectedCliente: ICliente | null;
  isSaving: boolean;
  isActualizandoEstado?: boolean;
  historialCliente: any[];
  isLoadingHistorial: boolean;
  empleadosById: Map<string, IEmpleado>;
  onSubmit: (values: ClienteFormValues) => void;
  onVolver: () => void;
  onVerCuenta: () => void;
  onToggleActivo?: () => void;
  onToggleCuentaCorriente?: () => void;
  onBloqueo?: () => void;
  onAccionLegal?: () => void;
}

export default function ClienteFichaSection({
  form,
  creating,
  selectedCliente,
  isSaving,
  isActualizandoEstado = false,
  historialCliente,
  isLoadingHistorial,
  empleadosById,
  onSubmit,
  onVolver,
  onVerCuenta,
  onToggleActivo,
  onToggleCuentaCorriente,
  onBloqueo,
  onAccionLegal,
}: Props) {
  const usarCuentaCorriente = form.watch('usarCuentaCorriente');
  const creditoSinLimite = form.watch('credito_sin_limite');
  const recargoActivo = form.watch('recargo_activo');
  const tipoVencimiento = form.watch('tipo_vencimiento');

  const saldo = Number(selectedCliente?.cuentaCorriente?.saldo ?? 0);

  return (
    <div className="min-h-[calc(100vh-52px)] bg-[#f3f4f6] px-4 py-4">
      <div className="mx-auto grid max-w-375 gap-4 xl:grid-cols-[1fr_360px]">
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="rounded-lg border border-[#c4c6cd] bg-white shadow-sm"
        >
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#c4c6cd] px-4 py-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="text-[18px] font-bold text-[#041627]">
                  {creating
                    ? 'Nuevo cliente'
                    : selectedCliente
                      ? clienteNombre(selectedCliente)
                      : 'Ficha de cliente'}
                </div>
                {!creating && selectedCliente && (
                  <>
                    {!selectedCliente.activo && (
                      <span className="rounded-full bg-[#fce8e8] px-2 py-0.5 text-[10px] font-bold text-[#ba1a1a]">
                        INACTIVO
                      </span>
                    )}
                    {selectedCliente.accion_legal && (
                      <span className="flex items-center gap-1 rounded-full bg-[#FCEBEB] px-2 py-0.5 text-[10px] font-bold text-[#A32D2D]">
                        <AlertTriangle size={10} /> Acción Legal
                      </span>
                    )}
                    {selectedCliente.bloqueado && (
                      <span className="flex items-center gap-1 rounded-full bg-[#FFF3CD] px-2 py-0.5 text-[10px] font-bold text-[#856404]">
                        <ShieldOff size={10} /> Crédito bloqueado
                        {selectedCliente.razon_bloqueo ? ` — ${selectedCliente.razon_bloqueo}` : ''}
                      </span>
                    )}
                    {selectedCliente.cuentaCorriente && !selectedCliente.cuentaCorriente.activa && (
                      <span className="rounded-full bg-[#f1f5f9] px-2 py-0.5 text-[10px] font-bold text-[#64748b]">
                        Cuenta suspendida
                      </span>
                    )}
                  </>
                )}
              </div>
              <div className="text-[13px] text-[#44474c]">
                Datos comerciales, contacto y cuenta corriente.
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onVolver}
                className="flex h-9 items-center gap-2 rounded border border-[#c4c6cd] bg-white px-3 text-[13px] font-semibold text-[#041627] hover:bg-[#f4f5f6]"
              >
                Volver
              </button>
              {!creating && selectedCliente && (
                <>
                  {selectedCliente.cuentaCorriente && (
                    <>
                      <button
                        type="button"
                        onClick={onVerCuenta}
                        className="flex h-9 items-center gap-2 rounded border border-[#c4c6cd] bg-white px-3 text-[13px] font-semibold text-[#041627] hover:bg-[#f4f5f6]"
                      >
                        <Wallet size={15} />
                        Ver cuenta
                      </button>
                      <button
                        type="button"
                        onClick={onToggleCuentaCorriente}
                        disabled={isActualizandoEstado}
                        className={`flex h-9 items-center gap-1.5 rounded border px-3 text-[13px] font-semibold disabled:opacity-60 ${
                          selectedCliente.cuentaCorriente.activa
                            ? 'border-[#F7C1C1] bg-[#FCEBEB] text-[#A32D2D] hover:bg-[#fad8d8]'
                            : 'border-[#C0DD97] bg-[#EAF3DE] text-[#3B6D11] hover:bg-[#d8edbb]'
                        }`}
                      >
                        {selectedCliente.cuentaCorriente.activa
                          ? <><ShieldOff size={14} /> Suspender cuenta</>
                          : <><ShieldCheck size={14} /> Reactivar cuenta</>
                        }
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={onBloqueo}
                    disabled={isActualizandoEstado}
                    className={`flex h-9 items-center gap-1.5 rounded border px-3 text-[13px] font-semibold disabled:opacity-60 ${
                      selectedCliente.bloqueado
                        ? 'border-[#C0DD97] bg-[#EAF3DE] text-[#3B6D11] hover:bg-[#d8edbb]'
                        : 'border-[#FAC775] bg-[#FAEEDA] text-[#854F0B] hover:bg-[#f5ddb8]'
                    }`}
                  >
                    <ShieldOff size={14} />
                    {selectedCliente.bloqueado ? 'Desbloquear crédito' : 'Bloquear crédito'}
                  </button>
                  <button
                    type="button"
                    onClick={onAccionLegal}
                    disabled={isActualizandoEstado}
                    className={`flex h-9 items-center gap-1.5 rounded border px-3 text-[13px] font-semibold disabled:opacity-60 ${
                      selectedCliente.accion_legal
                        ? 'border-[#C0DD97] bg-[#EAF3DE] text-[#3B6D11] hover:bg-[#d8edbb]'
                        : 'border-[#F7C1C1] bg-[#FCEBEB] text-[#A32D2D] hover:bg-[#fad8d8]'
                    }`}
                  >
                    <AlertTriangle size={14} />
                    {selectedCliente.accion_legal ? 'Quitar acción legal' : 'Acción legal'}
                  </button>
                  <button
                    type="button"
                    onClick={onToggleActivo}
                    disabled={isActualizandoEstado}
                    className={`flex h-9 items-center gap-1.5 rounded border px-3 text-[13px] font-semibold disabled:opacity-60 ${
                      selectedCliente.activo
                        ? 'border-[#F7C1C1] bg-[#FCEBEB] text-[#A32D2D] hover:bg-[#fad8d8]'
                        : 'border-[#C0DD97] bg-[#EAF3DE] text-[#3B6D11] hover:bg-[#d8edbb]'
                    }`}
                  >
                    {selectedCliente.activo ? 'Desactivar' : 'Activar'}
                  </button>
                </>
              )}
              <button
                type="submit"
                disabled={isSaving}
                className="flex h-9 items-center gap-2 rounded bg-[#075E54] px-3 text-[13px] font-semibold text-white hover:bg-[#0b6d62] disabled:opacity-60"
              >
                <Save size={15} />
                Guardar
              </button>
            </div>
          </div>

          {!creating && selectedCliente?.cuentaCorriente ? (
            <div className="grid gap-3 border-b border-[#c4c6cd] bg-[#fbfbfc] p-4 sm:grid-cols-3">
              <div className="rounded border border-[#e5e7eb] bg-white px-3 py-2">
                <div className="text-[11px] font-bold uppercase text-[#44474c]">Saldo</div>
                <div className={`mt-1 text-[15px] font-bold ${saldo > 0 ? 'text-[#b42318]' : 'text-[#075E54]'}`}>
                  {money(saldo)}
                </div>
              </div>
              <div className="rounded border border-[#e5e7eb] bg-white px-3 py-2">
                <div className="text-[11px] font-bold uppercase text-[#44474c]">Limite</div>
                <div className="mt-1 text-[15px] font-bold text-[#041627]">
                  {Number(selectedCliente.cuentaCorriente.limite_credito) > 0
                    ? money(selectedCliente.cuentaCorriente.limite_credito)
                    : 'Sin limite'}
                </div>
              </div>
              <div className="rounded border border-[#e5e7eb] bg-white px-3 py-2">
                <div className="text-[11px] font-bold uppercase text-[#44474c]">Disponible</div>
                <div className="mt-1 text-[15px] font-bold text-[#075E54]">
                  {Number(selectedCliente.cuentaCorriente.limite_credito) > 0
                    ? money(
                        Number(selectedCliente.cuentaCorriente.limite_credito) -
                          Math.max(saldo, 0),
                      )
                    : 'Sin limite'}
                </div>
              </div>
            </div>
          ) : null}

          <div className="grid gap-4 p-4">
            {/* Identificacion */}
            <section className="rounded border border-[#c4c6cd]">
              <div className="flex items-center gap-2 border-b border-[#c4c6cd] px-4 py-3 text-[13px] font-bold uppercase text-[#041627]">
                <UserRound size={15} className="text-[#075E54]" />
                Identificacion
              </div>
              <div className="grid gap-3 p-4 md:grid-cols-2">
                <label className="text-[12px] font-semibold text-[#041627]">
                  Nombre
                  <input {...form.register('nombre', { required: true })} className="mt-1 h-9 w-full rounded border border-[#c4c6cd] px-2 text-[13px] outline-none focus:border-[#075E54]" />
                </label>
                <label className="text-[12px] font-semibold text-[#041627]">
                  Apellido
                  <input {...form.register('apellido')} className="mt-1 h-9 w-full rounded border border-[#c4c6cd] px-2 text-[13px] outline-none focus:border-[#075E54]" />
                </label>
                <label className="text-[12px] font-semibold text-[#041627]">
                  Razon social
                  <input {...form.register('razon_social')} className="mt-1 h-9 w-full rounded border border-[#c4c6cd] px-2 text-[13px] outline-none focus:border-[#075E54]" />
                </label>
                <label className="text-[12px] font-semibold text-[#041627]">
                  Condicion fiscal
                  <select {...form.register('tipo')} className="mt-1 h-9 w-full rounded border border-[#c4c6cd] bg-white px-2 text-[13px] outline-none focus:border-[#075E54]">
                    <option value="CONSUMIDOR_FINAL">Consumidor final</option>
                    <option value="RESPONSABLE_INSCRIPTO">Responsable inscripto</option>
                    <option value="MONOTRIBUTISTA">Monotributista</option>
                    <option value="EXENTO">Exento</option>
                  </select>
                </label>
                <label className="text-[12px] font-semibold text-[#041627]">
                  CUIT
                  <input {...form.register('cuit')} className="mt-1 h-9 w-full rounded border border-[#c4c6cd] px-2 text-[13px] outline-none focus:border-[#075E54]" />
                </label>
                <label className="text-[12px] font-semibold text-[#041627]">
                  DNI
                  <input {...form.register('dni')} className="mt-1 h-9 w-full rounded border border-[#c4c6cd] px-2 text-[13px] outline-none focus:border-[#075E54]" />
                </label>
              </div>
            </section>

            {/* Contacto */}
            <section className="rounded border border-[#c4c6cd]">
              <div className="flex items-center gap-2 border-b border-[#c4c6cd] px-4 py-3 text-[13px] font-bold uppercase text-[#041627]">
                <Mail size={15} className="text-[#075E54]" />
                Contacto y direccion
              </div>
              <div className="grid gap-3 p-4 md:grid-cols-2">
                <label className="text-[12px] font-semibold text-[#041627]">
                  Email
                  <div className="mt-1 flex h-9 items-center gap-2 rounded border border-[#c4c6cd] px-2">
                    <Mail size={14} className="text-[#075E54]" />
                    <input {...form.register('email')} className="min-w-0 flex-1 outline-none" />
                  </div>
                </label>
                <label className="text-[12px] font-semibold text-[#041627]">
                  Telefono
                  <div className="mt-1 flex h-9 items-center gap-2 rounded border border-[#c4c6cd] px-2">
                    <Phone size={14} className="text-[#075E54]" />
                    <input {...form.register('telefono')} className="min-w-0 flex-1 outline-none" />
                  </div>
                </label>
                <label className="md:col-span-2 text-[12px] font-semibold text-[#041627]">
                  Calle / direccion
                  <div className="mt-1 flex min-h-9 items-center gap-2 rounded border border-[#c4c6cd] px-2">
                    <MapPin size={14} className="text-[#075E54]" />
                    <input {...form.register('direccion')} className="min-w-0 flex-1 py-2 outline-none" />
                  </div>
                </label>
                <label className="text-[12px] font-semibold text-[#041627]">
                  Altura
                  <input {...form.register('altura')} className="mt-1 h-9 w-full rounded border border-[#c4c6cd] px-2 text-[13px] outline-none focus:border-[#075E54]" />
                </label>
                <label className="text-[12px] font-semibold text-[#041627]">
                  Codigo postal
                  <input {...form.register('codigo_postal')} className="mt-1 h-9 w-full rounded border border-[#c4c6cd] px-2 text-[13px] outline-none focus:border-[#075E54]" />
                </label>
                <label className="text-[12px] font-semibold text-[#041627]">
                  Barrio
                  <input {...form.register('barrio')} className="mt-1 h-9 w-full rounded border border-[#c4c6cd] px-2 text-[13px] outline-none focus:border-[#075E54]" />
                </label>
                <label className="text-[12px] font-semibold text-[#041627]">
                  Localidad
                  <input {...form.register('localidad')} className="mt-1 h-9 w-full rounded border border-[#c4c6cd] px-2 text-[13px] outline-none focus:border-[#075E54]" />
                </label>
                <label className="md:col-span-2 text-[12px] font-semibold text-[#041627]">
                  Referencia de entrega
                  <input {...form.register('referencia_entrega')} className="mt-1 h-9 w-full rounded border border-[#c4c6cd] px-2 text-[13px] outline-none focus:border-[#075E54]" />
                </label>
              </div>
            </section>

            {/* Cuenta corriente */}
            <section className="rounded border border-[#c4c6cd]">
              <div className="flex items-center justify-between border-b border-[#c4c6cd] px-4 py-3">
                <div className="flex items-center gap-2 text-[13px] font-bold uppercase text-[#041627]">
                  <Wallet size={15} className="text-[#075E54]" />
                  Cuenta corriente
                </div>
                <label className="flex items-center gap-2 text-[13px] font-semibold text-[#041627]">
                  Habilitar
                  <input type="checkbox" {...form.register('usarCuentaCorriente')} className="h-4 w-4 accent-[#075E54]" />
                </label>
              </div>
              {usarCuentaCorriente ? (
                <div className="grid gap-3 p-4 md:grid-cols-2">
                  <label className="flex h-9 items-center justify-between rounded border border-[#c4c6cd] px-3 text-[13px] font-semibold text-[#041627] md:col-span-2">
                    Sin limite de credito durante el periodo
                    <input type="checkbox" {...form.register('credito_sin_limite')} className="h-4 w-4 accent-[#075E54]" />
                  </label>
                  <label className="text-[12px] font-semibold text-[#041627]">
                    Limite de credito
                    <div className="mt-1 flex h-9 items-center gap-2 rounded border border-[#c4c6cd] px-2">
                      <CreditCard size={14} className="text-[#075E54]" />
                      <input
                        type="number"
                        min={0}
                        disabled={creditoSinLimite}
                        {...form.register('limite_credito', { valueAsNumber: true })}
                        className="min-w-0 flex-1 outline-none disabled:bg-transparent disabled:text-[#9ca3af]"
                      />
                    </div>
                  </label>
                  <label className="text-[12px] font-semibold text-[#041627]">
                    Tipo de vencimiento
                    <select {...form.register('tipo_vencimiento')} className="mt-1 h-9 w-full rounded border border-[#c4c6cd] bg-white px-2 text-[13px] outline-none focus:border-[#075E54]">
                      <option value="DIA_FIJO">Dia fijo del mes</option>
                      <option value="DIAS_DESDE_COMPRA">Dias desde compra</option>
                    </select>
                  </label>
                  <label className="text-[12px] font-semibold text-[#041627]">
                    {tipoVencimiento === 'DIA_FIJO' ? 'Dia de vencimiento' : 'Dias de credito'}
                    <input
                      type="number"
                      min={1}
                      max={tipoVencimiento === 'DIA_FIJO' ? 31 : undefined}
                      {...form.register('valor_vencimiento', { valueAsNumber: true })}
                      className="mt-1 h-9 w-full rounded border border-[#c4c6cd] px-2 text-[13px] outline-none focus:border-[#075E54]"
                    />
                  </label>
                  <div className="grid gap-2">
                    <label className="flex h-9 items-center justify-between rounded border border-[#c4c6cd] px-3 text-[13px] font-semibold text-[#041627]">
                      Calcular interes por mora
                      <input type="checkbox" {...form.register('recargo_activo')} className="h-4 w-4 accent-[#075E54]" />
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      disabled={!recargoActivo}
                      placeholder="Porcentaje diario"
                      {...form.register('recargo_porcentaje_diario', { valueAsNumber: true })}
                      className="h-9 rounded border border-[#c4c6cd] px-2 text-[13px] outline-none focus:border-[#075E54] disabled:bg-[#f4f5f6]"
                    />
                  </div>
                </div>
              ) : (
                <div className="px-4 py-8 text-center text-[14px] text-[#44474c]">
                  El cliente no tendra credito ni fiado hasta habilitar cuenta corriente.
                </div>
              )}
            </section>
          </div>
        </form>

        <FichaHistoryPanel
          className="min-h-155 rounded-lg border-[#c4c6cd] shadow-sm"
          title="Historial"
          subtitle="Cambios y movimientos del cliente"
          events={historialCliente}
          isLoading={isLoadingHistorial}
          labels={clienteHistoryLabels}
          emptyDescription="Aca se vera quien cambio el cliente y que paso."
          getActorName={(evento: any) => {
            const empleado = evento.empleado_id ? empleadosById.get(evento.empleado_id) : null;
            return empleado?.nombreCompleto ?? 'Sistema';
          }}
          getChanges={(evento: any) => clienteChanges(evento.antes, evento.despues)}
        />
      </div>
    </div>
  );
}
