import { useState } from 'react';
import { Loader2, Truck, X } from 'lucide-react';
import type { ICartItem, IClientePos } from '../../types/pos.type';
import { formatCurrency } from '../../utils/pos.utils';
import type {
  CrearPedidoEnvioPayload,
  MedioPagoPedidoEnvio,
} from '../../../PedidosEnvio/types/pedido-envio.type';

interface Props {
  abierto: boolean;
  cartItems: ICartItem[];
  total: number;
  cajaId: string | null | undefined;
  clientes: IClientePos[];
  selectedClienteId: string;
  isPending: boolean;
  onCerrar: () => void;
  onConfirmar: (payload: Omit<CrearPedidoEnvioPayload, 'caja_id'>) => void;
}

const MEDIOS: { value: MedioPagoPedidoEnvio; label: string }[] = [
  { value: 'EFECTIVO', label: 'Efectivo' },
  { value: 'TRANSFERENCIA', label: 'Transferencia' },
  { value: 'OTRO', label: 'Otro' },
];

const etiqueta = 'mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#64748b]';
const campo =
  'h-11 w-full rounded-lg border border-[#dbe0e6] bg-white px-3.5 text-[14px] text-[#041627] outline-none focus:border-[#075E54] focus:ring-2 focus:ring-[#075E54]/15';

export const ModalEnvio = (props: Props) => {
  if (!props.abierto) return null;
  return <ContenidoModalEnvio {...props} />;
};

