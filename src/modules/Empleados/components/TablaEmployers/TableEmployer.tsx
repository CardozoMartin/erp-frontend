import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useGetEmpleados } from '../../hooks/useEmpleados';
import RowEmployer from './RowEmployer';

type Props = {
  search?: string;
};

const LIMIT = 10;

const TableEmployer = ({ search = '' }: Props) => {
  const [currentPage, setCurrentPage] = useState(1);

  // La API ya pagina, asi que en frontend solo consumimos la pagina actual
  // y aplicamos un filtro visual liviano sobre esos registros.
  const { data: empleadosResponse, isLoading } = useGetEmpleados(
    currentPage,
    LIMIT,
  );

  const empleados = empleadosResponse?.data ?? [];
  const totalEmpleados = empleadosResponse?.total ?? 0;
  const totalPages = empleadosResponse?.lastPage ?? 1;

  const filteredEmpleados = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return empleados;

    return empleados.filter((empleado) => {
      const roles = empleado.roles.map((rol) => rol.nombre).join(' ');
      return (
        empleado.nombreCompleto.toLowerCase().includes(term) ||
        empleado.email.toLowerCase().includes(term) ||
        empleado.cargo.toLowerCase().includes(term) ||
        roles.toLowerCase().includes(term)
      );
    });
  }, [empleados, search]);

  return (
    <section className="overflow-hidden border-t border-[#c4c6cd] bg-white">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[#fbf9fa]">
              {[
                { label: 'Empleado', align: 'text-left' },
                { label: 'Contacto', align: 'text-left' },
                { label: 'Cargo', align: 'text-left' },
                { label: 'Roles', align: 'text-left' },
                { label: 'Sucursal', align: 'text-left' },
                { label: 'Estado', align: 'text-center' },
              ].map(({ label, align }) => (
                <th
                  key={label}
                  className={`border-b border-[#c4c6cd] px-6 py-4 text-[13px] font-medium uppercase tracking-wider text-[#44474c] ${align}`}
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-8 text-center text-[14px] text-[#44474c]"
                >
                  Cargando empleados...
                </td>
              </tr>
            ) : filteredEmpleados.length > 0 ? (
              filteredEmpleados.map((empleado) => (
                <RowEmployer key={empleado.id} empleado={empleado} />
              ))
            ) : (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-8 text-center text-[14px] text-[#44474c]"
                >
                  No se encontraron empleados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-[#c4c6cd] bg-white px-6 py-3">
        <span className="text-[13px] font-medium leading-[18px] text-[#44474c]">
          Mostrando {filteredEmpleados.length} de {totalEmpleados} empleados
        </span>

        <div className="flex gap-1">
          <button
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            disabled={currentPage === 1}
            className="flex h-8 w-8 items-center justify-center rounded border border-[#c4c6cd] text-[#44474c] transition-colors hover:bg-[#efedef] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft size={18} />
          </button>

          {Array.from({ length: totalPages }, (_, index) => index + 1).map(
            (page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`flex h-8 w-8 items-center justify-center rounded border text-[13px] font-medium transition-colors ${
                  currentPage === page
                    ? 'border-[#041627] bg-[#041627] text-white'
                    : 'border-[#c4c6cd] bg-white text-[#44474c] hover:bg-[#efedef]'
                }`}
              >
                {page}
              </button>
            ),
          )}

          <button
            onClick={() =>
              setCurrentPage((page) => Math.min(totalPages, page + 1))
            }
            disabled={currentPage === totalPages || totalPages === 0}
            className="flex h-8 w-8 items-center justify-center rounded border border-[#c4c6cd] text-[#44474c] transition-colors hover:bg-[#efedef] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </section>
  );
};

export default TableEmployer;
