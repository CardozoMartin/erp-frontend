export interface IComprobanteAux {
  id: string;
  tipo: string;
  estado: string;
  numero: string;
  total: number | string;
  subtotal?: number | string;
  descuento_total?: number | string;
  recargo_total?: number | string;
  observaciones?: string | null;
  comprobante_origen_id?: string | null;
  cliente_id?: string | null;
  caja_id?: string | null;
  created_at: string;
  fecha_vencimiento?: string | null;
  items?: {
    id: string;
    descripcion: string;
    cantidad: number | string;
    precio_unitario: number | string;
    subtotal: number | string;
    producto_id?: string | null;
    variante_id?: string | null;
    comprobante_item_origen_id?: string | null;
  }[];
}

export interface IVentasPosPaginationAux {
  data: IComprobanteAux[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface IVentaGeneralAux {
  comprobante: IComprobanteAux & {
    lista_precio_id?: string | null;
    empleado_vendedor_id?: string | null;
    empleado_cajero_id?: string | null;
  };
  vendedor: { id: string; nombreCompleto: string; email: string } | null;
  cajero: { id: string; nombreCompleto: string; email: string } | null;
  listaPrecio: {
    id: string;
    nombre: string;
    modo_iva?: 'NO_APLICA' | 'IVA_INCLUIDO' | 'AGREGAR_IVA';
    porcentaje_iva?: number | string;
    tipo_ajuste?: string;
    porcentaje?: number | string;
  } | null;
  pagos: {
    id: string;
    tipo: string;
    monto: number | string;
    recargo_monto?: number | string;
    referencia?: string | null;
    medioPago?: { id: string; nombre: string } | null;
    created_at: string;
  }[];
  fiscales: IComprobanteAux[];
  notasCredito: IComprobanteAux[];
  margen: {
    costo_total: number;
    ganancia_total: number;
    margen_porcentaje: number;
    iva_estimado: number;
  };
}

export interface ICajaAux {
  id: string;
  estado: 'ABIERTA' | 'CERRADA';
  empleado_id: string;
  monto_inicial: number | string;
  monto_final_declarado?: number | string | null;
  monto_final_calculado?: number | string | null;
  diferencia?: number | string | null;
  fecha_apertura: string;
  fecha_cierre?: string | null;
  movimientos?: {
    id: string;
    tipo: string;
    monto: number | string;
    categoria_egreso?: string | null;
    entidad_nombre?: string | null;
    descripcion?: string | null;
    fecha: string;
  }[];
}

export interface IResumenCajaAux {
  caja: ICajaAux;
  totales: {
    apertura: number;
    cobros: number;
    ingresos_manuales: number;
    egresos: number;
    ajustes: number;
    calculado: number;
    declarado?: number | string | null;
    diferencia?: number | string | null;
  };
  cobros_por_medio: {
    medio_pago_id?: string | null;
    medio: string;
    total: number;
    cantidad: number;
  }[];
}

export interface IDespachoAux {
  id: string;
  estado: string;
  comprobante_id: string;
  remito_id?: string | null;
  observaciones?: string | null;
  fecha_despacho?: string | null;
  created_at: string;
  comprobante?: IComprobanteAux;
  remito?: IComprobanteAux | null;
  items: {
    id: string;
    descripcion: string;
    cantidad_solicitada: number | string;
    cantidad_despachada: number | string;
    cantidad_pendiente: number | string;
    motivo_pendiente?: string | null;
  }[];
}

export interface IReporteResumen {
  periodo: { desde: string; hasta: string };
  ventas: { cantidad: number; subtotal: number; descuentos: number; recargos: number; total: number };
  cobros: { total: number };
  rentabilidad: {
    costo_estimado: number;
    ganancia_estimada: number;
    margen_porcentaje: number;
    reposicion_estimada: number;
  };
  notas_credito: { cantidad: number; total: number };
  stock: { unidades_salidas: number };
}

export interface IReporteProducto {
  producto_id: string;
  producto: string;
  cantidad: number;
  total: number;
  costo: number;
  margen: number;
  margen_porcentaje: number;
}

export interface IReporteCaja {
  caja_id: string;
  estado: string;
  empleado: string;
  fecha_apertura: string;
  fecha_cierre?: string | null;
  monto_inicial: number;
  ventas: number;
  total_vendido: number;
  costo_vendido: number;
  ganancia_estimada: number;
  margen_porcentaje: number;
  reposicion_estimada: number;
  unidades_vendidas: number;
  stock_salidas: number;
  cobros: number;
  ingresos_manuales: number;
  egresos: number;
  ajustes: number;
  dinero_esperado: number;
  notas_credito: number;
  total_notas_credito: number;
  monto_final_declarado?: number | null;
  monto_final_calculado?: number | null;
  diferencia?: number | null;
}

export interface IAuditoriaEventoAux {
  id: string;
  modulo: string;
  accion: string;
  entidad?: string | null;
  entidad_id?: string | null;
  empleado_id?: string | null;
  sucursal_id?: string | null;
  descripcion?: string | null;
  antes?: Record<string, unknown> | null;
  despues?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
}

export interface IAuditoriaPaginationAux {
  data: IAuditoriaEventoAux[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type TipoMovimientoCuentaCorriente =
  | 'CARGO'
  | 'PAGO'
  | 'NOTA_CREDITO'
  | 'RECARGO_INTERES'
  | 'AJUSTE';

export interface IMovimientoCuentaCorrienteAux {
  id: string;
  cuenta_corriente_id: string;
  tipo: TipoMovimientoCuentaCorriente;
  monto: number | string;
  descripcion?: string | null;
  comprobante_id?: string | null;
  comprobante?: IComprobanteAux | null;
  movimiento_origen_id?: string | null;
  fecha_vencimiento?: string | null;
  recargo_generado_hasta?: string | null;
  omitido: boolean;
  omitido_por?: string | null;
  fecha: string;
}

export interface IRecargosCuentaCorrienteAux {
  total: number;
  movimientos: IMovimientoCuentaCorrienteAux[];
}

export type ModoPosSucursal =
  | 'SIMPLE'
  | 'MULTICAJA'
  | 'CAJA_CENTRALIZADA'
  | 'CON_DESPACHO';

export type DescuentoStockSucursal = 'AL_COBRAR' | 'AL_DESPACHAR';
export type FormatoImpresionComprobante = 'TICKET_80MM' | 'TICKET_58MM' | 'BOLETA_A4';
export type DisenoComprobante = 'BASICO' | 'WAVE' | 'CLASICO';

export interface IConfiguracionPosSucursal {
  id: string;
  sucursal_id: string;
  cotizacion_vigencia_horas: number;
  modo_pos: ModoPosSucursal;
  descuento_stock: DescuentoStockSucursal;
  permitir_pago_mixto: boolean;
  permitir_listas_precio: boolean;
  permitir_cotizaciones: boolean;
  prefijo_ticket: string;
  prefijo_cotizacion: string;
  prefijo_remito: string;
  prefijo_nota_credito: string;
  punto_venta_arca?: string | null;
  permitir_cuenta_corriente: boolean;
  formato_impresion_comprobante: FormatoImpresionComprobante;
  imprimir_automaticamente: boolean;
  diseno_comprobante: DisenoComprobante;
  nombre_fantasia_ticket?: string | null;
  razon_social_ticket?: string | null;
  cuit_ticket?: string | null;
  ingresos_brutos_ticket?: string | null;
  inicio_actividades_ticket?: string | null;
  domicilio_ticket?: string | null;
  telefono_ticket?: string | null;
  email_ticket?: string | null;
  web_ticket?: string | null;
  mensaje_ticket?: string | null;
  mensaje_boleta?: string | null;
  mostrar_detalle_productos: boolean;
  mostrar_descuentos: boolean;
  mostrar_recargos: boolean;
  mostrar_observaciones: boolean;
  mostrar_datos_fiscales: boolean;
  updated_at?: string;
}

export type ConfiguracionPosPayload = Omit<
  IConfiguracionPosSucursal,
  'id' | 'updated_at'
>;

export type ProveedorEmail = 'GMAIL' | 'SMTP';
export type SeguridadEmail = 'SSL' | 'STARTTLS' | 'NINGUNA';

export interface IConfiguracionEmailSucursal {
  id: string;
  sucursal_id: string;
  activo: boolean;
  proveedor: ProveedorEmail;
  email_remitente: string;
  nombre_remitente?: string | null;
  usuario: string;
  smtp_host: string;
  smtp_port: number;
  seguridad: SeguridadEmail;
  email_respuesta?: string | null;
  enviar_facturas_email: boolean;
  enviar_facturas_automaticamente: boolean;
  adjuntar_pdf: boolean;
  copia_oculta_admin: boolean;
  email_copia_admin?: string | null;
  ultimo_test_at?: string | null;
  updated_at?: string;
  password_configurado: boolean;
}

export type ConfiguracionEmailPayload = Omit<
  IConfiguracionEmailSucursal,
  'id' | 'updated_at' | 'ultimo_test_at' | 'password_configurado'
> & {
  password?: string;
};

export interface IConfiguracionCloudinarySucursal {
  id: string;
  sucursal_id: string;
  activo: boolean;
  cloud_name: string;
  api_key: string;
  carpeta_base?: string | null;
  ultimo_test_at?: string | null;
  updated_at?: string;
  api_secret_configurado: boolean;
  disponible: boolean;
  fuente: 'SUCURSAL' | 'ENV';
}

export type ConfiguracionCloudinaryPayload = {
  sucursal_id: string;
  cloud_name: string;
  api_key: string;
  api_secret?: string;
  carpeta_base?: string | null;
};