const ContenidoModalEnvio = ({
  cartItems,
  total,
  cajaId,
  clientes,
  selectedClienteId,
  isPending,
  onCerrar,
  onConfirmar,
}: Props) => {
  const [clienteId, setClienteId] = useState(selectedClienteId);
  const [direccion, setDireccion] = useState('');
  const [localidad, setLocalidad] = useState('');
  const [telefono, setTelefono] = useState('');
  const [referencia, setReferencia] = useState('');
  const [medioPago, setMedioPago] = useState<MedioPagoPedidoEnvio>('EFECTIVO');
  const [pagaAhora, setPagaAhora] = useState(false);
  const [fechaProgramada, setFechaProgramada] = useState('');
  const [observaciones, setObservaciones] = useState('');

  // El pedido crea una venta con cliente obligatorio: sin cliente no hay a quien
  // entregarle ni a quien cobrarle despues.
  const faltaCliente = !clienteId;
  const faltaDireccion = !direccion.trim();
  const puedeConfirmar = !isPending && !faltaCliente && !faltaDireccion && !!cajaId;

  const manejarConfirmar = () => {
    if (!puedeConfirmar) return;
    onConfirmar({
      cliente_id: clienteId,
      medio_pago_previsto: medioPago,
      // Si ya pagó en el local el pedido nace saldado; si paga al recibir queda
      // pendiente y al entregarse pasa solo a PENDIENTE_RENDICION.
      estado_pago: pagaAhora ? 'PAGADO' : 'PENDIENTE_PAGO',
      direccion_entrega: direccion.trim(),
      localidad_entrega: localidad.trim() || null,
      telefono_contacto: telefono.trim() || null,
      referencia_entrega: referencia.trim() || null,
      fecha_programada: fechaProgramada || null,
      observaciones: observaciones.trim() || null,
      items: cartItems.map((item) => ({
        producto_id: item.producto.id!,
        cantidad: item.cantidad,
        precio_unitario: item.precioUnitario,
      })),
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6"
      onKeyDown={(e) => e.key === 'Escape' && onCerrar()}
      role="dialog"
      aria-modal="true"
      aria-label="Cargar pedido con envío"
    >
      <div className="flex max-h-full w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Encabezado */}
        <div className="flex items-start justify-between gap-4 border-b border-[#e5e7eb] bg-[#f8fafc] px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#eef8f6] text-[#075E54]">
              <Truck size={21} />
            </span>
            <div>
              <h2 className="text-[18px] font-bold text-[#041627]">Pedido con envío</h2>
              <p className="text-[13px] text-[#64748b]">
                {cartItems.length} {cartItems.length === 1 ? 'producto' : 'productos'} ·{' '}
                <span className="font-bold text-[#041627]">{formatCurrency(total)}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="rounded-lg p-2 text-[#64748b] transition-colors hover:bg-[#e5e7eb] hover:text-[#041627]"
          >
            <X size={20} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto px-6 py-5">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Cliente */}
            <div className="sm:col-span-2">
              <label htmlFor="envio-cliente" className={etiqueta}>
                Cliente <span className="text-[#b42318]">*</span>
              </label>
              <select
                id="envio-cliente"
                value={clienteId}
                onChange={(e) => setClienteId(e.target.value)}
                disabled={isPending}
                className={campo}
              >
                <option value="">Seleccionar cliente…</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.razon_social || `${c.nombre} ${c.apellido ?? ''}`.trim()}
                  </option>
                ))}
              </select>
              {faltaCliente && (
                <p className="mt-1 text-[12px] text-[#b42318]">
                  El envío necesita un cliente con quien asociar la entrega.
                </p>
              )}
            </div>

            {/* Direccion */}
            <div className="sm:col-span-2">
              <label htmlFor="envio-direccion" className={etiqueta}>
                Dirección de entrega <span className="text-[#b42318]">*</span>
              </label>
              <input
                id="envio-direccion"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                placeholder="Calle, número, piso/depto"
                disabled={isPending}
                className={campo}
              />
            </div>

            <div>
              <label htmlFor="envio-localidad" className={etiqueta}>Localidad / barrio</label>
              <input
                id="envio-localidad"
                value={localidad}
                onChange={(e) => setLocalidad(e.target.value)}
                disabled={isPending}
                className={campo}
              />
            </div>

            <div>
              <label htmlFor="envio-telefono" className={etiqueta}>Teléfono de contacto</label>
              <input
                id="envio-telefono"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="Para coordinar la entrega"
                disabled={isPending}
                className={campo}
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="envio-referencia" className={etiqueta}>Referencia</label>
              <input
                id="envio-referencia"
                value={referencia}
                onChange={(e) => setReferencia(e.target.value)}
                placeholder="Ej: casa con portón verde, timbre 2"
                disabled={isPending}
                className={campo}
              />
            </div>

            <div>
              <label htmlFor="envio-fecha" className={etiqueta}>Fecha programada</label>
              <input
                id="envio-fecha"
                type="datetime-local"
                value={fechaProgramada}
                onChange={(e) => setFechaProgramada(e.target.value)}
                disabled={isPending}
                className={campo}
              />
            </div>

            <div>
              <label htmlFor="envio-medio" className={etiqueta}>Medio de pago previsto</label>
              <select
                id="envio-medio"
                value={medioPago}
                onChange={(e) => setMedioPago(e.target.value as MedioPagoPedidoEnvio)}
                disabled={isPending}
                className={campo}
              >
                {MEDIOS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Cuando se cobra: define si despues hay rendicion */}
          <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-[#dbe0e6] bg-[#f8fafc] px-4 py-3">
            <input
              type="checkbox"
              checked={pagaAhora}
              onChange={(e) => setPagaAhora(e.target.checked)}
              disabled={isPending}
              className="mt-0.5 h-4 w-4 accent-[#075E54]"
            />
            <span className="text-[13.5px] text-[#041627]">
              <span className="font-semibold">Ya pagó en el local</span>
              <span className="mt-0.5 block text-[12.5px] text-[#64748b]">
                {pagaAhora
                  ? 'El pedido queda saldado: no habrá rendición al entregar.'
                  : 'Paga al recibir. Al marcarlo entregado quedará pendiente de rendición hasta que el repartidor entregue la plata en caja.'}
              </span>
            </span>
          </label>

          <div className="mt-4">
            <label htmlFor="envio-obs" className={etiqueta}>Observaciones</label>
            <textarea
              id="envio-obs"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={2}
              disabled={isPending}
              className="w-full rounded-lg border border-[#dbe0e6] bg-white px-3.5 py-2.5 text-[14px] text-[#041627] outline-none focus:border-[#075E54] focus:ring-2 focus:ring-[#075E54]/15"
            />
          </div>

          {!cajaId && (
            <p className="mt-4 rounded-lg border border-[#f1c7c7] bg-[#fff5f5] px-3.5 py-2.5 text-[13px] text-[#b42318]">
              Necesitás una caja abierta para cargar el pedido.
            </p>
          )}
        </div>

        {/* Acciones */}
        <div className="flex gap-3 border-t border-[#e5e7eb] bg-[#f8fafc] px-6 py-4">
          <button
            type="button"
            onClick={onCerrar}
            disabled={isPending}
            className="flex-1 rounded-xl border border-[#dbe0e6] bg-white px-5 py-3.5 text-[15px] font-semibold text-[#041627] transition-colors hover:bg-[#f1f5f9] disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={manejarConfirmar}
            disabled={!puedeConfirmar}
            className="flex flex-2 items-center justify-center gap-2 rounded-xl bg-[#0b3d2c] px-5 py-3.5 text-[16px] font-bold text-white transition-colors hover:bg-[#0a5c52] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Cargando pedido…
              </>
            ) : (
              <>
                <Truck size={18} />
                Cargar pedido
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
