import {
  User, ChevronRight, Shield, Check, RotateCcw, Camera, Trash2,
  Mail, Phone, MapPin, Briefcase, Key, ToggleLeft, ToggleRight,
  ShieldCheck, ShieldOff, Clock, Star, UserCheck, AlertCircle,
  ChevronDown, ChevronUp, Search, X, Plus
} from 'lucide-react';
import { useState, useRef } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { useEmpleadoStore } from '../store/useEmpleadoStore';
import type { IEmpleadoSucursalAsignada } from '../types/empleado.type';
import {
  useAsignarEmpleadoSucursal,
  useDesasignarEmpleadoSucursal,
  useGetSucursalesActivas,
  useSetEmpleadoSucursalPrincipal,
} from '../hooks/useEmpleados';

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

const EMPLEADO_MOCK = {
  id: 'emp-001',
  nombreCompleto: 'Valentina Rodríguez',
  email: 'v.rodriguez@empresa.com',
  telefono: '+54 9 381 555-0192',
  direccion: 'Av. Independencia 1452, Tucumán',
  cargo: 'Vendedora Senior',
  foto_url: null,
  activo: true,
  roles: [
    { id: 'rol-1', nombre: 'Vendedor', rutaInicio: '/punto-de-venta' },
    { id: 'rol-2', nombre: 'Cajero', rutaInicio: '/caja' },
  ],
  permisos: [
    'ventas.crear', 'ventas.ver', 'caja.cobrar', 'caja.abrir',
    'caja.cerrar', 'clientes.ver', 'clientes.cargar', 'productos.ver',
  ],
  sucursales: [],
  creadoEn: '2024-03-15',
  ultimoAcceso: '2025-05-22T14:32:00',
};

const ROLES_DISPONIBLES = [
  { id: 'rol-1', nombre: 'Vendedor', descripcion: 'Puede crear y gestionar ventas', rutaInicio: '/punto-de-venta', color: 'green' },
  { id: 'rol-2', nombre: 'Cajero', descripcion: 'Puede cobrar y gestionar caja', rutaInicio: '/caja', color: 'amber' },
  { id: 'rol-3', nombre: 'Depósito', descripcion: 'Puede cargar y editar productos', rutaInicio: '/deposito', color: 'purple' },
  { id: 'rol-4', nombre: 'Supervisor', descripcion: 'Acceso a reportes y supervisión', rutaInicio: '/dashboard', color: 'blue' },
  { id: 'rol-5', nombre: 'Administrador', descripcion: 'Acceso total al sistema', rutaInicio: '/admin', color: 'gray' },
];

const TODOS_LOS_PERMISOS = {
  VENTAS: ['ventas.crear', 'ventas.ver', 'ventas.eliminar'],
  CAJA: ['caja.cobrar', 'caja.abrir', 'caja.cerrar'],
  PRODUCTOS: ['productos.ver', 'productos.cargar', 'productos.editar', 'productos.eliminar'],
  CLIENTES: ['clientes.ver', 'clientes.cargar', 'clientes.editar'],
  REPORTES: ['reportes.ver'],
};

const PERM_LABELS = {
  'ventas.crear': 'Crear ventas',
  'ventas.ver': 'Ver ventas',
  'ventas.eliminar': 'Eliminar ventas',
  'caja.cobrar': 'Cobrar',
  'caja.abrir': 'Abrir caja',
  'caja.cerrar': 'Cerrar caja',
  'productos.ver': 'Ver productos',
  'productos.cargar': 'Cargar productos',
  'productos.editar': 'Editar productos',
  'productos.eliminar': 'Eliminar productos',
  'clientes.ver': 'Ver clientes',
  'clientes.cargar': 'Cargar clientes',
  'clientes.editar': 'Editar clientes',
  'reportes.ver': 'Ver reportes',
};

const ROL_COLORS = {
  green: { bg: '#EAF3DE', text: '#3B6D11', border: '#C0DD97', dot: '#639922' },
  amber: { bg: '#FAEEDA', text: '#854F0B', border: '#FAC775', dot: '#BA7517' },
  purple: { bg: '#EEEDFE', text: '#534AB7', border: '#CECBF6', dot: '#7F77DD' },
  blue: { bg: '#E6F1FB', text: '#185FA5', border: '#B5D4F4', dot: '#378ADD' },
  gray: { bg: '#F1EFE8', text: '#5F5E5A', border: '#D3D1C7', dot: '#888780' },
};

