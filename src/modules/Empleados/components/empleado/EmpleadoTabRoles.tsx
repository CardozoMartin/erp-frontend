import { AlertCircle, ChevronRight, Plus, Search, Shield } from 'lucide-react';
import { useState } from 'react';
import type { IEmpleadoRol } from '../../types/empleado.type';
import { ROL_COLORS } from '../../utils/empleado.utils';
import type { RoleColorKey } from '../../utils/empleado.utils';
import { RolBadge } from './EmpleadoBadges';

type RolAsignado = Pick<IEmpleadoRol, 'id' | 'nombre' | 'rutaInicio'>;
type RoleOption = IEmpleadoRol & { color?: RoleColorKey };

interface Props {
  isEditing: boolean;
  rolesAsignados: RolAsignado[];
  setRolesAsignados: (updater: RolAsignado[] | ((roles: RolAsignado[]) => RolAsignado[])) => void;
  availableRoles?: RoleOption[];
}

export function EmpleadoTabRoles({ isEditing, rolesAsignados, setRolesAsignados, availableRoles = [] }: Props) {
  const [search, setSearch] = useState('');
  const disponibles = availableRoles.filter(
    (r) => !rolesAsignados.find((a) => a.id === r.id) && r.nombre.toLowerCase().includes(search.toLowerCase()),
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
          {rolesAsignados.map((rol) => (
            <RolBadge
              key={rol.id}
              rol={rol}
              isEditing={isEditing}
              colorKey={(availableRoles.find((r) => r.id === rol.id)?.color ?? 'gray') as RoleColorKey}
              onRemove={(id) => setRolesAsignados((rs) => rs.filter((r) => r.id !== id))}
            />
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
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', padding: '7px 12px 7px 30px', fontSize: 13, border: '1px solid #e2e8f0', borderRadius: 6, outline: 'none', fontFamily: 'inherit', background: '#f8fafc' }}
            />
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(isEditing ? disponibles : availableRoles).map((rol) => {
            const rc = ROL_COLORS[(rol.color ?? 'gray') as RoleColorKey];
            const yaAsignado = !!rolesAsignados.find((r) => r.id === rol.id);
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
                      onClick={() => setRolesAsignados((rs) => [...rs, { id: rol.id, nombre: rol.nombre, rutaInicio: rol.rutaInicio }])}
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
