import { api } from '../../../api/ApiBase';
import type { ISuccessResponse } from '../../../type/api.response.type';
import type { IImagenLocal, IProducto } from '../types/productos.type';
import {
  cleanAtributos,
  cleanImagenes,
  cleanLotes,
  cleanOfertas,
  cleanStock,
  cleanVariantes,
  toNullableId,
  toNumber,
} from '../utils/producto.utils';

export type ProductoSavePayload = Omit<
  Partial<IProducto>,
  'alicuota_iva' | 'atributos' | 'categoria_id' | 'codigo_barras' | 'imagenes' | 'lotes' | 'ofertas' | 'stock' | 'variantes'
> & {
  id?: string;
  /** El form la maneja como string; normalizeProductoPayload la convierte a numero */
  alicuota_iva?: number | string;
  atributos?: { tipo?: string; nombre?: string; valor?: string }[];
  categoria_id?: string | null;
  codigo_barras?: string | null;
  imagenes?: { url?: string; rol?: string; alt_text?: string; orden?: unknown }[];
  imagenesLocales?: IImagenLocal[];
  lotes?: { sucursal_id?: unknown; numero_lote?: string; fecha_vencimiento?: string; cantidad?: unknown }[];
  marca_id?: string | null;
  ofertas?: { precio_oferta?: unknown; fecha_inicio?: string; fecha_fin?: string; activo?: boolean }[];
  stock?: { sucursal_id?: unknown; cantidad?: unknown; cantidad_minima?: unknown }[];
  todas_sucursales?: boolean;
  sucursales_habilitadas_ids?: string[];
  sucursales_disponibles_ids?: string[];
  variantes?: {
    sku?: string;
    precio_extra?: unknown;
    activo?: boolean;
    imagenesLocales?: IImagenLocal[];
    [key: string]: unknown;
  }[];
};

export interface IAdjustProductStockPayload {
  productoId: string;
  cantidad: number;
  operacion: 'AUMENTAR' | 'RESTAR';
  sucursal_id?: string | null;
  variante_id?: string | null;
}

