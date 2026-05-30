export interface ISuccessResponse<T> {
  ok: true;
  mensaje: string;
  data: T;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface IErrorResponse {
  ok: false;
  mensaje: string;
  errores?: string[];
  message?: string;
}
