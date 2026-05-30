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
  roles: Array<Pick<IEmpleadoRol, 'id' | 'nombre' | 'rutaInicio'>>;
  permisos: string[];
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
  foto_url?: string;
  rolesIds?: string[];
  sucursalId?: string;
  sucursalIds?: string[];
  esSucursalPrincipal?: boolean;
}
