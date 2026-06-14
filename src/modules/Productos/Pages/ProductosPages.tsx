import { AlertCircle, Download, Plus, Search, Warehouse } from 'lucide-react';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/auth.store';
import { usePermisos } from '../../../store/usePermisos';
import { useGetSucursales } from '../../Sucursal/hooks/useSucursal';
import NoBranchModal from '../../Sucursal/components/NoBranchModal';
import TableProducts from '../components/Products/TableProducts';

const ProductosPages = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { tiene } = usePermisos();
  const sucursalActiva = useAuthStore((state) => state.sucursalActiva);

  const [busqueda, setBusqueda] = useState('');
  const [modalSinSucursal, setModalSinSucursal] = useState(
    location.state?.showNoBranchModal ?? false
  );

  const { data: sucursalesResponse } = useGetSucursales();
  const sucursales = sucursalesResponse?.data ?? [];

  const manejarNuevoProducto = () => {
    if (sucursales.length === 0) {
      setModalSinSucursal(true);
    } else {
      navigate('/productos/nuevo');
    }
  };

  return (
    <>
      <NoBranchModal isOpen={modalSinSucursal} onClose={() => setModalSinSucursal(false)} />

      <header className="top-16 z-10 bg-[#fbf9fa] border-b border-[#c4c6cd] px-6 py-3 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-[#041627]">
            Inventario de Productos
          </h2>
          <div className="mt-1 flex items-center gap-1.5 text-[13px] text-[#44474c]">
            <Warehouse size={15} className="text-[#075E54]" />
            <span>Sucursal activa:</span>
            <span className="font-semibold text-[#041627]">
              {sucursalActiva?.nombre ?? 'Sin sucursal seleccionada'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="px-4 py-2 text-[13px] font-medium tracking-wide border border-[#c4c6cd] text-[#44474c] rounded-sm hover:bg-[#efedef] transition-colors flex items-center gap-1.5"
          >
            <Download size={15} />
            Exportar
          </button>
          {tiene('productos.crear') && (
            <button
              type="button"
              onClick={manejarNuevoProducto}
              className="px-6 py-2 text-[13px] font-medium tracking-wide bg-[#075E54] hover:bg-[#1e8e4f] text-white rounded-sm transition-opacity flex items-center gap-1"
            >
              <Plus size={15} />
              Nuevo Producto
            </button>
          )}
        </div>
      </header>

      <div className="w-[90vw] max-w-none mx-auto px-6 py-6 flex flex-col gap-6">
        {!sucursalActiva && (
          <div className="flex items-center gap-2 border border-amber-300 bg-amber-50 px-4 py-3 text-[14px] text-amber-800">
            <AlertCircle size={16} />
            No tenés una sucursal activa en la sesión. Volvé a iniciar sesión o pedí que te asignen una sucursal.
          </div>
        )}

        <section className="bg-white border border-[#c4c6cd] shadow-sm overflow-visible">
          <div className="px-6 py-4 border-b border-[#c4c6cd] flex justify-between items-center bg-[#fbf9fa]">
            <h2 className="text-[18px] leading-7 font-semibold text-[#041627]">Lista de Productos</h2>
            <div className="relative max-w-xs w-full">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[#44474c]">
                <Search size={15} />
              </span>
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre, SKU o categoría..."
                className="w-full bg-white border border-[#c4c6cd] pl-8 pr-4 py-1 rounded text-[14px] leading-5 focus:border-[#041627] outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <TableProducts search={busqueda} />
          </div>
        </section>
      </div>
    </>
  );
};

export default ProductosPages;
