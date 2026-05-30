import { useEffect, useState } from "react";
import { AlertCircle, Download, Plus, Search, Warehouse } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import TableProducts from "../components/Products/TableProducts";
import { useGetSucursales } from "../../Sucursal/hooks/useSucursal";
import NoBranchModal from "../../Sucursal/components/NoBranchModal";
import { usePermisos } from "../../../store/usePermisos";
import { useAuthStore } from "../../../store/auth.store";

const ProductosPages = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState("");
  const [showNoBranchModal, setShowNoBranchModal] = useState(
    location.state?.showNoBranchModal ?? false,
  );
  const [noActive, setNoActive] = useState(false);
  const { tiene } = usePermisos();
  const sucursalActiva = useAuthStore((state) => state.sucursalActiva);

  //Tquery-------------------------------------------
  const { data: sucursales, isSuccess } = useGetSucursales();
  const sucursalesActivas = sucursales?.data ?? [];

  //ahora si la consulta de sucursales trae datos vamos a usar el estado isTrueBranch para hacer verificacion
  useEffect(() => {
    if (isSuccess && sucursalesActivas.length === 0) {
      setShowNoBranchModal(true);
      setNoActive(true);
    }
  }, [isSuccess, sucursalesActivas.length]);

  //handlers-------------------------------------
  const handlerChangePageProducts = () => {
    if (sucursalesActivas.length === 0) {
      setShowNoBranchModal(true);
    } else {
      navigate("/productos/nuevo", { state: { noActive } });
    }
  };

  return (
    <>
      {/* ── Header ── */}
      <NoBranchModal
        isOpen={showNoBranchModal}
        onClose={() => setShowNoBranchModal(false)}
      />
      <header
        className="top-16 z-10 bg-[#fbf9fa] border-b border-[#c4c6cd] px-6 py-3 flex items-center justify-between"
        style={{ fontFamily: "Inter, sans-serif" }}
      >
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-[#041627]">
            Inventario de Productos
          </h2>
          <div className="mt-1 flex items-center gap-1.5 text-[13px] text-[#44474c]">
            <Warehouse size={15} className="text-[#075E54]" />
            <span>Sucursal activa:</span>
            <span className="font-semibold text-[#041627]">
              {sucursalActiva?.nombre ?? "Sin sucursal seleccionada"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="px-4 py-2 text-[13px] font-medium tracking-wide border border-[#c4c6cd] text-[#44474c] rounded-sm hover:bg-[#efedef] transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Download size={15} />
            Exportar
          </button>
          {
            tiene('productos.crear') && (
          <button
            type="button"
            onClick={handlerChangePageProducts}
            className="px-6 py-2 text-[13px] font-medium tracking-wide bg-[#075E54] hover:bg-[#1e8e4f] text-white rounded-sm transition-opacity cursor-pointer flex items-center gap-1"
          >
            <Plus size={15} />
            Nuevo Producto
              </button>
            )
          }
        </div>
      </header>

      {/* ── Content ── */}
      <div
        className="w-[90vw] max-w-none mx-auto px-6 py-6 flex flex-col gap-6"
        style={{ fontFamily: "Inter, sans-serif" }}
      >
        {!sucursalActiva && (
          <div className="flex items-center gap-2 border border-amber-300 bg-amber-50 px-4 py-3 text-[14px] text-amber-800">
            <AlertCircle size={16} />
            No tenés una sucursal activa en la sesión. Volvé a iniciar sesión o pedí que te asignen una sucursal.
          </div>
        )}
        <section className="bg-white border border-[#c4c6cd] rounded-xl shadow-sm overflow-hidden">
          {/* Toolbar */}
          <div className="px-6 py-4 border-b border-[#c4c6cd] flex justify-between items-center bg-[#fbf9fa]">
            <h2 className="text-[18px] leading-7 font-semibold text-[#041627]">
              Lista de Productos
            </h2>

            {/* Search */}
            <div className="relative max-w-xs w-full">
              <span
                className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-[#44474c] text-[20px]"
                style={{ fontFamily: "'Material Symbols Outlined'" }}
              >
                <Search size={15} />
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                }}
                placeholder="Buscar por nombre, SKU o categoría..."
                className="w-full bg-white border border-[#c4c6cd] pl-8 pr-4 py-1 rounded text-[14px] leading-5 focus:border-[#041627] outline-none"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <TableProducts />
          </div>
        </section>
      </div>
    </>
  );
};

export default ProductosPages;
