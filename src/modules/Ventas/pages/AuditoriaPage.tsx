import { Clock, Eye, Filter, RotateCcw, Search, ShieldAlert, UserRound, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import AccessDenied from '../../../components/common/AccessDenied';
import DataTable from '../../../components/common/DataTable';
import type { DataTableColumn } from '../../../components/common/DataTable';
import { useAuthStore } from '../../../store/auth.store';
import { getEmpleadosFn } from '../../Empleados/api/empleadosApi';
import { getAccionesAuditoriaFn } from '../../POSAuxiliares/api/posAux.api';
import { useAuditoriaAux } from '../../POSAuxiliares/hooks/usePosAux';
import { CambiosEvento } from '../components/auditoria/CambiosEvento';
import { RangoFechas } from '../components/auditoria/RangoFechas';
import { rangoPorDefecto } from '../components/auditoria/rangos';
import type { IAuditoriaEventoAux } from '../../POSAuxiliares/types/pos-aux.type';
import { dateTime } from '../../POSAuxiliares/utils/format';
import { POS_PERMISSIONS } from '../../POSAuxiliares/utils/posPermissions';

const modulos = [
  { value: '', label: 'Todos los modulos' },
  { value: 'auth', label: 'Sesiones' },
  { value: 'caja', label: 'Caja' },
  { value: 'clientes', label: 'Clientes' },
  { value: 'comprobantes', label: 'Comprobantes' },
  { value: 'configuracion', label: 'Configuracion' },
  { value: 'despachos', label: 'Despachos' },
  { value: 'empleados', label: 'Empleados' },
  { value: 'pedidos-envio', label: 'Pedidos de envio' },
  { value: 'pos', label: 'POS' },
  { value: 'productos', label: 'Productos' },
  { value: 'seguridad', label: 'Seguridad' },
  { value: 'stock', label: 'Stock' },
];

const entidades = [
  { value: '', label: 'Todas las entidades' },
  { value: 'pedido_envio', label: 'Pedido de envio' },
  { value: 'comprobante', label: 'Venta / comprobante' },
  { value: 'producto', label: 'Producto' },
  { value: 'cliente', label: 'Cliente' },
  { value: 'caja', label: 'Caja' },
  { value: 'empleado', label: 'Empleado' },
  { value: 'configuracion_pos', label: 'Configuracion POS' },
  { value: 'rol', label: 'Rol' },
  { value: 'permiso', label: 'Permiso' },
];

const accionLabel: Record<string, string> = {
  CREAR_PEDIDO_ENVIO: 'Pedido creado',
  EDITAR_PEDIDO_ENVIO: 'Pedido editado',
  CAMBIAR_ESTADO_PEDIDO_ENVIO: 'Cambio de estado',
  RENDIR_PEDIDO_ENVIO: 'Rendicion registrada',
  ABRIR_CAJA: 'Caja abierta',
  CERRAR_CAJA: 'Caja cerrada',
  MOVIMIENTO_CAJA: 'Movimiento de caja',
  EGRESO_CAJA: 'Egreso de caja',
  COBRO_CAJA: 'Cobro en caja',
  REEMBOLSO_CAJA: 'Reembolso de caja',
  COBRAR_COMPROBANTE: 'Comprobante cobrado',
  CREAR_COMPROBANTE: 'Comprobante creado',
  ACTUALIZAR_COMPROBANTE: 'Comprobante actualizado',
  CAMBIAR_ESTADO_COMPROBANTE: 'Cambio de estado',
  LOGIN: 'Inicio de sesion',
  LOGOUT: 'Cierre de sesion',
  CREAR_CLIENTE: 'Cliente creado',
  ACTUALIZAR_CLIENTE: 'Cliente actualizado',
  ELIMINAR_CLIENTE: 'Cliente eliminado',
  ACTIVAR_CUENTA_CORRIENTE: 'Cuenta corriente activada',
  PAGO_CUENTA_CORRIENTE: 'Pago en cuenta corriente',
  CARGO_CUENTA_CORRIENTE: 'Cargo en cuenta corriente',
  NOTA_CREDITO_CUENTA_CORRIENTE: 'Nota de credito aplicada',
  AJUSTE_CUENTA_CORRIENTE: 'Ajuste de cuenta corriente',
  GENERAR_RECARGOS_CUENTA_CORRIENTE: 'Recargos generados',
  OMITIR_RECARGO_CUENTA_CORRIENTE: 'Recargo omitido',
  CREAR_EMPLEADO: 'Empleado creado',
  ACTUALIZAR_EMPLEADO: 'Empleado actualizado',
  ACTUALIZAR_ROLES_EMPLEADO: 'Roles de empleado actualizados',
  ASIGNAR_SUCURSAL_EMPLEADO: 'Sucursal asignada',
  QUITAR_SUCURSAL_EMPLEADO: 'Sucursal quitada',
  CAMBIAR_SUCURSAL_PRINCIPAL_EMPLEADO: 'Sucursal principal cambiada',
  CREAR_ROL: 'Rol creado',
  ACTUALIZAR_ROL: 'Rol actualizado',
  ELIMINAR_ROL: 'Rol eliminado',
  CAMBIAR_ESTADO_ROL: 'Estado de rol cambiado',
  CREAR_PERMISO: 'Permiso creado',
  ACTUALIZAR_PERMISO: 'Permiso actualizado',
  ELIMINAR_PERMISO: 'Permiso eliminado',
  CAMBIAR_ESTADO_PERMISO: 'Estado de permiso cambiado',
  CREAR_CONFIGURACION_POS: 'Configuracion POS creada',
  ACTUALIZAR_CONFIGURACION_POS: 'Configuracion POS actualizada',
  CREAR_PRODUCTO: 'Producto creado',
  ACTUALIZAR_PRODUCTO: 'Producto actualizado',
  ELIMINAR_PRODUCTO: 'Producto eliminado',
  ACTUALIZAR_STOCK_PRODUCTO: 'Stock actualizado',
  AJUSTAR_STOCK_PRODUCTO: 'Stock ajustado',
  CAMBIAR_ESTADO_PRODUCTO_SUCURSAL: 'Estado por sucursal cambiado',
};

const accionesSensibles = [
  'ANULAR',
  'CANCELAR',
  'ELIMINAR',
  'DESACTIVAR',
  'PERMISO',
  'ROL',
  'STOCK',
  'COSTO',
  'PRECIO',
  'RENDIR',
  'CERRAR_CAJA',
];

const isSensitive = (evento: IAuditoriaEventoAux) =>
  accionesSensibles.some((token) => evento.accion.toUpperCase().includes(token));

const formatJson = (value?: Record<string, unknown> | null) =>
  value ? JSON.stringify(value, null, 2) : 'Sin datos';

/** Nombra los campos que cambiaron, en vez de volcar el JSON entero */
const resumirCambios = (
  antes?: Record<string, unknown> | null,
  despues?: Record<string, unknown> | null,
): string | null => {
  if (!antes || !despues) return null;
  const claves = Array.from(new Set([...Object.keys(antes), ...Object.keys(despues)]));
  const cambiados = claves.filter(
    (clave) => JSON.stringify(antes[clave] ?? null) !== JSON.stringify(despues[clave] ?? null),
  );
  if (!cambiados.length) return null;
  const nombres = cambiados.slice(0, 3).map((c) => c.replace(/_/g, ' '));
  const resto = cambiados.length - nombres.length;
  return `Cambió: ${nombres.join(', ')}${resto > 0 ? ` y ${resto} más` : ''}`;
};

const AuditoriaPage = () => {
  const [rangoInicial] = useState(rangoPorDefecto);
  const [page, setPage] = useState(1);
  const [desde, setDesde] = useState(rangoInicial[0]);
  const [hasta, setHasta] = useState(rangoInicial[1]);
  const [modulo, setModulo] = useState('');
  const [accion, setAccion] = useState('');
  const [empleadoId, setEmpleadoId] = useState('');
  const [entidad, setEntidad] = useState('');
  const [entidadId, setEntidadId] = useState('');
  const [q, setQ] = useState('');
  const [soloSensibles, setSoloSensibles] = useState(false);
  const [selectedEvento, setSelectedEvento] = useState<IAuditoriaEventoAux | null>(null);
  const permisos = useAuthStore((state) => state.permisos);
  const puedeVerAuditoria = permisos.includes(POS_PERMISSIONS.reportesVer);

  const empleadosQuery = useQuery({
    queryKey: ['auditoria', 'empleados'],
    queryFn: () => getEmpleadosFn(1, 300),
    enabled: puedeVerAuditoria,
  });
  const empleados = useMemo(() => empleadosQuery.data?.data ?? [], [empleadosQuery.data]);
  const empleadosById = useMemo(
    () => new Map(empleados.map((empleado) => [empleado.id, empleado])),
    [empleados],
  );

  // El filtro de sensibles viaja al backend: filtrarlo en el front solo revisaba
  // los 50 registros de la pagina y decia "0 sensibles" habiendolos en otra.
  const params = useMemo(
    () => ({
      page,
      limit: 50,
      desde,
      hasta,
      modulo,
      accion,
      empleado_id: empleadoId,
      entidad,
      entidad_id: entidadId,
      q,
      solo_sensibles: soloSensibles,
    }),
    [accion, desde, empleadoId, entidad, entidadId, hasta, modulo, page, q, soloSensibles],
  );
  const auditoriaQuery = useAuditoriaAux(params, puedeVerAuditoria);
  const eventos = auditoriaQuery.data?.data ?? [];
  const meta = auditoriaQuery.data?.meta;

  // Se piden las acciones que existen de verdad, filtradas por el modulo elegido:
  // antes habia que tipear "CAMBIAR_ESTADO_PEDIDO_ENVIO" de memoria.
  const accionesQuery = useQuery({
    queryKey: ['auditoria', 'acciones', modulo],
    queryFn: () => getAccionesAuditoriaFn(modulo),
    enabled: puedeVerAuditoria,
  });
  const accionesDisponibles = accionesQuery.data ?? [];

  const resetFilters = () => {
    const [d, h] = rangoPorDefecto();
    setPage(1);
    setDesde(d);
    setHasta(h);
    setModulo('');
    setAccion('');
    setEmpleadoId('');
    setEntidad('');
    setEntidadId('');
    setQ('');
    setSoloSensibles(false);
  };

  const hayFiltros =
    !!modulo || !!accion || !!empleadoId || !!entidad || !!entidadId || !!q || soloSensibles;

  if (!puedeVerAuditoria) {
    return (
      <AccessDenied
        title="Sin permisos para auditoria"
        message="Necesitas reportes.ver para consultar eventos de auditoria."
      />
    );
  }

  const columns: DataTableColumn<IAuditoriaEventoAux>[] = [
    {
      key: 'fecha',
      header: 'Fecha',
      render: (evento) => (
        <div>
          <div className="font-semibold text-[#041627]">{dateTime(evento.created_at)}</div>
          {isSensitive(evento) ? (
            <div className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-[#b42318]">
              <ShieldAlert size={12} />
              Sensible
            </div>
          ) : null}
        </div>
      ),
    },
    {
      key: 'accion',
      header: 'Accion',
      render: (evento) => (
        <div>
          <span className="border border-[#c4c6cd] bg-[#fbf9fa] px-2 py-1 text-[12px] font-bold text-[#075E54]">
            {accionLabel[evento.accion] ?? evento.accion}
          </span>
          <div className="mt-1 text-[11px] uppercase text-[#6b7280]">{evento.modulo}</div>
        </div>
      ),
    },
    {
      key: 'responsable',
      header: 'Responsable',
      render: (evento) => {
        const empleado = evento.empleado_id ? empleadosById.get(evento.empleado_id) : null;
        return (
          <div className="min-w-[180px]">
            <div className="flex items-center gap-1 font-semibold text-[#041627]">
              <UserRound size={14} className="text-[#075E54]" />
              {empleado?.nombreCompleto ?? evento.empleado_id ?? 'Sistema'}
            </div>
            <div className="mt-1 truncate text-[11px] text-[#6b7280]">{empleado?.email ?? ''}</div>
          </div>
        );
      },
    },
    {
      key: 'entidad',
      header: 'Entidad',
      render: (evento) => (
        <div>
          <div className="font-semibold text-[#041627]">{evento.entidad ?? '-'}</div>
          <div className="max-w-[210px] truncate text-[11px] text-[#6b7280]">{evento.entidad_id ?? ''}</div>
        </div>
      ),
    },
    {
      key: 'detalle',
      header: 'Detalle',
      className: 'max-w-[340px]',
      render: (evento) => {
        const cambios = resumirCambios(evento.antes, evento.despues);
        return (
          <div>
            <div className="text-[#041627]">{evento.descripcion ?? '-'}</div>
            {/* Antes esto era JSON cortado a 130 caracteres, que no decia nada */}
            {cambios ? (
              <div className="mt-1 text-[11.5px] text-[#6b7280]">{cambios}</div>
            ) : null}
          </div>
        );
      },
    },
    {
      key: 'ver',
      header: '',
      align: 'right',
      render: (evento) => (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setSelectedEvento(evento);
          }}
          className="inline-flex h-8 items-center gap-2 border border-[#c4c6cd] bg-white px-3 text-[12px] font-semibold text-[#041627] hover:bg-[#f5f7f8]"
        >
          <Eye size={14} />
          Ver
        </button>
      ),
    },
  ];

  return (
    <div className="min-h-[calc(100vh-52px)] bg-[#f3f4f6] px-4 py-4">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-4">
        <section className="border border-[#c4c6cd] bg-white shadow-sm">
          <div className="border-b border-[#c4c6cd] px-4 py-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-[18px] font-bold text-[#041627]">
                  <Clock size={18} className="text-[#075E54]" />
                  Centro de auditoria
                </div>
                <div className="text-[13px] text-[#44474c]">
                  Investiga acciones, cambios de datos, estados, caja, ventas, stock y permisos.
                </div>
              </div>
              <button
                type="button"
                onClick={resetFilters}
                className="flex h-9 items-center gap-2 border border-[#c4c6cd] bg-white px-3 text-[13px] font-semibold text-[#041627] hover:bg-[#f5f7f8]"
              >
                <RotateCcw size={15} />
                Limpiar filtros
              </button>
            </div>
          </div>

          <div className="border-b border-[#c4c6cd] bg-[#fbfbfc] p-3">
            <RangoFechas
              desde={desde}
              hasta={hasta}
              onCambiar={(d, h) => {
                setDesde(d);
                setHasta(h);
                setPage(1);
              }}
            />
          </div>

          <div className="grid gap-3 border-b border-[#c4c6cd] bg-[#fbfbfc] px-3 pb-3 lg:grid-cols-4">
            <select
              value={modulo}
              onChange={(event) => {
                setModulo(event.target.value);
                setPage(1);
              }}
              className="h-9 border border-[#c4c6cd] bg-white px-3 text-[13px] outline-none focus:border-[#075E54]"
            >
              {modulos.map((item) => (
                <option key={item.value || 'todos'} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>

            <select
              value={empleadoId}
              onChange={(event) => {
                setEmpleadoId(event.target.value);
                setPage(1);
              }}
              className="h-9 border border-[#c4c6cd] bg-white px-3 text-[13px] outline-none focus:border-[#075E54]"
            >
              <option value="">Todos los empleados</option>
              {empleados.map((empleado) => (
                <option key={empleado.id} value={empleado.id}>
                  {empleado.nombreCompleto}
                </option>
              ))}
            </select>

            <label className="flex h-9 items-center gap-2 border border-[#c4c6cd] bg-white px-3 text-[13px] font-semibold text-[#041627]">
              <input
                type="checkbox"
                checked={soloSensibles}
                onChange={(event) => setSoloSensibles(event.target.checked)}
                className="h-4 w-4 accent-[#075E54]"
              />
              Solo sensibles
            </label>

            <select
              value={entidad}
              onChange={(event) => {
                setEntidad(event.target.value);
                setPage(1);
              }}
              className="h-9 border border-[#c4c6cd] bg-white px-3 text-[13px] outline-none focus:border-[#075E54]"
            >
              {entidades.map((item) => (
                <option key={item.value || 'todas'} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>

            <input
              value={entidadId}
              onChange={(event) => {
                setEntidadId(event.target.value);
                setPage(1);
              }}
              placeholder="ID de pedido, venta, producto, caja..."
              className="h-9 border border-[#c4c6cd] px-3 text-[13px] outline-none focus:border-[#075E54]"
            />

            {/* Selector poblado con lo que existe en la base y acotado al modulo
                elegido: tipear la accion exacta obligaba a saberla de memoria. */}
            <div className="flex h-9 items-center gap-2 border border-[#c4c6cd] bg-white px-3">
              <Filter size={14} className="shrink-0 text-[#075E54]" />
              <select
                value={accion}
                onChange={(event) => {
                  setAccion(event.target.value);
                  setPage(1);
                }}
                className="w-full bg-white text-[13px] outline-none"
              >
                <option value="">Todas las acciones</option>
                {accionesDisponibles.map((item) => (
                  <option key={item} value={item}>
                    {accionLabel[item] ?? item}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex h-9 items-center gap-2 border border-[#c4c6cd] bg-white px-3">
              <Search size={14} className="text-[#075E54]" />
              <input
                value={q}
                onChange={(event) => {
                  setQ(event.target.value);
                  setPage(1);
                }}
                placeholder="Buscar descripcion, accion o entidad"
                className="w-full text-[13px] outline-none"
              />
            </div>
          </div>

          <DataTable
            rows={eventos}
            columns={columns}
            getRowKey={(evento) => evento.id}
            isLoading={auditoriaQuery.isLoading}
            loadingMessage="Cargando eventos de auditoria..."
            emptyMessage="Sin eventos de auditoria para los filtros seleccionados."
            minWidth="1180px"
            onRowClick={setSelectedEvento}
          />

          <div className="flex items-center justify-between border-t border-[#c4c6cd] px-4 py-3 text-[13px] text-[#44474c]">
            <span>
              {meta?.total ?? 0} evento{(meta?.total ?? 0) === 1 ? '' : 's'}
              {soloSensibles ? ' sensibles' : ''} · página {meta?.page ?? page} de{' '}
              {meta?.totalPages ?? 1}
              {hayFiltros ? ' · con filtros aplicados' : ''}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                className="h-8 border border-[#c4c6cd] px-3 font-semibold disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                type="button"
                disabled={!!meta && page >= meta.totalPages}
                onClick={() => setPage((value) => value + 1)}
                className="h-8 border border-[#c4c6cd] px-3 font-semibold disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        </section>
      </div>

      {selectedEvento ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/20" onClick={() => setSelectedEvento(null)}>
          <aside
            className="h-full w-full max-w-[720px] overflow-auto border-l border-[#c4c6cd] bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-[#c4c6cd] bg-white px-4 py-3">
              <div>
                <div className="text-[16px] font-bold text-[#041627]">
                  {accionLabel[selectedEvento.accion] ?? selectedEvento.accion}
                </div>
                <div className="mt-1 text-[12px] text-[#59616b]">{dateTime(selectedEvento.created_at)}</div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEvento(null)}
                className="flex h-8 w-8 items-center justify-center border border-[#c4c6cd] text-[#041627]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid gap-3 p-4">
              <DetailLine label="Modulo" value={selectedEvento.modulo} />
              <DetailLine label="Entidad" value={`${selectedEvento.entidad ?? '-'} ${selectedEvento.entidad_id ?? ''}`} />
              <DetailLine
                label="Responsable"
                value={
                  selectedEvento.empleado_id
                    ? empleadosById.get(selectedEvento.empleado_id)?.nombreCompleto ?? selectedEvento.empleado_id
                    : 'Sistema'
                }
              />
              <DetailLine label="Descripcion" value={selectedEvento.descripcion ?? '-'} />

              <CambiosEvento antes={selectedEvento.antes} despues={selectedEvento.despues} />

              {selectedEvento.metadata ? (
                <JsonBlock title="Datos adicionales" value={selectedEvento.metadata} />
              ) : null}
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
};

const DetailLine = ({ label, value }: { label: string; value: string }) => (
  <div className="border border-[#e5e7eb] bg-[#fbfbfc] px-3 py-2">
    <div className="text-[11px] font-bold uppercase text-[#59616b]">{label}</div>
    <div className="mt-1 break-words text-[13px] font-semibold text-[#041627]">{value}</div>
  </div>
);

const JsonBlock = ({ title, value }: { title: string; value?: Record<string, unknown> | null }) => (
  <div className="border border-[#e5e7eb]">
    <div className="border-b border-[#e5e7eb] bg-[#fbfbfc] px-3 py-2 text-[12px] font-bold uppercase text-[#59616b]">
      {title}
    </div>
    <pre className="max-h-[320px] overflow-auto whitespace-pre-wrap p-3 font-mono text-[12px] leading-5 text-[#041627]">
      {formatJson(value)}
    </pre>
  </div>
);

export default AuditoriaPage;
