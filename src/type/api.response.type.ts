
export interface ISuccessResponse<T> {
  ok: true;
  mensaje: string;
  datos: T;
}

export interface IErrorResponse {
  ok: false;
  mensaje: string;
  errores?: string[];
}
