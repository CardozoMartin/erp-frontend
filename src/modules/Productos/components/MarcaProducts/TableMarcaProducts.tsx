import { ArrowBigLeft, ArrowBigRight, Edit3, Search, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import DataTable from '../../../../components/common/DataTable';
import type { DataTableColumn } from '../../../../components/common/DataTable';
import { useGetMarcaProductAll } from '../../hooks/useMarquee';

type MarcaTableRow = {
  id: number;
  nombre: string;
  descripcion?: string;
  logo_url?: string;
  activo?: boolean;
  productos?: unknown[] | number;
};

const TableMarcaProducts = () => {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const LIMIT = 10;
  const { data: marcasProducts, isLoading } = useGetMarcaProductAll(currentPage, LIMIT);

  const marquees: MarcaTableRow[] = Array.isArray(marcasProducts)
    ? marcasProducts
    : marcasProducts?.data && Array.isArray(marcasProducts.data)
      ? marcasProducts.data
      : [];
  const totalMarquees = marquees.length;
  const totalPages = Math.ceil(totalMarquees / LIMIT);

  const filtered = marquees.filter(
    (marca) =>
      marca.nombre?.toLowerCase().includes(search.toLowerCase()) ||
      (marca.descripcion?.toLowerCase().includes(search.toLowerCase()) ?? false),
  );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const columns: DataTableColumn<MarcaTableRow>[] = [
    {
      key: 'logo',
      header: 'Logo',
      render: (marca) => (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#e8f5ff]">
          {marca.logo_url ? (
            <img src={marca.logo_url} alt={marca.nombre} className="h-full w-full object-cover" />
          ) : (
            <span className="text-sm font-semibold text-[#0d47a1]">
              {marca.nombre?.charAt(0).toUpperCase() || 'M'}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'nombre',
      header: 'Nombre',
      render: (marca) => (
        <p className="text-[16px] font-semibold leading-6 text-[#041627]">{marca.nombre}</p>
      ),
    },
    {
      key: 'descripcion',
      header: 'Descripcion',
      render: (marca) => marca.descripcion || 'Sin descripcion',
    },
  ];

  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-xl border border-[#c4c6cd] bg-white p-6 text-center text-[#44474c] shadow-sm">
        Cargando marcas...
      </div>
    );
  }

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        rel="stylesheet"
      />
      <section className="overflow-hidden rounded-xl border border-[#c4c6cd] bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-[#c4c6cd] bg-[#fbf9fa] px-6 py-4">
          <h2 className="text-[18px] font-semibold leading-7 text-[#041627]">Lista de Marcas</h2>

          <div className="relative w-full max-w-xs">
            <Search
              size={20}
              className="absolute left-2 top-1/2 -translate-y-1/2 text-[#44474c]"
            />
            <input
              type="text"
              value={search}
              onChange={handleSearch}
              placeholder="Buscar marca..."
              className="w-full rounded border border-[#c4c6cd] bg-white py-1 pl-8 pr-4 text-[14px] leading-5 outline-none focus:border-[#041627]"
            />
          </div>
        </div>

        <DataTable
          rows={filtered}
          columns={columns}
          getRowKey={(marca) => String(marca.id || marca.nombre)}
          emptyMessage="No se encontraron marcas."
          getContextActions={(marca) => [
            {
              label: 'Editar marca',
              icon: <Edit3 size={14} />,
              onClick: () => {},
            },
            {
              label: 'Eliminar marca',
              icon: <Trash2 size={14} />,
              danger: true,
              dividerBefore: true,
              onClick: () => {},
            },
          ]}
        />

        <div className="flex items-center justify-between border-t border-[#c4c6cd] bg-white px-6 py-3">
          <span className="text-[13px] font-medium leading-[18px] text-[#44474c]">
            Mostrando {filtered.length} de {totalMarquees} marcas
          </span>

          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded border border-[#c4c6cd] text-[#44474c] transition-colors hover:bg-[#efedef] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowBigLeft size={18} />
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
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded border border-[#c4c6cd] text-[#44474c] transition-colors hover:bg-[#efedef] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowBigRight size={18} />
            </button>
          </div>
        </div>
      </section>
    </>
  );
};

export default TableMarcaProducts;
