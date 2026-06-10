export interface ICaja {
  id: string;
  estado: 'ABIERTA' | 'CERRADA';
  empleado_id: string;
  monto_inicial: number | string;
  monto_final_declarado?: number | string | null;
  monto_final_calculado?: number | string | null;
  diferencia?: number | string | null;
  fecha_apertura: string;
  fecha_cierre?: string | null;
  movimientos?: {
    id: string;
    tipo: string;
    monto: number | string;
    categoria_egreso?: string | null;
    entidad_nombre?: string | null;
    descripcion?: string | null;
    fecha: string;
  }[];
}

export interface IResumenCaja {
  caja: ICaja;
  totales: {
    apertura: number;
    cobros: number;
    ingresos_manuales: number;
    egresos: number;
    ajustes: number;
    calculado: number;
    declarado?: number | string | null;
    diferencia?: number | string | null;
  };
  cobros_por_medio: {
    medio_pago_id?: string | null;
    medio: string;
    total: number;
    cantidad: number;
  }[];
}

export type CajaQuery = {
  desde?: string;
  hasta?: string;
  estado?: 'ABIERTA' | 'CERRADA';
};

export interface IAuditoriaCaja {
  id: string;
  modulo: string;
  accion: string;
  entidad?: string | null;
  entidad_id?: string | null;
  empleado_id?: string | null;
  sucursal_id?: string | null;
  descripcion?: string | null;
  antes?: Record<string, unknown> | null;
  despues?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
}

export interface IAuditoriaCajaPagination {
  data: IAuditoriaCaja[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type AuditoriaCajaQuery = {
  page?: number;
  limit?: number;
  desde?: string;
  hasta?: string;
  modulo?: string;
  accion?: string;
  empleado_id?: string;
  entidad?: string;
  entidad_id?: string;
  q?: string;
};
