import { api } from '../../../api/ApiBase';
import type {
  IArcaResumen,
  ICambiarAmbientePayload,
  IGuardarArcaPayload,
  ITestArcaRespuesta,
} from '../types/arca.type';

const unwrap = <T>(res: { data: { data?: T; ok?: boolean } | T }): T => {
  const d = res.data as any;
  return d?.data !== undefined ? d.data : d;
};

export const getArcaResumenFn = async (sucursalId: string): Promise<IArcaResumen> =>
  unwrap(await api.get(`/arca/resumen/${sucursalId}`));

export const guardarArcaCredencialesFn = async (
  payload: IGuardarArcaPayload,
): Promise<{ ok: boolean; id: string }> =>
  unwrap(await api.post('/arca/credenciales', payload));

export const probarArcaConexionFn = async (
  sucursalId: string,
): Promise<ITestArcaRespuesta> =>
  unwrap(await api.post('/arca/test', { sucursalId }));

export const cambiarArcaAmbienteFn = async (
  payload: ICambiarAmbientePayload,
): Promise<{ ok: boolean }> =>
  unwrap(await api.patch('/arca/ambiente', payload));
