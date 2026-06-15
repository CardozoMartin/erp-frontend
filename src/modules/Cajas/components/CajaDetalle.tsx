import { ArrowDownCircle, ArrowLeft, CreditCard, Lock, PackageMinus, ReceiptText, UserRound, Wallet } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import DataTable from '../../../components/common/DataTable';
import type { DataTableColumn } from '../../../components/common/DataTable';
import { useResumenCaja, usePedidosCaja } from '../hooks/useCaja';
import type { ICaja, CajaMovimientoEvent } from '../types/caja.type';
import { dateTime, money, toNumber } from '../utils/format';
import { POS_PERMISSIONS } from '../utils/cajaPermissions';
import { useAuthStore } from '../../../store/auth.store';
import { useVentasCaja } from '../../PuntoDeVenta/hooks/usePos';
import type { IVentaCajaPos } from '../../PuntoDeVenta/types/pos.type';

const formatVentaPagos = (ventaCaja: IVentaCajaPos) => {
  if (!ventaCaja.pagos.length) return 'Sin pagos';
  return ventaCaja.pagos.map((p) => `${p.medioPago?.nombre ?? p.tipo}: ${money(p.monto)}`).join(' | ');
};

const formatVentaProductos = (ventaCaja: IVentaCajaPos) => {
  if (!ventaCaja.venta.items.length) return 'Sin productos';
  return ventaCaja.venta.items.map((item) => `${Number(item.cantidad ?? 0)} x ${item.descripcion}`).join(' | ');
};

const ventasCajaColumns: DataTableColumn<IVentaCajaPos>[] = [
  {
    key: 'venta',
    header: 'Venta',
    render: (v) => (
      <div>
        <div className="font-semibold text-[#041627]">{v.venta.numero}</div>
        <div className="text-[12px] text-[#44474c]">{dateTime(v.venta.created_at)}</div>
      </div>
    ),
  },
  { key: 'productos', header: 'Productos', render: (v) => <span className="block max-w-[420px] whitespace-normal text-[12px] leading-snug text-[#44474c]">{formatVentaProductos(v)}</span> },
  { key: 'pagos', header: 'Tipo de pago', render: (v) => <span className="block max-w-[260px] whitespace-normal text-[12px] leading-snug text-[#44474c]">{formatVentaPagos(v)}</span> },
  { key: 'total', header: 'Total', align: 'right', render: (v) => <span className="font-bold text-[#041627]">{money(v.venta.total)}</span> },
];

interface Props {
  cajaId: string;
  cajaAbierta: ICaja | null | undefined;
  movimientosCaja: CajaMovimientoEvent[];
  puedeVerCaja: boolean;
}

