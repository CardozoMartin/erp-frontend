export type ArcaAmbiente = 'testing' | 'produccion';
export type ArcaEstado = 'pendiente' | 'activo' | 'error';

/** Resumen de configuracion ARCA — nunca incluye certificado ni clave privada */
export interface IArcaResumen {
  configurado: boolean;
  id?: string;
  sucursalId?: string;
  cuit?: string;
  puntoVenta?: string;
  ambiente?: ArcaAmbiente;
  estado?: ArcaEstado;
  ticketVigente?: boolean;
  ultimoTest?: string | null;
  ultimoError?: string | null;
  updatedAt?: string;
}

export interface IGuardarArcaPayload {
  sucursalId: string;
  /** Formato XX-XXXXXXXX-X */
  cuit: string;
  /** 1 a 4 digitos */
  puntoVenta: string;
  /** Contenido del .crt en texto plano */
  certificado: string;
  /** Contenido del .key en texto plano */
  clavePrivada: string;
  ambiente?: ArcaAmbiente;
}

export interface ICambiarAmbientePayload {
  sucursalId: string;
  ambiente: ArcaAmbiente;
}

export interface ITestArcaRespuesta {
  ok: boolean;
  mensaje: string;
}
