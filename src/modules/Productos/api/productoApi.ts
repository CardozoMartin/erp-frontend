import { api } from '../../../api/ApiBase';
import type { ISuccessResponse } from '../../../type/api.response.type';
import type { IImagenLocal, IProducto } from '../types/productos.type';

type ProductoSavePayload = Omit<
  Partial<IProducto>,
  'atributos' | 'categoria_id' | 'codigo_barras' | 'imagenes' | 'lotes' | 'ofertas' | 'stock' | 'variantes'
> & {
  id?: string;
  atributos?: any[];
  categoria_id?: string | null;
  codigo_barras?: string | null;
  imagenes?: any[];
  imagenesLocales?: IImagenLocal[];
  lotes?: any[];
  marca_id?: string | null;
  ofertas?: any[];
  stock?: any[];
  variantes?: any[];
};

export interface IAdjustProductStockPayload {
  productoId: string;
  cantidad: number;
  operacion: 'AUMENTAR' | 'RESTAR';
  sucursal_id?: string | null;
  variante_id?: string | null;
}

const toNumber = (value: unknown, fallback = 0) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
};

const toNullableId = (value: unknown) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const cleanAtributos = (atributos: any[] = []) =>
  atributos
    .map((attr) => ({
      tipo: (attr.tipo ?? attr.nombre ?? '').toString().trim(),
      valor: (attr.valor ?? '').toString().trim(),
    }))
    .filter((attr) => attr.tipo && attr.valor);

const cleanStock = (stock: any[] = []) =>
  stock.map((item) => ({
    sucursal_id: toNullableId(item.sucursal_id),
    cantidad: toNumber(item.cantidad),
    cantidad_minima: toNumber(item.cantidad_minima),
  }));

const cleanLotes = (lotes: any[] = []) =>
  lotes
    .map((lote) => ({
      sucursal_id: toNullableId(lote.sucursal_id),
      numero_lote: lote.numero_lote?.trim?.() || undefined,
      fecha_vencimiento: lote.fecha_vencimiento,
      cantidad: toNumber(lote.cantidad ?? lote.cantidad_total ?? lote.cantidad_disponible),
    }))
    .filter((lote) => lote.fecha_vencimiento);

const cleanImagenes = (imagenes: any[] = []) =>
  imagenes
    .filter((imagen) => imagen?.url)
    .map((imagen) => ({
      rol: imagen.rol,
      url: imagen.url,
      alt_text: imagen.alt_text ?? undefined,
      orden: toNumber(imagen.orden),
      ancho_px: imagen.ancho_px === undefined ? undefined : toNumber(imagen.ancho_px),
      alto_px: imagen.alto_px === undefined ? undefined : toNumber(imagen.alto_px),
    }));

const cleanOfertas = (ofertas: any[] = []) =>
  ofertas
    .map((oferta) => ({
      precio_oferta: toNumber(oferta.precio_oferta ?? oferta.precio),
      fecha_inicio: oferta.fecha_inicio,
      fecha_fin: oferta.fecha_fin,
      activo: oferta.activo ?? true,
    }))
    .filter((oferta) => oferta.fecha_inicio && oferta.fecha_fin);

const cleanVariantes = (variantes: any[] = []) =>
  variantes.map((variante) => ({
    sku: variante.sku?.trim?.() || undefined,
    precio_extra: toNumber(variante.precio_extra),
    activo: variante.activo ?? true,
    atributos: cleanAtributos(variante.atributos),
    stock: cleanStock(variante.stock),
    lotes: cleanLotes(variante.lotes),
    imagenes: cleanImagenes(variante.imagenes),
    ofertas: cleanOfertas(variante.ofertas),
  }));

export const normalizeProductoPayload = (productoData: ProductoSavePayload): ProductoSavePayload => {
  const payload: ProductoSavePayload = {
    ...productoData,
    precio_base:
      productoData.precio_base === undefined ? undefined : toNumber(productoData.precio_base),
    codigo_barras:
      productoData.codigo_barras === undefined
        ? undefined
        : productoData.codigo_barras?.trim?.() || null,
    categoria_id:
      productoData.categoria_id === undefined
        ? undefined
        : (toNullableId(productoData.categoria_id) as any),
    marca_id:
      productoData.marca_id === undefined ? undefined : (toNullableId(productoData.marca_id) as any),
  };

  if (productoData.stock !== undefined) payload.stock = cleanStock(productoData.stock);
  if (productoData.lotes !== undefined) payload.lotes = cleanLotes(productoData.lotes) as any;
  if (productoData.imagenes !== undefined) payload.imagenes = cleanImagenes(productoData.imagenes) as any;
  if (productoData.ofertas !== undefined) payload.ofertas = cleanOfertas(productoData.ofertas) as any;
  if (productoData.atributos !== undefined) payload.atributos = cleanAtributos(productoData.atributos) as any;
  if (productoData.variantes !== undefined) payload.variantes = cleanVariantes(productoData.variantes) as any;

  if (payload.tiene_variantes) {
    payload.stock = [];
    payload.lotes = [];
    payload.ofertas = [];
    payload.imagenes = [];
    payload.atributos = [];
  } else if (payload.tiene_variantes === false) {
    payload.variantes = [];
  }

  return payload;
};

