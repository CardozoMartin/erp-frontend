import { useEffect, useRef, useState } from 'react';
import type { IEmpleado } from '../../types/empleado.type';
import { ImageIcon, PackagePlusIcon, PencilIcon, TagIcon, TrashIcon } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useEmpleadoStore } from '../../store/useEmpleadoStore';

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
  const rowRef = useRef<HTMLTableRowElement>(null);
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
     //cerar al clikear en cualquier lado fuera del menu
      useEffect(() => {
        const close = () => setMenu(null);
        const handleGlobalContextMenu = (event: MouseEvent) => {
          if (rowRef.current && !rowRef.current.contains(event.target as Node)) {
            setMenu(null);
          }
        };
    
        window.addEventListener('click', close);
        window.addEventListener('contextmenu', handleGlobalContextMenu);
        return () => {
          window.removeEventListener('click', close);
          window.removeEventListener('contextmenu', handleGlobalContextMenu);
        };
      }, []);
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
    {menu &&
        createPortal(
          <div
            className="fixed z-50 bg-white border border-[#c4c6cd] rounded-lg shadow-lg py-1 min-w-[220px]"
            style={{ top: menu.y, left: menu.x }}
            onClick={(e) => e.stopPropagation()}
          >
           
            <button
              onClick={handleDetailEmployer}
              className="w-full px-4 py-2 text-left text-[13px] text-[#44474c] hover:bg-[#f5f3f4] flex items-center gap-2"
            >
              <PencilIcon size={14} /> Ver detalles
            </button>
            <button
             
              className="w-full px-4 py-2 text-left text-[13px] text-[#44474c] hover:bg-[#f5f3f4] flex items-center gap-2"
            >
              <ImageIcon size={14} /> Cambiar imagen
            </button>
            <div className="my-1 border-t border-[#efedef]" />
            <button
             
              className="w-full px-4 py-2 text-left text-[13px] text-[#44474c] hover:bg-[#f5f3f4] flex items-center gap-2"
            >
              <PackagePlusIcon size={14} /> Aumentar stock
            </button>
            <button
              
              className="w-full px-4 py-2 text-left text-[13px] text-[#44474c] hover:bg-[#f5f3f4] flex items-center gap-2 justify-between"
            >
              <span className="flex items-center gap-2">
                <TagIcon size={14} /> Aplicar oferta
              </span>
              <span className="text-[11px] bg-amber-100 text-amber-700 px-2 rounded-full">%</span>
            </button>
            <div className="my-1 border-t border-[#efedef]" />
            <button
              
              className="w-full px-4 py-2 text-left text-[13px] text-[#ba1a1a] hover:bg-[#fce8e8] flex items-center gap-2"
            >
              <TrashIcon size={14} /> Desactivar producto
            </button>
          </div>,
          document.body
        )}
    </>
  );
};

export default RowEmployer;
