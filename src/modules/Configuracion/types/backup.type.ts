export type FrecuenciaBackup = 'DIARIO' | 'SEMANAL' | 'MANUAL';
export type EstadoBackup = 'EN_PROCESO' | 'EXITOSO' | 'FALLIDO';

export interface IBackupConfig {
  id: string;
  carpeta_drive: string | null;
  frecuencia: FrecuenciaBackup;
  hora_backup: number;
  retener_ultimos: number;
  activo: boolean;
  tiene_credenciales: boolean;
  updated_at: string;
}

export interface IBackupHistorial {
  id: string;
  estado: EstadoBackup;
  nombre_archivo: string | null;
  drive_file_id: string | null;
  drive_link: string | null;
  tamano_bytes: number | null;
  error: string | null;
  origen: 'MANUAL' | 'AUTOMATICO';
  created_at: string;
}

export interface IGuardarConfigBackupPayload {
  client_id?: string;
  client_secret?: string;
  refresh_token?: string;
  carpeta_drive?: string;
  frecuencia?: FrecuenciaBackup;
  hora_backup?: number;
  retener_ultimos?: number;
  activo?: boolean;
}
