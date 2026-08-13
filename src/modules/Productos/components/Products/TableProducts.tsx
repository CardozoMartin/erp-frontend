import { useMemo, useState } from 'react';
import { useAuthStore } from '../../../../store/auth.store';
import { useObtenerProductos } from '../../hooks/useProductos';
import type { IProducto } from '../../types/productos.type';
import {
  columnasDisponibles,
  guardarColumnasEnStorage,
  leerColumnasGuardadas,
  normalizarColumnas,
  puedeConfigurarColumnas,
  type ProductoColumnaKey,
} from '../../utils/columnas.utils';
import { ColumnasSelector } from '../productos/ColumnasSelector';
import { PaginadorTabla } from '../productos/PaginadorTabla';
import ModalImageUpload from './ModalImageUpload';
import { ModalOfertaRapida } from './ModalOfertaRapida';
import ProductRow from './ProductRow';

const LIMITE = 10;

const obtenerNombreCategoria = (producto: IProducto) => {
  if (typeof producto.categoria === 'string') return producto.categoria;
  return (producto.categoria as { nombre?: string } | undefined)?.nombre ?? '';
};

const TableProducts = ({ search = '' }: { search?: string }) => {
  const [paginaActual, setPaginaActual] = useState(1);
  const [productoImagen, setProductoImagen] = useState<IProducto | null>(null);
  const [productoOferta, setProductoOferta] = useState<IProducto | null>(null);

  const sucursalActiva = useAuthStore((state) => state.sucursalActiva);
  const permisos = useAuthStore((state) => state.permisos);

  const disponibles = useMemo(() => columnasDisponibles(permisos), [permisos]);
  const puedeCambiarColumnas = useMemo(() => puedeConfigurarColumnas(permisos), [permisos]);

  const [columnasVisibles, setColumnasVisibles] = useState<ProductoColumnaKey[]>(() =>
    leerColumnasGuardadas(disponibles)
  );

  const { data: respuesta, isLoading, isError, error } = useObtenerProductos(paginaActual, LIMITE);

  const productos = respuesta?.data ?? [];
  const totalProductos = respuesta?.meta?.total ?? productos.length;
  const totalPaginas = respuesta?.meta?.totalPages ?? Math.max(1, Math.ceil(totalProductos / LIMITE));

  const productosFiltrados = useMemo(() => {
    const termino = search.trim().toLowerCase();
    if (!termino) return productos;
    return productos.filter((p) =>
      [p.nombre, p.codigo_barras, obtenerNombreCategoria(p)]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(termino))
    );
  }, [productos, search]);

  const columnasMostradas = disponibles.filter((c) => columnasVisibles.includes(c.key));

  const mensajeVacio = !sucursalActiva
    ? 'No hay una sucursal activa para consultar productos.'
    : isLoading
      ? 'Cargando productos de la sucursal activa...'
      : isError
        ? ((error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'No se pudieron cargar los productos.')
        : 'No se encontraron productos para esta sucursal.';

  const manejarCambioColumnas = (siguientes: ProductoColumnaKey[]) => {
    const normalizadas = normalizarColumnas(siguientes, disponibles);
    setColumnasVisibles(normalizadas);
    guardarColumnasEnStorage(normalizadas);
  };

  const manejarCambiarPagina = (pagina: number) => {
    setPaginaActual(pagina);
  };

  return (
    <>
      <section className="bg-white border-t border-[#d7d9de] overflow-visible">
        {/* Selector de columnas visibles */}
        <ColumnasSelector
          disponibles={disponibles}
          visibles={columnasVisibles}
          puedeConfigurar={puedeCambiarColumnas}
          onCambiar={manejarCambioColumnas}
        />

        {/* Tabla de productos */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#f8fafb]">
                {columnasMostradas.map(({ key, label, align }) => (
                  <th
                    key={key}
                    className={`px-4 py-3 font-semibold text-[11px] leading-4 uppercase text-[#59616b] border-b border-[#d7d9de] ${align}`}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {productosFiltrados.length > 0 ? (
                productosFiltrados.map((producto) => (
                  <ProductRow
                    key={producto.id}
                    product={producto}
                    onChangeImage={(p) => setProductoImagen(p as IProducto)}
                    onOffer={() => setProductoOferta(producto)}
                    visibleColumns={columnasMostradas.map((c) => c.key)}
                  />
                ))
              ) : (
                <tr>
                  <td
                    colSpan={columnasMostradas.length}
                    className="px-6 py-8 text-center text-[14px] text-[#44474c]"
                  >
                    {mensajeVacio}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginador */}
        <PaginadorTabla
          paginaActual={paginaActual}
          totalPaginas={totalPaginas}
          totalProductos={totalProductos}
          cantidadFiltrada={productosFiltrados.length}
          onCambiarPagina={manejarCambiarPagina}
        />
      </section>

      {productoImagen?.id && (
        <ModalImageUpload
          productId={productoImagen.id}
          productName={productoImagen.nombre}
          existingImages={productoImagen.imagenes ?? []}
          onClose={() => setProductoImagen(null)}
          onSuccess={() => setProductoImagen(null)}
        />
      )}

      {productoOferta?.id && (
        <ModalOfertaRapida
          productoId={productoOferta.id}
          productoNombre={productoOferta.nombre}
          precioVenta={Number(productoOferta.precio_venta ?? productoOferta.precio_base ?? 0)}
          ofertasExistentes={productoOferta.ofertas}
          onClose={() => setProductoOferta(null)}
        />
      )}
    </>
  );
};

export default TableProducts;
