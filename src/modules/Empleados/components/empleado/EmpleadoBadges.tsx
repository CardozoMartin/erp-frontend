import { X } from 'lucide-react';
import type { IEmpleadoRol } from '../../types/empleado.type';
import { ROL_COLORS } from '../../utils/empleado.utils';
import type { RoleColorKey } from '../../utils/empleado.utils';

type RolAsignado = Pick<IEmpleadoRol, 'id' | 'nombre' | 'rutaInicio'>;

export function StatusBadge({ active }: { active: boolean }) {
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

interface RolBadgeProps {
  rol: RolAsignado;
  onRemove: (id: string) => void;
  isEditing: boolean;
  colorKey?: RoleColorKey;
}

export function RolBadge({ rol, onRemove, isEditing, colorKey = 'gray' }: RolBadgeProps) {
  const rc = ROL_COLORS[colorKey] || ROL_COLORS.gray;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600,
      background: rc.bg, color: rc.text, border: `1px solid ${rc.border}`,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: rc.dot }} />
      {rol.nombre}
      {isEditing && (
        <button
          onClick={() => onRemove(rol.id)}
          style={{ marginLeft: 2, background: 'none', border: 'none', cursor: 'pointer', color: rc.text, opacity: 0.7, padding: 0, display: 'flex', alignItems: 'center' }}
        >
          <X size={11} />
        </button>
      )}
    </span>
  );
}
