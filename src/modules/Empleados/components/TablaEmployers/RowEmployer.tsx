import { useState } from 'react';
import type { IEmpleado } from '../../types/empleado.type';
import { PencilIcon, ShieldOff, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEmpleadoStore } from '../../store/useEmpleadoStore';
import TableContextMenu from '../../../../components/common/TableContextMenu';

type Props = {
  empleado: IEmpleado;
};

const getInitials = (nombreCompleto: string) =>
  nombreCompleto
    .split(' ')
    .slice(0, 2)
    .map((chunk) => chunk[0] ?? '')
    .join('')
    .toUpperCase();

const RowEmployer = ({ empleado }: Props) => {
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const navigate = useNavigate();
  const { setEmpleado } = useEmpleadoStore();
  // Usamos la sucursal principal cuando exista; si no, mostramos la primera.
  const sucursalPrincipal =
    empleado.sucursales.find((sucursal) => sucursal.esPrincipal) ??
    empleado.sucursales[0];

    const handleDetailEmployer = () => {
      setEmpleado(empleado);
      navigate(`/empleados/${empleado.id}`);
      setMenu(null);
    };

    //handlers para manejar el  en caulquier parte del empleado row
    const handleContextMenu = (event: React.MouseEvent) => {
      event.preventDefault();
      setMenu({x: event.clientX, y: event.clientY});
    }
  return (
    <>
    <tr className="border-b border-[#c4c6cd] transition-colors last:border-b-0 hover:bg-[#f5f3f4]"
      onContextMenu={handleContextMenu}>
      <td className="px-6 py-4">
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
      </td>

      <td className="px-6 py-4">
        <p className="text-[13px] font-medium text-[#041627]">{empleado.email}</p>
        <p className="mt-0.5 text-[12px] text-[#595f66]">{empleado.telefono}</p>
      </td>

      <td className="px-6 py-4 text-[13px] text-[#44474c]">{empleado.cargo}</td>

      <td className="px-6 py-4">
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
      </td>

      <td className="px-6 py-4">
        <div className="text-[13px] text-[#44474c]">
          {sucursalPrincipal?.nombre ?? 'Sin sucursal'}
        </div>
        <div className="mt-0.5 text-[11px] font-mono text-[#888]">
          {empleado.roles[0]?.rutaInicio ?? '/sin-acceso'}
        </div>
      </td>

      <td className="px-6 py-4 text-center">
        <span
          className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${
            empleado.activo
              ? 'bg-[#e6f4ea] text-[#1e7e34]'
              : 'bg-[#fce8e8] text-[#ba1a1a]'
          }`}
        >
          {empleado.activo ? 'Activo' : 'Inactivo'}
        </span>
      </td>
    </tr>
    {menu && (
      <TableContextMenu
        x={menu.x}
        y={menu.y}
        onClose={() => setMenu(null)}
        actions={[
          { label: 'Ver detalles', icon: <PencilIcon size={14} />, onClick: handleDetailEmployer },
          { label: empleado.activo ? 'Desactivar empleado' : 'Activar empleado', icon: empleado.activo ? <ShieldOff size={14} /> : <UserCheck size={14} />, danger: empleado.activo, dividerBefore: true },
        ]}
      />
    )}
    </>
  );
};

export default RowEmployer;