export const normalizeProductoPayload = (productoData: ProductoSavePayload): ProductoSavePayload => {
  const payload: ProductoSavePayload = {
    ...productoData,
    precio_costo: productoData.precio_costo === undefined ? undefined : toNumber(productoData.precio_costo),
    precio_venta: productoData.precio_venta === undefined ? undefined : toNumber(productoData.precio_venta),
    precio_base:
      productoData.precio_venta === undefined
        ? productoData.precio_base === undefined
          ? undefined
          : toNumber(productoData.precio_base)
        : toNumber(productoData.precio_venta),
    // El <select> entrega string; el backend valida contra 21 | 10.5 | 0 numericos
    alicuota_iva:
      productoData.alicuota_iva === undefined
        ? undefined
        : toNumber(productoData.alicuota_iva),
    codigo_barras:
      productoData.codigo_barras === undefined
        ? undefined
        : productoData.codigo_barras?.trim?.() || null,
    categoria_id:
      productoData.categoria_id === undefined
        ? undefined
        : (toNullableId(productoData.categoria_id) as string | null | undefined),
    marca_id:
      productoData.marca_id === undefined
        ? undefined
        : (toNullableId(productoData.marca_id) as string | null | undefined),
  };

  if (productoData.stock !== undefined) payload.stock = cleanStock(productoData.stock as Parameters<typeof cleanStock>[0]);
  if (productoData.lotes !== undefined) payload.lotes = cleanLotes(productoData.lotes as Parameters<typeof cleanLotes>[0]) as typeof payload.lotes;
  if (productoData.imagenes !== undefined) payload.imagenes = cleanImagenes(productoData.imagenes as Parameters<typeof cleanImagenes>[0]) as typeof payload.imagenes;
  if (productoData.ofertas !== undefined) payload.ofertas = cleanOfertas(productoData.ofertas as Parameters<typeof cleanOfertas>[0]) as typeof payload.ofertas;
  if (productoData.atributos !== undefined) payload.atributos = cleanAtributos(productoData.atributos);
  if (productoData.variantes !== undefined) payload.variantes = cleanVariantes(productoData.variantes as Parameters<typeof cleanVariantes>[0]) as typeof payload.variantes;

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

// Sube una imagen a Cloudinary via el endpoint de imágenes del backend
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

  await api.post('/imagenes', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
};

const prepararParaGuardar = (productoData: ProductoSavePayload) => {
  const { imagenesLocales, ...restoProducto } = normalizeProductoPayload(productoData);
  delete restoProducto.sucursales_disponibles_ids;

  const variantes = (restoProducto.variantes ?? []).map((variante) => {
    const { imagenesLocales: _locales, ...varianteSinLocales } = variante as typeof variante & { imagenesLocales?: IImagenLocal[] };
    return varianteSinLocales;
  });

  const imagenesPorVariante = (productoData.variantes ?? []).map((variante) =>
    ((variante as { imagenesLocales?: IImagenLocal[] }).imagenesLocales ?? [])
  );

  const productoSinImagenes = { ...restoProducto };
  if (restoProducto.variantes !== undefined) productoSinImagenes.variantes = variantes;

  return { imagenesLocales, imagenesPorVariante, productoSinImagenes };
};

const subirImagenesDeVariantes = async (
  productoId: string,
  imagenesPorVariante: IImagenLocal[][],
  variantesCreadas: { id?: string; sku?: string }[],
  variantesOriginales: { sku?: string }[]
) => {
  await Promise.all(
    imagenesPorVariante.flatMap((imagenes, index) => {
      const skuOriginal = variantesOriginales[index]?.sku;
      const varianteId =
        variantesCreadas.find((v) => v.sku && v.sku === skuOriginal)?.id ??
        variantesCreadas[index]?.id;
      if (!varianteId) return [];
      return imagenes.map((img, i) => subirImagen(productoId, { ...img, orden: img.orden ?? i }, varianteId));
    })
  );
};

export const postProductoFn = async (
  productoData: ProductoSavePayload
): Promise<ISuccessResponse<IProducto>> => {
  const { imagenesLocales, imagenesPorVariante, productoSinImagenes } = prepararParaGuardar(productoData);

  const { data } = await api.post<ISuccessResponse<IProducto>>('/producto', productoSinImagenes);
  const productoCreado = (data.data ?? data) as IProducto & { id: string };

  if (!productoCreado.id) throw new Error('El backend no devolvio el id del producto creado');

  if (imagenesLocales?.length) {
    await Promise.all(
      imagenesLocales.map((img, i) => subirImagen(productoCreado.id, { ...img, orden: img.orden ?? i }))
    );
  }

  if (imagenesPorVariante.length && productoCreado.variantes?.length) {
    await subirImagenesDeVariantes(
      productoCreado.id,
      imagenesPorVariante,
      productoCreado.variantes,
      productoData.variantes ?? []
    );
  }

  return data;
};

export const getProductosFn = async (
  page: number = 1,
  limit: number = 30
): Promise<ISuccessResponse<IProducto[]>> => {
  const response = await api.get<ISuccessResponse<IProducto[]> | IProducto[]>('/producto', {
    params: { page, limit },
  });

  if (Array.isArray(response.data)) {
    return {
      ok: true,
      mensaje: 'Productos obtenidos correctamente',
      data: response.data,
      meta: {
        page,
        limit,
        total: response.data.length,
        totalPages: Math.max(1, Math.ceil(response.data.length / limit)),
      },
    };
  }

  return response.data as ISuccessResponse<IProducto[]>;
};

export const adjustProductStockFn = async ({ productoId, ...payload }: IAdjustProductStockPayload) => {
  const { data } = await api.patch(`/producto/${productoId}/stock/ajustar`, payload);
  return data;
};

export const updateProductoFn = async (
  productoData: ProductoSavePayload
): Promise<ISuccessResponse<IProducto>> => {
  const { id } = productoData;
  if (!id) throw new Error('No se puede actualizar un producto sin id');

  const { imagenesLocales, imagenesPorVariante, productoSinImagenes } = prepararParaGuardar(productoData);
  delete (productoSinImagenes as Partial<IProducto>).id;

  const { data } = await api.patch<ISuccessResponse<IProducto>>(`/producto/${id}`, productoSinImagenes);
  const productoActualizado = (data.data ?? data) as IProducto & { variantes?: { id?: string; sku?: string }[] };

  if (imagenesLocales?.length) {
    await Promise.all(
      imagenesLocales.map((img, i) => subirImagen(id, { ...img, orden: img.orden ?? i }))
    );
  }

  if (imagenesPorVariante.length && productoActualizado.variantes?.length) {
    await subirImagenesDeVariantes(
      id,
      imagenesPorVariante,
      productoActualizado.variantes,
      productoData.variantes ?? []
    );
  }

  const hayImagenesNuevas =
    (imagenesLocales?.length ?? 0) > 0 ||
    imagenesPorVariante.some((items) => items.length > 0);

  if (hayImagenesNuevas) {
    const refreshed = await api.get<ISuccessResponse<IProducto>>(`/producto/${id}`);
    return refreshed.data;
  }

  return data;
};
