import { Lock, Plus, ReceiptText, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../../components/common/DataTable';
import type { DataTableColumn } from '../../../components/common/DataTable';
import { useCajaAbierta, useCajaMutations, useCajas } from '../hooks/useCaja';
import type { ICaja } from '../types/caja.type';
import { dateTime, money, shortId, toNumber } from '../utils/format';
import { hasAnyPermission, POS_PERMISSIONS } from '../utils/cajaPermissions';
import { useAuthStore } from '../../../store/auth.store';
import { useState } from 'react';
import { Link } from 'react-router-dom';

const cajasColumns: DataTableColumn<ICaja>[] = [
  { key: 'caja', header: 'Caja', render: (caja) => <span className="font-semibold text-[#041627]">{shortId(caja.id)}</span> },
  { key: 'estado', header: 'Estado', render: (caja) => caja.estado },
  { key: 'apertura', header: 'Apertura', render: (caja) => dateTime(caja.fecha_apertura) },
  { key: 'inicial', header: 'Inicial', align: 'right', render: (caja) => money(caja.monto_inicial) },
  { key: 'declarado', header: 'Declarado', align: 'right', render: (caja) => money(caja.monto_final_declarado) },
  { key: 'calculado', header: 'Calculado', align: 'right', render: (caja) => money(caja.monto_final_calculado) },
  { key: 'diferencia', header: 'Diferencia', align: 'right', render: (caja) => money(caja.diferencia) },
];

export const CajaListado = () => {
  const navigate = useNavigate();
  const permisos = useAuthStore((s) => s.permisos);
  const puedeAbrirCaja = permisos.includes(POS_PERMISSIONS.cajaAbrir);
  const puedeCerrarCaja = permisos.includes(POS_PERMISSIONS.cajaCerrar);
  const puedeVerCaja = hasAnyPermission(permisos, POS_PERMISSIONS.cajaVer, POS_PERMISSIONS.reportesVer, POS_PERMISSIONS.reportesCaja, POS_PERMISSIONS.configPos);
  const puedeVerTodasCajas = hasAnyPermission(permisos, POS_PERMISSIONS.reportesVer, POS_PERMISSIONS.reportesCaja, POS_PERMISSIONS.configPos);

  const [montoInicial, setMontoInicial] = useState('1000');
  const [desdeCajas, setDesdeCajas] = useState('');
  const [hastaCajas, setHastaCajas] = useState('');
  const [estadoCajas, setEstadoCajas] = useState<'TODAS' | 'ABIERTA' | 'CERRADA'>('TODAS');

  const mutations = useCajaMutations();
  const cajaAbiertaQuery = useCajaAbierta(puedeVerCaja || puedeAbrirCaja);
  const cajaAbierta = cajaAbiertaQuery.data;
  const cajasQuery = useCajas(
    puedeVerTodasCajas
      ? { desde: desdeCajas || undefined, hasta: hastaCajas || undefined, estado: estadoCajas === 'TODAS' ? undefined : estadoCajas }
      : {},
    puedeVerCaja,
  );
  const cajas = cajasQuery.data ?? [];
  const cajasAbiertas = cajas.filter((c) => c.estado === 'ABIERTA');
  const cajasListado = puedeVerTodasCajas ? cajas : cajasAbiertas;

  return (
    <div className="min-h-[calc(100vh-52px)] bg-[#f3f4f6] px-4 py-4">
      <section className="mx-auto max-w-[1500px] rounded-lg border border-[#c4c6cd] bg-white shadow-sm">
        {/* 1.- Encabezado */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#c4c6cd] px-4 py-3">
          <div>
            <div className="flex items-center gap-2 text-[15px] font-bold text-[#041627]">
              <Wallet size={17} className="text-[#075E54]" />
              {puedeVerTodasCajas ? 'Cajas' : 'Mi caja en proceso'}
            </div>
            <div className="mt-1 text-[13px] text-[#44474c]">
              Selecciona una caja para ver ventas, pagos, egresos, consumos y rentabilidad.
            </div>
          </div>
          {!cajaAbierta ? (
            <div className="flex flex-wrap gap-2">
              <input
                type="number"
                min={0}
                value={montoInicial}
                onChange={(e) => setMontoInicial(e.target.value)}
                className="h-9 w-36 rounded border border-[#c4c6cd] px-3 text-[14px] outline-none focus:border-[#075E54]"
              />
              <button
                onClick={() => mutations.abrirCaja.mutate({ monto_inicial: toNumber(montoInicial), descripcion: 'Apertura desde modulo caja' })}
                disabled={!puedeAbrirCaja || mutations.abrirCaja.isPending}
                className="flex h-9 items-center gap-2 rounded bg-[#075E54] px-3 text-[13px] font-semibold text-white hover:bg-[#0b6d62] disabled:opacity-60"
              >
                <Plus size={15} />
                Abrir caja
              </button>
            </div>
          ) : (
            <Link
              to="/caja/movimientos"
              className="flex h-9 items-center gap-2 rounded bg-[#075E54] px-3 text-[13px] font-semibold text-white hover:bg-[#0b6d62]"
            >
              <Wallet size={15} />
              Operar caja
            </Link>
          )}
        </div>

        {/* 2.- Filtros (solo para quien puede ver todas) */}
        {puedeVerTodasCajas && (
          <div className="flex flex-wrap items-end gap-2 border-b border-[#c4c6cd] bg-[#fbf9fa] px-4 py-3">
            <label className="block">
              <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">Desde</span>
              <input type="date" value={desdeCajas} onChange={(e) => setDesdeCajas(e.target.value)} className="h-9 rounded border border-[#c4c6cd] px-3 text-[14px] outline-none focus:border-[#075E54]" />
            </label>
            <label className="block">
              <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">Hasta</span>
              <input type="date" value={hastaCajas} onChange={(e) => setHastaCajas(e.target.value)} className="h-9 rounded border border-[#c4c6cd] px-3 text-[14px] outline-none focus:border-[#075E54]" />
            </label>
            <label className="block">
              <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">Estado</span>
              <select value={estadoCajas} onChange={(e) => setEstadoCajas(e.target.value as typeof estadoCajas)} className="h-9 rounded border border-[#c4c6cd] bg-white px-3 text-[14px] outline-none focus:border-[#075E54]">
                <option value="TODAS">Todas</option>
                <option value="ABIERTA">Abiertas</option>
                <option value="CERRADA">Cerradas</option>
              </select>
            </label>
            <button
              type="button"
              onClick={() => { setDesdeCajas(''); setHastaCajas(''); setEstadoCajas('TODAS'); }}
              className="h-9 rounded border border-[#c4c6cd] bg-white px-3 text-[13px] font-semibold text-[#041627] hover:bg-[#f4f5f6]"
            >
              Limpiar
            </button>
          </div>
        )}

        {/* 3.- Tabla */}
        <DataTable
          rows={cajasListado}
          columns={puedeVerTodasCajas ? cajasColumns : cajasColumns.filter((c) => !['declarado', 'calculado', 'diferencia'].includes(c.key))}
          getRowKey={(caja) => caja.id}
          isLoading={cajasQuery.isLoading}
          loadingMessage="Cargando cajas..."
          emptyMessage={puedeVerTodasCajas ? 'Sin cajas para los filtros seleccionados.' : 'No tenes una caja abierta en proceso.'}
          minWidth="900px"
          onRowClick={(caja) => navigate(`/caja/${caja.id}`)}
          getContextActions={(caja) => [
            { label: 'Ver ventas y pagos', icon: <ReceiptText size={14} />, onClick: () => navigate(`/caja/${caja.id}`) },
            { label: 'Cerrar caja', icon: <Lock size={14} />, danger: true, disabled: !puedeCerrarCaja, dividerBefore: true, onClick: () => navigate(`/caja/${caja.id}/cierre`) },
          ]}
        />
      </section>
    </div>
  );
};
