
//Categoría de productos
export interface ICategoria {
  id: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  padre_id?: string | null;
  hijos?: ICategoria[];
}

//Atributo de variante (color, talle, etc)
export interface IAtributo {
  id: string;
  variante_id: string;
  tipo: string;
  valor: string;
  metadata?: string;
}

//Imagen de producto o variante
export interface IImagen {
  id: string;
  producto_id: string;
  variante_id?: string | null;
  rol: 'PRINCIPAL' | 'PRINCIPAL_POS' | 'PRINCIPAL_WEB' | 'GALERIA' | 'DETALLE' | 'BANNER' | 'MINIATURA';
  url: string;
  alt_text?: string;
  orden: number;
  ancho_px?: number;
  alto_px?: number;
  created_at: string;
}

//Stock de producto en una sucursal
export interface IStock {
  id: string;
  producto_id: string;
  variante_id?: string | null;
  sucursal_id?: string | null;
  cantidad: number;
  cantidad_minima: number;
  deposito?: string | null;
  pasillo?: string | null;
  estante?: string | null;
  sector?: string | null;
  codigo_ubicacion?: string | null;
  ubicacion_referencia?: string | null;
  created_at: string;
  updated_at: string;
}

//Oferta de descuento
export interface IOferta {
  id: string;
  producto_id: string;
  variante_id?: string | null;
  precio_oferta?: number | null;
  porcentaje_descuento?: number;
  fecha_inicio: string;
  fecha_fin: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

//Lote de producto
export interface ILote {
  id: string;
  producto_id: string;
  variante_id?: string | null;
  sucursal_id?: string | null;
  numero_lote: string;
  fecha_vencimiento?: string;
  cantidad_total: number;
  cantidad_disponible: number;
  created_at: string;
}

//Variante de producto
export interface IVariante {
  id: string;
  producto_id: string;
  sku: string;
  precio_extra?: number;
  activo: boolean;
  atributos?: IAtributo[];
  stock?: IStock[];
  imagenes?: IImagen[];
  ofertas?: IOferta[];
  lotes?: ILote[];
  created_at: string;
  updated_at: string;
}

//Producto principal
export interface IProducto {
  id?: string;
  nombre: string;
  codigo_barras: string;
  descripcion: string;
  precio_base: number;
  precio_costo?: number;
  precio_venta?: number;
  margen_ganancia?: number;
  unidad_venta: 'UNIDAD' | 'KILOGRAMO' | 'LITRO' | 'METRO';
  activo: boolean;
  activo_pos: boolean;
  activo_web: boolean;
  tiene_variantes: boolean;
  tiene_vencimiento: boolean;
  es_fraccionable: boolean;
  categoria_id: string;
  categoria?: ICategoria;
  imagenes?: IImagen[];
  variantes?: IVariante[];
  atributos?: IAtributo[];
  stock?: IStock[];
  ofertas?: IOferta[];
  lotes?: ILote[];
  todas_sucursales?: boolean;
  sucursales_habilitadas_ids?: string[];
  sucursales_disponibles_ids?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface IImagenLocal {
  file: File;
  preview: string;
  alt_text?: string;
  orden?: number;
  rol?: IImagen['rol'];
  reemplazar_rol?: boolean;
  reemplazar_imagen_id?: string;
}


