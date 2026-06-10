import { ChevronLeft, ChevronRight, Columns3, SlidersHorizontal } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useAuthStore } from '../../../../store/auth.store';
import { useGetProducts } from '../../hooks/useProducts';
import type { IProducto } from '../../types/productos.type';
import ModalImageUpload from './ModalImageUpload';
import ProductRow, { type ProductTableColumnKey } from './ProductRow';

type ProductColumnDefinition = {
  key: ProductTableColumnKey;
  label: string;
  align: 'text-left' | 'text-center' | 'text-right';
  defaultVisible: boolean;
  sensitive?: boolean;
};

const STORAGE_KEY = 'erp:productos:tabla:columnas:v1';

const PRODUCT_COLUMNS: ProductColumnDefinition[] = [
  { key: 'imagen', label: 'Imagen', align: 'text-left', defaultVisible: true },
  { key: 'producto', label: 'Producto', align: 'text-left', defaultVisible: true },
  { key: 'codigo', label: 'Codigo', align: 'text-left', defaultVisible: true },
  { key: 'categoria', label: 'Categoria', align: 'text-left', defaultVisible: true },
  { key: 'stock', label: 'Stock', align: 'text-center', defaultVisible: true },
  { key: 'costo', label: 'Costo', align: 'text-right', defaultVisible: false, sensitive: true },
  { key: 'venta', label: 'Venta', align: 'text-right', defaultVisible: false, sensitive: true },
  { key: 'margen', label: 'Margen', align: 'text-right', defaultVisible: false, sensitive: true },
  { key: 'vencimiento', label: 'Vencimiento', align: 'text-center', defaultVisible: false },
];

const defaultVisibleColumns = PRODUCT_COLUMNS.filter((column) => column.defaultVisible).map(
  (column) => column.key
);

const normalizeColumns = (columns: ProductTableColumnKey[]) => {
  const validKeys = new Set(PRODUCT_COLUMNS.map((column) => column.key));
  const normalized = PRODUCT_COLUMNS.map((column) => column.key).filter(
    (key) => columns.includes(key) && validKeys.has(key)
  );

  return normalized.length > 0 ? normalized : defaultVisibleColumns;
};

const getCategoryName = (product: IProducto) => {
  if (typeof product.categoria === 'string') return product.categoria;
  return product.categoria?.nombre ?? '';
};

