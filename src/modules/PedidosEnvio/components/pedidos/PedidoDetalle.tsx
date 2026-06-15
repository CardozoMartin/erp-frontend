import {
  ArrowLeft, Banknote, CheckCircle2, ClipboardList, History,
  PackagePlus, ReceiptText, Send, UserRound, WalletCards, XCircle,
} from 'lucide-react';
import { money, dateTime, toNumber } from '../../../POSAuxiliares/utils/format';
import type { IEmpleado } from '../../../Empleados/types/empleado.type';
import type { ICaja } from '../../../Cajas/types/caja.type';
import type { IPedidoEnvio, IAuditoriaEvento, EstadoPedidoEnvio } from '../../types/pedido-envio.type';
import {
  accionHistorialLabel, clienteNombre, medioPagoLabel, pagoLabel, estadoLabel, pagoClass, estadoClass,
} from '../../utils/pedidos.utils';

interface MedioPago { id: string; nombre: string; tipo: string }

interface Props {
  pedido: IPedidoEnvio | null;
  historial: IAuditoriaEvento[];
  isLoadingHistorial: boolean;
  clientesById: Map<string, { nombre?: string; apellido?: string | null; razon_social?: string | null }>;
  empleadosById: Map<string, IEmpleado>;
  mediosPago: MedioPago[];
  cajaAbierta: ICaja | null | undefined;
  isMutating: boolean;
  montoRendido: string; onMontoRendidoChange: (v: string) => void;
  referenciaPago: string; onReferenciaPagoChange: (v: string) => void;
  medioPagoRendidoId: string; onMedioPagoRendidoIdChange: (v: string) => void;
  onVolver: () => void;
  onEditar: (pedido: IPedidoEnvio) => void;
  onCambiarEstado: (pedido: IPedidoEnvio, estado: EstadoPedidoEnvio) => void;
  onRendir: (pedido: IPedidoEnvio) => void;
  onRefreshHistorial: () => void;
}

const InfoBox = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded border border-[#e5e7eb] bg-[#fbfbfc] px-3 py-2">
    <div className="text-[11px] font-bold uppercase text-[#44474c]">{label}</div>
    <div className="mt-1 truncate text-[14px] font-semibold text-[#041627]">{value}</div>
  </div>
);

