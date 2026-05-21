import { api } from '../../../api/ApiBase';
import type { ISuccessResponse } from '../../../type/api.response.type';
import type { IImagenLocal, IProducto } from '../types/productos.type';

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
  if (imagen.alt_text) formData.append('alt_text', imagen.alt_text);
  if (imagen.orden !== undefined) formData.append('orden', imagen.orden.toString());

  await api.post('/imagenes', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

const prepararProductoParaGuardar = (
  productoData: IProducto & { imagenesLocales?: IImagenLocal[] }
): {
  imagenesLocales?: IImagenLocal[];
  imagenesPorVariante: IImagenLocal[][];
  productoSinImagenes: IProducto;
} => {
  const { imagenesLocales, ...productoSinImagenes } = productoData;
  const imagenesPorVariante = (productoSinImagenes.variantes ?? []).map((variante: any) => {
    const locales = (variante.imagenesLocales ?? []) as IImagenLocal[];
    delete variante.imagenesLocales;
    return locales;
  });

  return { imagenesLocales, imagenesPorVariante, productoSinImagenes };
};

// Funcion para crear un nuevo producto
export const postProductoFn = async (
  productoData: IProducto & { imagenesLocales?: IImagenLocal[] }
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

//fundion para editar un producto existente
export const updateProductoFn = async (
  productoData: IProducto & { imagenesLocales?: IImagenLocal[] }
): Promise<ISuccessResponse<IProducto>> => {
  const { id } = productoData;
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

  return data;
};
