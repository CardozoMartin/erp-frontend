import type { IVentaGeneralAux } from '../types/pos-aux.type';
import { dateTime, money, shortId, toNumber } from '../utils/format';

const tipoLabel: Record<string, string> = {
  VENTA: 'Venta',
  COTIZACION: 'Cotizacion',
};

const arcaBadgeClass = (estado?: string | null) => {
  if (estado === 'AUTORIZADO') return 'border-[#cfe2de] bg-[#f3fbf9] text-[#075E54]';
  if (estado === 'RECHAZADO') return 'border-[#f1c7c7] bg-[#fff5f5] text-[#b42318]';
  if (estado === 'MANUAL') return 'border-[#c7d2fe] bg-[#eef2ff] text-[#3730a3]';
  return 'border-[#f6d9a8] bg-[#fff8eb] text-[#92400e]';
};

type Props = {
  venta: IVentaGeneralAux;
};

const VentaDetalleFicha = ({ venta }: Props) => {
  const comprobante = venta.comprobante;
  const pagosTotal = venta.pagos.reduce(
    (sum, pago) => sum + toNumber(pago.monto) + toNumber(pago.recargo_monto),
    0,
  );

  return (
    <div className="rounded-lg border border-[#c4c6cd] bg-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#c4c6cd] px-4 py-3">
        <div>
          <div className="text-[18px] font-bold text-[#041627]">Detalle {comprobante.numero}</div>
          <div className="text-[13px] text-[#44474c]">
            {tipoLabel[comprobante.tipo] ?? comprobante.tipo} | {dateTime(comprobante.created_at)}
          </div>
        </div>
        <span className="rounded border border-[#cfe2de] bg-[#f3fbf9] px-2.5 py-1 text-[11px] font-semibold text-[#075E54]">
          {comprobante.estado}
        </span>
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
        {venta.fiscales.length ? (
          <section className="mb-4 rounded border border-[#c4c6cd]">
            <div className="border-b border-[#c4c6cd] px-3 py-2 text-[13px] font-bold uppercase text-[#041627]">
              Comprobantes fiscales
            </div>
            <div className="overflow-auto">
              <table className="w-full min-w-[780px] border-collapse text-[13px]">
                <thead className="bg-[#fbf9fa] text-[#44474c]">
                  <tr>
                    <th className="px-3 py-2 text-left">Comprobante</th>
                    <th className="px-3 py-2 text-left">Estado ARCA</th>
                    <th className="px-3 py-2 text-left">CAE</th>
                    <th className="px-3 py-2 text-left">Vencimiento</th>
                    <th className="px-3 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {venta.fiscales.map((fiscal) => (
                    <tr key={fiscal.id} className="border-t border-[#e5e7eb]">
                      <td className="px-3 py-2 font-semibold text-[#041627]">
                        {fiscal.tipo} {fiscal.numero}
                      </td>
                      <td className="px-3 py-2">
                        {['FACTURA_A', 'FACTURA_B', 'FACTURA_C'].includes(fiscal.tipo) ? (
                          <span className={`rounded border px-2 py-1 text-[11px] font-semibold ${arcaBadgeClass(fiscal.arca_estado)}`}>
                            {fiscal.arca_estado ?? 'PENDIENTE'}
                            {fiscal.arca_modo ? ` (${fiscal.arca_modo})` : ''}
                          </span>
                        ) : (
                          <span className="text-[#44474c]">No requiere</span>
                        )}
                      </td>
                      <td className="px-3 py-2 font-mono text-[12px]">{fiscal.cae ?? '-'}</td>
                      <td className="px-3 py-2">{fiscal.cae_vencimiento ? dateTime(fiscal.cae_vencimiento) : '-'}</td>
                      <td className="px-3 py-2 text-right font-semibold">{money(fiscal.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        <section className="rounded border border-[#c4c6cd]">
          <div className="border-b border-[#c4c6cd] px-3 py-2 text-[13px] font-bold uppercase text-[#041627]">
            Items
          </div>
          <div className="overflow-auto">
            <table className="w-full min-w-[720px] border-collapse text-[13px]">
              <thead className="bg-[#fbf9fa] text-[#44474c]">
                <tr>
                  <th className="px-3 py-2 text-left">Producto</th>
                  <th className="px-3 py-2 text-right">Cant.</th>
                  <th className="px-3 py-2 text-right">Precio</th>
                  <th className="px-3 py-2 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {(comprobante.items ?? []).map((item) => (
                  <tr key={item.id} className="border-t border-[#e5e7eb]">
                    <td className="px-3 py-2 font-semibold text-[#041627]">{item.descripcion}</td>
                    <td className="px-3 py-2 text-right">{toNumber(item.cantidad)}</td>
                    <td className="px-3 py-2 text-right">{money(item.precio_unitario)}</td>
                    <td className="px-3 py-2 text-right font-semibold">{money(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid gap-2 border-t border-[#c4c6cd] bg-[#fbfbfc] px-3 py-3 text-[13px] md:grid-cols-4">
            <TotalLine label="Subtotal" value={comprobante.subtotal} />
            <TotalLine label="Descuento" value={comprobante.descuento_total} />
            <TotalLine label="Recargo" value={comprobante.recargo_total} />
            <TotalLine label="Total final" value={comprobante.total} strong />
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