const MODULE_COLORS = {
  VENTAS: { bg: '#EAF3DE', text: '#3B6D11', border: '#C0DD97' },
  CAJA: { bg: '#FAEEDA', text: '#854F0B', border: '#FAC775' },
  PRODUCTOS: { bg: '#EEEDFE', text: '#534AB7', border: '#CECBF6' },
  CLIENTES: { bg: '#E6F1FB', text: '#185FA5', border: '#B5D4F4' },
  REPORTES: { bg: '#F1EFE8', text: '#5F5E5A', border: '#D3D1C7' },
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function getInitials(name) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(iso) {
  return new Date(iso).toLocaleString('es-AR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

function StatusBadge({ active }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '3px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700,
      letterSpacing: '0.04em',
      background: active ? '#EAF3DE' : '#FCEBEB',
      color: active ? '#3B6D11' : '#A32D2D',
      border: `1px solid ${active ? '#C0DD97' : '#F7C1C1'}`,
    }}>
      <span style={{
        width: 7, height: 7, borderRadius: '50%',
        background: active ? '#639922' : '#E24B4A',
        animation: active ? 'pulse 2s infinite' : 'none',
      }} />
      {active ? 'Activo' : 'Inactivo'}
    </span>
  );
}

function RolBadge({ rol, onRemove, isEditing }) {
  const rc = ROL_COLORS[ROLES_DISPONIBLES.find(r => r.id === rol.id)?.color] || ROL_COLORS.gray;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600,
      background: rc.bg, color: rc.text, border: `1px solid ${rc.border}`,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: rc.dot }} />
      {rol.nombre}
      {isEditing && (
        <button onClick={() => onRemove(rol.id)} style={{
          marginLeft: 2, background: 'none', border: 'none', cursor: 'pointer',
          color: rc.text, opacity: 0.7, padding: 0, display: 'flex', alignItems: 'center',
        }}>
          <X size={11} />
        </button>
      )}
    </span>
  );
}

// ─── TABS ─────────────────────────────────────────────────────────────────────

