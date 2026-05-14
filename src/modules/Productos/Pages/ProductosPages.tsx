import { useEffect, useState } from "react";
import { Download, Plus, Search } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import TableProducts from "../components/Products/TableProducts";
import { useGetProducts } from "../hooks/useProducts";
import { useGetSucursales } from "../../Sucursal/hooks/useSucursal";
import NoBranchModal from "../../Sucursal/components/NoBranchModal";

const ProductosPages = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState("");
  const [showNoBranchModal, setShowNoBranchModal] = useState(
    location.state?.showNoBranchModal ?? false,
  );
  const [noActive, setNoActive] = useState(false);

  //Tquery-------------------------------------------
  const { data: sucursales, isSuccess } = useGetSucursales();

  //ahora si la consulta de sucursales trae datos vamos a usar el estado isTrueBranch para hacer verificacion
  useEffect(() => {
    if (isSuccess && (!sucursales || sucursales.length === 0)) {
      setShowNoBranchModal(true);
      setNoActive(true);
    }
  }, [isSuccess, sucursales]);

  //handlers-------------------------------------
  const handlerChangePageProducts = () => {
    if (!sucursales || sucursales.length === 0) {
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
        <h2 className="text-2xl font-semibold tracking-tight text-[#041627]">
          Inventario de Productos
        </h2>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="px-4 py-2 text-[13px] font-medium tracking-wide border border-[#c4c6cd] text-[#44474c] rounded-sm hover:bg-[#efedef] transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Download size={15} />
            Exportar
          </button>
          <button
            type="button"
            onClick={handlerChangePageProducts}
            className="px-6 py-2 text-[13px] font-medium tracking-wide bg-[#075E54] hover:bg-[#1e8e4f] text-white rounded-sm transition-opacity cursor-pointer flex items-center gap-1"
          >
            <Plus size={15} />
            Nuevo Producto
          </button>
        </div>
      </header>

      {/* ── Content ── */}
      <div
        className="max-w-[1280px] mx-auto px-6 py-6 flex flex-col gap-6"
        style={{ fontFamily: "Inter, sans-serif" }}
      >
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
                  setCurrentPage(1);
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
