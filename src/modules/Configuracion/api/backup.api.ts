import { api } from '../../../api/ApiBase';
import type { IBackupConfig, IBackupHistorial, IGuardarConfigBackupPayload } from '../types/backup.type';

const unwrap = <T>(res: { data: { data?: T; ok?: boolean } | T }): T => {
  const d = res.data as any;
  return d?.data !== undefined ? d.data : d;
};

export const getBackupConfigFn = async (): Promise<IBackupConfig> =>
  unwrap(await api.get('/backup/config'));

export const guardarBackupConfigFn = async (payload: IGuardarConfigBackupPayload): Promise<void> =>
  unwrap(await api.post('/backup/config', payload));

export const probarBackupConexionFn = async (): Promise<{ ok: boolean; email?: string; mensaje: string }> =>
  unwrap(await api.post('/backup/probar'));

export const ejecutarBackupFn = async (): Promise<IBackupHistorial> =>
  unwrap(await api.post('/backup/ejecutar'));

export const getBackupHistorialFn = async (limit = 20): Promise<IBackupHistorial[]> =>
  unwrap(await api.get('/backup/historial', { params: { limit } }));
