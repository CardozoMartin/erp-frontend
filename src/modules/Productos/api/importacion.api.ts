import { api } from '../../../api/ApiBase';

export interface ResultadoImportacion {
  total: number;
  creados: number;
  errores: { fila: number; nombre: string; motivo: string }[];
}

export const descargarPlantillaFn = async (): Promise<void> => {
  const response = await api.get('/producto/importar/plantilla', { responseType: 'blob' });
  const blob = new Blob([response.data as BlobPart], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'plantilla-importacion-productos.xlsx';
  a.click();
  URL.revokeObjectURL(url);
};

export const importarProductosFn = async (archivo: File): Promise<ResultadoImportacion> => {
  const formData = new FormData();
  formData.append('archivo', archivo);
  const { data } = await api.post<{ data: ResultadoImportacion }>('/producto/importar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
};
