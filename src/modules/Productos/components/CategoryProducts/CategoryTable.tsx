import { useState } from 'react';
import { useGetAllProductCategoriesActives } from '../../hooks/useProductCategory';
import { useCategoryStore } from '../../store/useStoreCategoryProducts';
import CategoryRow from './CategoryRow';

export default function CategoryTable() {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const LIMIT = 10;
  const { openModal } = useCategoryStore();
  //Tquery--------------------------------------------
  const { data: categoriesData } = useGetAllProductCategoriesActives(currentPage, LIMIT);
  const categories = Array.isArray(categoriesData)
    ? categoriesData
    : categoriesData?.data && Array.isArray(categoriesData.data)
      ? categoriesData.data
      : [];
  const totalCategories = categories.length;

  const filtered = categories.filter(
    (c: any) =>
      c.nombre?.toLowerCase().includes(search.toLowerCase()) ||
      (c.descripcion?.toLowerCase().includes(search.toLowerCase()) ?? false)
  );

  const totalPages = Math.ceil(totalCategories / LIMIT);

  //Handlers ------------------------------------------
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };
  const handleEdit = () => {
    openModal();
  };

  const handleDelete = (id: number) => {
    console.log('Delete category', id);
  };

  return (
    <>
      {/* Google Fonts for Material Symbols */}
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        rel="stylesheet"
      />

      <section className="bg-white border border-[#c4c6cd] rounded-xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#c4c6cd] flex justify-between items-center bg-[#fbf9fa]">
          <h2 className="text-[18px] leading-7 font-semibold text-[#041627]">
            Lista de Categorías
          </h2>

          {/* Search */}
          <div className="relative max-w-xs w-full">
            <span
              className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-[#44474c] text-[20px]"
              style={{ fontFamily: "'Material Symbols Outlined'" }}
            >
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={handleSearch}
              placeholder="Buscar categoría..."
              className="w-full bg-white border border-[#c4c6cd] pl-8 pr-4 py-1 rounded text-[14px] leading-5 focus:border-[#041627] outline-none"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#fbf9fa]">
                {['Nombre', 'Descripción', 'Productos', 'Acciones'].map((col) => (
                  <th
                    key={col}
                    className={`px-6 py-4 font-medium text-[13px] leading-[18px] tracking-wider uppercase text-[#44474c] border-b border-[#c4c6cd] ${
                      col === 'Productos'
                        ? 'text-center'
                        : col === 'Acciones'
                          ? 'text-right'
                          : 'text-left'
                    }`}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((category: any) => (
                <CategoryRow
                  key={category.id || category.nombre}
                  category={{
                    id: category.id || 0,
                    name: category.nombre,
                    description: category.descripcion || '',
                    color_identificador: category.color_identificador || '',
                    padre_id: category.padre_id,
                    store: 'Principal',
                    storeColor: 'primary' as const,
                    products: 0,
                    icon: 'category',
                  }}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-[14px] text-[#44474c]">
                    No se encontraron categorías.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer / Pagination */}
        <div className="px-6 py-3 bg-white border-t border-[#c4c6cd] flex justify-between items-center">
          <span className="text-[13px] leading-[18px] font-medium text-[#44474c]">
            Mostrando {filtered.length} de {totalCategories} categorías
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
                chevron_left
              </span>
            </button>

            {/* Números de página dinámicos */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 flex items-center justify-center rounded font-bold text-[14px] transition-colors ${
                  currentPage === page
                    ? 'bg-[#041627] text-white'
                    : 'border border-[#c4c6cd] text-[#44474c] hover:bg-[#efedef]'
                }`}
              >
                {page}
              </button>
            ))}

            {/* Botón siguiente */}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="w-8 h-8 flex items-center justify-center rounded border border-[#c4c6cd] text-[#44474c] hover:bg-[#efedef] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <span
                className="material-symbols-outlined text-[18px]"
                style={{ fontFamily: "'Material Symbols Outlined'" }}
              >
                chevron_right
              </span>
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
