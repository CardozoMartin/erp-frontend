import { Plus } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import SucursalTable from "../components/SucursalTable";
import { useGetSucursales } from "../hooks/useSucursal";
import { usePermisos } from "../../../store/usePermisos";

const SucursalPages = () => {
  const navigate = useNavigate();
  const { tiene } = usePermisos();
  const [currentPage, setCurrentPage] = useState(1);
  const LIMIT = 10;

  const { data: sucursalesResponse, isLoading } = useGetSucursales(
    currentPage,
    LIMIT,
  );
  const sucursales = sucursalesResponse?.data ?? [];
  console.log(sucursales);
  const total = sucursalesResponse?.meta?.total || sucursales.length;
  const totalPages =
    sucursalesResponse?.meta?.totalPages ||
    Math.max(1, Math.ceil(total / LIMIT));

  return (
    <>
      <header className="top-16 z-10 bg-[#fbf9fa] border-b border-[#c4c6cd] px-6 py-3 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-[#041627]">
            Sucursales
          </h2>
          <p className="text-sm text-[#5f6771] mt-1">
            Administra las sucursales disponibles para stock y operaciones.
          </p>
        </div>
        {tiene('sucursal.crear') && (
          <button
            onClick={() => navigate('/sucursales/nuevo')}
            className="px-4 py-2 text-sm font-medium bg-[#075E54] hover:bg-[#1e8e4f] text-white rounded-sm transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nueva sucursal
          </button>
        )} 
       
      </header>

      <div className="max-w-[1280px] mx-auto px-6 py-6 flex flex-col gap-6">
        <section className="bg-white border border-[#c4c6cd] rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#c4c6cd] bg-[#fbf9fa]">
            <h3 className="text-lg font-semibold text-[#041627]">
              Lista de sucursales
            </h3>
          </div>
          {isLoading ? (
            <div className="px-6 py-8 text-center text-[#44474c]">
              Cargando sucursales...
            </div>
          ) : (
            <SucursalTable sucursales={sucursales} />
          )}
        </section>

        <div className="flex justify-between items-center text-[#44474c]">
          <span className="text-sm">
            Mostrando {sucursales.length} de {total} sucursales
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="w-8 h-8 rounded border border-[#c4c6cd] text-[#44474c] hover:bg-[#efedef] disabled:opacity-40"
            >
              ‹
            </button>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map(
              (page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded border text-[13px] font-medium transition-colors ${
                    currentPage === page
                      ? "bg-[#041627] border-[#041627] text-white"
                      : "bg-white border-[#c4c6cd] text-[#44474c] hover:bg-[#efedef]"
                  }`}
                >
                  {page}
                </button>
              ),
            )}
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
              className="w-8 h-8 rounded border border-[#c4c6cd] text-[#44474c] hover:bg-[#efedef] disabled:opacity-40"
            >
              ›
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default SucursalPages;
