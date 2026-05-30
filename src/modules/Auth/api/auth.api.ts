// modules/Auth/api/auth.api.ts
import { api } from '../../../api/ApiBase';
import type { LoginResponse } from '../../../type/auth.types';


export const postLoginFn = async (data: {
  email: string;
  password: string;
}): Promise<LoginResponse> => {
  const res = await api.post<LoginResponse>('/auth/login', data);
  return res.data;
};
