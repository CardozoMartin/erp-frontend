export type RoleColorKey = 'green' | 'amber' | 'purple' | 'blue' | 'gray';

export const ROL_COLORS: Record<RoleColorKey, { bg: string; text: string; border: string; dot: string }> = {
  green:  { bg: '#EAF3DE', text: '#3B6D11', border: '#C0DD97', dot: '#639922' },
  amber:  { bg: '#FAEEDA', text: '#854F0B', border: '#FAC775', dot: '#BA7517' },
  purple: { bg: '#EEEDFE', text: '#534AB7', border: '#CECBF6', dot: '#7F77DD' },
  blue:   { bg: '#E6F1FB', text: '#185FA5', border: '#B5D4F4', dot: '#378ADD' },
  gray:   { bg: '#F1EFE8', text: '#5F5E5A', border: '#D3D1C7', dot: '#888780' },
};

export const MODULE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  VENTAS:    { bg: '#EAF3DE', text: '#3B6D11', border: '#C0DD97' },
  CAJA:      { bg: '#FAEEDA', text: '#854F0B', border: '#FAC775' },
  PRODUCTOS: { bg: '#EEEDFE', text: '#534AB7', border: '#CECBF6' },
  CLIENTES:  { bg: '#E6F1FB', text: '#185FA5', border: '#B5D4F4' },
  REPORTES:  { bg: '#F1EFE8', text: '#5F5E5A', border: '#D3D1C7' },
};

export function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('es-AR', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export const empleadoHistoryLabels: Record<string, string> = {
  LOGIN:                             'Inicio sesion',
  LOGOUT:                            'Cerro sesion',
  CREAR_EMPLEADO:                    'Creo el empleado',
  ACTUALIZAR_EMPLEADO:               'Actualizo la ficha',
  ACTUALIZAR_ROLES_EMPLEADO:         'Actualizo roles',
  ASIGNAR_SUCURSAL_EMPLEADO:         'Asigno sucursal',
  QUITAR_SUCURSAL_EMPLEADO:          'Quito sucursal',
  CAMBIAR_SUCURSAL_PRINCIPAL_EMPLEADO: 'Cambio sucursal principal',
};

const empleadoFieldLabels: Record<string, string> = {
  nombreCompleto: 'Nombre',
  email:          'Email',
  telefono:       'Telefono',
  direccion:      'Direccion',
  cargo:          'Cargo',
  activo:         'Activo',
  roles:          'Roles',
  permisos:       'Permisos',
  sucursales:     'Sucursales',
};

const formatAuditValue = (value: unknown) => {
  if (value === null || value === undefined || value === '') return 'vacio';
  if (typeof value === 'boolean') return value ? 'Si' : 'No';
  if (Array.isArray(value)) return `${value.length} item(s)`;
  if (typeof value === 'object') return 'datos actualizados';
  return String(value);
};

export const empleadoChanges = (
  before?: Record<string, unknown> | null,
  after?: Record<string, unknown> | null,
) => {
  if (!before && after) return ['Alta inicial del empleado'];
  if (!before || !after) return [];
  return Object.keys(empleadoFieldLabels)
    .filter((key) => JSON.stringify(before[key] ?? null) !== JSON.stringify(after[key] ?? null))
    .map((key) => `${empleadoFieldLabels[key]}: ${formatAuditValue(before[key])} -> ${formatAuditValue(after[key])}`);
};
