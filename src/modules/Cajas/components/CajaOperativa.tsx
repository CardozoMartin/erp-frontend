import { ArrowDownCircle, ArrowUpCircle, Calculator, Lock, PackageMinus, ShieldAlert, Wallet } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import DataTable from '../../../components/common/DataTable';
import type { DataTableColumn } from '../../../components/common/DataTable';
import FichaHistoryPanel from '../../../components/common/FichaHistoryPanel';
import { useAuditoriaCaja, useCajaAbierta, useCajaMutations, useResumenCaja } from '../hooks/useCaja';
import type { CajaMovimientoEvent, CajaPanel, CobroMedio, IAuditoriaCaja, CATEGORIAS_EGRESO, CategoriaEgreso } from '../types/caja.type';
import { CATEGORIAS_EGRESO as CATS } from '../types/caja.type';
import { money, toNumber } from '../utils/format';
import { hasAnyPermission, POS_PERMISSIONS } from '../utils/cajaPermissions';
import { useAuthStore } from '../../../store/auth.store';
import { useObtenerProductos } from '../../Productos/hooks/useProductos';
import type { IResumenCaja } from '../types/caja.type';

const cobrosColumns: DataTableColumn<CobroMedio>[] = [
  { key: 'medio', header: 'Medio', render: (m) => <span className="font-semibold text-[#041627]">{m.medio}</span> },
  { key: 'operaciones', header: 'Operaciones', align: 'right', render: (m) => m.cantidad },
  { key: 'total', header: 'Total', align: 'right', render: (m) => <span className="font-bold text-[#041627]">{money(m.total)}</span> },
];

interface Props {
  movimientosCaja: CajaMovimientoEvent[];
  puedeVerCaja: boolean;
}

