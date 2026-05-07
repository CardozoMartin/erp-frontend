import type { AxiosError } from "axios";
import type { IErrorResponse } from "../type/api.response.type";

export const getErrorMessage = (error: AxiosError<IErrorResponse>): string => {
  const data = error.response?.data;
  return data?.errores?.join(' · ') ?? data?.mensaje ?? 'Error inesperado';
};
