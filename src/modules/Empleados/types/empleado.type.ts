export interface IEmpleadoRol {
  id: string;
  nombre: string;
  descripcion?: string | null;
  rutaInicio: string;
  activo?: boolean;
  permisos?: { id: string; clave: string; nombre: string }[];
}

export interface IEmpleadoSucursalAsignada {
  id: string;
  nombre: string;
  esPrincipal: boolean;
  activo: boolean;
}

export interface IEmpleado {
  id: string;
  nombreCompleto: string;
  email: string;
  telefono: string;
  direccion: string;
  cargo: string;
  foto_url: string | null;
  activo: boolean;
  bono_ventas_activo?: boolean;
  meta_mensual_ventas?: number | string;
  bono_mensual_ventas?: number | string;
  ventas_mes_actual?: number | string;
  avance_bono_ventas?: number | string;
  bono_ventas_corresponde?: boolean;
  roles: Array<Pick<IEmpleadoRol, 'id' | 'nombre' | 'rutaInicio'>>;
  permisos: string[];
  permisosExtra?: {
    permiso: { id: string; clave: string; nombre: string; modulo: string };
    tipo: 'grant' | 'revoke';
    sucursalId: string;
  }[];
  sucursales: IEmpleadoSucursalAsignada[];
}

export interface IEmpleadosPaginationResponse {
  data: IEmpleado[];
  total: number;
  page: number;
  lastPage: number;
}

export interface ICreateEmpleadoPayload {
  nombreCompleto: string;
  email: string;
  telefono: string;
  direccion: string;
  cargo: string;
  contrasena: string;
  activo?: boolean;
  foto_url?: string;
  rolesIds?: string[];
  sucursalId?: string;
  sucursalIds?: string[];
  esSucursalPrincipal?: boolean;
  bono_ventas_activo?: boolean;
  meta_mensual_ventas?: number;
  bono_mensual_ventas?: number;
}
