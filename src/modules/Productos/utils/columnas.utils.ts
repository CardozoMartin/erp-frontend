export type ProductoColumnaKey =
  | 'imagen'
  | 'producto'
  | 'codigo'
  | 'categoria'
  | 'stock'
  | 'costo'
  | 'venta'
  | 'margen'
  | 'vencimiento';

export interface DefinicionColumna {
  key: ProductoColumnaKey;
  label: string;
  align: 'text-left' | 'text-center' | 'text-right';
  defaultVisible: boolean;
  sensitive?: boolean;
  permisoRequerido?: string;
}

export const COLUMNAS_PRODUCTOS: DefinicionColumna[] = [
  { key: 'imagen', label: 'Imagen', align: 'text-left', defaultVisible: true },
  { key: 'producto', label: 'Producto', align: 'text-left', defaultVisible: true },
  { key: 'codigo', label: 'Codigo', align: 'text-left', defaultVisible: true },
  { key: 'categoria', label: 'Categoria', align: 'text-left', defaultVisible: true },
  { key: 'stock', label: 'Stock', align: 'text-center', defaultVisible: true },
  {
    key: 'costo',
    label: 'Costo',
    align: 'text-right',
    defaultVisible: false,
    sensitive: true,
    permisoRequerido: 'productos.ver_costos',
  },
  { key: 'venta', label: 'Venta', align: 'text-right', defaultVisible: false },
  {
    key: 'margen',
    label: 'Margen',
    align: 'text-right',
    defaultVisible: false,
    sensitive: true,
    permisoRequerido: 'productos.ver_margenes',
  },
  { key: 'vencimiento', label: 'Vencimiento', align: 'text-center', defaultVisible: false },
];

export const COLUMNAS_DEFAULT = COLUMNAS_PRODUCTOS
  .filter((c) => c.defaultVisible)
  .map((c) => c.key);

const STORAGE_KEY = 'erp:productos:tabla:columnas:v1';

export const leerColumnasGuardadas = (disponibles: DefinicionColumna[]): ProductoColumnaKey[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return COLUMNAS_DEFAULT;
    const parsed: ProductoColumnaKey[] = JSON.parse(stored);
    return normalizarColumnas(parsed, disponibles);
  } catch {
    return COLUMNAS_DEFAULT;
  }
};

export const guardarColumnasEnStorage = (columnas: ProductoColumnaKey[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(columnas));
};

export const normalizarColumnas = (
  columnas: ProductoColumnaKey[],
  disponibles = COLUMNAS_PRODUCTOS
): ProductoColumnaKey[] => {
  const keysValidas = new Set(disponibles.map((c) => c.key));
  const resultado = disponibles
    .map((c) => c.key)
    .filter((key) => columnas.includes(key) && keysValidas.has(key));

  return resultado.length > 0
    ? resultado
    : disponibles.filter((c) => c.defaultVisible).map((c) => c.key);
};

export const columnasDisponibles = (permisos: string[]): DefinicionColumna[] =>
  COLUMNAS_PRODUCTOS.filter((c) => !c.permisoRequerido || permisos.includes(c.permisoRequerido));

export const puedeConfigurarColumnas = (permisos: string[]): boolean =>
  permisos.some(
    (p) =>
      p === 'productos.configurar_columnas' ||
      p === 'productos.editar' ||
      p.startsWith('roles.') ||
      p.startsWith('permisos.') ||
      p.startsWith('config.')
  );