export const CajaOperativa = ({ movimientosCaja, puedeVerCaja }: Props) => {
  const location = useLocation();
  const permisos = useAuthStore((s) => s.permisos);
  const puedeAbrirCaja = permisos.includes(POS_PERMISSIONS.cajaAbrir);
  const puedeCerrarCaja = permisos.includes(POS_PERMISSIONS.cajaCerrar);
  const puedeRegistrarMovimiento = permisos.includes(POS_PERMISSIONS.cajaMovimientosCrear);
  const puedeConsumirStock = hasAnyPermission(permisos, POS_PERMISSIONS.cajaMovimientosCrear, POS_PERMISSIONS.stockAjuste);

  const [activePanel, setActivePanel] = useState<CajaPanel>('resumen');
  const [montoInicial, setMontoInicial] = useState('1000');
  const [montoMovimiento, setMontoMovimiento] = useState('');
  const [montoCierre, setMontoCierre] = useState('');
  const [descripcionCierre, setDescripcionCierre] = useState('');
  const [categoriaEgreso, setCategoriaEgreso] = useState<CategoriaEgreso>('RETIRO_DINERO');
  const [entidadNombre, setEntidadNombre] = useState('');
  const [referenciaEgreso, setReferenciaEgreso] = useState('');
  const [descripcionEgreso, setDescripcionEgreso] = useState('');
  const [productoConsumoId, setProductoConsumoId] = useState('');
  const [productoSearch, setProductoSearch] = useState('');
  const [cantidadConsumo, setCantidadConsumo] = useState('1');
  const [descripcionConsumo, setDescripcionConsumo] = useState('');

  const mutations = useCajaMutations();
  const cajaAbiertaQuery = useCajaAbierta(puedeVerCaja || puedeAbrirCaja);
  const cajaAbierta = cajaAbiertaQuery.data;
  const resumenQuery = useResumenCaja(cajaAbierta?.id, puedeVerCaja && !!cajaAbierta?.id);
  const resumen = resumenQuery.data;
  const cajaEnDetalle = resumen?.caja ?? cajaAbierta;

  const auditoriaCajaQuery = useAuditoriaCaja(
    { page: 1, limit: 50, entidad: 'caja', entidad_id: cajaAbierta?.id ?? '' },
    puedeVerCaja && !!cajaAbierta?.id,
  );

  const productsQuery = useObtenerProductos(1, 200);
  const productosResponse = productsQuery.data;
  const productos = Array.isArray(productosResponse) ? productosResponse : productosResponse?.data ?? [];

  const productosConsumo = useMemo(() => {
    const term = productoSearch.trim().toLowerCase();
    if (!term) return productos.slice(0, 20);
    return productos.filter((p) => {
      const codigo = p.codigo_barras?.toLowerCase?.() ?? '';
      return p.nombre.toLowerCase().includes(term) || codigo.includes(term);
    }).slice(0, 30);
  }, [productoSearch, productos]);

  const productoConsumo = productos.find((p) => p.id === productoConsumoId);
  const montoDeclarado = toNumber(montoCierre);
  const montoCalculado = toNumber(resumen?.totales.calculado);
  const montoEgreso = toNumber(montoMovimiento);
  const egresoSuperaDisponible = montoEgreso > montoCalculado;
  const diferenciaPreview = useMemo(() => Number((montoDeclarado - montoCalculado).toFixed(2)), [montoCalculado, montoDeclarado]);
  const cierreTieneDiferencia = Math.abs(diferenciaPreview) > 0.009;
  const auditoriaCaja = auditoriaCajaQuery.data?.data ?? [];

  useEffect(() => {
    const panel = new URLSearchParams(location.search).get('panel') as CajaPanel | null;
    if (panel && ['resumen', 'egreso', 'consumo', 'cierre', 'historial', 'movimientos', 'auditoria'].includes(panel)) {
      setActivePanel(panel);
    }
  }, [location.search]);

  const manejarRegistrarEgreso = () => {
    if (!puedeRegistrarMovimiento || !cajaAbierta || egresoSuperaDisponible) return;
    mutations.movimientoCaja.mutate(
      { cajaId: cajaAbierta.id, tipo: 'EGRESO', monto: montoEgreso, categoria_egreso: categoriaEgreso, entidad_nombre: entidadNombre.trim() || null, referencia: referenciaEgreso.trim() || null, descripcion: descripcionEgreso.trim() || CATS.find((c) => c.value === categoriaEgreso)?.label },
      { onSuccess: () => { setMontoMovimiento(''); setEntidadNombre(''); setReferenciaEgreso(''); setDescripcionEgreso(''); } },
    );
  };

  const manejarRegistrarConsumo = () => {
    if (!puedeConsumirStock || !cajaAbierta || !productoConsumoId) return;
    const producto = productos.find((p) => p.id === productoConsumoId);
    const descripcionFinal = descripcionConsumo.trim() || `Consumo interno${producto?.nombre ? ` de ${producto.nombre}` : ''}`;
    mutations.consumoInterno.mutate(
      { producto_id: productoConsumoId, cantidad: toNumber(cantidadConsumo), descripcion: descripcionFinal },
      {
        onSuccess: () => {
          mutations.movimientoCaja.mutate({ cajaId: cajaAbierta.id, tipo: 'EGRESO', monto: 0, categoria_egreso: 'CONSUMO_INTERNO', entidad_nombre: producto?.nombre ?? null, descripcion: descripcionFinal });
          setProductoConsumoId('');
          setCantidadConsumo('1');
          setDescripcionConsumo('');
        },
      },
    );
  };

  const tabs = [
    { id: 'resumen', label: 'Resumen', icon: <Calculator size={14} /> },
    ...(puedeRegistrarMovimiento ? [{ id: 'egreso', label: 'Egreso', icon: <ArrowDownCircle size={14} /> }] : []),
    ...(puedeConsumirStock ? [{ id: 'consumo', label: 'Consumo interno', icon: <PackageMinus size={14} /> }] : []),
    ...(puedeCerrarCaja ? [{ id: 'cierre', label: 'Cerrar caja', icon: <Lock size={14} /> }] : []),
    { id: 'historial', label: 'Medios de pago', icon: <Wallet size={14} /> },
    { id: 'movimientos', label: 'Movimientos', icon: <ArrowUpCircle size={14} /> },
    { id: 'auditoria', label: 'Auditoria', icon: <ShieldAlert size={14} /> },
  ];

  return (
    <div className="mx-auto max-w-[1500px] rounded-lg border border-[#c4c6cd] bg-white shadow-sm">
      {/* 1.- Encabezado con acciones rápidas */}
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#c4c6cd] px-4 py-3">
        <div>
          <div className="flex items-center gap-2 text-[15px] font-bold text-[#041627]">
            <Wallet size={17} className="text-[#075E54]" />
            Caja operativa
          </div>
          <div className="mt-1 text-[13px] text-[#44474c]">
            {cajaAbierta ? `Caja abierta ${cajaAbierta.id.slice(0, 8)}` : 'No hay caja abierta para este usuario'}
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          {!cajaAbierta ? (
            <>
              <input type="number" min={0} value={montoInicial} onChange={(e) => setMontoInicial(e.target.value)} className="h-9 w-36 rounded border border-[#c4c6cd] px-3 text-[14px] outline-none focus:border-[#075E54]" />
              <button onClick={() => mutations.abrirCaja.mutate({ monto_inicial: toNumber(montoInicial), descripcion: 'Apertura desde modulo caja' })} disabled={!puedeAbrirCaja || mutations.abrirCaja.isPending} className="flex h-9 items-center gap-2 rounded bg-[#075E54] px-3 text-[13px] font-semibold text-white hover:bg-[#0b6d62] disabled:opacity-60">
                Abrir caja
              </button>
            </>
          ) : (
            <>
              <input type="number" min={0} value={montoMovimiento} onChange={(e) => setMontoMovimiento(e.target.value)} placeholder="Monto" className="h-9 w-32 rounded border border-[#c4c6cd] px-3 text-[14px] outline-none focus:border-[#075E54]" />
              <button onClick={() => mutations.movimientoCaja.mutate({ cajaId: cajaAbierta.id, tipo: 'INGRESO_MANUAL', monto: toNumber(montoMovimiento), descripcion: 'Ingreso manual desde caja' })} className="flex h-9 items-center gap-2 rounded border border-[#c4c6cd] bg-white px-3 text-[13px] font-semibold text-[#041627] hover:bg-[#f4f5f6]">
                <ArrowUpCircle size={15} /> Ingreso
              </button>
              <button onClick={manejarRegistrarEgreso} disabled={!puedeRegistrarMovimiento || montoEgreso <= 0 || egresoSuperaDisponible} className="flex h-9 items-center gap-2 rounded border border-[#c4c6cd] bg-white px-3 text-[13px] font-semibold text-[#041627] hover:bg-[#f4f5f6] disabled:opacity-60">
                <ArrowDownCircle size={15} /> Egreso
              </button>
              <input type="number" min={0} value={montoCierre} onChange={(e) => setMontoCierre(e.target.value)} placeholder="Declarado" className="h-9 w-32 rounded border border-[#c4c6cd] px-3 text-[14px] outline-none focus:border-[#075E54]" />
              <button onClick={() => mutations.cerrarCaja.mutate({ cajaId: cajaAbierta.id, monto_final_declarado: toNumber(montoCierre), descripcion: descripcionCierre || 'Cierre desde modulo caja' })} disabled={!puedeCerrarCaja || mutations.cerrarCaja.isPending || !montoCierre} className="flex h-9 items-center gap-2 rounded bg-[#b42318] px-3 text-[13px] font-semibold text-white hover:bg-[#9b1c13] disabled:opacity-60">
                <Lock size={15} /> Cerrar
              </button>
            </>
          )}
        </div>
      </div>

      {/* 2.- Tabs de panel */}
      {cajaAbierta && (
        <div className="border-b border-[#c4c6cd] bg-[#fbf9fa]">
          <div className="flex flex-wrap gap-2 border-b border-[#c4c6cd] px-4 py-3">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActivePanel(tab.id as CajaPanel)}
                className={`flex h-9 items-center gap-2 rounded border px-3 text-[13px] font-semibold ${activePanel === tab.id ? 'border-[#075E54] bg-[#075E54] text-white' : 'border-[#c4c6cd] bg-white text-[#041627] hover:bg-[#f4f5f6]'}`}
              >
                {tab.icon}{tab.label}
              </button>
            ))}
          </div>

          <div className="grid gap-4 p-4 lg:grid-cols-[1fr_1fr]">
            {/* Panel: Resumen */}
            {activePanel === 'resumen' && (
              <section className="rounded border border-[#c4c6cd] bg-white">
                <div className="flex items-center gap-2 border-b border-[#c4c6cd] px-4 py-3 text-[13px] font-bold uppercase tracking-wide text-[#44474c]">
                  <Calculator size={15} className="text-[#075E54]" /> Analisis de caja actual
                </div>
                <div className="grid gap-3 p-4 sm:grid-cols-2">
                  {[
                    { label: 'Monto inicial', value: resumen?.totales.apertura ?? cajaEnDetalle?.monto_inicial },
                    { label: 'Cobros registrados', value: resumen?.totales.cobros },
                    { label: 'Ingresos manuales', value: resumen?.totales.ingresos_manuales },
                    { label: 'Egresos', value: resumen?.totales.egresos, color: 'text-[#b42318]' },
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
                  {cajaEnDetalle?.estado === 'CERRADA' && (
                    <>
                      <div className="rounded border border-[#e5e7eb] bg-[#f8fafc] px-3 py-3">
                        <div className="text-[12px] font-semibold text-[#44474c]">Declarado al cierre</div>
                        <div className="mt-1 text-[18px] font-bold text-[#041627]">{money(cajaEnDetalle.monto_final_declarado)}</div>
                      </div>
                      <div className="rounded border border-[#e5e7eb] bg-[#f8fafc] px-3 py-3">
                        <div className="text-[12px] font-semibold text-[#44474c]">Diferencia final</div>
                        <div className={`mt-1 text-[18px] font-bold ${toNumber(cajaEnDetalle.diferencia) < 0 ? 'text-[#b42318]' : 'text-[#075E54]'}`}>{money(cajaEnDetalle.diferencia)}</div>
                      </div>
                    </>
                  )}
                </div>
              </section>
            )}

            {/* Panel: Cierre */}
            {activePanel === 'cierre' && (
              <section className="rounded border border-[#c4c6cd] bg-white">
                <div className="border-b border-[#c4c6cd] px-4 py-3 text-[13px] font-bold uppercase tracking-wide text-[#44474c]">Cierre y arqueo</div>
                <div className="space-y-3 p-4">
                  <label className="block">
                    <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">Dinero declarado al cierre</span>
                    <input type="number" min={0} value={montoCierre} onChange={(e) => setMontoCierre(e.target.value)} placeholder="Ingrese el monto contado" className="h-10 w-full rounded border border-[#c4c6cd] px-3 text-[14px] outline-none focus:border-[#075E54]" />
                  </label>
                  <div className={`rounded border px-3 py-3 ${!montoCierre ? 'border-[#e5e7eb] bg-[#f8fafc]' : cierreTieneDiferencia ? 'border-[#f1c7c7] bg-[#fff5f5]' : 'border-[#cfe2de] bg-[#f3fbf9]'}`}>
                    <div className="text-[12px] font-semibold text-[#44474c]">Diferencia contra sistema</div>
                    <div className={`mt-1 text-[20px] font-bold ${diferenciaPreview < 0 ? 'text-[#b42318]' : 'text-[#075E54]'}`}>{montoCierre ? money(diferenciaPreview) : money(0)}</div>
                    {montoCierre && <div className="mt-1 text-[12px] text-[#44474c]">{diferenciaPreview === 0 ? 'Caja exacta' : diferenciaPreview > 0 ? 'Sobra dinero contra lo esperado' : 'Falta dinero contra lo esperado'}</div>}
                  </div>
                  <textarea value={descripcionCierre} onChange={(e) => setDescripcionCierre(e.target.value)} placeholder="Observaciones del cierre" className="min-h-[72px] w-full rounded border border-[#c4c6cd] px-3 py-2 text-[14px] outline-none focus:border-[#075E54]" />
                  <button type="button" onClick={() => mutations.cerrarCaja.mutate({ cajaId: cajaAbierta.id, monto_final_declarado: montoDeclarado, descripcion: descripcionCierre || 'Cierre desde modulo caja' })} disabled={!puedeCerrarCaja || mutations.cerrarCaja.isPending || !montoCierre} className="flex h-10 w-full items-center justify-center gap-2 rounded bg-[#b42318] px-4 text-[14px] font-semibold text-white hover:bg-[#9b1c13] disabled:opacity-60">
                    <Lock size={15} /> Cerrar caja con este monto
                  </button>
                </div>
              </section>
            )}

            {/* Panel: Historial medios de pago */}
            {activePanel === 'historial' && (
              <section className="rounded border border-[#c4c6cd] bg-white lg:col-span-2">
                <div className="border-b border-[#c4c6cd] px-4 py-3 text-[13px] font-bold uppercase tracking-wide text-[#44474c]">Cobros por medio de pago</div>
                <DataTable rows={resumen?.cobros_por_medio ?? []} columns={cobrosColumns} getRowKey={(m) => m.medio_pago_id ?? m.medio} emptyMessage="Todavia no hay cobros registrados en esta caja." />
              </section>
            )}

            {/* Panel: Movimientos */}
            {activePanel === 'movimientos' && (
              <FichaHistoryPanel
                variant="section"
                className="lg:col-span-2 bg-white"
                title="Movimientos de caja"
                subtitle="Aperturas, cobros, ingresos, egresos y cierres"
                events={movimientosCaja}
                labels={{ APERTURA: 'Apertura de caja', COBRO: 'Cobro registrado', EGRESO: 'Egreso de dinero', INGRESO_MANUAL: 'Ingreso manual', CIERRE: 'Cierre de caja' }}
                emptyTitle="Sin movimientos"
                emptyDescription="Aca se veran los movimientos operativos de esta caja."
                getActorName={() => 'Caja'}
                getChanges={(e) => [`Monto: ${money(e.monto)}`, e.categoria_egreso ? `Categoria: ${e.categoria_egreso}` : '', e.entidad_nombre ? `Destino: ${e.entidad_nombre}` : ''].filter(Boolean)}
              />
            )}

            {/* Panel: Auditoría */}
            {activePanel === 'auditoria' && (
              <FichaHistoryPanel<IAuditoriaCaja>
                variant="section"
                className="lg:col-span-2 bg-white"
                title="Auditoria de caja"
                subtitle="Responsables, cobros, egresos, apertura y cierre con datos tecnicos"
                events={auditoriaCaja}
                isLoading={auditoriaCajaQuery.isLoading}
                labels={{ ABRIR_CAJA: 'Caja abierta', CERRAR_CAJA: 'Caja cerrada', MOVIMIENTO_CAJA: 'Movimiento manual', EGRESO_CAJA: 'Egreso de caja', COBRO_CAJA: 'Cobro registrado', REEMBOLSO_CAJA: 'Reembolso' }}
                emptyTitle="Sin auditoria"
                emptyDescription="Aca se veran los eventos auditados de esta caja."
                getActorName={(e) => e.empleado_id ?? 'Sistema'}
                getChanges={(e) => {
                  const data = e.despues ?? e.metadata ?? {};
                  return [
                    data.monto ? `Monto: ${money(data.monto as number | string)}` : '',
                    data.movimiento_id ? `Movimiento: ${String(data.movimiento_id).slice(0, 8)}` : '',
                    data.comprobante_id ? `Comprobante: ${String(data.comprobante_id).slice(0, 8)}` : '',
                    data.medio_pago_id ? `Medio: ${String(data.medio_pago_id).slice(0, 8)}` : '',
                    data.diferencia != null ? `Diferencia: ${money(data.diferencia as number | string)}` : '',
                  ].filter(Boolean);
                }}
              />
            )}

            {/* Panel: Egreso */}
            {activePanel === 'egreso' && (
              <section className="rounded border border-[#c4c6cd] bg-white">
                <div className="border-b border-[#c4c6cd] px-4 py-3 text-[13px] font-bold uppercase tracking-wide text-[#44474c]">Registrar egreso de dinero</div>
                <div className="grid gap-3 p-4 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">Motivo</span>
                    <select value={categoriaEgreso} onChange={(e) => setCategoriaEgreso(e.target.value as CategoriaEgreso)} className="h-10 w-full rounded border border-[#c4c6cd] bg-white px-3 text-[14px] outline-none focus:border-[#075E54]">
                      {CATS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">Monto</span>
                    <input type="number" min={0} max={montoCalculado} value={montoMovimiento} onChange={(e) => setMontoMovimiento(e.target.value)} className={`h-10 w-full rounded border px-3 text-[14px] outline-none focus:border-[#075E54] ${egresoSuperaDisponible ? 'border-[#b42318]' : 'border-[#c4c6cd]'}`} />
                    <span className={`mt-1 block text-[12px] ${egresoSuperaDisponible ? 'text-[#b42318]' : 'text-[#44474c]'}`}>Disponible en caja: {money(montoCalculado)}</span>
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">Proveedor / empleado / destino</span>
                    <input value={entidadNombre} onChange={(e) => setEntidadNombre(e.target.value)} className="h-10 w-full rounded border border-[#c4c6cd] px-3 text-[14px] outline-none focus:border-[#075E54]" />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">Referencia</span>
                    <input value={referenciaEgreso} onChange={(e) => setReferenciaEgreso(e.target.value)} className="h-10 w-full rounded border border-[#c4c6cd] px-3 text-[14px] outline-none focus:border-[#075E54]" />
                  </label>
                  <label className="block md:col-span-2">
                    <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">Observacion</span>
                    <textarea value={descripcionEgreso} onChange={(e) => setDescripcionEgreso(e.target.value)} className="min-h-[70px] w-full rounded border border-[#c4c6cd] px-3 py-2 text-[14px] outline-none focus:border-[#075E54]" />
                  </label>
                  <button type="button" onClick={manejarRegistrarEgreso} disabled={!puedeRegistrarMovimiento || mutations.movimientoCaja.isPending || montoEgreso <= 0 || egresoSuperaDisponible} className="flex h-10 items-center justify-center gap-2 rounded bg-[#b42318] px-4 text-[14px] font-semibold text-white hover:bg-[#9b1c13] disabled:opacity-60 md:col-span-2">
                    <ArrowDownCircle size={15} /> Registrar egreso
                  </button>
                </div>
              </section>
            )}

            {/* Panel: Consumo interno */}
            {activePanel === 'consumo' && (
              <section className="rounded border border-[#c4c6cd] bg-white">
                <div className="border-b border-[#c4c6cd] px-4 py-3 text-[13px] font-bold uppercase tracking-wide text-[#44474c]">Consumo interno de productos</div>
                <div className="grid gap-3 p-4 md:grid-cols-[1fr_120px]">
                  <div className="block">
                    <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">Buscar producto</span>
                    <input value={productoSearch} onChange={(e) => setProductoSearch(e.target.value)} placeholder="Nombre o codigo" className="h-10 w-full rounded border border-[#c4c6cd] bg-white px-3 text-[14px] outline-none focus:border-[#075E54]" />
                    <div className="mt-2 max-h-[220px] overflow-auto rounded border border-[#c4c6cd] bg-white">
                      {productosConsumo.map((p) => (
                        <button key={p.id} type="button" onClick={() => { setProductoConsumoId(p.id ?? ''); setProductoSearch(p.nombre); }} className={`flex w-full items-center justify-between gap-3 border-b border-[#e5e7eb] px-3 py-2 text-left text-[13px] hover:bg-[#f8fafc] ${productoConsumoId === p.id ? 'bg-[#eef8f6]' : ''}`}>
                          <span className="font-semibold text-[#041627]">{p.nombre}</span>
                          <span className="text-[#44474c]">{p.codigo_barras || '-'}</span>
                        </button>
                      ))}
                      {!productosConsumo.length && <div className="px-3 py-5 text-center text-[13px] text-[#44474c]">Sin productos encontrados</div>}
                    </div>
                    {productoConsumo && <div className="mt-2 rounded border border-[#cfe2de] bg-[#f3fbf9] px-3 py-2 text-[13px] font-semibold text-[#075E54]">Seleccionado: {productoConsumo.nombre}</div>}
                  </div>
                  <label className="block">
                    <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">Cantidad</span>
                    <input type="number" min={0} value={cantidadConsumo} onChange={(e) => setCantidadConsumo(e.target.value)} className="h-10 w-full rounded border border-[#c4c6cd] px-3 text-[14px] outline-none focus:border-[#075E54]" />
                  </label>
                  <label className="block md:col-span-2">
                    <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">Motivo de consumo</span>
                    <textarea value={descripcionConsumo} onChange={(e) => setDescripcionConsumo(e.target.value)} placeholder="Ej: producto usado para limpieza, merienda del personal, muestra, rotura interna" className="min-h-[70px] w-full rounded border border-[#c4c6cd] px-3 py-2 text-[14px] outline-none focus:border-[#075E54]" />
                  </label>
                  <button type="button" onClick={manejarRegistrarConsumo} disabled={!puedeConsumirStock || mutations.consumoInterno.isPending || !productoConsumoId || toNumber(cantidadConsumo) <= 0} className="flex h-10 items-center justify-center gap-2 rounded bg-[#075E54] px-4 text-[14px] font-semibold text-white hover:bg-[#0b6d62] disabled:opacity-60 md:col-span-2">
                    <ArrowDownCircle size={15} /> Descontar del stock
                  </button>
                </div>
              </section>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
