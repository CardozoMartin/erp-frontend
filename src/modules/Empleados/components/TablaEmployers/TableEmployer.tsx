import { ChevronLeft, ChevronRight, Gift, PencilIcon, ShieldOff, UserCheck } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../../../components/common/DataTable';
import type { DataTableColumn } from '../../../../components/common/DataTable';
import { useGetEmpleados } from '../../hooks/useEmpleados';
import { useAuthStore } from '../../../../store/auth.store';
import { useEmpleadoStore } from '../../store/useEmpleadoStore';
import type { IEmpleado } from '../../types/empleado.type';

type Props = {
  search?: string;
};

const LIMIT = 10;

const getInitials = (nombreCompleto: string) =>
  nombreCompleto
    .split(' ')
    .slice(0, 2)
    .map((chunk) => chunk[0] ?? '')
    .join('')
    .toUpperCase();

const money = (value: unknown) =>
  Number(value ?? 0).toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  });

const TableEmployer = ({ search = '' }: Props) => {
  const [currentPage, setCurrentPage] = useState(1);
  const sucursalActivaId = useAuthStore((state) => state.sucursalActiva?.id);
  const navigate = useNavigate();
  const { setEmpleado } = useEmpleadoStore();

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
    return empleados.filter((empleado) => {
      const perteneceSucursalActiva = sucursalActivaId
        ? empleado.sucursales.some(
            (sucursal) => sucursal.id === sucursalActivaId && sucursal.activo,
          )
        : true;
      if (!perteneceSucursalActiva) return false;
      if (!term) return true;

      const roles = empleado.roles.map((rol) => rol.nombre).join(' ');
      return (
        empleado.nombreCompleto.toLowerCase().includes(term) ||
        empleado.email.toLowerCase().includes(term) ||
        empleado.cargo.toLowerCase().includes(term) ||
        roles.toLowerCase().includes(term)
      );
    });
  }, [empleados, search, sucursalActivaId]);

  const openEmpleado = (empleado: IEmpleado) => {
    setEmpleado(empleado);
    navigate(`/empleados/${empleado.id}`);
  };

  const columns: DataTableColumn<IEmpleado>[] = [
    {
      key: 'empleado',
      header: 'Empleado',
      render: (empleado) => (
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-[#c4c6cd] bg-[#E6F1FB] text-sm font-bold text-[#185FA5]">
            {getInitials(empleado.nombreCompleto)}
          </div>
          <div>
            <p className="text-[15px] font-semibold leading-tight text-[#041627]">
              {empleado.nombreCompleto}
            </p>
            <p className="mt-0.5 text-[12px] text-[#595f66]">
              ID: <span className="font-mono">{empleado.id}</span>
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'contacto',
      header: 'Contacto',
      render: (empleado) => (
        <>
          <p className="text-[13px] font-medium text-[#041627]">{empleado.email}</p>
          <p className="mt-0.5 text-[12px] text-[#595f66]">{empleado.telefono}</p>
        </>
      ),
    },
    { key: 'cargo', header: 'Cargo', render: (empleado) => empleado.cargo },
    {
      key: 'roles',
      header: 'Roles',
      render: (empleado) => (
        <div className="flex flex-wrap gap-1.5">
          {empleado.roles.length > 0 ? (
            empleado.roles.map((rol) => (
              <span
                key={rol.id}
                className="rounded-full bg-[#EAF3DE] px-2.5 py-1 text-[11px] font-bold text-[#3B6D11]"
              >
                {rol.nombre}
              </span>
            ))
          ) : (
            <span className="text-[12px] text-[#888]">Sin roles</span>
          )}
        </div>
      ),
    },
    {
      key: 'sucursal',
      header: 'Sucursal',
      render: (empleado) => {
        const sucursalPrincipal =
          empleado.sucursales.find((sucursal) => sucursal.esPrincipal) ??
          empleado.sucursales[0];
        return (
          <>
            <div className="text-[13px] text-[#44474c]">
              {sucursalPrincipal?.nombre ?? 'Sin sucursal'}
            </div>
            <div className="mt-0.5 text-[11px] font-mono text-[#888]">
              {empleado.roles[0]?.rutaInicio ?? '/sin-acceso'}
            </div>
          </>
        );
      },
    },
    {
      key: 'bono_ventas',
      header: 'Bono ventas',
      render: (empleado) => {
        if (!empleado.bono_ventas_activo) {
          return <span className="text-[12px] text-[#888]">Sin bono activo</span>;
        }
        const avance = Math.min(100, Number(empleado.avance_bono_ventas ?? 0));
        return (
          <div className="min-w-[180px]">
            <div className="flex items-center justify-between gap-2 text-[12px]">
              <span className="font-bold text-[#041627]">{money(empleado.ventas_mes_actual)}</span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                empleado.bono_ventas_corresponde === true
                  ? 'bg-[#e6f4ea] text-[#1e7e34]'
                  : 'bg-[#fff8e6] text-[#8a5a00]'
              }`}>
                {empleado.bono_ventas_corresponde === true ? 'Alcanzado' : 'En curso'}
              </span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-[#e5e7eb]">
              <div className="h-full bg-[#075E54]" style={{ width: `${avance}%` }} />
            </div>
            <div className="mt-1 text-[11px] text-[#595f66]">
              Meta {money(empleado.meta_mensual_ventas)} | Bono {money(empleado.bono_mensual_ventas)}
            </div>
          </div>
        );
      },
    },
    {
      key: 'estado',
      header: 'Estado',
      align: 'center',
      render: (empleado) => (
        <span
          className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${
            empleado.activo
              ? 'bg-[#e6f4ea] text-[#1e7e34]'
              : 'bg-[#fce8e8] text-[#ba1a1a]'
          }`}
        >
          {empleado.activo ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
  ];

  return (
    <section className="overflow-hidden border-t border-[#c4c6cd] bg-white">
      <DataTable
        rows={filteredEmpleados}
        columns={columns}
        getRowKey={(empleado) => empleado.id}
        isLoading={isLoading}
        loadingMessage="Cargando empleados..."
        emptyMessage="No se encontraron empleados."
        onRowClick={openEmpleado}
        getContextActions={(empleado) => [
          {
            label: 'Ver detalles',
            icon: <PencilIcon size={14} />,
            onClick: () => openEmpleado(empleado),
          },
          {
            label: empleado.bono_ventas_activo
              ? `Bono: ${empleado.bono_ventas_corresponde === true ? 'alcanzado' : 'en curso'}`
              : 'Sin bono de ventas',
            icon: <Gift size={14} />,
            disabled: true,
          },
          {
            label: empleado.activo ? 'Desactivar empleado' : 'Activar empleado',
            icon: empleado.activo ? <ShieldOff size={14} /> : <UserCheck size={14} />,
            danger: empleado.activo,
            dividerBefore: true,
          },
        ]}
      />

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
