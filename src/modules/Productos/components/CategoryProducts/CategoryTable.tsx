import { useState } from 'react';
import DataTable from '../../../../components/common/DataTable';
import type { DataTableColumn } from '../../../../components/common/DataTable';
import {
  useGetAllProductCategoriesActives,
  useToggleProductCategoryStatus,
} from '../../hooks/useProductCategory';
import { useCategoryStore } from '../../store/useStoreCategoryProducts';
import { Toggle } from '../FormComponents';

type CategoryTableRow = {
  id: number;
  nombre: string;
  descripcion?: string;
  color_identificador?: string;
  padre_id?: number | string | null;
  activo?: boolean;
};

function MaterialIcon({ name, className = '' }: { name: string; className?: string }) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={{ fontFamily: "'Material Symbols Outlined'" }}
    >
      {name}
    </span>
  );
}

function CategoryActions({
  category,
  onEdit,
}: {
  category: CategoryTableRow;
  onEdit: (category: CategoryTableRow) => void;
}) {
  const [isActive, setIsActive] = useState(category.activo ?? true);
  const { mutate: toggleCategoryStatusMutation } = useToggleProductCategoryStatus(category.id);

  return (
    <div className="flex justify-end gap-2">
      <button
        type="button"
        onClick={() => onEdit(category)}
        className="cursor-pointer rounded p-1 text-[#595f66] transition-colors hover:text-[#fd9308]"
        aria-label={`Editar ${category.nombre}`}
      >
        <MaterialIcon name="edit" className="text-[20px]" />
      </button>
      <div className="flex items-center justify-center gap-2 border-l border-[#efedef] px-3">
        <Toggle
          checked={isActive}
          onChange={(value) => {
            setIsActive(value);
            toggleCategoryStatusMutation();
          }}
        />
      </div>
    </div>
  );
}

export default function CategoryTable() {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const LIMIT = 10;
  const { openModal, setCategory } = useCategoryStore();
  const { data: categoriesData } = useGetAllProductCategoriesActives(currentPage, LIMIT);
  const categories: CategoryTableRow[] = Array.isArray(categoriesData)
    ? categoriesData
    : categoriesData?.data && Array.isArray(categoriesData.data)
      ? categoriesData.data
      : [];
  const totalCategories = categories.length;

  const filtered = categories.filter(
    (category) =>
      category.nombre?.toLowerCase().includes(search.toLowerCase()) ||
      (category.descripcion?.toLowerCase().includes(search.toLowerCase()) ?? false),
  );

  const totalPages = Math.ceil(totalCategories / LIMIT);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleEdit = (category: CategoryTableRow) => {
    setCategory({
      id: category.id || 0,
      name: category.nombre,
      description: category.descripcion || '',
      color_identificador: category.color_identificador || '',
      padre_id: category.padre_id ? String(category.padre_id) : undefined,
      store: 'Principal',
      storeColor: 'primary',
      products: 0,
      icon: 'category',
    });
    openModal();
  };

  const columns: DataTableColumn<CategoryTableRow>[] = [
    {
      key: 'nombre',
      header: 'Nombre',
      render: (category) => (
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#e8f5ff]">
            <MaterialIcon name="category" className="text-[22px] text-[#0d47a1]" />
          </div>
          <div className="flex flex-col gap-0.5">
            <p className="text-[16px] font-semibold leading-6 text-[#041627]">{category.nombre}</p>
            <span className="rounded bg-[#e8f5ff] px-1 text-[11px] font-bold uppercase tracking-wide text-[#0d47a1]">
              Principal
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'descripcion',
      header: 'Descripcion',
      render: (category) => category.descripcion || 'Sin descripcion',
    },
    {
      key: 'productos',
      header: 'Productos',
      align: 'center',
      render: () => (
        <span className="rounded-full bg-[#efedef] px-3 py-1 text-[14px] text-[#1b1c1d]">0</span>
      ),
    },
    {
      key: 'acciones',
      header: 'Acciones',
      align: 'right',
      render: (category) => <CategoryActions category={category} onEdit={handleEdit} />,
    },
  ];

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        rel="stylesheet"
      />

      <section className="overflow-hidden rounded-xl border border-[#c4c6cd] bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-[#c4c6cd] bg-[#fbf9fa] px-6 py-4">
          <h2 className="text-[18px] font-semibold leading-7 text-[#041627]">
            Lista de Categorias
          </h2>

          <div className="relative w-full max-w-xs">
            <MaterialIcon
              name="search"
              className="absolute left-2 top-1/2 -translate-y-1/2 text-[20px] text-[#44474c]"
            />
            <input
              type="text"
              value={search}
              onChange={handleSearch}
              placeholder="Buscar categoria..."
              className="w-full rounded border border-[#c4c6cd] bg-white py-1 pl-8 pr-4 text-[14px] leading-5 outline-none focus:border-[#041627]"
            />
          </div>
        </div>

        <DataTable
          rows={filtered}
          columns={columns}
          getRowKey={(category) => String(category.id || category.nombre)}
          emptyMessage="No se encontraron categorias."
          getContextActions={(category) => [
            {
              label: 'Editar categoria',
              icon: <MaterialIcon name="edit" className="text-[16px]" />,
              onClick: () => handleEdit(category),
            },
          ]}
        />

        <div className="flex items-center justify-between border-t border-[#c4c6cd] bg-white px-6 py-3">
          <span className="text-[13px] font-medium leading-[18px] text-[#44474c]">
            Mostrando {filtered.length} de {totalCategories} categorias
          </span>

          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex h-8 w-8 items-center justify-center rounded border border-[#c4c6cd] text-[#44474c] transition-colors hover:bg-[#efedef] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <MaterialIcon name="chevron_left" className="text-[18px]" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                type="button"
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`flex h-8 w-8 items-center justify-center rounded text-[14px] font-bold transition-colors ${
                  currentPage === page
                    ? 'bg-[#041627] text-white'
                    : 'border border-[#c4c6cd] text-[#44474c] hover:bg-[#efedef]'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex h-8 w-8 items-center justify-center rounded border border-[#c4c6cd] text-[#44474c] transition-colors hover:bg-[#efedef] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <MaterialIcon name="chevron_right" className="text-[18px]" />
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
