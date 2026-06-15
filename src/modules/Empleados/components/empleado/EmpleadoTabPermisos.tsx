import { ShieldCheck, ShieldOff } from 'lucide-react';
import { useMemo } from 'react';
import { useAsignarPermiso, useGetPermisos, useRemoverPermiso } from '../../hooks/useEmpleados';
import { useAuthStore } from '../../../../store/auth.store';
import type { DetailEmpleado } from '../../types/empleado.type';
import { MODULE_COLORS } from '../../utils/empleado.utils';

interface Props {
  empleado: DetailEmpleado;
  isEditing: boolean;
}

export function EmpleadoTabPermisos({ empleado, isEditing }: Props) {
  const { data: todosLosPermisos = [] } = useGetPermisos();
  const asignarPermiso = useAsignarPermiso();
  const removerPermiso = useRemoverPermiso();
  const sucursalActivaId = useAuthStore((s) => s.sucursalActiva?.id ?? '');

  const permisosPorModulo = useMemo(() => {
    const agrupado: Record<string, { id: string; clave: string; nombre: string; modulo: string }[]> = {};
    todosLosPermisos.forEach((p) => {
      const mod = p.modulo.toUpperCase();
      if (!agrupado[mod]) agrupado[mod] = [];
      agrupado[mod].push(p);
    });
    return agrupado;
  }, [todosLosPermisos]);

  const permisosActivos = empleado.permisos || [];
  const extras = empleado.permisosExtra || [];

  const handleToggleExtra = async (permisoId: string, yaTieneExtra: boolean) => {
    if (!isEditing) return;
    try {
      if (yaTieneExtra) {
        await removerPermiso.mutateAsync({ empleadoId: empleado.id, permisoId });
      } else {
        await asignarPermiso.mutateAsync({ empleadoId: empleado.id, permisoId, tipo: 'grant' });
      }
    } catch {
      // El hook ya muestra el toast
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12, color: '#666' }}>
        <span style={{ fontWeight: 700, color: '#041627' }}>{permisosActivos.length}</span> permisos activos en total.
        {isEditing && <span> Podés asignar o revocar permisos específicos (extras) para este empleado en la sucursal actual.</span>}
      </div>
      {Object.entries(permisosPorModulo).map(([modulo, perms]) => {
        const mc = MODULE_COLORS[modulo] || { bg: '#f1f5f9', text: '#334155', border: '#cbd5e1' };
        return (
          <div key={modulo}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: mc.text, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: mc.text }} /> {modulo}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {perms.map((p) => {
                const tieneActivo = permisosActivos.includes(p.clave);
                const extra = extras.find((e) => e.permiso.clave === p.clave && e.sucursalId === sucursalActivaId);
                const tieneExtraGrant = extra?.tipo === 'grant';
                const isLoading = asignarPermiso.isPending || removerPermiso.isPending;

                return (
                  <div key={p.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '9px 14px', borderRadius: 7,
                    background: tieneActivo ? mc.bg : '#f8fafc',
                    border: `1px solid ${tieneActivo ? mc.border : '#e2e8f0'}`,
                    transition: 'all .15s',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {tieneActivo
                        ? <ShieldCheck size={14} style={{ color: mc.text }} />
                        : <ShieldOff size={14} style={{ color: '#ccc' }} />}
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: tieneActivo ? '#041627' : '#aaa', display: 'flex', alignItems: 'center', gap: 6 }}>
                          {p.nombre}
                          {tieneExtraGrant && (
                            <span style={{ fontSize: 9, padding: '2px 6px', background: '#378ADD', color: '#fff', borderRadius: 4, fontWeight: 800 }}>EXTRA</span>
                          )}
                        </div>
                        <div style={{ fontSize: 10, fontFamily: 'monospace', color: tieneActivo ? mc.text : '#ccc', marginTop: 1 }}>{p.clave}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {!isEditing ? (
                        tieneActivo
                          ? <span style={{ fontSize: 11, fontWeight: 700, color: mc.text, background: mc.bg, border: `1px solid ${mc.border}`, borderRadius: 999, padding: '2px 8px' }}>Habilitado</span>
                          : <span style={{ fontSize: 11, color: '#ccc', fontWeight: 600 }}>Sin acceso</span>
                      ) : (
                        <button
                          onClick={(e) => { e.preventDefault(); handleToggleExtra(p.id, tieneExtraGrant); }}
                          disabled={isLoading}
                          style={{
                            padding: '4px 10px', fontSize: 11, fontWeight: 700, borderRadius: 6,
                            cursor: isLoading ? 'wait' : 'pointer', border: 'none',
                            background: tieneExtraGrant ? '#fee2e2' : '#EAF3DE',
                            color: tieneExtraGrant ? '#991b1b' : '#3B6D11',
                          }}
                        >
                          {tieneExtraGrant ? 'Quitar Extra' : 'Asignar Extra'}
                        </button>
                      )}
                    </div>
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
