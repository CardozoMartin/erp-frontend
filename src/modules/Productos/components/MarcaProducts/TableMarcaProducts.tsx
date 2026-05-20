import {
  ArrowBigLeft,
  ArrowBigRight,
  Search,
} from "lucide-react";
import React, { useState } from "react";
import { useGetMarcaProductAll } from "../../hooks/useMarquee";
import MarcaRow from "./MarcaRow";

const TableMarcaProducts = () => {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const LIMIT = 10;

  //Tquery--------------------------------------------
  const { data: marcasProducts, isLoading } = useGetMarcaProductAll(
    currentPage,
    LIMIT,
  );

  const marquees = Array.isArray(marcasProducts)
    ? marcasProducts
    : marcasProducts?.data && Array.isArray(marcasProducts.data)
      ? marcasProducts.data
      : [];
  const totalMarquees = marquees.length;
  const totalPages = Math.ceil(totalMarquees / LIMIT);

  const filtered = marquees.filter((marca: any) =>
    marca.nombre?.toLowerCase().includes(search.toLowerCase()) ||
    (marca.descripcion?.toLowerCase().includes(search.toLowerCase()) ?? false)
  );

  //Handlers ------------------------------------------
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <div className="bg-white border border-[#c4c6cd] rounded-xl shadow-sm overflow-hidden p-6 text-center text-[#44474c]">
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
      <section className="bg-white border border-[#c4c6cd] rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[#c4c6cd] flex justify-between items-center bg-[#fbf9fa]">
        <h2 className="text-[18px] leading-7 font-semibold text-[#041627]">
          Lista de Marcas
        </h2>

        {/* Search */}
        <div className="relative max-w-xs w-full">
          <span
            className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-[#44474c] text-[20px]"
            style={{ fontFamily: "'Material Symbols Outlined'" }}
          >
            <Search size={20} />
          </span>
          <input
            type="text"
            value={search}
            onChange={handleSearch}
            placeholder="Buscar marca..."
            className="w-full bg-white border border-[#c4c6cd] pl-8 pr-4 py-1 rounded text-[14px] leading-5 focus:border-[#041627] outline-none"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[#fbf9fa]">
              {['Logo', 'Nombre', 'Descripción'].map((col) => (
                <th
                  key={col}
                  className="px-6 py-4 font-medium text-[13px] leading-4.5 tracking-wider uppercase text-[#44474c] border-b border-[#c4c6cd] text-left"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((marca: any) => (
              <MarcaRow
                key={marca.id || marca.nombre}
                marca={{
                  id: marca.id ?? 0,
                  nombre: marca.nombre ?? '',
                  descripcion: marca.descripcion ?? '',
                  logo_url: marca.logo_url ?? '',
                  activo: marca.activo ?? true,
                  products: marca.productos?.length ?? marca.productos ?? 0,
                }}
              />
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-[14px] text-[#44474c]">
                  No se encontraron marcas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer / Pagination */}
      <div className="px-6 py-3 bg-white border-t border-[#c4c6cd] flex justify-between items-center">
        <span className="text-[13px] leading-4.5 font-medium text-[#44474c]">
          Mostrando de marcas
        </span>

        <div className="flex gap-1">
          {/* Botón anterior */}
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="w-8 h-8 flex items-center justify-center rounded border border-[#c4c6cd] text-[#44474c] hover:bg-[#efedef] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <span
              className="material-symbols-outlined text-[18px]"
              style={{ fontFamily: "'Material Symbols Outlined'" }}
            >
              <ArrowBigLeft size={18} />
            </span>
          </button>

          {/* Números de página dinámicos */}
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`w-8 h-8 flex items-center justify-center rounded font-bold text-[14px] transition-colors ${
                currentPage === page
                  ? "bg-[#041627] text-white"
                  : "border border-[#c4c6cd] text-[#44474c] hover:bg-[#efedef]"
              }`}
            >
              {page}
            </button>
          ))}

          {/* Botón siguiente */}
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="w-8 h-8 flex items-center justify-center rounded border border-[#c4c6cd] text-[#44474c] hover:bg-[#efedef] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <span
              className="material-symbols-outlined text-[18px]"
              style={{ fontFamily: "'Material Symbols Outlined'" }}
            >
              <ArrowBigRight size={18} />
            </span>
          </button>
        </div>
      </div>
    </section>
    </>
  );
};

export default TableMarcaProducts;
