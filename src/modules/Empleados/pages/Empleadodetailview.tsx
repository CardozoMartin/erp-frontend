import {
  Camera, Check, ChevronRight, Clock, Key, RotateCcw, Shield,
  ShieldCheck, ShieldOff, Star, Trash2, User, UserCheck,
} from 'lucide-react';
import Swal from 'sweetalert2';
import { useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import FichaHistoryPanel from '../../../components/common/FichaHistoryPanel';
import { useAuthStore } from '../../../store/auth.store';
import { useAuditoriaAux } from '../../POSAuxiliares/hooks/usePosAux';
import { EmpleadoTabActividad } from '../components/empleado/EmpleadoTabActividad';
import { EmpleadoTabInfo } from '../components/empleado/EmpleadoTabInfo';
import { EmpleadoTabPermisos } from '../components/empleado/EmpleadoTabPermisos';
import { EmpleadoTabRoles } from '../components/empleado/EmpleadoTabRoles';
import { RolBadge, StatusBadge } from '../components/empleado/EmpleadoBadges';
import { useGetEmpleados, useGetRoles, usePutEmpleado, useResetPassword } from '../hooks/useEmpleados';
import { useEmpleadoStore } from '../store/useEmpleadoStore';
import type { DetailEmpleado, EmpleadoDetailFormValues, ICreateEmpleadoPayload, IEmpleadoRol } from '../types/empleado.type';
import { empleadoChanges, empleadoHistoryLabels, formatDate, formatDateTime, getInitials, MODULE_COLORS } from '../utils/empleado.utils';
import type { RoleColorKey } from '../utils/empleado.utils';

type RolAsignado = Pick<IEmpleadoRol, 'id' | 'nombre' | 'rutaInicio'>;
type RoleOption = IEmpleadoRol & { color?: RoleColorKey };

const TABS_DEF = [
  { id: 'info',      label: 'Información General', icon: User },
  { id: 'roles',     label: 'Roles',               icon: Shield },
  { id: 'permisos',  label: 'Permisos',            icon: Key },
  { id: 'actividad', label: 'Actividad',            icon: Clock },
];

const EMPLEADO_FALLBACK: DetailEmpleado = {
  id: '', nombreCompleto: '', email: '', telefono: '', direccion: '', cargo: '',
  foto_url: null, activo: true, roles: [], permisos: [], sucursales: [],
  creadoEn: '', ultimoAcceso: '',
};

export default function EmpleadoDetailView() {
  const { empleado, setEmpleado } = useEmpleadoStore();
  const rolesQuery = useGetRoles();
  const empleadosQuery = useGetEmpleados(1, 100);

  const emp: DetailEmpleado = empleado
    ? { ...EMPLEADO_FALLBACK, ...empleado, creadoEn: (empleado as DetailEmpleado).creadoEn ?? '', ultimoAcceso: (empleado as DetailEmpleado).ultimoAcceso ?? '' }
    : EMPLEADO_FALLBACK;

  const putEmpleado = usePutEmpleado(emp.id);
  const resetPassword = useResetPassword(emp.id);
  const [activeTab, setActiveTab] = useState('info');
  const [isEditing, setIsEditing] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [fotoPreview, setFotoPreview] = useState<string | null>(emp.foto_url);
  const [nuevaContrasena, setNuevaContrasena] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const defaultValues: EmpleadoDetailFormValues = {
    nombreCompleto: emp.nombreCompleto,
    email: emp.email,
    telefono: emp.telefono,
    direccion: emp.direccion,
    cargo: emp.cargo,
    contrasena: '',
    activo: emp.activo,
    activo_pos: emp.activo_pos ?? true,
    activo_web: emp.activo_web ?? false,
    rolesIds: emp.roles.map((r) => r.id),
  };

  const { register, watch, setValue, reset, handleSubmit, formState: { errors } } = useForm<EmpleadoDetailFormValues>({ defaultValues });
  const form = watch();

  const rolesDisponibles: RoleOption[] = rolesQuery.data ?? [];
  const rolesAsignados = useMemo<RolAsignado[]>(
    () => form.rolesIds
      .map((id) => {
        const rol = rolesDisponibles.find((r) => r.id === id);
        if (rol) return { id: rol.id, nombre: rol.nombre, rutaInicio: rol.rutaInicio };
        return emp.roles.find((r) => r.id === id) ?? null;
      })
      .filter((r): r is RolAsignado => Boolean(r)),
    [emp.roles, form.rolesIds, rolesDisponibles],
  );

  const setRolesAsignados = (updater: RolAsignado[] | ((roles: RolAsignado[]) => RolAsignado[])) => {
    const next = typeof updater === 'function' ? updater(rolesAsignados) : updater;
    setValue('rolesIds', next.map((r) => r.id), { shouldDirty: true, shouldValidate: true });
  };

  const empleadosById = useMemo(() => {
    const lista = empleadosQuery.data?.data ?? [];
    return new Map(lista.map((e) => [e.id, e]));
  }, [empleadosQuery.data]);

  const historialQuery = useAuditoriaAux({ page: 1, limit: 30, entidad: 'empleado', entidad_id: emp.id }, !!emp.id);
  const historialEmpleado = historialQuery.data?.data ?? [];

  const handleDiscard = () => { reset(defaultValues); setFotoPreview(emp.foto_url); setIsEditing(false); };

  const handleToggleActivo = async () => {
    const nuevoEstado = !form.activo;
    const { isConfirmed } = await Swal.fire({
      title: nuevoEstado ? '¿Activar empleado?' : '¿Desactivar empleado?',
      text: nuevoEstado
        ? `${emp.nombreCompleto} podrá volver a iniciar sesión en el sistema.`
        : `${emp.nombreCompleto} no podrá iniciar sesión hasta que sea reactivado.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: nuevoEstado ? '#075E54' : '#d33',
      cancelButtonColor: '#6b7280',
      confirmButtonText: nuevoEstado ? 'Sí, activar' : 'Sí, desactivar',
      cancelButtonText: 'Cancelar',
    });
    if (!isConfirmed) return;
    try {
      const actualizado = await putEmpleado.mutateAsync({ activo: nuevoEstado });
      setEmpleado(actualizado);
      reset({ ...form, activo: actualizado.activo, contrasena: '', rolesIds: actualizado.roles.map((r) => r.id) });
    } catch { /* El hook ya muestra el toast */ }
  };

  const handleResetPassword = async () => {
    const { isConfirmed } = await Swal.fire({
      title: '¿Resetear contraseña?',
      text: `Se generará una nueva contraseña temporal para ${emp.nombreCompleto}. La contraseña actual quedará inválida de inmediato.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#075E54',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, resetear',
      cancelButtonText: 'Cancelar',
    });
    if (!isConfirmed) return;
    try {
      const resultado = await resetPassword.mutateAsync();
      setNuevaContrasena(resultado.contrasenaGenerada);
    } catch { /* El hook ya muestra el toast */ }
  };

  const handleSave = handleSubmit(async (data) => {
    const payload: Partial<ICreateEmpleadoPayload> = {
      nombreCompleto: data.nombreCompleto.trim(),
      email: data.email.trim(),
      telefono: data.telefono.trim(),
      direccion: data.direccion.trim(),
      cargo: data.cargo.trim(),
      activo: data.activo,
      rolesIds: data.rolesIds,
    };
    if (data.contrasena.trim()) payload.contrasena = data.contrasena;
    try {
      const actualizado = await putEmpleado.mutateAsync(payload);
      setEmpleado(actualizado);
      reset({ ...data, contrasena: '', rolesIds: actualizado.roles.map((r) => r.id) });
      setIsEditing(false);
    } catch { /* El hook ya muestra el toast */ }
  });

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', fontFamily: "'Inter', sans-serif" }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}*{box-sizing:border-box}input:focus{border-color:#075E54!important}button{font-family:inherit}`}</style>

      {/* Barra de acciones */}
      <div style={{ top: 64, zIndex: 20, background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '12px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#666', fontWeight: 500 }}>
            <span style={{ color: '#075E54', cursor: 'pointer', fontWeight: 600 }}>Empleados</span>
            <ChevronRight size={14} style={{ color: '#ccc' }} />
            <span style={{ color: '#041627', fontWeight: 700 }}>{emp.nombreCompleto}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
            {isEditing ? (
              <>
                <button onClick={handleSave} disabled={putEmpleado.isPending} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 16px', background: '#075E54', color: '#fff', border: 'none', borderRadius: 5, fontSize: 13, fontWeight: 700, cursor: putEmpleado.isPending ? 'wait' : 'pointer', opacity: putEmpleado.isPending ? 0.7 : 1 }}>
                  <Check size={13} /> {putEmpleado.isPending ? 'Guardando...' : 'Guardar'}
                </button>
                <button onClick={handleDiscard} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 16px', background: '#fff', color: '#555', border: '1px solid #d1d5db', borderRadius: 5, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  <RotateCcw size={13} /> Descartar
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setIsEditing(true)} style={{ padding: '6px 16px', background: '#075E54', color: '#fff', border: 'none', borderRadius: 5, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Editar</button>
                <button
                  onClick={handleResetPassword}
                  disabled={resetPassword.isPending}
                  style={{ padding: '6px 14px', background: '#fff', color: '#041627', border: '1px solid #d1d5db', borderRadius: 5, fontSize: 13, fontWeight: 600, cursor: resetPassword.isPending ? 'wait' : 'pointer', opacity: resetPassword.isPending ? 0.7 : 1 }}
                >
                  {resetPassword.isPending ? 'Reseteando...' : 'Resetear contraseña'}
                </button>
                <button
                  onClick={handleToggleActivo}
                  disabled={putEmpleado.isPending}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', background: form.activo ? '#FCEBEB' : '#EAF3DE', color: form.activo ? '#A32D2D' : '#3B6D11', border: `1px solid ${form.activo ? '#F7C1C1' : '#C0DD97'}`, borderRadius: 5, fontSize: 13, fontWeight: 600, cursor: putEmpleado.isPending ? 'wait' : 'pointer', opacity: putEmpleado.isPending ? 0.7 : 1 }}
                >
                  {form.activo ? <><ShieldOff size={13} /> Desactivar</> : <><ShieldCheck size={13} /> Activar</>}
                </button>
              </>
            )}
          </div>
        </div>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f1f5f9', padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, color: '#041627' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#639922' }} /> Conectado al sistema
        </span>
      </div>

      <main style={{ maxWidth: 1480, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: 20, alignItems: 'start' }}>

          {/* Panel principal */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.04)', padding: 32, display: 'flex', flexDirection: 'column', gap: 24, minHeight: 550 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24 }}>
              <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flex: 1 }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{ width: 96, height: 96, borderRadius: 12, background: fotoPreview ? 'transparent' : '#E6F1FB', border: '2px dashed #B5D4F4', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
                    {fotoPreview ? <img src={fotoPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 28, fontWeight: 800, color: '#378ADD' }}>{getInitials(emp.nombreCompleto || '?')}</span>}
                    {isEditing && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: 0, transition: 'opacity .15s' }} onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')} onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}>
                        <button onClick={() => fileRef.current?.click()} style={{ padding: 6, background: '#075E54', border: 'none', borderRadius: '50%', cursor: 'pointer', color: '#fff', display: 'flex' }}><Camera size={13} /></button>
                        <button onClick={() => setFotoPreview(null)} style={{ padding: 6, background: '#dc2626', border: 'none', borderRadius: '50%', cursor: 'pointer', color: '#fff', display: 'flex' }}><Trash2 size={13} /></button>
                      </div>
                    )}
                  </div>
                  <input type="file" ref={fileRef} accept="image/*" style={{ display: 'none' }} onChange={(e) => e.target.files?.[0] && setFotoPreview(URL.createObjectURL(e.target.files[0]))} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <button onClick={() => setIsFavorite((f) => !f)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                      <Star size={20} style={{ fill: isFavorite ? '#FBBF24' : 'none', stroke: isFavorite ? '#FBBF24' : '#d1d5db' }} />
                    </button>
                    <span style={{ fontSize: 10, fontWeight: 800, color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em', background: '#f1f5f9', padding: '2px 8px', borderRadius: 4 }}>Ficha de Empleado</span>
                  </div>
                  <h1 style={{ fontSize: 28, fontWeight: 800, color: '#041627', margin: 0, lineHeight: 1.2 }}>{form.nombreCompleto}</h1>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                    <span style={{ fontSize: 13, color: '#666', fontWeight: 500 }}>{form.cargo}</span>
                    <span style={{ color: '#e2e8f0' }}>·</span>
                    <span style={{ fontSize: 13, color: '#888', fontFamily: 'monospace' }}>{emp.email}</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                    <StatusBadge active={form.activo} />
                    {rolesAsignados.map((r) => <RolBadge key={r.id} rol={r} isEditing={false} onRemove={() => {}} colorKey={(rolesDisponibles.find((rd) => rd.id === r.id)?.color ?? 'gray') as RoleColorKey} />)}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', flexShrink: 0 }}>
                {[
                  { label: 'Roles',         value: rolesAsignados.length,      icon: Shield,    sub: 'asignados' },
                  { label: 'Permisos',      value: emp.permisos?.length ?? 0,  icon: Key,       sub: 'activos' },
                  { label: 'Último acceso', value: '22 may',                   icon: Clock,     sub: '14:32 hs' },
                  { label: 'Estado',        value: form.activo ? 'Activo' : 'Inactivo', icon: UserCheck, sub: form.activo ? '🟢' : '🔴' },
                ].map(({ label, value, icon: Icon, sub }, i, arr) => (
                  <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10px 16px', textAlign: 'center', minWidth: 90, borderRight: i < arr.length - 1 ? '1px solid #e2e8f0' : 'none', cursor: 'pointer', background: '#fff', transition: 'background .1s' }} onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')} onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}>
                    <Icon size={15} style={{ color: '#075E54', marginBottom: 4 }} />
                    <span style={{ fontSize: 9, color: '#aaa', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.07em', lineHeight: 1 }}>{label}</span>
                    <span style={{ fontSize: 15, fontWeight: 800, color: '#041627', marginTop: 4 }}>{value}</span>
                    <span style={{ fontSize: 10, color: '#aaa' }}>{sub}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ height: 1, background: '#f1f5f9' }} />

            <div style={{ display: 'flex', borderBottom: '1px solid #f1f5f9', gap: 4, background: '#fafafa', padding: 4, borderRadius: '6px 6px 0 0', overflowX: 'auto' }}>
              {TABS_DEF.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setActiveTab(id)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', fontSize: 13, fontWeight: activeTab === id ? 700 : 600, whiteSpace: 'nowrap', border: 'none', cursor: 'pointer', background: activeTab === id ? '#fff' : 'transparent', color: activeTab === id ? '#075E54' : '#888', borderBottom: `2px solid ${activeTab === id ? '#075E54' : 'transparent'}`, borderRadius: '4px 4px 0 0', boxShadow: activeTab === id ? '0 1px 4px rgba(0,0,0,0.06)' : 'none', transition: 'all .15s' }}>
                  <Icon size={13} style={{ color: activeTab === id ? '#075E54' : '#bbb' }} /> {label}
                </button>
              ))}
            </div>

            <div style={{ flex: 1, paddingTop: 4 }}>
              {activeTab === 'info'      && <EmpleadoTabInfo emp={form} isEditing={isEditing} form={form} register={register} setValue={setValue} errors={errors} />}
              {activeTab === 'roles'     && <EmpleadoTabRoles isEditing={isEditing} rolesAsignados={rolesAsignados} setRolesAsignados={setRolesAsignados} availableRoles={rolesDisponibles} />}
              {activeTab === 'permisos'  && <EmpleadoTabPermisos empleado={emp} isEditing={isEditing} />}
              {activeTab === 'actividad' && <EmpleadoTabActividad />}
            </div>
          </div>

          {/* Sidebar */}
          <aside style={{ display: 'flex', flexDirection: 'column', borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', overflow: 'hidden', minHeight: 550 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', background: '#fff' }}>
              <h2 style={{ fontSize: 12, fontWeight: 800, color: '#041627', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Resumen del acceso</h2>
              <p style={{ fontSize: 12, color: '#aaa', marginTop: 4 }}>Qué puede hacer este empleado</p>
            </div>
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <FichaHistoryPanel
                variant="section"
                className="max-h-[430px] rounded-lg bg-white"
                title="Historial"
                subtitle="Cambios, roles, sucursales y accesos"
                events={historialEmpleado}
                isLoading={historialQuery.isLoading}
                labels={empleadoHistoryLabels}
                maxChanges={4}
                emptyTitle="Sin movimientos"
                emptyDescription="Aca se vera quien cambio el empleado y cuando."
                getActorName={(evento) => {
                  const actor = evento.empleado_id ? empleadosById.get(evento.empleado_id) : null;
                  return actor?.nombreCompleto ?? 'Sistema';
                }}
                getChanges={(evento) => empleadoChanges(evento.antes, evento.despues)}
              />
              <div style={{ padding: '12px 14px', background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Al iniciar sesión va a:</div>
                <div style={{ fontSize: 14, fontFamily: 'monospace', fontWeight: 700, color: '#075E54' }}>{rolesAsignados[0]?.rutaInicio ?? '/sin-acceso'}</div>
              </div>
              <div style={{ padding: '12px 14px', background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Módulos habilitados</div>
                {Object.entries(MODULE_COLORS).map(([mod, mc]) => (
                  <div key={mod} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#041627' }}>{mod}</span>
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 999, background: mc.bg, color: mc.text, fontWeight: 700, border: `1px solid ${mc.border}` }}>✓ Acceso</span>
                  </div>
                ))}
              </div>
              <div style={{ padding: '12px 14px', background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Datos del registro</div>
                {[
                  { label: 'Creado el',     value: formatDate(emp.creadoEn || new Date().toISOString()) },
                  { label: 'Último acceso', value: formatDateTime(emp.ultimoAcceso || new Date().toISOString()) },
                  { label: 'ID interno',    value: emp.id },
                ].map(({ label, value }) => (
                  <div key={label} style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 10, color: '#aaa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#555', fontFamily: label === 'ID interno' ? 'monospace' : 'inherit', marginTop: 1 }}>{value}</div>
                  </div>
                ))}
              </div>
              {!form.activo && (
                <div style={{ padding: '12px 14px', background: '#FCEBEB', borderRadius: 8, border: '1px solid #F7C1C1', display: 'flex', gap: 8 }}>
                  <ShieldOff size={14} style={{ color: '#A32D2D', flexShrink: 0, marginTop: 1 }} />
                  <div style={{ fontSize: 12, color: '#A32D2D', fontWeight: 600, lineHeight: 1.5 }}>Empleado inactivo. No puede iniciar sesión en el sistema.</div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>

      {nuevaContrasena && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 10, padding: 32, maxWidth: 420, width: '90%', boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <Key size={20} style={{ color: '#075E54' }} />
              <h2 style={{ fontSize: 17, fontWeight: 800, color: '#041627', margin: 0 }}>Contraseña reseteada</h2>
            </div>
            <p style={{ fontSize: 13, color: '#555', marginBottom: 16, lineHeight: 1.6 }}>
              La contraseña fue reseteada correctamente. Entregá esta contraseña temporal al empleado para que pueda iniciar sesión.
            </p>
            <div style={{ background: '#f1f5f9', borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 20 }}>
              <span style={{ fontSize: 20, fontFamily: 'monospace', fontWeight: 800, color: '#041627', letterSpacing: '0.08em' }}>{nuevaContrasena}</span>
              <button
                onClick={() => navigator.clipboard.writeText(nuevaContrasena)}
                style={{ padding: '6px 12px', background: '#075E54', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                Copiar
              </button>
            </div>
            <p style={{ fontSize: 11, color: '#e67e00', fontWeight: 600, marginBottom: 20 }}>
              ⚠ Esta contraseña solo se muestra una vez. Una vez cerrado este panel no se puede recuperar.
            </p>
            <button
              onClick={() => setNuevaContrasena(null)}
              style={{ width: '100%', padding: '10px', background: '#041627', color: '#fff', border: 'none', borderRadius: 7, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
            >
              Entendido, cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
