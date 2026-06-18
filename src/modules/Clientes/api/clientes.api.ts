import { api } from '../../../api/ApiBase';
import type { ICliente, IClientePayload } from '../types/cliente.type';

export const getClientesFn = async () => {
  const { data } = await api.get<ICliente[]>('/clientes');
  return data;
};

export const createClienteFn = async (payload: IClientePayload) => {
  const { data } = await api.post<ICliente>('/clientes', payload);
  return data;
};

export const updateClienteFn = async (payload: { id: string; data: Partial<IClientePayload> }) => {
  const response = await api.patch<ICliente>(`/clientes/${payload.id}`, payload.data);
  return response.data;
};

export const toggleActivoClienteFn = async (id: string): Promise<ICliente> => {
  const { data } = await api.patch<ICliente>(`/clientes/${id}/toggle-activo`);
  return data;
};

export const toggleCuentaCorrienteFn = async (id: string) => {
  const { data } = await api.patch(`/clientes/${id}/cuenta-corriente/toggle`);
  return data;
};

export const setBloqueoClienteFn = async (payload: {
  id: string;
  bloqueado: boolean;
  razon?: string;
}): Promise<ICliente> => {
  const { data } = await api.patch<ICliente>(`/clientes/${payload.id}/bloqueo`, {
    bloqueado: payload.bloqueado,
    razon: payload.razon,
  });
  return data;
};

export const setAccionLegalClienteFn = async (payload: {
  id: string;
  accion_legal: boolean;
}): Promise<ICliente> => {
  const { data } = await api.patch<ICliente>(`/clientes/${payload.id}/accion-legal`, {
    accion_legal: payload.accion_legal,
  });
  return data;
};