export const CajaDetalle = ({ cajaId, cajaAbierta, movimientosCaja, puedeVerCaja }: Props) => {
  const permisos = useAuthStore((s) => s.permisos);
  const puedeCerrarCaja = permisos.includes(POS_PERMISSIONS.cajaCerrar);
  const puedeRegistrarMovimiento = permisos.includes(POS_PERMISSIONS.cajaMovimientosCrear);
  const puedeConsumirStock = permisos.some((p) => [POS_PERMISSIONS.cajaMovimientosCrear, POS_PERMISSIONS.stockAjuste].includes(p as never));

  const [selectedVentaId, setSelectedVentaId] = useState<string | null>(null);

  const resumenQuery = useResumenCaja(cajaId, puedeVerCaja);
  const pedidosCajaQuery = usePedidosCaja(cajaId, puedeVerCaja && !!cajaId);
  const ventasCajaQuery = useVentasCaja(cajaId);

  const resumen = resumenQuery.data;
  const cajaEnDetalle = resumen?.caja ?? cajaAbierta;
  const ventasCaja = ventasCajaQuery.data ?? [];
  const pedidosCaja = pedidosCajaQuery.data ?? [];
  const egresosDetalle = movimientosCaja.filter((m) => m.accion === 'EGRESO');
  const consumosDetalle = movimientosCaja.filter((m) => m.categoria_egreso === 'CONSUMO_INTERNO');

  const selectedVenta = ventasCaja.find((v) => v.venta.id === selectedVentaId) ?? ventasCaja[0] ?? null;

  const totalVentas = ventasCaja.reduce((sum, v) => sum + toNumber(v.venta.total), 0);
  const totalPagos = ventasCaja.reduce((sum, v) => sum + v.pagos.reduce((acc, p) => acc + toNumber(p.monto) + toNumber(p.recargo_monto), 0), 0);
  const costoTotal = ventasCaja.reduce((sum, v) => sum + toNumber(v.margen?.costo_total), 0);
  const gananciaTotal = ventasCaja.reduce((sum, v) => sum + toNumber(v.margen?.ganancia_total), 0);
  const unidadesVendidas = ventasCaja.reduce((sum, v) => sum + v.venta.items.reduce((acc, item) => acc + toNumber(item.cantidad), 0), 0);
  const margenCaja = totalVentas > 0 ? (gananciaTotal / totalVentas) * 100 : 0;
  const totalPedidos = pedidosCaja.reduce((sum, p) => sum + toNumber(p.comprobante?.total), 0);
  const totalPedidosRendidos = pedidosCaja.reduce((sum, p) => sum + toNumber(p.monto_rendido), 0);
  const unidadesPedidos = pedidosCaja.reduce((sum, p) => sum + (p.comprobante?.items ?? []).reduce((acc, item) => acc + toNumber(item.cantidad), 0), 0);

  return (
    <div className="min-h-[calc(100vh-52px)] bg-[#f3f4f6] px-4 py-4">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-4">
        {/* 1.- Encabezado con métricas */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link to="/caja" className="inline-flex h-10 w-10 items-center justify-center rounded border border-[#c4c6cd] bg-white text-[#041627] hover:bg-[#f4f5f6]">
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-[22px] font-bold text-[#041627]">Detalle de caja</h1>
              <p className="text-[13px] text-[#44474c]">Caja {cajaId?.slice(0, 8)}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'Ventas', value: ventasCaja.length },
              { label: 'Total vendido', value: money(totalVentas) },
              { label: 'Total cobrado', value: money(totalPagos), color: 'text-[#075E54]' },
              { label: 'Ganancia est.', value: money(gananciaTotal), color: 'text-[#075E54]' },
              { label: 'Reposicion', value: money(costoTotal) },
              { label: 'Pedidos', value: pedidosCaja.length },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded border border-[#c4c6cd] bg-white px-4 py-2">
                <div className="text-[11px] font-bold uppercase text-[#44474c]">{label}</div>
                <div className={`text-[18px] font-bold text-[#041627] ${color ?? ''}`}>{value}</div>
              </div>
            ))}
            {cajaEnDetalle?.estado === 'ABIERTA' && puedeCerrarCaja && (
              <Link to={`/caja/${cajaId}/cierre`} className="flex h-10 items-center gap-2 rounded bg-[#b42318] px-4 text-[13px] font-semibold text-white hover:bg-[#9b1c13]">
                <Lock size={15} /> Cerrar caja
              </Link>
            )}
            {cajaEnDetalle?.estado === 'ABIERTA' && puedeRegistrarMovimiento && (
              <Link to="/caja/movimientos?panel=egreso" className="flex h-10 items-center gap-2 rounded border border-[#c4c6cd] bg-white px-4 text-[13px] font-semibold text-[#041627] hover:bg-[#f4f5f6]">
                <ArrowDownCircle size={15} /> Registrar egreso
              </Link>
            )}
            {cajaEnDetalle?.estado === 'ABIERTA' && puedeConsumirStock && (
              <Link to="/caja/movimientos?panel=consumo" className="flex h-10 items-center gap-2 rounded border border-[#c4c6cd] bg-white px-4 text-[13px] font-semibold text-[#041627] hover:bg-[#f4f5f6]">
                <PackageMinus size={15} /> Consumo interno
              </Link>
            )}
          </div>
        </div>

        {/* 2.- Cards resumen */}
        <section className="grid gap-3 md:grid-cols-4">
          <div className="rounded-lg border border-[#c4c6cd] bg-white p-4 shadow-sm">
            <div className="text-[12px] font-bold uppercase text-[#44474c]">Dinero esperado</div>
            <div className="mt-2 text-[22px] font-bold text-[#041627]">{money(resumen?.totales.calculado)}</div>
          </div>
          <div className="rounded-lg border border-[#c4c6cd] bg-white p-4 shadow-sm">
            <div className="text-[12px] font-bold uppercase text-[#44474c]">Egresos</div>
            <div className="mt-2 text-[22px] font-bold text-[#b42318]">{money(resumen?.totales.egresos)}</div>
          </div>
          <div className="rounded-lg border border-[#c4c6cd] bg-white p-4 shadow-sm">
            <div className="text-[12px] font-bold uppercase text-[#44474c]">Unidades vendidas</div>
            <div className="mt-2 text-[22px] font-bold text-[#041627]">{unidadesVendidas}</div>
          </div>
          <div className="rounded-lg border border-[#c4c6cd] bg-white p-4 shadow-sm">
            <div className="text-[12px] font-bold uppercase text-[#44474c]">Margen est.</div>
            <div className="mt-2 text-[22px] font-bold text-[#041627]">{margenCaja.toFixed(2)}%</div>
          </div>
          <div className="rounded-lg border border-[#c4c6cd] bg-white p-4 shadow-sm md:col-span-2">
            <div className="text-[12px] font-bold uppercase text-[#44474c]">Pedidos de envio</div>
            <div className="mt-2 text-[20px] font-bold text-[#041627]">
              {money(totalPedidos)} vendidos | {money(totalPedidosRendidos)} rendidos | {unidadesPedidos} unidades
            </div>
          </div>
        </section>

        {/* 3.- Tabla de ventas + panel detalle */}
        <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-lg border border-[#c4c6cd] bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-[#c4c6cd] px-4 py-3 text-[14px] font-semibold text-[#041627]">
              <ReceiptText size={16} className="text-[#075E54]" />
              Ventas realizadas en esta caja
            </div>
            <DataTable
              rows={ventasCaja}
              columns={ventasCajaColumns}
              getRowKey={(v) => v.venta.id}
              isLoading={ventasCajaQuery.isLoading}
              loadingMessage="Cargando ventas de caja..."
              emptyMessage="Todavia no hay ventas en esta caja."
              minWidth="980px"
              onRowClick={(v) => setSelectedVentaId(v.venta.id)}
              rowClassName={(v) => selectedVenta?.venta.id === v.venta.id ? 'bg-[#eef8f6]' : ''}
            />
          </div>

          <aside className="rounded-lg border border-[#c4c6cd] bg-white shadow-sm">
            {selectedVenta ? (
              <>
                <div className="border-b border-[#c4c6cd] px-4 py-3">
                  <div className="text-[16px] font-bold text-[#041627]">{selectedVenta.venta.numero}</div>
                  <div className="text-[12px] text-[#44474c]">{dateTime(selectedVenta.venta.created_at)}</div>
                </div>
                <div className="grid gap-3 border-b border-[#c4c6cd] px-4 py-3 sm:grid-cols-2">
                  {[
                    { label: 'Vendedor', icon: <UserRound size={14} />, value: selectedVenta.vendedor?.nombreCompleto ?? 'Sin vendedor' },
                    { label: 'Cajero', icon: <Wallet size={14} />, value: selectedVenta.cajero?.nombreCompleto ?? 'Sin cajero' },
                  ].map(({ label, icon, value }) => (
                    <div key={label} className="rounded border border-[#e5e7eb] bg-[#f8fafc] px-3 py-2">
                      <div className="flex items-center gap-2 text-[12px] font-bold uppercase text-[#44474c]">{icon}{label}</div>
                      <div className="mt-1 truncate text-[14px] font-semibold text-[#041627]">{value}</div>
                    </div>
                  ))}
                </div>
                <div className="border-b border-[#c4c6cd] px-4 py-3">
                  <div className="mb-2 text-[12px] font-bold uppercase text-[#44474c]">Productos</div>
                  <div className="space-y-2">
                    {selectedVenta.venta.items.map((item) => (
                      <div key={item.id} className="grid grid-cols-[1fr_60px_100px] gap-2 rounded border border-[#e5e7eb] px-3 py-2 text-[13px]">
                        <div className="min-w-0">
                          <div className="truncate font-semibold text-[#041627]">{item.descripcion}</div>
                          <div className="text-[#44474c]">{money(item.precio_unitario)}</div>
                        </div>
                        <div className="text-center text-[#041627]">x{toNumber(item.cantidad)}</div>
                        <div className="text-right font-semibold text-[#041627]">{money(item.subtotal)}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="border-b border-[#c4c6cd] px-4 py-3">
                  <div className="mb-2 flex items-center gap-2 text-[12px] font-bold uppercase text-[#44474c]">
                    <CreditCard size={14} /> Pagos
                  </div>
                  <div className="space-y-2">
                    {selectedVenta.pagos.map((pago) => (
                      <div key={pago.id} className="rounded border border-[#e5e7eb] bg-[#f8fafc] px-3 py-2">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-[13px] font-semibold text-[#041627]">{pago.medioPago?.nombre ?? pago.tipo}</span>
                          <span className="text-[14px] font-bold text-[#041627]">{money(pago.monto)}</span>
                        </div>
                        {pago.referencia && <div className="mt-1 text-[12px] text-[#44474c]">Ref. {pago.referencia}</div>}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-2 px-4 py-4">
                  <div className="flex items-center justify-between text-[14px] text-[#44474c]"><span>Costo estimado</span><span>{money(selectedVenta.margen?.costo_total)}</span></div>
                  <div className="flex items-center justify-between text-[14px] text-[#44474c]"><span>Ganancia estimada</span><span>{money(selectedVenta.margen?.ganancia_total)}</span></div>
                  <div className="flex items-center justify-between text-[14px] text-[#44474c]"><span>Subtotal</span><span>{money(selectedVenta.venta.subtotal)}</span></div>
                  <div className="flex items-center justify-between text-[18px] font-bold text-[#041627]"><span>Total</span><span>{money(selectedVenta.venta.total)}</span></div>
                </div>
              </>
            ) : (
              <div className="px-4 py-10 text-center text-[14px] text-[#44474c]">Seleccione una venta para ver el detalle.</div>
            )}
          </aside>
        </section>

        {/* 4.- Pedidos, egresos y consumos */}
        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-[#c4c6cd] bg-white shadow-sm lg:col-span-2">
            <div className="border-b border-[#c4c6cd] px-4 py-3 text-[14px] font-bold text-[#041627]">Pedidos de envio de esta caja</div>
            <div className="grid gap-3 p-4 md:grid-cols-2">
              {pedidosCaja.map((pedido) => (
                <div key={pedido.id} className="rounded border border-[#e5e7eb] bg-[#f8fafc] px-3 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[13px] font-bold text-[#041627]">Pedido {pedido.id.slice(0, 8)}</div>
                      <div className="mt-1 text-[12px] text-[#44474c]">{pedido.direccion_entrega} | {dateTime(pedido.created_at)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[14px] font-bold text-[#041627]">{money(pedido.comprobante?.total)}</div>
                      <div className="text-[11px] font-semibold text-[#44474c]">{pedido.estado_pago}</div>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1">
                    {(pedido.comprobante?.items ?? []).map((item) => (
                      <div key={item.id} className="flex justify-between gap-3 text-[12px] text-[#44474c]">
                        <span className="truncate">{toNumber(item.cantidad)} x {item.descripcion}</span>
                        <span className="font-semibold text-[#041627]">{money(item.subtotal)}</span>
                      </div>
                    ))}
                  </div>
                  {pedido.monto_rendido && (
                    <div className="mt-3 rounded border border-[#cfe2de] bg-[#f3fbf9] px-2 py-1 text-[12px] font-semibold text-[#075E54]">
                      Rendido en caja: {money(pedido.monto_rendido)}
                    </div>
                  )}
                </div>
              ))}
              {!pedidosCaja.length && (
                <div className="rounded border border-dashed border-[#c4c6cd] px-3 py-6 text-center text-[13px] text-[#44474c] md:col-span-2">Sin pedidos vinculados a esta caja.</div>
              )}
            </div>
          </div>

          {[
            { titulo: 'Egresos y pagos de la caja', items: egresosDetalle, empty: 'Sin egresos en esta caja.', renderMonto: (m: CajaMovimientoEvent) => <span className="text-[14px] font-bold text-[#b42318]">{money(m.monto)}</span>, renderLabel: (m: CajaMovimientoEvent) => m.categoria_egreso ?? 'EGRESO', renderSub: (m: CajaMovimientoEvent) => m.descripcion ?? m.entidad_nombre ?? dateTime(m.created_at) },
            { titulo: 'Consumos internos', items: consumosDetalle, empty: 'Sin consumos internos en esta caja.', renderMonto: (m: CajaMovimientoEvent) => <span className="text-[12px] font-semibold text-[#44474c]">{dateTime(m.created_at)}</span>, renderLabel: (m: CajaMovimientoEvent) => m.entidad_nombre ?? 'Consumo interno', renderSub: (m: CajaMovimientoEvent) => m.descripcion ?? 'Descuento de stock por consumo interno' },
          ].map(({ titulo, items, empty, renderMonto, renderLabel, renderSub }) => (
            <div key={titulo} className="rounded-lg border border-[#c4c6cd] bg-white shadow-sm">
              <div className="border-b border-[#c4c6cd] px-4 py-3 text-[14px] font-bold text-[#041627]">{titulo}</div>
              <div className="space-y-2 p-4">
                {items.map((m) => (
                  <div key={m.id} className="rounded border border-[#e5e7eb] bg-[#f8fafc] px-3 py-2">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[13px] font-semibold text-[#041627]">{renderLabel(m)}</span>
                      {renderMonto(m)}
                    </div>
                    <div className="mt-1 text-[12px] text-[#44474c]">{renderSub(m)}</div>
                  </div>
                ))}
                {!items.length && (
                  <div className="rounded border border-dashed border-[#c4c6cd] px-3 py-6 text-center text-[13px] text-[#44474c]">{empty}</div>
                )}
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
};