const TableProducts = ({ search = '' }: { search?: string }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [uploadModalProduct, setUploadModalProduct] = useState<IProducto | null>(null);
  const [columnsMenuOpen, setColumnsMenuOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<ProductTableColumnKey[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? normalizeColumns(JSON.parse(stored)) : defaultVisibleColumns;
    } catch {
      return defaultVisibleColumns;
    }
  });
  const LIMIT = 10;
  const sucursalActiva = useAuthStore((state) => state.sucursalActiva);
  const permisos = useAuthStore((state) => state.permisos);
  const canConfigureColumns = permisos.some(
    (permiso) =>
      permiso === 'productos.configurar_columnas' ||
      permiso === 'productos.editar' ||
      permiso.startsWith('roles.') ||
      permiso.startsWith('permisos.') ||
      permiso.startsWith('config.')
  );

  const {
    data: productsResponse,
    isLoading,
    isError,
    error,
  } = useGetProducts(currentPage, LIMIT);

  const productsData = Array.isArray(productsResponse)
    ? productsResponse
    : productsResponse?.data || [];
  const totalProducts = Array.isArray(productsResponse)
    ? productsResponse.length
    : productsResponse?.meta?.total || productsData.length;
  const totalPages = Array.isArray(productsResponse)
    ? Math.max(1, Math.ceil(totalProducts / LIMIT))
    : productsResponse?.meta?.totalPages || Math.ceil(totalProducts / LIMIT);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return productsData;

    return productsData.filter((product) =>
      [product.nombre, product.codigo_barras, getCategoryName(product)]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [productsData, search]);

  const selectedColumns = PRODUCT_COLUMNS.filter((column) => visibleColumns.includes(column.key));
  const visibleSensitiveCount = PRODUCT_COLUMNS.filter(
    (column) => column.sensitive && visibleColumns.includes(column.key)
  ).length;
  const emptyMessage = !sucursalActiva
    ? 'No hay una sucursal activa para consultar productos.'
    : isLoading
      ? 'Cargando productos de la sucursal activa...'
      : isError
        ? ((error as any)?.response?.data?.message ?? 'No se pudieron cargar los productos.')
        : 'No se encontraron productos para esta sucursal.';

  const updateVisibleColumns = (nextColumns: ProductTableColumnKey[]) => {
    const normalized = normalizeColumns(nextColumns);
    setVisibleColumns(normalized);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  };

  const toggleColumn = (key: ProductTableColumnKey) => {
    const nextColumns = visibleColumns.includes(key)
      ? visibleColumns.filter((column) => column !== key)
      : [...visibleColumns, key];
    updateVisibleColumns(nextColumns);
  };

  return (
    <>
      <section className="bg-white border-t border-[#d7d9de] overflow-visible">
        <div className="px-4 py-3 bg-white border-b border-[#d7d9de] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[13px] text-[#44474c]">
            <Columns3 size={16} className="text-[#075E54]" />
            <span>
              Vista: {selectedColumns.length} columnas
              {visibleSensitiveCount > 0 ? `, ${visibleSensitiveCount} sensibles` : ''}
            </span>
          </div>

          {canConfigureColumns && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setColumnsMenuOpen((open) => !open)}
                className="h-8 px-3 border border-[#c4c6cd] bg-white text-[#041627] hover:bg-[#f5f7f8] text-[13px] font-medium flex items-center gap-2"
              >
                <SlidersHorizontal size={15} />
                Columnas
              </button>

              {columnsMenuOpen && (
                <div className="absolute right-0 top-10 z-40 w-72 border border-[#c4c6cd] bg-white shadow-xl">
                  <div className="px-4 py-3 border-b border-[#e4e6ea]">
                    <p className="text-[13px] font-semibold text-[#041627]">Datos visibles</p>
                    <p className="text-[12px] text-[#59616b] mt-0.5">
                      Esta vista queda guardada para la tabla de productos.
                    </p>
                  </div>
                  <div className="py-1 max-h-80 overflow-y-auto">
                    {PRODUCT_COLUMNS.map((column) => (
                      <label
                        key={column.key}
                        className="px-4 py-2 flex items-center justify-between gap-3 hover:bg-[#f5f7f8] cursor-pointer"
                      >
                        <span className="flex items-center gap-2 text-[13px] text-[#2f343a]">
                          <input
                            type="checkbox"
                            checked={visibleColumns.includes(column.key)}
                            onChange={() => toggleColumn(column.key)}
                            className="h-4 w-4 accent-[#075E54]"
                          />
                          {column.label}
                        </span>
                        {column.sensitive && (
                          <span className="text-[10px] font-semibold uppercase text-[#8a5a00] bg-[#fff4d6] px-2 py-0.5">
                            sensible
                          </span>
                        )}
                      </label>
                    ))}
                  </div>
                  <div className="px-4 py-3 border-t border-[#e4e6ea] flex justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => updateVisibleColumns(defaultVisibleColumns)}
                      className="text-[12px] font-medium text-[#44474c] hover:text-[#041627]"
                    >
                      Vista operativa
                    </button>
                    <button
                      type="button"
                      onClick={() => setColumnsMenuOpen(false)}
                      className="px-3 py-1.5 bg-[#041627] text-white text-[12px] font-medium"
                    >
                      Aplicar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#f8fafb]">
                {selectedColumns.map(({ key, label, align }) => (
                  <th
                    key={key}
                    className={`px-4 py-3 font-semibold text-[11px] leading-[16px] uppercase text-[#59616b] border-b border-[#d7d9de] ${align}`}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <ProductRow
                    key={product.id}
                    product={product}
                    onEdit={(id) => console.log('Edit', id)}
                    onDelete={(id) => console.log('Delete', id)}
                    onChangeImage={(selectedProduct) =>
                      setUploadModalProduct(selectedProduct as IProducto)
                    }
                    visibleColumns={visibleColumns}
                  />
                ))
              ) : (
                <tr>
                  <td
                    colSpan={selectedColumns.length}
                    className="px-6 py-8 text-center text-[14px] text-[#44474c]"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 bg-white border-t border-[#d7d9de] flex justify-between items-center">
          <span className="text-[13px] leading-[18px] font-medium text-[#44474c]">
            Mostrando {filteredProducts.length} de {totalProducts} productos
          </span>

          <div className="flex gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-8 h-8 flex items-center justify-center border border-[#c4c6cd] text-[#44474c] hover:bg-[#efedef] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={17} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 flex items-center justify-center border text-[13px] font-medium transition-colors ${
                  currentPage === page
                    ? 'bg-[#041627] border-[#041627] text-white'
                    : 'bg-white border-[#c4c6cd] text-[#44474c] hover:bg-[#efedef]'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="w-8 h-8 flex items-center justify-center border border-[#c4c6cd] text-[#44474c] hover:bg-[#efedef] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={17} />
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
            console.log('Images uploaded successfully');
          }}
        />
      )}
    </>
  );
};

export default TableProducts;