//funcion helper para subir imagenes a Cloudinary
export const subirImagen = async (
  productoId: string,
  imagen: IImagenLocal,
  varianteId?: string
): Promise<void> => {
  const formData = new FormData();
  formData.append('archivo', imagen.file);
  formData.append('producto_id', productoId);
  if (varianteId) formData.append('variante_id', varianteId);
  if (imagen.rol) formData.append('rol', imagen.rol);
  if (imagen.reemplazar_rol) formData.append('reemplazar_rol', 'true');
  if (imagen.reemplazar_imagen_id) formData.append('reemplazar_imagen_id', imagen.reemplazar_imagen_id);
  if (imagen.alt_text) formData.append('alt_text', imagen.alt_text);
  if (imagen.orden !== undefined) formData.append('orden', imagen.orden.toString());

  await api.post('/imagenes', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

const prepararProductoParaGuardar = (
  productoData: ProductoSavePayload
): {
  imagenesLocales?: IImagenLocal[];
  imagenesPorVariante: IImagenLocal[][];
  productoSinImagenes: ProductoSavePayload;
} => {
  const { imagenesLocales, ...restoProducto } = normalizeProductoPayload(productoData);
  const variantes = (restoProducto.variantes ?? []).map((variante: any) => {
    const { imagenesLocales: _imagenesLocales, ...varianteSinLocales } = variante;
    return varianteSinLocales;
  });
  const imagenesPorVariante = (productoData.variantes ?? []).map((variante: any) => {
    const locales = (variante.imagenesLocales ?? []) as IImagenLocal[];
    return locales;
  });
  const productoSinImagenes = { ...restoProducto };
  if (restoProducto.variantes !== undefined) {
    productoSinImagenes.variantes = variantes;
  }

  return { imagenesLocales, imagenesPorVariante, productoSinImagenes };
};

// Funcion para crear un nuevo producto
export const postProductoFn = async (
  productoData: ProductoSavePayload
): Promise<ISuccessResponse<IProducto>> => {
  console.log('Datos recibidos para crear producto:', productoData);
  // Separar imágenes locales del resto del payload
  const { imagenesLocales, imagenesPorVariante, productoSinImagenes } =
    prepararProductoParaGuardar(productoData);

  // 1. Crear el producto (JSON normal)
  const { data } = await api.post<any>('/producto', productoSinImagenes);

  const productoCreado = data.data ?? data;
  const productoId = productoCreado.id;
  if (!productoId) {
    console.error('[ProductoDebug] El backend no devolvio id del producto creado', data);
    throw new Error('El backend no devolvio el id del producto creado');
  }

  // 2. Subir imágenes si las hay (en paralelo)
  if (imagenesLocales && imagenesLocales.length > 0) {
    await Promise.all(
      imagenesLocales.map((img, index) =>
        subirImagen(productoId, { ...img, orden: img.orden ?? index })
      )
    );
  }

  if (imagenesPorVariante.length > 0 && productoCreado.variantes?.length > 0) {
    await Promise.all(
      imagenesPorVariante.flatMap((imagenes, index) => {
        const variante = productoSinImagenes.variantes?.[index] as any;
        const varianteId =
          productoCreado.variantes?.find((item: any) => item.sku && item.sku === variante?.sku)
            ?.id ?? productoCreado.variantes?.[index]?.id;
        if (!varianteId) return [];
        return imagenes.map((img, imgIndex) =>
          subirImagen(productoId, { ...img, orden: img.orden ?? imgIndex }, varianteId)
        );
      })
    );
  }

  return data;
};

//funcion para obtener todos los productos con paginacion
export const getProductosFn = async (page: number = 1, limit: number = 30) => {
  const response = await api.get<ISuccessResponse<IProducto[]>>('/producto', {
    params: {
      page,
      limit,
    },
  });
  console.log('Respuesta del servidor:', response.data);
  return response.data;
};

export const adjustProductStockFn = async ({
  productoId,
  ...payload
}: IAdjustProductStockPayload) => {
  const { data } = await api.patch(`/producto/${productoId}/stock/ajustar`, payload);
  return data;
};

//fundion para editar un producto existente
export const updateProductoFn = async (
  productoData: ProductoSavePayload
): Promise<ISuccessResponse<IProducto>> => {
  const { id } = productoData;
  if (!id) {
    throw new Error('No se puede actualizar un producto sin id');
  }
  console.log(productoData);
  console.log('id del producto a actualizar:', id);
  const { imagenesLocales, imagenesPorVariante, productoSinImagenes } =
    prepararProductoParaGuardar(productoData);
  delete (productoSinImagenes as Partial<IProducto>).id;

  // 1. Actualizar campos del producto
  const { data } = await api.patch(`/producto/${id}`, productoSinImagenes);

  const productoActualizado = data.data ?? data;

  // 2. Subir imágenes nuevas si las hay
  if (imagenesLocales && imagenesLocales.length > 0) {
    await Promise.all(
      imagenesLocales.map((img, index) => subirImagen(id!, { ...img, orden: img.orden ?? index }))
    );
  }

  if (imagenesPorVariante.length > 0 && productoActualizado.variantes?.length > 0) {
    await Promise.all(
      imagenesPorVariante.flatMap((imagenes, index) => {
        const variante = productoSinImagenes.variantes?.[index] as any;
        const varianteId =
          productoActualizado.variantes?.find((item: any) => item.sku && item.sku === variante?.sku)
            ?.id ?? productoActualizado.variantes?.[index]?.id;
        if (!varianteId) return [];
        return imagenes.map((img, imgIndex) =>
          subirImagen(id!, { ...img, orden: img.orden ?? imgIndex }, varianteId)
        );
      })
    );
  }

  if ((imagenesLocales && imagenesLocales.length > 0) || imagenesPorVariante.some((items) => items.length > 0)) {
    const refreshed = await api.get<IProducto>(`/producto/${id}`);
    return refreshed.data as any;
  }

  return data;
};