function TabInfo({ emp, isEditing, form, setForm }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {[
          { label: 'Nombre completo', key: 'nombreCompleto', icon: User },
          { label: 'Email', key: 'email', icon: Mail },
          { label: 'Teléfono', key: 'telefono', icon: Phone },
          { label: 'Cargo', key: 'cargo', icon: Briefcase },
        ].map(({ label, key, icon: Icon }) => (
          <div key={key}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
              <Icon size={12} /> {label}
            </label>
            {isEditing ? (
              <input
                value={form[key] || ''}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                style={{
                  width: '100%', padding: '8px 12px', fontSize: 14, fontWeight: 500,
                  border: '1.5px solid #e2e8f0', borderRadius: 6, outline: 'none',
                  color: '#041627', background: '#f8fafc', fontFamily: 'inherit',
                  borderBottom: '2px solid #075E54',
                }}
              />
            ) : (
              <div style={{ fontSize: 14, fontWeight: 600, color: '#041627', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                {emp[key] || <span style={{ color: '#ccc', fontWeight: 400 }}>Sin datos</span>}
              </div>
            )}
          </div>
        ))}
      </div>

      <div>
        <label style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
          <MapPin size={12} /> Dirección
        </label>
        {isEditing ? (
          <input
            value={form.direccion || ''}
            onChange={e => setForm(f => ({ ...f, direccion: e.target.value }))}
            style={{
              width: '100%', padding: '8px 12px', fontSize: 14, fontWeight: 500,
              border: '1.5px solid #e2e8f0', borderRadius: 6, outline: 'none',
              color: '#041627', background: '#f8fafc', fontFamily: 'inherit',
              borderBottom: '2px solid #075E54',
            }}
          />
        ) : (
          <div style={{ fontSize: 14, fontWeight: 600, color: '#041627', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
            {emp.direccion}
          </div>
        )}
      </div>

      {isEditing && (
        <div style={{ padding: '14px 16px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 10 }}>
            <Key size={12} /> Nueva contraseña (opcional)
          </label>
          <input
            type="password"
            placeholder="Dejar vacío para no cambiar"
            style={{
              width: '100%', padding: '8px 12px', fontSize: 14,
              border: '1.5px solid #e2e8f0', borderRadius: 6, outline: 'none',
              color: '#041627', background: '#fff', fontFamily: 'inherit',
              borderBottom: '2px solid #075E54',
            }}
          />
          <p style={{ fontSize: 11, color: '#aaa', marginTop: 6 }}>Mínimo 8 caracteres. Solo completar si se desea cambiar.</p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {[
          { label: 'Activo General', key: 'activo' },
          { label: 'Activo en POS', key: 'activo_pos' },
          { label: 'Activo en Web', key: 'activo_web' },
        ].map(({ label, key }) => {
          const val = form[key] ?? emp[key] ?? false;
          return (
            <label key={key} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px', borderRadius: 8, cursor: isEditing ? 'pointer' : 'default',
              border: `1px solid ${val ? '#C0DD97' : '#e2e8f0'}`,
              background: val ? '#EAF3DE' : '#f8fafc',
              transition: 'all .15s',
            }}>
              <div
                onClick={() => isEditing && setForm(f => ({ ...f, [key]: !val }))}
                style={{ color: val ? '#3B6D11' : '#ccc', cursor: isEditing ? 'pointer' : 'default' }}
              >
                {val ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: val ? '#3B6D11' : '#888' }}>{label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

function TabRoles({ emp, isEditing, rolesAsignados, setRolesAsignados }) {
  const [search, setSearch] = useState('');
  const disponibles = ROLES_DISPONIBLES.filter(r =>
    !rolesAsignados.find(a => a.id === r.id) &&
    r.nombre.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Shield size={13} /> Roles asignados
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {rolesAsignados.length === 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#FCEBEB', borderRadius: 8, border: '1px solid #F7C1C1' }}>
              <AlertCircle size={14} style={{ color: '#A32D2D' }} />
              <span style={{ fontSize: 13, color: '#A32D2D', fontWeight: 600 }}>Sin roles asignados — el empleado no podrá iniciar sesión</span>
            </div>
          )}
          {rolesAsignados.map(rol => (
            <RolBadge key={rol.id} rol={rol} isEditing={isEditing}
              onRemove={id => setRolesAsignados(rs => rs.filter(r => r.id !== id))} />
          ))}
        </div>
      </div>

      {rolesAsignados.length > 0 && (
        <div style={{ padding: '12px 16px', background: '#E6F1FB', borderRadius: 8, border: '1px solid #B5D4F4', display: 'flex', alignItems: 'center', gap: 10 }}>
          <ChevronRight size={14} style={{ color: '#185FA5' }} />
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#185FA5', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Al iniciar sesión será redirigido a:</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0C447C', fontFamily: 'monospace', marginTop: 2 }}>
              {rolesAsignados[0]?.rutaInicio ?? '/sin-acceso'}
            </div>
          </div>
        </div>
      )}

      <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
          {isEditing ? 'Agregar roles disponibles' : 'Todos los roles del sistema'}
        </div>
        {isEditing && (
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
            <input
              placeholder="Buscar rol..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '7px 12px 7px 30px', fontSize: 13, border: '1px solid #e2e8f0', borderRadius: 6, outline: 'none', fontFamily: 'inherit', background: '#f8fafc' }}
            />
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(isEditing ? disponibles : ROLES_DISPONIBLES).map(rol => {
            const rc = ROL_COLORS[rol.color];
            const yaAsignado = !!rolesAsignados.find(r => r.id === rol.id);
            return (
              <div key={rol.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 16px', borderRadius: 8,
                border: `1px solid ${yaAsignado ? rc.border : '#e2e8f0'}`,
                background: yaAsignado ? rc.bg : '#fff',
                transition: 'all .15s',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: rc.dot, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#041627' }}>{rol.nombre}</div>
                    <div style={{ fontSize: 11, color: '#888', marginTop: 1 }}>{rol.descripcion}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#aaa' }}>{rol.rutaInicio}</span>
                  {isEditing && !yaAsignado && (
                    <button
                      onClick={() => setRolesAsignados(rs => [...rs, { id: rol.id, nombre: rol.nombre, rutaInicio: rol.rutaInicio }])}
                      style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: '#075E54', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                    >
                      <Plus size={11} /> Asignar
                    </button>
                  )}
                  {yaAsignado && <span style={{ fontSize: 11, color: rc.text, fontWeight: 700 }}>✓ Asignado</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function TabPermisos({ emp, rolesAsignados }) {
  const permisosActivos = [...new Set(
    rolesAsignados.flatMap(ra => {
      const rolDef = ROLES_DISPONIBLES.find(r => r.id === ra.id);
      if (rolDef?.nombre === 'Administrador') return Object.values(TODOS_LOS_PERMISOS).flat();
      if (rolDef?.nombre === 'Supervisor') return Object.values(TODOS_LOS_PERMISOS).flat().filter(p => !p.includes('eliminar'));
      if (rolDef?.nombre === 'Vendedor') return ['ventas.crear', 'ventas.ver', 'clientes.ver', 'clientes.cargar', 'productos.ver'];
      if (rolDef?.nombre === 'Cajero') return ['caja.cobrar', 'caja.abrir', 'caja.cerrar', 'ventas.ver', 'productos.ver'];
      if (rolDef?.nombre === 'Depósito') return ['productos.ver', 'productos.cargar', 'productos.editar'];
      return [];
    })
  )];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12, color: '#666' }}>
        <span style={{ fontWeight: 700, color: '#041627' }}>{permisosActivos.length}</span> permisos activos · derivados de los roles asignados. Los permisos no se pueden editar directamente — modificá los roles.
      </div>
      {Object.entries(TODOS_LOS_PERMISOS).map(([modulo, perms]) => {
        const mc = MODULE_COLORS[modulo];
        return (
          <div key={modulo}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: mc.text, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: mc.text }} /> {modulo}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {perms.map(p => {
                const tiene = permisosActivos.includes(p);
                return (
                  <div key={p} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '9px 14px', borderRadius: 7,
                    background: tiene ? mc.bg : '#f8fafc',
                    border: `1px solid ${tiene ? mc.border : '#e2e8f0'}`,
                    transition: 'all .15s',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {tiene
                        ? <ShieldCheck size={14} style={{ color: mc.text }} />
                        : <ShieldOff size={14} style={{ color: '#ccc' }} />}
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: tiene ? '#041627' : '#aaa' }}>{PERM_LABELS[p]}</div>
                        <div style={{ fontSize: 10, fontFamily: 'monospace', color: tiene ? mc.text : '#ccc', marginTop: 1 }}>{p}</div>
                      </div>
                    </div>
                    {tiene
                      ? <span style={{ fontSize: 11, fontWeight: 700, color: mc.text, background: mc.bg, border: `1px solid ${mc.border}`, borderRadius: 999, padding: '2px 8px' }}>Habilitado</span>
                      : <span style={{ fontSize: 11, color: '#ccc', fontWeight: 600 }}>Sin acceso</span>
                    }
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TabActividad() {
  const items = [
    { tipo: 'login', desc: 'Inició sesión', detalle: 'Desde IP 192.168.1.45', ts: '2025-05-22T14:32:00', color: '#3B6D11' },
    { tipo: 'venta', desc: 'Registró venta #00892', detalle: '$12.450 · 3 productos', ts: '2025-05-22T11:15:00', color: '#185FA5' },
    { tipo: 'rol', desc: 'Rol Cajero asignado', detalle: 'Por Admin Torres', ts: '2025-05-20T09:00:00', color: '#854F0B' },
    { tipo: 'login', desc: 'Inició sesión', detalle: 'Desde IP 192.168.1.45', ts: '2025-05-20T08:55:00', color: '#3B6D11' },
    { tipo: 'edit', desc: 'Datos actualizados', detalle: 'Teléfono y dirección', ts: '2025-05-18T16:00:00', color: '#534AB7' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: 'flex', gap: 14, paddingBottom: 16, position: 'relative' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.color, marginTop: 4, flexShrink: 0 }} />
            {i < items.length - 1 && <div style={{ width: 1, flex: 1, background: '#e2e8f0', marginTop: 4 }} />}
          </div>
          <div style={{ flex: 1, paddingBottom: 4 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#041627' }}>{item.desc}</div>
            <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{item.detalle}</div>
            <div style={{ fontSize: 11, color: '#bbb', marginTop: 3 }}>{formatDateTime(item.ts)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

function TabSucursales({
  emp,
  isEditing,
  sucursalesAsignadas,
  setSucursalesAsignadas,
}: {
  emp: { id: string };
  isEditing: boolean;
  sucursalesAsignadas: IEmpleadoSucursalAsignada[];
  setSucursalesAsignadas: Dispatch<SetStateAction<IEmpleadoSucursalAsignada[]>>;
}) {
  const [selectedSucursalId, setSelectedSucursalId] = useState('');
  const { data: sucursalesDisponiblesCatalogo = [] } = useGetSucursalesActivas();
  const asignarSucursal = useAsignarEmpleadoSucursal();
  const setPrincipal = useSetEmpleadoSucursalPrincipal();
  const desasignarSucursal = useDesasignarEmpleadoSucursal();

  const asignadasIds = new Set(sucursalesAsignadas.map((s) => s.id));
  const sucursalesParaAgregar = sucursalesDisponiblesCatalogo.filter(
    (sucursal) => !asignadasIds.has(sucursal.id),
  );
  const isMutating =
    asignarSucursal.isPending ||
    setPrincipal.isPending ||
    desasignarSucursal.isPending;

  const handleAsignar = async () => {
    if (!selectedSucursalId) return;
    const sucursal = sucursalesDisponiblesCatalogo.find(
      (item) => item.id === selectedSucursalId,
    );
    if (!sucursal) return;

    const esPrincipal = sucursalesAsignadas.length === 0;
    await asignarSucursal.mutateAsync({
      empleadoId: emp.id,
      sucursalId: selectedSucursalId,
      esPrincipal,
    });

    setSucursalesAsignadas((prev) => [
      ...prev.map((item) => ({
        ...item,
        esPrincipal: esPrincipal ? false : item.esPrincipal,
      })),
      {
        id: sucursal.id,
        nombre: sucursal.nombre,
        activo: true,
        esPrincipal,
      },
    ]);
    setSelectedSucursalId('');
  };

  const handleSetPrincipal = async (sucursalId: string) => {
    await setPrincipal.mutateAsync({ empleadoId: emp.id, sucursalId });
    setSucursalesAsignadas((prev) =>
      prev.map((item) => ({ ...item, esPrincipal: item.id === sucursalId })),
    );
  };

  const handleQuitar = async (sucursalId: string) => {
    const removedWasPrincipal = sucursalesAsignadas.find(
      (item) => item.id === sucursalId,
    )?.esPrincipal;
    await desasignarSucursal.mutateAsync({ empleadoId: emp.id, sucursalId });

    const remaining = sucursalesAsignadas.filter((item) => item.id !== sucursalId);
    const next =
      removedWasPrincipal && remaining.length > 0
        ? remaining.map((item, index) => ({ ...item, esPrincipal: index === 0 }))
        : remaining;

    setSucursalesAsignadas(next);
    if (removedWasPrincipal && next[0]) {
      await setPrincipal.mutateAsync({
        empleadoId: emp.id,
        sucursalId: next[0].id,
      });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12, color: '#666' }}>
        <span style={{ fontWeight: 700, color: '#041627' }}>{sucursalesAsignadas.length}</span> sucursales asignadas. El empleado solo puede operar en las sucursales habilitadas.
      </div>

      {isEditing && (
        <div style={{ display: 'flex', gap: 10, padding: 12, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8 }}>
          <select
            value={selectedSucursalId}
            onChange={(event) => setSelectedSucursalId(event.target.value)}
            style={{ flex: 1, padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13, fontWeight: 600, color: '#041627', outline: 'none' }}
          >
            <option value="">Seleccionar sucursal para agregar</option>
            {sucursalesParaAgregar.map((sucursal) => (
              <option key={sucursal.id} value={sucursal.id}>
                {sucursal.nombre}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleAsignar}
            disabled={!selectedSucursalId || isMutating}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#075E54', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: selectedSucursalId ? 'pointer' : 'not-allowed', opacity: !selectedSucursalId || isMutating ? 0.6 : 1 }}
          >
            <Plus size={13} /> Asignar
          </button>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {sucursalesAsignadas.length > 0 ? (
          sucursalesAsignadas.map((sucursal) => (
            <div key={sucursal.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px', borderRadius: 8,
              border: `1px solid ${sucursal.esPrincipal ? '#C0DD97' : '#e2e8f0'}`,
              background: sucursal.esPrincipal ? '#EAF3DE' : '#fff',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <MapPin size={16} style={{ color: sucursal.esPrincipal ? '#075E54' : '#888' }} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#041627' }}>{sucursal.nombre}</div>
                  {sucursal.esPrincipal && (
                    <span style={{ display: 'inline-block', marginTop: 3, fontSize: 10, fontWeight: 800, color: '#075E54', background: '#fff', borderRadius: 999, padding: '2px 8px' }}>
                      Principal
                    </span>
                  )}
                </div>
              </div>

              {isEditing && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {!sucursal.esPrincipal && (
                    <button
                      type="button"
                      onClick={() => handleSetPrincipal(sucursal.id)}
                      disabled={isMutating}
                      style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #075E54', background: '#fff', color: '#075E54', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                    >
                      Principal
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleQuitar(sucursal.id)}
                    disabled={isMutating}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', borderRadius: 6, border: '1px solid #F7C1C1', background: '#fff', color: '#A32D2D', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                  >
                    <Trash2 size={12} /> Quitar
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: '#FCEBEB', borderRadius: 8, border: '1px solid #F7C1C1', color: '#A32D2D', fontSize: 13, fontWeight: 700 }}>
            <AlertCircle size={14} />
            Este empleado todavia no tiene sucursales asignadas.
          </div>
        )}
      </div>
    </div>
  );
}

const TABS_DEF = [
  { id: 'info', label: 'Información General', icon: User },
  { id: 'roles', label: 'Roles', icon: Shield },
  { id: 'sucursales', label: 'Sucursales', icon: MapPin },
  { id: 'permisos', label: 'Permisos', icon: Key },
  { id: 'actividad', label: 'Actividad', icon: Clock },
];

export default function EmpleadoDetailView() {
  const { empleado } = useEmpleadoStore();
  const empleadoActual = empleado
    ? {
        ...EMPLEADO_MOCK,
        ...empleado,
        creadoEn: '2024-03-15',
        ultimoAcceso: '2025-05-22T14:32:00',
      }
    : EMPLEADO_MOCK;
  const [emp] = useState(empleadoActual);
  const [activeTab, setActiveTab] = useState('info');
  const [isEditing, setIsEditing] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [form, setForm] = useState({
    nombreCompleto: emp.nombreCompleto,
    email: emp.email,
    telefono: emp.telefono,
    direccion: emp.direccion,
    cargo: emp.cargo,
    activo: emp.activo,
    activo_pos: true,
    activo_web: false,
  });
  const [rolesAsignados, setRolesAsignados] = useState(emp.roles);
  const [sucursalesAsignadas, setSucursalesAsignadas] = useState<
    IEmpleadoSucursalAsignada[]
  >(
    emp.sucursales ?? [],
  );
  const [fotoPreview, setFotoPreview] = useState(emp.foto_url);
  const fileRef = useRef(null);

  const handleDiscard = () => {
    setForm({
      nombreCompleto: emp.nombreCompleto,
      email: emp.email,
      telefono: emp.telefono,
      direccion: emp.direccion,
      cargo: emp.cargo,
      activo: emp.activo,
      activo_pos: true,
      activo_web: false,
    });
    setRolesAsignados(emp.roles);
    setSucursalesAsignadas(emp.sucursales ?? []);
    setFotoPreview(emp.foto_url);
    setIsEditing(false);
  };

  const permisoCount = [...new Set(
    rolesAsignados.flatMap(ra => {
      const rolDef = ROLES_DISPONIBLES.find(r => r.id === ra.id);
      if (rolDef?.nombre === 'Administrador') return Object.values(TODOS_LOS_PERMISOS).flat();
      if (rolDef?.nombre === 'Supervisor') return Object.values(TODOS_LOS_PERMISOS).flat().filter(p => !p.includes('eliminar'));
      if (rolDef?.nombre === 'Vendedor') return ['ventas.crear', 'ventas.ver', 'clientes.ver', 'clientes.cargar', 'productos.ver'];
      if (rolDef?.nombre === 'Cajero') return ['caja.cobrar', 'caja.abrir', 'caja.cerrar', 'ventas.ver', 'productos.ver'];
      if (rolDef?.nombre === 'Depósito') return ['productos.ver', 'productos.cargar', 'productos.editar'];
      return [];
    })
  )].length;

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        * { box-sizing: border-box; }
        input:focus { border-color: #075E54 !important; }
        button { font-family: inherit; }
      `}</style>

      {/* ── TOP ACTION BAR ── */}
      <div style={{
        top: 64, zIndex: 20, background: '#fff',
        borderBottom: '1px solid #e2e8f0',
        padding: '12px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#666', fontWeight: 500 }}>
            <span style={{ color: '#075E54', cursor: 'pointer', fontWeight: 600 }}>Empleados</span>
            <ChevronRight size={14} style={{ color: '#ccc' }} />
            <span style={{ color: '#041627', fontWeight: 700 }}>{emp.nombreCompleto}</span>
          </div>
          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
            {isEditing ? (
              <>
                <button onClick={() => setIsEditing(false)} style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '6px 16px', background: '#075E54', color: '#fff',
                  border: 'none', borderRadius: 5, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                }}>
                  <Check size={13} /> Guardar
                </button>
                <button onClick={handleDiscard} style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '6px 16px', background: '#fff', color: '#555',
                  border: '1px solid #d1d5db', borderRadius: 5, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}>
                  <RotateCcw size={13} /> Descartar
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setIsEditing(true)} style={{
                  padding: '6px 16px', background: '#075E54', color: '#fff',
                  border: 'none', borderRadius: 5, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                }}>
                  Editar
                </button>
                <button style={{
                  padding: '6px 14px', background: '#fff', color: '#041627',
                  border: '1px solid #d1d5db', borderRadius: 5, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}>
                  Resetear contraseña
                </button>
                <button style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '6px 14px', background: form.activo ? '#FCEBEB' : '#EAF3DE',
                  color: form.activo ? '#A32D2D' : '#3B6D11',
                  border: `1px solid ${form.activo ? '#F7C1C1' : '#C0DD97'}`,
                  borderRadius: 5, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}
                  onClick={() => setForm(f => ({ ...f, activo: !f.activo }))}
                >
                  {form.activo ? <><ShieldOff size={13} /> Desactivar</> : <><ShieldCheck size={13} /> Activar</>}
                </button>
              </>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f1f5f9', padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, color: '#041627' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#639922' }} />
            Conectado al sistema
          </span>
        </div>
      </div>

      {/* ── MAIN SHEET ── */}
      <main style={{ maxWidth: 1480, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: 20, alignItems: 'start' }}>

          {/* ── LEFT SHEET ── */}
          <div style={{
            background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8,
            boxShadow: '0 4px 20px rgba(0,0,0,0.04)', padding: 32,
            display: 'flex', flexDirection: 'column', gap: 24, minHeight: 550,
          }}>

            {/* ── ROW 1: HEADER ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24 }}>

              {/* Left: Avatar + Info */}
              <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flex: 1 }}>
                {/* Avatar */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{
                    width: 96, height: 96, borderRadius: 12,
                    background: fotoPreview ? 'transparent' : '#E6F1FB',
                    border: '2px dashed #B5D4F4',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden', position: 'relative',
                  }}>
                    {fotoPreview
                      ? <img src={fotoPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontSize: 28, fontWeight: 800, color: '#378ADD' }}>{getInitials(emp.nombreCompleto)}</span>
                    }
                    {isEditing && (
                      <div style={{
                        position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        opacity: 0, transition: 'opacity .15s',
                      }}
                        onMouseEnter={e => e.currentTarget.style.opacity = 1}
                        onMouseLeave={e => e.currentTarget.style.opacity = 0}
                      >
                        <button onClick={() => fileRef.current?.click()} style={{ padding: 6, background: '#075E54', border: 'none', borderRadius: '50%', cursor: 'pointer', color: '#fff', display: 'flex' }}>
                          <Camera size={13} />
                        </button>
                        <button onClick={() => setFotoPreview(null)} style={{ padding: 6, background: '#dc2626', border: 'none', borderRadius: '50%', cursor: 'pointer', color: '#fff', display: 'flex' }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                  <input type="file" ref={fileRef} accept="image/*" style={{ display: 'none' }}
                    onChange={e => e.target.files?.[0] && setFotoPreview(URL.createObjectURL(e.target.files[0]))} />
                </div>

                {/* Name & meta */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <button onClick={() => setIsFavorite(f => !f)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                      <Star size={20} style={{ fill: isFavorite ? '#FBBF24' : 'none', stroke: isFavorite ? '#FBBF24' : '#d1d5db' }} />
                    </button>
                    <span style={{ fontSize: 10, fontWeight: 800, color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em', background: '#f1f5f9', padding: '2px 8px', borderRadius: 4 }}>
                      Ficha de Empleado
                    </span>
                  </div>
                  <h1 style={{ fontSize: 28, fontWeight: 800, color: '#041627', margin: 0, lineHeight: 1.2 }}>
                    {form.nombreCompleto}
                  </h1>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                    <span style={{ fontSize: 13, color: '#666', fontWeight: 500 }}>{form.cargo}</span>
                    <span style={{ color: '#e2e8f0' }}>·</span>
                    <span style={{ fontSize: 13, color: '#888', fontFamily: 'monospace' }}>{emp.email}</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                    <StatusBadge active={form.activo} />
                    {rolesAsignados.map(r => <RolBadge key={r.id} rol={r} isEditing={false} onRemove={() => {}} />)}
                  </div>
                </div>
              </div>

              {/* Right: Smart buttons */}
              <div style={{ display: 'flex', border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', flexShrink: 0 }}>
                {[
                  { label: 'Roles', value: rolesAsignados.length, icon: Shield, sub: 'asignados' },
                  { label: 'Permisos', value: permisoCount, icon: Key, sub: 'activos' },
                  { label: 'Último acceso', value: '22 may', icon: Clock, sub: '14:32 hs' },
                  { label: 'Estado', value: form.activo ? 'Activo' : 'Inactivo', icon: UserCheck, sub: form.activo ? '🟢' : '🔴' },
                ].map(({ label, value, icon: Icon, sub }, i, arr) => (
                  <div key={label} style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    padding: '10px 16px', textAlign: 'center', minWidth: 90,
                    borderRight: i < arr.length - 1 ? '1px solid #e2e8f0' : 'none',
                    cursor: 'pointer', background: '#fff', transition: 'background .1s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                  >
                    <Icon size={15} style={{ color: '#075E54', marginBottom: 4 }} />
                    <span style={{ fontSize: 9, color: '#aaa', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.07em', lineHeight: 1 }}>{label}</span>
                    <span style={{ fontSize: 15, fontWeight: 800, color: '#041627', marginTop: 4 }}>{value}</span>
                    <span style={{ fontSize: 10, color: '#aaa' }}>{sub}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ height: 1, background: '#f1f5f9' }} />

            {/* ── TABS ── */}
            <div style={{ display: 'flex', borderBottom: '1px solid #f1f5f9', gap: 4, background: '#fafafa', padding: 4, borderRadius: '6px 6px 0 0', overflowX: 'auto' }}>
              {TABS_DEF.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setActiveTab(id)} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '9px 18px', fontSize: 13, fontWeight: activeTab === id ? 700 : 600,
                  whiteSpace: 'nowrap', border: 'none', cursor: 'pointer',
                  background: activeTab === id ? '#fff' : 'transparent',
                  color: activeTab === id ? '#075E54' : '#888',
                  borderBottom: `2px solid ${activeTab === id ? '#075E54' : 'transparent'}`,
                  borderRadius: '4px 4px 0 0',
                  boxShadow: activeTab === id ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all .15s',
                }}>
                  <Icon size={13} style={{ color: activeTab === id ? '#075E54' : '#bbb' }} />
                  {label}
                </button>
              ))}
            </div>

            {/* ── TAB CONTENT ── */}
            <div style={{ flex: 1, paddingTop: 4 }}>
              {activeTab === 'info' && <TabInfo emp={form} isEditing={isEditing} form={form} setForm={setForm} />}
              {activeTab === 'roles' && <TabRoles emp={emp} isEditing={isEditing} rolesAsignados={rolesAsignados} setRolesAsignados={setRolesAsignados} />}
              {activeTab === 'sucursales' && <TabSucursales emp={emp} isEditing={isEditing} sucursalesAsignadas={sucursalesAsignadas} setSucursalesAsignadas={setSucursalesAsignadas} />}
              {activeTab === 'permisos' && <TabPermisos emp={emp} rolesAsignados={rolesAsignados} />}
              {activeTab === 'actividad' && <TabActividad />}
            </div>
          </div>

          {/* ── RIGHT SIDEBAR ── */}
          <aside style={{
            display: 'flex', flexDirection: 'column', borderRadius: 8,
            border: '1px solid #e2e8f0', background: '#f8fafc',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)', overflow: 'hidden', minHeight: 550,
          }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', background: '#fff' }}>
              <h2 style={{ fontSize: 12, fontWeight: 800, color: '#041627', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
                Resumen del acceso
              </h2>
              <p style={{ fontSize: 12, color: '#aaa', marginTop: 4 }}>Qué puede hacer este empleado</p>
            </div>

            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Ruta de inicio */}
              <div style={{ padding: '12px 14px', background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Al iniciar sesión va a:</div>
                <div style={{ fontSize: 14, fontFamily: 'monospace', fontWeight: 700, color: '#075E54' }}>
                  {rolesAsignados[0]?.rutaInicio ?? '/sin-acceso'}
                </div>
              </div>

              {/* Módulos con acceso */}
              <div style={{ padding: '12px 14px', background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Módulos habilitados</div>
                {Object.entries(MODULE_COLORS).map(([mod, mc]) => {
                  const tieneAcceso = Object.values(TODOS_LOS_PERMISOS[mod] || []).some(p =>
                    rolesAsignados.some(ra => {
                      const rolDef = ROLES_DISPONIBLES.find(r => r.id === ra.id);
                      if (rolDef?.nombre === 'Administrador' || rolDef?.nombre === 'Supervisor') return true;
                      if (rolDef?.nombre === 'Vendedor') return ['ventas.crear', 'ventas.ver', 'clientes.ver', 'clientes.cargar', 'productos.ver'].includes(p);
                      if (rolDef?.nombre === 'Cajero') return ['caja.cobrar', 'caja.abrir', 'caja.cerrar', 'ventas.ver', 'productos.ver'].includes(p);
                      if (rolDef?.nombre === 'Depósito') return ['productos.ver', 'productos.cargar', 'productos.editar'].includes(p);
                      return false;
                    })
                  );
                  return (
                    <div key={mod} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: tieneAcceso ? '#041627' : '#ccc' }}>{mod}</span>
                      {tieneAcceso
                        ? <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 999, background: mc.bg, color: mc.text, fontWeight: 700, border: `1px solid ${mc.border}` }}>✓ Acceso</span>
                        : <span style={{ fontSize: 10, color: '#ddd', fontWeight: 600 }}>Sin acceso</span>
                      }
                    </div>
                  );
                })}
              </div>

              {/* Datos del registro */}
              <div style={{ padding: '12px 14px', background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Datos del registro</div>
                {[
                  { label: 'Creado el', value: formatDate(emp.creadoEn) },
                  { label: 'Último acceso', value: formatDateTime(emp.ultimoAcceso) },
                  { label: 'ID interno', value: emp.id },
                ].map(({ label, value }) => (
                  <div key={label} style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 10, color: '#aaa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#555', fontFamily: label === 'ID interno' ? 'monospace' : 'inherit', marginTop: 1 }}>{value}</div>
                  </div>
                ))}
              </div>

              {!form.activo && (
                <div style={{ padding: '12px 14px', background: '#FCEBEB', borderRadius: 8, border: '1px solid #F7C1C1', display: 'flex', gap: 8 }}>
                  <AlertCircle size={14} style={{ color: '#A32D2D', flexShrink: 0, marginTop: 1 }} />
                  <div style={{ fontSize: 12, color: '#A32D2D', fontWeight: 600, lineHeight: 1.5 }}>
                    Empleado inactivo. No puede iniciar sesión en el sistema.
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
