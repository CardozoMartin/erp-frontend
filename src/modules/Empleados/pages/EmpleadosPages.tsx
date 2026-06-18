import { Download, Plus, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/auth.store';
import { useGetEmpleados } from '../hooks/useEmpleados';
import { exportarEmpleadosExcel } from '../utils/empleado.utils';
import TableEmployer from '../components/TablaEmployers/TableEmployer';

type FiltroEstado = 'todos' | 'activos' | 'inactivos';

const FILTROS: { valor: FiltroEstado; label: string }[] = [
  { valor: 'todos',     label: 'Todos' },
  { valor: 'activos',   label: 'Activos' },
  { valor: 'inactivos', label: 'Inactivos' },
];

const EmpleadosPages = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('activos');
  const sucursalActivaId = useAuthStore((s) => s.sucursalActiva?.id);

  // Misma query que TableEmployer — sale del caché, no hay doble fetch
  const { data: empleadosResponse } = useGetEmpleados(1, 1000);

  const empleadosFiltrados = useMemo(() => {
    const todos = empleadosResponse?.data ?? [];
    const term = search.trim().toLowerCase();
    return todos.filter((e) => {
      const perteneceActiva = sucursalActivaId
        ? e.sucursales.some((s) => s.id === sucursalActivaId && s.activo)
        : true;
      if (!perteneceActiva) return false;
      if (filtroEstado === 'activos'   && !e.activo) return false;
      if (filtroEstado === 'inactivos' &&  e.activo) return false;
      if (!term) return true;
      const roles = e.roles.map((r) => r.nombre).join(' ');
      return (
        e.nombreCompleto.toLowerCase().includes(term) ||
        e.email.toLowerCase().includes(term) ||
        e.cargo.toLowerCase().includes(term) ||
        roles.toLowerCase().includes(term)
      );
    });
  }, [empleadosResponse, search, filtroEstado, sucursalActivaId]);

  const handleExportar = () => {
    const label = filtroEstado === 'todos' ? 'todos' : filtroEstado;
    exportarEmpleadosExcel(empleadosFiltrados, `empleados_${label}`);
  };

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
            onClick={handleExportar}
            disabled={empleadosFiltrados.length === 0}
            className="flex items-center gap-1.5 rounded-sm border border-[#c4c6cd] px-4 py-2 text-[13px] font-medium tracking-wide text-[#44474c] transition-colors hover:bg-[#efedef] disabled:cursor-not-allowed disabled:opacity-40"
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
            <div className="flex items-center gap-3">
              <h2 className="text-[18px] font-semibold leading-7 text-[#041627]">
                Lista de Empleados
              </h2>
              <div className="flex items-center gap-1 rounded-lg border border-[#c4c6cd] bg-white p-1">
                {FILTROS.map(({ valor, label }) => (
                  <button
                    key={valor}
                    type="button"
                    onClick={() => setFiltroEstado(valor)}
                    className={`rounded-md px-3 py-1 text-[12px] font-semibold transition-colors ${
                      filtroEstado === valor
                        ? 'bg-[#041627] text-white'
                        : 'text-[#44474c] hover:bg-[#efedef]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative w-full max-w-xs">
              <span className="absolute left-2 top-1/2 -translate-y-1/2">
                <Search size={15} className="text-[#44474c]" />
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
            <TableEmployer search={search} filtroEstado={filtroEstado} />
          </div>
        </section>
      </div>
    </>
  );
};

export default EmpleadosPages;
