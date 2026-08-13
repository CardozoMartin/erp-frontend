import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { Edit3, Trash2 } from 'lucide-react';

interface Marca {
  id: number;
  nombre: string;
  descripcion?: string;
  logo_url?: string;
  activo?: boolean;
  products?: number;
}

interface MarcaRowProps {
  marca: Marca;
}

const MarcaRow = ({ marca }: MarcaRowProps) => {
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const rowRef = useRef<HTMLTableRowElement>(null);

  const handleContextMenu = (event: ReactMouseEvent<HTMLTableRowElement>) => {
    event.preventDefault();
    setMenu({ x: event.clientX, y: event.clientY });
  };

  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      if (rowRef.current && !rowRef.current.contains(event.target as Node)) {
        setMenu(null);
      }
    };

    window.addEventListener('click', handleClickOutside);
    return () => {
      window.removeEventListener('click', handleClickOutside);
    };
  }, []);

  return (
    <>
      <tr
        className="hover:bg-[#f5f3f4] transition-colors border-b border-[#c4c6cd] last:border-b-0"
        ref={rowRef}
        onContextMenu={handleContextMenu}
      >
        {/* Logo */}
        <td className="px-6 py-4">
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#e8f5ff] flex items-center justify-center shrink-0">
            {marca.logo_url ? (
              <img
                src={marca.logo_url}
                alt={marca.nombre}
                className="object-cover w-full h-full"
              />
            ) : (
              <span className="text-[#0d47a1] font-semibold text-sm">
                {marca.nombre?.charAt(0).toUpperCase() || 'M'}
              </span>
            )}
          </div>
        </td>

        {/* Nombre */}
        <td className="px-6 py-4">
          <p className="text-[16px] leading-6 font-semibold text-[#041627]">
            {marca.nombre}
          </p>
        </td>

        {/* Descripción */}
        <td className="px-6 py-4 text-[14px] leading-5 text-[#44474c]">
          {marca.descripcion || 'Sin descripción'}
        </td>
      </tr>

      {menu &&
        createPortal(
          <div
            className="fixed z-50 bg-white border border-[#c4c6cd] rounded-lg shadow-lg py-1 min-w-55"
            style={{ top: menu.y, left: menu.x }}
          >
            <button
              className="w-full px-4 py-2 text-left text-[13px] text-[#44474c] hover:bg-[#f5f3f4] flex items-center gap-2"
              onClick={() => {
                setMenu(null);
              }}
            >
              <Edit3 size={14} /> Editar marca
            </button>
            <button
              className="w-full px-4 py-2 text-left text-[13px] text-[#44474c] hover:bg-[#f5f3f4] flex items-center gap-2"
              onClick={() => {
                setMenu(null);
              }}
            >
              <Trash2 size={14} /> Eliminar marca
            </button>
          </div>,
          document.body,
        )}
    </>
  );
};

export default MarcaRow;