export const PedidoDetalle = ({
  pedido, historial, isLoadingHistorial,
  clientesById, empleadosById, mediosPago, cajaAbierta, isMutating,
  montoRendido, onMontoRendidoChange,
  referenciaPago, onReferenciaPagoChange,
  medioPagoRendidoId, onMedioPagoRendidoIdChange,
  onVolver, onEditar, onCambiarEstado, onRendir, onRefreshHistorial,
}: Props) => (
  <div className="min-h-[calc(100vh-52px)] bg-[#f3f4f6] px-4 py-4">
    <section className="mx-auto max-w-[1500px] rounded-lg border border-[#c4c6cd] bg-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#c4c6cd] px-4 py-3">
        <div>
          <div className="flex items-center gap-2 text-[18px] font-bold text-[#041627]">
            <ClipboardList size={18} className="text-[#075E54]" />
            Ficha del pedido
          </div>
          <div className="text-[13px] text-[#44474c]">Cliente, entrega, productos, asignacion y rendicion.</div>
        </div>
        <div className="flex flex-wrap gap-2">
          {pedido && !['ENTREGADO', 'CANCELADO'].includes(pedido.estado) && !['PAGADO', 'RENDIDO'].includes(pedido.estado_pago) && (
            <button type="button" onClick={() => onEditar(pedido)} className="flex h-9 items-center gap-2 rounded border border-[#cfe2de] bg-[#f3fbf9] px-3 text-[13px] font-semibold text-[#075E54]">
              <PackagePlus size={15} /> Editar pedido
            </button>
          )}
          <button type="button" onClick={onVolver} className="flex h-9 items-center gap-2 rounded border border-[#c4c6cd] bg-white px-3 text-[13px] font-semibold text-[#041627]">
            <ArrowLeft size={15} /> Volver a tabla
          </button>
        </div>
      </div>

      {!pedido ? (
        <div className="px-4 py-12 text-center text-[14px] text-[#44474c]">Seleccione un pedido desde la tabla.</div>
      ) : (
        <div className="p-4">
          {/* Resumen */}
          <div className="grid gap-3 md:grid-cols-4">
            <InfoBox label="Cliente" value={clienteNombre(clientesById.get(pedido.cliente_id))} />
            <InfoBox label="Total" value={money(pedido.comprobante?.total ?? 0)} />
            <InfoBox label="Pago" value={medioPagoLabel[pedido.medio_pago_previsto]} />
            <InfoBox label="Repartidor" value={pedido.empleado_repartidor_id ? (empleadosById.get(pedido.empleado_repartidor_id)?.nombreCompleto ?? 'Asignado') : 'Sin asignar'} />
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <InfoBox label="Direccion" value={pedido.direccion_entrega} />
            <InfoBox label="Zona" value={[pedido.barrio_entrega, pedido.localidad_entrega, pedido.codigo_postal_entrega ? `CP ${pedido.codigo_postal_entrega}` : null].filter(Boolean).join(' | ') || 'Sin zona'} />
            <InfoBox label="Telefono" value={pedido.telefono_contacto || 'Sin telefono'} />
          </div>

          {/* Badges de estado */}
          <div className="mt-3 flex flex-wrap gap-2">
            <span className={`rounded border px-3 py-1 text-[12px] font-semibold ${estadoClass[pedido.estado]}`}>{estadoLabel[pedido.estado]}</span>
            <span className={`rounded border px-3 py-1 text-[12px] font-semibold ${pagoClass[pedido.estado_pago]}`}>{pagoLabel[pedido.estado_pago]}</span>
          </div>

          {/* Items */}
          <div className="mt-4 rounded border border-[#e5e7eb] bg-white">
            {(pedido.comprobante?.items ?? []).map((item) => (
              <div key={item.id} className="grid grid-cols-[1fr_80px_120px] border-b border-[#e5e7eb] px-3 py-2 text-[13px] last:border-b-0">
                <span className="font-semibold text-[#041627]">{item.descripcion}</span>
                <span className="text-right text-[#44474c]">{toNumber(item.cantidad)}</span>
                <span className="text-right font-semibold text-[#041627]">{money(item.subtotal)}</span>
              </div>
            ))}
          </div>

          {/* Acciones de estado */}
          <div className="mt-4 grid gap-2 md:grid-cols-4">
            <button type="button" onClick={() => onCambiarEstado(pedido, 'PREPARANDO')} disabled={pedido.estado !== 'PENDIENTE' || isMutating} className="flex h-9 items-center justify-center gap-2 rounded border border-[#bfd7ff] bg-[#f2f7ff] text-[13px] font-semibold text-[#1d4f91] disabled:opacity-50"><ReceiptText size={15} />Preparar</button>
            <button type="button" onClick={() => onCambiarEstado(pedido, 'EN_CAMINO')} disabled={['EN_CAMINO', 'ENTREGADO', 'CANCELADO'].includes(pedido.estado) || isMutating} className="flex h-9 items-center justify-center gap-2 rounded border border-[#cfe2de] bg-[#eef8f6] text-[13px] font-semibold text-[#075E54] disabled:opacity-50"><Send size={15} />En camino</button>
            <button type="button" onClick={() => onCambiarEstado(pedido, 'ENTREGADO')} disabled={['ENTREGADO', 'CANCELADO'].includes(pedido.estado) || isMutating} className="flex h-9 items-center justify-center gap-2 rounded bg-[#075E54] text-[13px] font-semibold text-white disabled:opacity-50"><CheckCircle2 size={15} />Entregado</button>
            <button type="button" onClick={() => onCambiarEstado(pedido, 'CANCELADO')} disabled={['ENTREGADO', 'CANCELADO'].includes(pedido.estado) || isMutating} className="flex h-9 items-center justify-center gap-2 rounded border border-[#f1c7c7] bg-[#fff5f5] text-[13px] font-semibold text-[#b42318] disabled:opacity-50"><XCircle size={15} />Cancelar</button>
          </div>

          {/* Rendición */}
          <div className="mt-4 grid gap-3 border-t border-[#c4c6cd] pt-4 md:grid-cols-[1fr_1fr_1fr_160px]">
            {!cajaAbierta && (
              <div className="rounded border border-[#f6d58f] bg-[#fff8e6] px-3 py-2 text-[12px] font-semibold text-[#8a5a00] md:col-span-4">
                Para rendir el dinero debe haber una caja abierta.
              </div>
            )}
            <input type="number" min={0} value={montoRendido} onChange={(e) => onMontoRendidoChange(e.target.value)} placeholder={`Monto rendido ${money(pedido.comprobante?.total ?? 0)}`} className="h-9 rounded border border-[#c4c6cd] px-3 text-[13px] outline-none focus:border-[#075E54]" />
            <input value={referenciaPago} onChange={(e) => onReferenciaPagoChange(e.target.value)} placeholder="Referencia de pago o comprobante" className="h-9 rounded border border-[#c4c6cd] px-3 text-[13px] outline-none focus:border-[#075E54]" />
            <select value={medioPagoRendidoId} onChange={(e) => onMedioPagoRendidoIdChange(e.target.value)} className="h-9 rounded border border-[#c4c6cd] bg-white px-3 text-[13px] outline-none focus:border-[#075E54]">
              <option value="">Medio sugerido: {medioPagoLabel[pedido.medio_pago_previsto]}</option>
              {mediosPago.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
            </select>
            <button type="button" onClick={() => onRendir(pedido)} disabled={pedido.estado_pago === 'RENDIDO' || isMutating} className="flex h-9 items-center justify-center gap-2 rounded bg-[#075E54] px-3 text-[13px] font-semibold text-white disabled:opacity-50">
              {pedido.medio_pago_previsto === 'EFECTIVO' ? <Banknote size={15} /> : <WalletCards size={15} />}
              Rendir
            </button>
          </div>

          {/* Historial */}
          <div className="mt-5 border-t border-[#c4c6cd] pt-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-[15px] font-bold text-[#041627]">
                <History size={17} className="text-[#075E54]" /> Historial del pedido
              </div>
              <button type="button" onClick={onRefreshHistorial} className="h-8 rounded border border-[#c4c6cd] bg-white px-3 text-[12px] font-semibold text-[#041627]">Actualizar</button>
            </div>

            {isLoadingHistorial ? (
              <div className="rounded border border-[#e5e7eb] bg-[#fbfbfc] px-3 py-6 text-center text-[13px] text-[#44474c]">Cargando historial del pedido...</div>
            ) : historial.length === 0 ? (
              <div className="rounded border border-[#e5e7eb] bg-[#fbfbfc] px-3 py-6 text-center text-[13px] text-[#44474c]">Todavia no hay eventos registrados para este pedido.</div>
            ) : (
              <div className="rounded border border-[#e5e7eb] bg-white">
                {historial.map((evento) => {
                  const empleado = evento.empleado_id ? empleadosById.get(evento.empleado_id) : null;
                  const cambiosItems = [
                    evento.metadata?.items_agregados?.length ? `${evento.metadata.items_agregados.length} agregado(s)` : null,
                    evento.metadata?.items_eliminados?.length ? `${evento.metadata.items_eliminados.length} eliminado(s)` : null,
                    evento.metadata?.items_modificados?.length ? `${evento.metadata.items_modificados.length} modificado(s)` : null,
                  ].filter(Boolean).join(' | ');
                  return (
                    <div key={evento.id} className="grid gap-3 border-b border-[#e5e7eb] px-3 py-3 last:border-b-0 md:grid-cols-[170px_1fr]">
                      <div className="text-[12px] font-semibold text-[#59616b]">{dateTime(evento.created_at)}</div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[13px] font-bold text-[#041627]">{accionHistorialLabel[evento.accion] ?? evento.accion}</span>
                          <span className="inline-flex items-center gap-1 rounded border border-[#d7d9de] bg-[#fbfbfc] px-2 py-0.5 text-[11px] font-semibold text-[#44474c]">
                            <UserRound size={12} />
                            {empleado?.nombreCompleto ?? evento.empleado_id ?? 'Sistema'}
                          </span>
                        </div>
                        {evento.descripcion && <div className="mt-1 text-[13px] text-[#44474c]">{evento.descripcion}</div>}
                        {(evento.antes?.estado || evento.despues?.estado) && (
                          <div className="mt-2 text-[12px] text-[#59616b]">Estado: {evento.antes?.estado ?? '-'} {'->'} {evento.despues?.estado ?? '-'}</div>
                        )}
                        {evento.despues?.monto_rendido && (
                          <div className="mt-2 text-[12px] font-semibold text-[#075E54]">Monto rendido: {money(evento.despues.monto_rendido as number)}</div>
                        )}
                        {cambiosItems && <div className="mt-2 text-[12px] text-[#59616b]">Productos: {cambiosItems}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  </div>
);
