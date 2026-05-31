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
