import { ArrowLeft, Lock } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import DataTable from '../../../components/common/DataTable';
import { useResumenCaja, useCajaMutations } from '../hooks/useCaja';
import type { CajaMovimientoEvent, CobroMedio } from '../types/caja.type';
import { money, toNumber } from '../utils/format';
import { POS_PERMISSIONS } from '../utils/cajaPermissions';
import { useAuthStore } from '../../../store/auth.store';
import type { DataTableColumn } from '../../../components/common/DataTable';

const cobrosColumns: DataTableColumn<CobroMedio>[] = [
  { key: 'medio', header: 'Medio', render: (m) => <span className="font-semibold text-[#041627]">{m.medio}</span> },
  { key: 'operaciones', header: 'Operaciones', align: 'right', render: (m) => m.cantidad },
  { key: 'total', header: 'Total', align: 'right', render: (m) => <span className="font-bold text-[#041627]">{money(m.total)}</span> },
];

interface Props {
  cajaId: string;
  movimientosCaja: CajaMovimientoEvent[];
  puedeVerCaja: boolean;
}

export const CajaCierre = ({ cajaId, movimientosCaja, puedeVerCaja }: Props) => {
  const permisos = useAuthStore((s) => s.permisos);
  const puedeCerrarCaja = permisos.includes(POS_PERMISSIONS.cajaCerrar);

  const [montoCierre, setMontoCierre] = useState('');
  const [descripcionCierre, setDescripcionCierre] = useState('');

  const resumenQuery = useResumenCaja(cajaId, puedeVerCaja);
  const mutations = useCajaMutations();
  const resumen = resumenQuery.data;
  const cajaEnDetalle = resumen?.caja;

  const montoDeclarado = toNumber(montoCierre);
  const montoCalculado = toNumber(resumen?.totales.calculado);
  const diferenciaPreview = Number((montoDeclarado - montoCalculado).toFixed(2));
  const cierreTieneDiferencia = Math.abs(diferenciaPreview) > 0.009;

  const egresos = movimientosCaja.filter((m) => m.accion === 'EGRESO');
  const consumosInternos = movimientosCaja.filter((m) => m.categoria_egreso === 'CONSUMO_INTERNO');

  return (
    <div className="min-h-[calc(100vh-52px)] bg-[#f3f4f6] px-4 py-4">
      <div className="mx-auto max-w-[1300px] rounded-lg border border-[#c4c6cd] bg-white shadow-sm">
        {/* 1.- Encabezado */}
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#c4c6cd] px-4 py-3">
          <div className="flex items-center gap-3">
            <Link to={`/caja/${cajaId}`} className="inline-flex h-10 w-10 items-center justify-center rounded border border-[#c4c6cd] bg-white text-[#041627] hover:bg-[#f4f5f6]">
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-[22px] font-bold text-[#041627]">Cerrar caja</h1>
              <p className="text-[13px] text-[#44474c]">Caja {cajaId?.slice(0, 8)} | arqueo y analisis final</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-4 lg:grid-cols-[1fr_0.9fr]">
          {/* 2.- Análisis de caja */}
          <section className="rounded border border-[#c4c6cd] bg-white">
            <div className="border-b border-[#c4c6cd] px-4 py-3 text-[13px] font-bold uppercase text-[#44474c]">Analisis de caja</div>
            <div className="grid gap-3 p-4 sm:grid-cols-2">
              {[
                { label: 'Monto inicial', value: resumen?.totales.apertura ?? cajaEnDetalle?.monto_inicial },
                { label: 'Cobros', value: resumen?.totales.cobros },
                { label: 'Ingresos manuales', value: resumen?.totales.ingresos_manuales },
                { label: 'Egresos / pagos', value: resumen?.totales.egresos, color: 'text-[#b42318]' },
              ].map(({ label, value, color }) => (
                <div key={label} className="rounded border border-[#e5e7eb] bg-[#f8fafc] px-3 py-3">
                  <div className="text-[12px] font-semibold text-[#44474c]">{label}</div>
                  <div className={`mt-1 text-[18px] font-bold text-[#041627] ${color ?? ''}`}>{money(value)}</div>
                </div>
              ))}
              <div className="rounded border border-[#cfe2de] bg-[#f3fbf9] px-3 py-3 sm:col-span-2">
                <div className="text-[12px] font-semibold text-[#075E54]">Total esperado por sistema</div>
                <div className="mt-1 text-[22px] font-bold text-[#041627]">{money(resumen?.totales.calculado)}</div>
              </div>
            </div>
            <div className="border-t border-[#c4c6cd]">
              <DataTable
                rows={resumen?.cobros_por_medio ?? []}
                columns={cobrosColumns}
                getRowKey={(m) => m.medio_pago_id ?? m.medio}
                emptyMessage="Sin cobros por medio de pago."
              />
            </div>
          </section>

          {/* 3.- Arqueo final */}
          <section className="rounded border border-[#c4c6cd] bg-white">
            <div className="border-b border-[#c4c6cd] px-4 py-3 text-[13px] font-bold uppercase text-[#44474c]">Arqueo final</div>
            <div className="space-y-3 p-4">
              <label className="block">
                <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">Dinero declarado</span>
                <input
                  type="number"
                  min={0}
                  value={montoCierre}
                  onChange={(e) => setMontoCierre(e.target.value)}
                  placeholder="Ingrese el monto contado"
                  className="h-10 w-full rounded border border-[#c4c6cd] px-3 text-[14px] outline-none focus:border-[#075E54]"
                />
              </label>
              <div className={`rounded border px-3 py-3 ${!montoCierre ? 'border-[#e5e7eb] bg-[#f8fafc]' : cierreTieneDiferencia ? 'border-[#f1c7c7] bg-[#fff5f5]' : 'border-[#cfe2de] bg-[#f3fbf9]'}`}>
                <div className="text-[12px] font-semibold text-[#44474c]">Diferencia</div>
                <div className={`mt-1 text-[20px] font-bold ${diferenciaPreview < 0 ? 'text-[#b42318]' : 'text-[#075E54]'}`}>
                  {montoCierre ? money(diferenciaPreview) : money(0)}
                </div>
              </div>
              <textarea
                value={descripcionCierre}
                onChange={(e) => setDescripcionCierre(e.target.value)}
                placeholder="Observaciones del cierre"
                className="min-h-[72px] w-full rounded border border-[#c4c6cd] px-3 py-2 text-[14px] outline-none focus:border-[#075E54]"
              />
              <button
                type="button"
                onClick={() => mutations.cerrarCaja.mutate({ cajaId, monto_final_declarado: montoDeclarado, descripcion: descripcionCierre || 'Cierre desde modulo caja' })}
                disabled={!puedeCerrarCaja || mutations.cerrarCaja.isPending || !montoCierre || cajaEnDetalle?.estado !== 'ABIERTA'}
                className="flex h-10 w-full items-center justify-center gap-2 rounded bg-[#b42318] px-4 text-[14px] font-semibold text-white hover:bg-[#9b1c13] disabled:opacity-60"
              >
                <Lock size={15} />
                Cerrar caja
              </button>
            </div>
          </section>

          {/* 4.- Egresos y consumos del cierre */}
          <section className="rounded border border-[#c4c6cd] bg-white lg:col-span-2">
            <div className="border-b border-[#c4c6cd] px-4 py-3 text-[13px] font-bold uppercase text-[#44474c]">Pagos, egresos y consumos internos</div>
            <div className="grid gap-4 p-4 md:grid-cols-2">
              <div>
                <div className="mb-2 text-[12px] font-bold uppercase text-[#44474c]">Egresos / pagos registrados</div>
                <div className="space-y-2">
                  {egresos.map((m) => (
                    <div key={m.id} className="rounded border border-[#e5e7eb] bg-[#f8fafc] px-3 py-2 text-[13px]">
                      <div className="flex justify-between gap-3">
                        <span className="font-semibold text-[#041627]">{m.categoria_egreso ?? m.accion}</span>
                        <span className="font-bold text-[#b42318]">{money(m.monto)}</span>
                      </div>
                      <div className="mt-1 text-[#44474c]">{m.descripcion ?? m.entidad_nombre ?? '-'}</div>
                    </div>
                  ))}
                  {!egresos.length && <div className="rounded border border-dashed border-[#c4c6cd] px-3 py-5 text-center text-[13px] text-[#44474c]">Sin egresos.</div>}
                </div>
              </div>
              <div>
                <div className="mb-2 text-[12px] font-bold uppercase text-[#44474c]">Consumos internos</div>
                <div className="space-y-2">
                  {consumosInternos.map((m) => (
                    <div key={m.id} className="rounded border border-[#e5e7eb] bg-[#f8fafc] px-3 py-2 text-[13px]">
                      <div className="flex justify-between gap-3">
                        <span className="font-semibold text-[#041627]">{m.descripcion ?? 'Consumo interno'}</span>
                        <span className="font-bold text-[#b42318]">{money(m.monto)}</span>
                      </div>
                    </div>
                  ))}
                  {!consumosInternos.length && <div className="rounded border border-dashed border-[#c4c6cd] px-3 py-5 text-center text-[13px] text-[#44474c]">Sin consumos internos vinculados a caja.</div>}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
