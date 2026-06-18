export type TipoCliente =
  | 'CONSUMIDOR_FINAL'
  | 'RESPONSABLE_INSCRIPTO'
  | 'MONOTRIBUTISTA'
  | 'EXENTO';

export type TipoVencimientoCuenta = 'DIA_FIJO' | 'DIAS_DESDE_COMPRA';

export interface IPlanPagoCliente {
  id?: string;
  tipo_vencimiento: TipoVencimientoCuenta;
  valor_vencimiento: number | string;
  recargo_porcentaje_diario?: number | string;
  recargo_activo?: boolean;
}

export interface ICuentaCorrienteCliente {
  id?: string;
  saldo: number | string;
  limite_credito: number | string;
  activa: boolean;
  planPago?: IPlanPagoCliente | null;
}

export interface ICliente {
  id: string;
  nombre: string;
  apellido?: string | null;
  razon_social?: string | null;
  tipo: TipoCliente;
  cuit?: string | null;
  dni?: string | null;
  email?: string | null;
  telefono?: string | null;
  direccion?: string | null;
  altura?: string | null;
  barrio?: string | null;
  localidad?: string | null;
  codigo_postal?: string | null;
  referencia_entrega?: string | null;
  activo: boolean;
  bloqueado: boolean;
  razon_bloqueo?: string | null;
  accion_legal: boolean;
  cuentaCorriente?: ICuentaCorrienteCliente | null;
  created_at?: string;
  updated_at?: string;
}

export interface IClientePayload {
  nombre: string;
  apellido?: string | null;
  razon_social?: string | null;
  tipo?: TipoCliente;
  cuit?: string | null;
  dni?: string | null;
  email?: string | null;
  telefono?: string | null;
  direccion?: string | null;
  altura?: string | null;
  barrio?: string | null;
  localidad?: string | null;
  codigo_postal?: string | null;
  referencia_entrega?: string | null;
  cuentaCorriente?: {
    limite_credito?: number;
    planPago?: {
      tipo_vencimiento: TipoVencimientoCuenta;
      valor_vencimiento: number;
      recargo_porcentaje_diario?: number;
      recargo_activo?: boolean;
    };
  };
}
