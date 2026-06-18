import type { IComprobanteAux, IVentaGeneralAux } from '../types/pos-aux.type';
import { dateTime, money, shortId, toNumber } from '../utils/format';
import { EstadoBadge } from './VentasDetalles/EstadoBadge';

const tipoLabel: Record<string, string> = {
  VENTA: 'Venta',
  COTIZACION: 'Cotizacion',
};

type Props = {
  venta: IVentaGeneralAux;
};

const calcularDevueltosPorItem = (notasCredito: IComprobanteAux[]): Map<string, number> => {
  const mapa = new Map<string, number>();
  for (const nota of notasCredito) {
    for (const item of nota.items ?? []) {
      if (!item.comprobante_item_origen_id) continue;
      mapa.set(
        item.comprobante_item_origen_id,
        (mapa.get(item.comprobante_item_origen_id) ?? 0) + toNumber(item.cantidad),
      );
    }
  }
  return mapa;
};

const VentaDetalleFicha = ({ venta }: Props) => {
  const comprobante = venta.comprobante;
  const devueltosPorItem = calcularDevueltosPorItem(venta.notasCredito);
  const pagosTotal = venta.pagos.reduce(
    (sum, pago) => sum + toNumber(pago.monto) + toNumber(pago.recargo_monto),
    0,
  );
  const totalCantidad = (comprobante.items ?? []).reduce(
    (sum, item) => sum + Math.max(0, toNumber(item.cantidad) - (devueltosPorItem.get(item.id) ?? 0)),
    0,
  );
  const totalPrecio = (comprobante.items ?? []).reduce(
    (sum, item) => sum + toNumber(item.precio_unitario),
    0,
  );

  return (
    <div className="rounded-lg border border-[#c4c6cd] bg-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#c4c6cd] px-4 py-3">
        <div>
          <div className="text-[28px] font-bold text-[#0D5C63]">Detalle {comprobante.numero}</div>
          <div className="text-[13px] text-[#44474c]">
            {tipoLabel[comprobante.tipo] ?? comprobante.tipo} | {dateTime(comprobante.created_at)}
          </div>
        </div>
        {/* Estado del comprobante con badge de colores */}
        <EstadoBadge estado={comprobante.estado} />
      </div>

      <div className="grid gap-4 p-4 xl:grid-cols-[1fr_1fr]">
        <section className="rounded border border-[#c4c6cd]">
          <div className="border-b border-[#c4c6cd] px-3 py-2 text-[13px] font-bold uppercase text-[#041627]">
            Datos
          </div>
          <div className="grid gap-2 p-3 sm:grid-cols-2">
            <Info label="Vendedor" value={venta.vendedor?.nombreCompleto ?? '-'} />
            <Info label="Cajero" value={venta.cajero?.nombreCompleto ?? '-'} />
            <Info label="Lista precio" value={venta.listaPrecio?.nombre ?? 'Precio base'} />
            <Info label="Caja" value={shortId(comprobante.caja_id)} />
            <Info label="Fiscal emitido" value={venta.fiscales.length ? `${venta.fiscales.length}` : 'No'} />
            <Info label="Notas credito" value={venta.notasCredito.length ? `${venta.notasCredito.length}` : 'No'} />
          </div>
        </section>

        <section className="rounded border border-[#c4c6cd]">
          <div className="border-b border-[#c4c6cd] px-3 py-2 text-[13px] font-bold uppercase text-[#041627]">
            Pagos y margen
          </div>
          <div className="grid gap-2 p-3 text-[13px]">
            {venta.pagos.length ? (
              venta.pagos.map((pago) => (
                <div key={pago.id} className="flex items-center justify-between rounded border border-[#e5e7eb] px-3 py-2">
                  <span>{pago.medioPago?.nombre ?? pago.tipo}</span>
                  <span className="font-semibold">{money(toNumber(pago.monto) + toNumber(pago.recargo_monto))}</span>
                </div>
              ))
            ) : (
              <div className="rounded border border-dashed border-[#c4c6cd] px-3 py-3 text-[#44474c]">
                Sin pagos registrados.
              </div>
            )}
            <TotalLine label="Total pagos" value={pagosTotal} />
            {venta.notasCredito.length > 0 && (
              <>
                <div className="mt-2 border-t border-[#e5e7eb] pt-2 text-[11px] font-bold uppercase text-[#b42318]">
                  Notas de crédito
                </div>
                {venta.notasCredito.map((nc) => (
                  <div key={nc.id} className="flex items-center justify-between rounded border border-[#f1c7c7] bg-[#fff5f5] px-3 py-1.5 text-[12px]">
                    <span className="font-semibold text-[#b42318]">{nc.numero}</span>
                    <span className="font-bold text-[#b42318]">-{money(nc.subtotal)}</span>
                  </div>
                ))}
                <TotalLine
                  label="Total neto"
                  value={toNumber(comprobante.total) - venta.notasCredito.reduce((sum, nc) => sum + toNumber(nc.subtotal), 0)}
                  strong
                />
              </>
            )}
            <TotalLine label="IVA estimado" value={venta.margen.iva_estimado} />
            <TotalLine label="Costo estimado" value={venta.margen.costo_total} />
            <TotalLine label="Ganancia estimada" value={venta.margen.ganancia_total} strong />
            <div className="text-right text-[12px] font-semibold text-[#075E54]">
              Margen {venta.margen.margen_porcentaje.toFixed(2)}%
            </div>
          </div>
        </section>
      </div>

      <div className="px-4 pb-4">
  <section className="overflow-hidden rounded-lg border border-[#c4c6cd]">
    
    {/* Header con contador de referencias */}
    <div className="flex items-center justify-between border-b border-[#c4c6cd] px-4 py-2.5">
      <span className="text-[12px] font-bold uppercase tracking-wider text-[#041627]">
        Productos / Items
      </span>
      <span className="text-[12px] font-semibold text-[#44474c]">
        {(comprobante.items ?? []).length} referencia{(comprobante.items ?? []).length !== 1 ? 's' : ''}
      </span>
    </div>

    {/* Tabla */}
    <div className="overflow-auto">
      <table className="w-full min-w-160 border-collapse text-[13px]">
        <thead>
          <tr className="bg-[#f4f5f7] text-[11px] font-bold uppercase tracking-wider text-[#44474c]">
            <th className="px-4 py-2.5 text-left">Producto</th>
            <th className="px-4 py-2.5 text-center">Cant.</th>
            <th className="px-4 py-2.5 text-right">Precio</th>
            <th className="px-4 py-2.5 text-right">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {(comprobante.items ?? []).map((item, idx) => {
            const devuelto = devueltosPorItem.get(item.id) ?? 0;
            const cantNeta = Math.max(0, toNumber(item.cantidad) - devuelto);
            const todoDevuelto = cantNeta === 0;
            return (
              <tr
                key={item.id}
                className={`border-t border-[#e5e7eb] transition-colors hover:bg-[#f9fafb] ${
                  todoDevuelto ? 'opacity-50' : idx % 2 === 0 ? 'bg-white' : 'bg-[#fafafa]'
                }`}
              >
                <td className="px-4 py-3 font-semibold text-[#041627]">
                  <span className={todoDevuelto ? 'line-through' : ''}>{item.descripcion}</span>
                  {devuelto > 0 && (
                    <span className="ml-2 rounded bg-[#fff5f5] px-1.5 py-0.5 text-[10px] font-bold text-[#b42318]">
                      -{devuelto} devuelto{devuelto > 1 ? 's' : ''}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-center text-[#44474c]">
                  {todoDevuelto ? (
                    <span className="text-[#b42318] line-through">{toNumber(item.cantidad)}</span>
                  ) : devuelto > 0 ? (
                    <span>
                      {cantNeta}{' '}
                      <span className="text-[11px] text-[#44474c] line-through">({toNumber(item.cantidad)})</span>
                    </span>
                  ) : (
                    toNumber(item.cantidad)
                  )}
                </td>
                <td className="px-4 py-3 text-right text-[#44474c]">{money(item.precio_unitario)}</td>
                <td className="px-4 py-3 text-right font-bold text-[#041627]">
                  {todoDevuelto ? (
                    <span className="text-[#b42318] line-through">{money(item.subtotal)}</span>
                  ) : devuelto > 0 ? (
                    money(cantNeta * toNumber(item.precio_unitario))
                  ) : (
                    money(item.subtotal)
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      <tfoot className="bg-[#0D3D45] text-white">
        <tr className="border-t border-[#1a5260]">
          <td className="px-4 py-3 text-left text-[11px] uppercase tracking-wider text-[#7ab8c0]">Totales</td>
          <td className="px-4 py-3 text-center">
            <div className="text-[13px] font-semibold">{totalCantidad}</div>
            <div className="text-[10px] uppercase tracking-wider text-[#7ab8c0]">productos</div>
          </td>
          <td className="px-4 py-3 text-right">
            <div className="text-[13px] font-semibold">{money(totalPrecio)}</div>
            <div className="text-[10px] uppercase tracking-wider text-[#7ab8c0]">suma precio</div>
          </td>
          <td className="px-4 py-3 text-right">
            <div className="text-[13px] font-semibold">{money(comprobante.subtotal)}</div>
            <div className="text-[10px] uppercase tracking-wider text-[#7ab8c0]">subtotal</div>
          </td>
        </tr>
      </tfoot>
    </table>
  </div>

  </section>
</div>
    </div>
  );
};

const Info = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded border border-[#e5e7eb] bg-[#fbf9fa] px-3 py-2">
    <div className="text-[11px] font-bold uppercase text-[#44474c]">{label}</div>
    <div className="mt-1 truncate text-[13px] font-semibold text-[#041627]">{value}</div>
  </div>
);

const TotalLine = ({ label, value, strong = false }: { label: string; value: unknown; strong?: boolean }) => (
  <div className={`flex items-center justify-between gap-3 ${strong ? 'font-bold text-[#041627]' : 'text-[#44474c]'}`}>
    <span>{label}</span>
    <span>{money(value)}</span>
  </div>
);

export default VentaDetalleFicha;
