import { Download, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TableEmployer from '../components/TablaEmployers/TableEmployer';

const EmpleadosPages = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  return (
    <>
      <header
        className="border-b border-[#c4c6cd] bg-[#fbf9fa] px-6 py-3 flex items-center justify-between"
        style={{ fontFamily: 'Inter, sans-serif' }}
      >
        <h2 className="text-2xl font-semibold tracking-tight text-[#041627]">
          Gestion de Empleados
        </h2>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-sm border border-[#c4c6cd] px-4 py-2 text-[13px] font-medium tracking-wide text-[#44474c] transition-colors hover:bg-[#efedef]"
          >
            <Download size={15} />
            Exportar
          </button>
          <button
            type="button"
            onClick={() => navigate('/empleados/nuevo')}
            className="flex items-center gap-1 rounded-sm bg-[#075E54] px-6 py-2 text-[13px] font-medium tracking-wide text-white transition-opacity hover:bg-[#1e8e4f]"
          >
            <Plus size={15} />
            Nuevo Empleado
          </button>
        </div>
      </header>

      <div
        className="mx-auto flex w-[90vw] max-w-none flex-col gap-6 px-6 py-6"
        style={{ fontFamily: 'Inter, sans-serif' }}
      >
        <section className="overflow-hidden rounded-xl border border-[#c4c6cd] bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-[#c4c6cd] bg-[#fbf9fa] px-6 py-4">
            <h2 className="text-[18px] font-semibold leading-7 text-[#041627]">
              Lista de Empleados
            </h2>

            <div className="relative w-full max-w-xs">
              <span
                className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-[20px] text-[#44474c]"
                style={{ fontFamily: "'Material Symbols Outlined'" }}
              >
                <Search size={15} />
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre, email o rol..."
                className="w-full rounded border border-[#c4c6cd] bg-white py-1 pl-8 pr-4 text-[14px] leading-5 outline-none focus:border-[#041627]"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <TableEmployer search={search} />
          </div>
        </section>
      </div>
    </>
  );
};

export default EmpleadosPages;
