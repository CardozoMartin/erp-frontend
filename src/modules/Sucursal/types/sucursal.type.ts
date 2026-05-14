export interface ISucursal {
  id: string;
  empresa_id: string;
  nombre: string;
  direccion?: string | null;
  telefono?: string | null;
  activa: boolean;
  creado_en: string;
}
