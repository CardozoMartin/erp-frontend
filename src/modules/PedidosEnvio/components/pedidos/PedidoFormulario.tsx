import { ArrowLeft, Minus, PackagePlus, Plus, Search, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { money } from '../../../POSAuxiliares/utils/format';
import { toNumber } from '../../../POSAuxiliares/utils/format';
import type { IProducto } from '../../../Productos/types/productos.type';
import type { IEmpleado } from '../../../Empleados/types/empleado.type';
import type { ICaja } from '../../../Cajas/types/caja.type';
import type { MedioPagoPedidoEnvio } from '../../types/pedido-envio.type';
import type { PedidoItemDraft } from '../../utils/pedidos.utils';
import { clienteNombre, productoPrecio } from '../../utils/pedidos.utils';

interface Props {
  isEditing: boolean;
  puedeCrear: boolean;
  isPending: boolean;
  cajaAbierta: ICaja | null | undefined;
  clientes: { id: string; nombre?: string; apellido?: string | null; razon_social?: string | null; direccion?: string; altura?: string | null; telefono?: string | null; barrio?: string | null; localidad?: string | null; codigo_postal?: string | null; referencia_entrega?: string | null }[];
  clientesById: Map<string, Props['clientes'][number]>;
  empleados: IEmpleado[];
  productos: IProducto[];
  productosFiltrados: IProducto[];
  productosById: Map<string, IProducto>;
  productSearch: string;
  onProductSearchChange: (v: string) => void;
  clienteId: string;
  onClienteChange: (id: string) => void;
  direccion: string; onDireccionChange: (v: string) => void;
  telefono: string; onTelefonoChange: (v: string) => void;
  localidad: string; onLocalidadChange: (v: string) => void;
  barrio: string; onBarrioChange: (v: string) => void;
  codigoPostal: string; onCodigoPostalChange: (v: string) => void;
  referencia: string; onReferenciaChange: (v: string) => void;
  fechaProgramada: string; onFechaProgramadaChange: (v: string) => void;
  repartidorId: string; onRepartidorChange: (v: string) => void;
  medioPago: MedioPagoPedidoEnvio; onMedioPagoChange: (v: MedioPagoPedidoEnvio) => void;
  transferenciaPagada: boolean; onTransferenciaPagadaChange: (v: boolean) => void;
  observaciones: string; onObservacionesChange: (v: string) => void;
  items: PedidoItemDraft[];
  onAddProduct: (producto: IProducto) => void;
  onUpdateItem: (id: string, patch: Partial<PedidoItemDraft>) => void;
  onChangeQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onGuardar: () => void;
  onVolver: () => void;
}

export const PedidoFormulario = ({
  isEditing, puedeCrear, isPending,
  clientes, clientesById, empleados, productosFiltrados, productosById,
  productSearch, onProductSearchChange,
  clienteId, onClienteChange,
  direccion, onDireccionChange, telefono, onTelefonoChange,
  localidad, onLocalidadChange, barrio, onBarrioChange,
  codigoPostal, onCodigoPostalChange, referencia, onReferenciaChange,
  fechaProgramada, onFechaProgramadaChange,
  repartidorId, onRepartidorChange,
  medioPago, onMedioPagoChange, transferenciaPagada, onTransferenciaPagadaChange,
  observaciones, onObservacionesChange,
  items, onAddProduct, onUpdateItem, onChangeQuantity, onRemoveItem,
  onGuardar, onVolver,
}: Props) => {
  const totalDraft = items.reduce((sum, item) => {
    const producto = productosById.get(item.producto_id);
    const precio = item.precio_unitario === '' ? productoPrecio(producto) : toNumber(item.precio_unitario);
    return sum + toNumber(item.cantidad) * precio;
  }, 0);

  return (
    <div className="min-h-[calc(100vh-52px)] bg-[#f3f4f6] px-4 py-4">
      <section className="mx-auto max-w-[1500px] rounded-lg border border-[#c4c6cd] bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#c4c6cd] px-4 py-3">
          <div>
            <div className="flex items-center gap-2 text-[18px] font-bold text-[#041627]">
              <PackagePlus size={18} className="text-[#075E54]" />
              {isEditing ? 'Editar pedido de envio' : 'Nuevo pedido de envio'}
            </div>
            <div className="text-[13px] text-[#44474c]">Carga separada del tablero diario.</div>
          </div>
          <button type="button" onClick={onVolver} className="flex h-9 items-center gap-2 rounded border border-[#c4c6cd] bg-white px-3 text-[13px] font-semibold text-[#041627]">
            <ArrowLeft size={15} /> Volver a pedidos
          </button>
        </div>

        <div className="grid gap-3 p-4 lg:grid-cols-2">
          <div className="grid gap-2 sm:grid-cols-[1fr_auto] lg:col-span-2">
            <select
              value={clienteId}
              onChange={(e) => {
                const cliente = clientesById.get(e.target.value);
                onClienteChange(e.target.value);
                onDireccionChange([cliente?.direccion, cliente?.altura].filter(Boolean).join(' '));
                onTelefonoChange(cliente?.telefono ?? '');
                onBarrioChange(cliente?.barrio ?? '');
                onLocalidadChange(cliente?.localidad ?? '');
                onCodigoPostalChange(cliente?.codigo_postal ?? '');
                onReferenciaChange(cliente?.referencia_entrega ?? '');
              }}
              disabled={isEditing}
              className="h-9 rounded border border-[#c4c6cd] bg-white px-3 text-[13px] outline-none focus:border-[#075E54] disabled:bg-[#f4f5f6]"
            >
              <option value="">Seleccionar cliente cargado</option>
              {clientes.map((c) => <option key={c.id} value={c.id}>{clienteNombre(c)}</option>)}
            </select>
            <Link to="/clientes/nuevo" className="flex h-9 items-center justify-center gap-2 rounded border border-[#cfe2de] bg-[#f3fbf9] px-3 text-[13px] font-semibold text-[#075E54]">
              Nuevo cliente
            </Link>
          </div>
          <input value={direccion} onChange={(e) => onDireccionChange(e.target.value)} placeholder="Direccion de entrega" className="h-9 rounded border border-[#c4c6cd] px-3 text-[13px] outline-none focus:border-[#075E54]" />
          <input value={telefono} onChange={(e) => onTelefonoChange(e.target.value)} placeholder="Telefono de contacto" className="h-9 rounded border border-[#c4c6cd] px-3 text-[13px] outline-none focus:border-[#075E54]" />
          <input value={localidad} onChange={(e) => onLocalidadChange(e.target.value)} placeholder="Localidad" className="h-9 rounded border border-[#c4c6cd] px-3 text-[13px] outline-none focus:border-[#075E54]" />
          <input value={barrio} onChange={(e) => onBarrioChange(e.target.value)} placeholder="Barrio" className="h-9 rounded border border-[#c4c6cd] px-3 text-[13px] outline-none focus:border-[#075E54]" />
          <input value={codigoPostal} onChange={(e) => onCodigoPostalChange(e.target.value)} placeholder="Codigo postal" className="h-9 rounded border border-[#c4c6cd] px-3 text-[13px] outline-none focus:border-[#075E54]" />
          <input value={referencia} onChange={(e) => onReferenciaChange(e.target.value)} placeholder="Referencia de entrega" className="h-9 rounded border border-[#c4c6cd] px-3 text-[13px] outline-none focus:border-[#075E54]" />
          <input type="datetime-local" value={fechaProgramada} onChange={(e) => onFechaProgramadaChange(e.target.value)} className="h-9 rounded border border-[#c4c6cd] px-3 text-[13px] outline-none focus:border-[#075E54]" />
          <select value={repartidorId} onChange={(e) => onRepartidorChange(e.target.value)} className="h-9 rounded border border-[#c4c6cd] bg-white px-3 text-[13px] outline-none focus:border-[#075E54]">
            <option value="">Repartidor sin asignar</option>
            {empleados.map((e) => <option key={e.id} value={e.id}>{e.nombreCompleto}</option>)}
          </select>
          <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <select value={medioPago} onChange={(e) => onMedioPagoChange(e.target.value as MedioPagoPedidoEnvio)} className="h-9 rounded border border-[#c4c6cd] bg-white px-3 text-[13px] outline-none focus:border-[#075E54]">
              <option value="EFECTIVO">Efectivo al entregar</option>
              <option value="TRANSFERENCIA">Transferencia</option>
              <option value="OTRO">Otro medio</option>
            </select>
            <label className="flex h-9 items-center gap-2 rounded border border-[#c4c6cd] px-3 text-[12px] font-semibold text-[#041627]">
              Transferencia pagada
              <input type="checkbox" checked={transferenciaPagada} disabled={medioPago !== 'TRANSFERENCIA'} onChange={(e) => onTransferenciaPagadaChange(e.target.checked)} className="h-4 w-4 accent-[#075E54]" />
            </label>
          </div>
        </div>

        <div className="grid gap-4 border-t border-[#c4c6cd] p-4 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded border border-[#c4c6cd]">
            <div className="border-b border-[#c4c6cd] p-3">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#44474c]" />
                <input value={productSearch} onChange={(e) => onProductSearchChange(e.target.value)} placeholder="Buscar producto por nombre o codigo" className="h-9 w-full rounded border border-[#c4c6cd] bg-white pl-9 pr-3 text-[13px] outline-none focus:border-[#075E54]" />
              </div>
            </div>
            <div className="max-h-[360px] overflow-auto">
              {productosFiltrados.map((producto) => (
                <button key={producto.id} type="button" onClick={() => onAddProduct(producto)} className="grid w-full grid-cols-[1fr_auto] gap-3 border-b border-[#e5e7eb] px-3 py-2 text-left hover:bg-[#f8fafc]">
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-bold text-[#041627]">{producto.nombre}</span>
                    <span className="block truncate text-[12px] text-[#44474c]">{producto.codigo_barras || producto.categoria?.nombre || 'Sin codigo'}</span>
                  </span>
                  <span className="text-right text-[13px] font-bold text-[#075E54]">{money(productoPrecio(producto))}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded border border-[#c4c6cd]">
            <div className="flex items-center justify-between border-b border-[#c4c6cd] px-3 py-3">
              <div className="text-[13px] font-bold text-[#041627]">Carrito del pedido</div>
              <div className="text-[13px] font-bold text-[#075E54]">{money(totalDraft)}</div>
            </div>
            <div className="max-h-[360px] overflow-auto">
              {items.filter((item) => item.producto_id).map((item) => {
                const producto = productosById.get(item.producto_id);
                const precio = item.precio_unitario === '' ? productoPrecio(producto) : toNumber(item.precio_unitario);
                return (
                  <div key={item.id} className="border-b border-[#e5e7eb] px-3 py-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-[13px] font-bold text-[#041627]">{producto?.nombre ?? 'Producto'}</div>
                        <div className="text-[12px] text-[#44474c]">{money(precio)} c/u</div>
                      </div>
                      <div className="text-right text-[13px] font-bold text-[#041627]">{money(precio * toNumber(item.cantidad))}</div>
                    </div>
                    <div className="mt-2 grid grid-cols-[32px_1fr_32px_80px_32px] gap-2">
                      <button type="button" onClick={() => onChangeQuantity(item.id, -1)} className="flex h-8 items-center justify-center rounded border border-[#c4c6cd] bg-white"><Minus size={14} /></button>
                      <input type="number" min={0.01} value={item.cantidad} onChange={(e) => onUpdateItem(item.id, { cantidad: e.target.value })} className="h-8 rounded border border-[#c4c6cd] px-2 text-center text-[13px] outline-none focus:border-[#075E54]" />
                      <button type="button" onClick={() => onChangeQuantity(item.id, 1)} className="flex h-8 items-center justify-center rounded border border-[#c4c6cd] bg-white"><Plus size={14} /></button>
                      <input type="number" min={0} value={item.precio_unitario} onChange={(e) => onUpdateItem(item.id, { precio_unitario: e.target.value })} className="h-8 rounded border border-[#c4c6cd] px-2 text-right text-[13px] outline-none focus:border-[#075E54]" />
                      <button type="button" onClick={() => onRemoveItem(item.id)} className="flex h-8 items-center justify-center rounded border border-[#f1c7c7] bg-[#fff5f5] text-[#b42318]"><XCircle size={14} /></button>
                    </div>
                  </div>
                );
              })}
              {!items.some((item) => item.producto_id) && <div className="px-3 py-8 text-center text-[13px] text-[#44474c]">Busque productos y agreguelos al pedido.</div>}
            </div>
          </div>
        </div>

        <div className="grid gap-3 border-t border-[#c4c6cd] p-4 md:grid-cols-[1fr_180px]">
          <textarea value={observaciones} onChange={(e) => onObservacionesChange(e.target.value)} placeholder="Observaciones del pedido" className="min-h-[74px] rounded border border-[#c4c6cd] px-3 py-2 text-[13px] outline-none focus:border-[#075E54]" />
          <button type="button" onClick={onGuardar} disabled={!puedeCrear || isPending} className="flex h-[74px] items-center justify-center gap-2 rounded bg-[#075E54] px-4 text-[13px] font-semibold text-white disabled:opacity-60">
            <PackagePlus size={16} />
            {isEditing ? 'Guardar cambios' : 'Crear pedido'}
          </button>
        </div>
      </section>
    </div>
  );
};
