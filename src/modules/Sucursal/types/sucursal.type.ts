export interface ISucursal {
  id: string;
  empresa_id: string;
  nombre: string;
  nombreFantasia?: string | null;
  direccion?: string | null;
  localidad?: string | null;
  provincia?: string | null;
  codigoPostal?: string | null;
  telefono?: string | null;
  email?: string | null;
  cuit?: string | null;
  razonSocial?: string | null;
  condicionIva?: 'RESPONSABLE_INSCRIPTO' | 'MONOTRIBUTISTA' | 'EXENTO' | 'CONSUMIDOR_FINAL' | null;
  puntoVentaArca?: string | null;
  ingresosBrutos?: string | null;
  inicioActividades?: string | null;
  logoUrl?: string | null;
  mensajePieTicket?: string | null;
  emailComprobantes?: string | null;
  tipoImpresora?: 'TERMICA' | 'FISCAL_HASAR' | 'FISCAL_EPSON' | 'PDF';
  anchoTicket?: '58mm' | '80mm';
  activa: boolean;
  creado_en: string;
}
