import { useState } from 'react';
import { useGetProducts } from '../../hooks/useProducts';
import ProductRow from './ProductRow';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ModalImageUpload from './ModalImageUpload';
import type { IProducto } from '../../types/productos.type';
import { useAuthStore } from '../../../../store/auth.store';

const TableProducts = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [uploadModalProduct, setUploadModalProduct] = useState<IProducto | null>(null);
  const LIMIT = 10;
  const sucursalActiva = useAuthStore((state) => state.sucursalActiva);

  //Tquery-------------------------------------------
  const {
    data: productsResponse,
    isLoading,
    isError,
    error,
  } = useGetProducts(currentPage, LIMIT);

  // Ajuste según la estructura real de la respuesta
  const productsData = Array.isArray(productsResponse)
    ? productsResponse
    : productsResponse?.data || [];
  const totalProducts = Array.isArray(productsResponse)
    ? productsResponse.length
    : productsResponse?.meta?.total || productsData.length;
  const totalPages = Array.isArray(productsResponse)
    ? Math.max(1, Math.ceil(totalProducts / LIMIT))
    : productsResponse?.meta?.totalPages || Math.ceil(totalProducts / LIMIT);

  // Si la API ya devuelve los datos paginados, no es necesario hacer .slice()
  // Usamos los datos directamente si la página coincide
  const paginatedProducts = productsData;
  const emptyMessage = !sucursalActiva
    ? 'No hay una sucursal activa para consultar productos.'
    : isLoading
      ? 'Cargando productos de la sucursal activa...'
      : isError
        ? ((error as any)?.response?.data?.message ?? 'No se pudieron cargar los productos.')
        : 'No se encontraron productos para esta sucursal.';

  return (
    <>
      <section className="bg-white border-t border-[#c4c6cd] overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[#fbf9fa]">
              {[
                { label: 'Imagen', align: 'text-left' },
                { label: 'Producto', align: 'text-left' },
                { label: 'SKU / Código', align: 'text-left' },
                { label: 'Categoría', align: 'text-left' },
                { label: 'Stock', align: 'text-center' },
                { label: 'Costo', align: 'text-right' },
                { label: 'Venta', align: 'text-right' },
                { label: 'Margen', align: 'text-right' },
                { label: 'Vencimiento', align: 'text-center' },
               
              ].map(({ label, align }) => (
                <th
                  key={label}
                  className={`px-6 py-4 font-medium text-[13px] leading-[18px] tracking-wider uppercase text-[#44474c] border-b border-[#c4c6cd] ${align}`}
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedProducts.length > 0 ? (
              paginatedProducts.map((product) => (
                <ProductRow
                  key={product.id}
                  product={product}
                  onEdit={(id) => console.log('Edit', id)}
                  onDelete={(id) => console.log('Delete', id)}
                  onChangeImage={(selectedProduct) => setUploadModalProduct(selectedProduct as IProducto)}
                />
              ))
            ) : (
              <tr>
                <td colSpan={9} className="px-6 py-8 text-center text-[14px] text-[#44474c]">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer / Pagination */}
      <div className="px-6 py-3 bg-white border-t border-[#c4c6cd] flex justify-between items-center">
        <span className="text-[13px] leading-[18px] font-medium text-[#44474c]">
          Mostrando {paginatedProducts.length} de {totalProducts} productos
        </span>

        <div className="flex gap-1">
          {/* Botón anterior */}
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="w-8 h-8 flex items-center justify-center rounded border border-[#c4c6cd] text-[#44474c] hover:bg-[#efedef] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <span
              className="material-symbols-outlined text-[18px]"
              style={{ fontFamily: "'Material Symbols Outlined'" }}
            >
              <ChevronLeft />
            </span>
          </button>

          {/* Números de página */}
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`w-8 h-8 flex items-center justify-center rounded border text-[13px] font-medium transition-colors ${
                currentPage === page
                  ? 'bg-[#041627] border-[#041627] text-white'
                  : 'bg-white border-[#c4c6cd] text-[#44474c] hover:bg-[#efedef]'
              }`}
            >
              {page}
            </button>
          ))}

          {/* Botón siguiente */}
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
            className="w-8 h-8 flex items-center justify-center rounded border border-[#c4c6cd] text-[#44474c] hover:bg-[#efedef] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <span
              className="material-symbols-outlined text-[18px]"
              style={{ fontFamily: "'Material Symbols Outlined'" }}
            >
              <ChevronRight />
            </span>
          </button>
        </div>
      </div>
    </section>
      {uploadModalProduct?.id && (
        <ModalImageUpload
          productId={uploadModalProduct.id}
          productName={uploadModalProduct.nombre}
          existingImages={uploadModalProduct.imagenes ?? []}
          onClose={() => setUploadModalProduct(null)}
          onSuccess={() => {
            // Optional: refetch products or rely on query invalidation
            console.log('Images uploaded successfully');
          }}
        />
      )}
    </>
  );
};

export default TableProducts;
