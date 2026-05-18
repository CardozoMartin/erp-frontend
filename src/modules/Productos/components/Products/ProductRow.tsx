import { ImageIcon, PackagePlusIcon, PencilIcon, PenIcon, TagIcon, TrashIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Swal from 'sweetalert2';
import { useProductStore } from '../../store/useProductStore';
import type { IProducto } from '../../types/productos.type';
import { useNavigate } from 'react-router-dom';

type StockStatus = 'IN STOCK' | 'LOW STOCK' | 'OUT OF STOCK';
type CategoryType = 'Footwear' | 'Electronics' | 'Apparel' | 'Accessories';

type ProductCategory =
  | CategoryType
  | string
  | {
      id: string;
      nombre: string;
      descripcion?: string;
      activo: boolean;
      padre_id?: string | null;
    }
  | null
  | undefined;

interface Product {
  id: number;
  image: string;
  nombre: string;
  subtitle: string;
  codigo_barras: string;
  categoria?: ProductCategory;
  stockUnits: number;
  stockStatus: StockStatus;
  cost: number;
  precio_base: number;
}

const stockBadge: Record<StockStatus, string> = {
  'IN STOCK': 'bg-[#e6f4ea] text-[#1e7e34]',
  'LOW STOCK': 'bg-[#fff8e1] text-[#856404]',
  'OUT OF STOCK': 'bg-[#fce8e8] text-[#ba1a1a]',
};

const stockDot: Record<StockStatus, string> = {
  'IN STOCK': 'bg-[#1e7e34]',
  'LOW STOCK': 'bg-[#856404]',
  'OUT OF STOCK': 'bg-[#ba1a1a]',
};

const stockLabel: Record<StockStatus, string> = {
  'IN STOCK': 'En Stock',
  'LOW STOCK': 'Stock Bajo',
  'OUT OF STOCK': 'Sin Stock',
};

const categoryBadge: Record<CategoryType, string> = {
  Footwear: 'bg-[#e8f5ff] text-[#0d47a1]',
  Electronics: 'bg-[#f3e5f5] text-[#4a148c]',
  Apparel: 'bg-[#fce4ec] text-[#880e4f]',
  Accessories: 'bg-[#fff3e0] text-[#e65100]',
};

const fmt = (n: number | null | undefined) =>
  n != null ? n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }) : '—';

const ProductRow = ({
  product,
  onEdit,
  onDelete,
  onChangeImage,
}: {
  product: Product;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onChangeImage: (id: number) => void;
}) => {
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const rowRef = useRef<HTMLTableRowElement>(null);
  const navigate = useNavigate();
  //Zustand para guardar el producto seleccionado para editarlo en el formulario de producto
  const { setProduct } = useProductStore();

  //handler para manejar el en cualquier parte del producto row
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setMenu({ x: e.clientX, y: e.clientY });
  };

  //handler para activar o desactivar un producto
  const handleToggleStatus = () => {
    Swal.fire({
      title: 'Estas por activar/desactivar el producto?',
      text: 'Esta acción no se puede revertir',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Si,Cambiar!',
    }).then((result) => {
      if (result.isConfirmed)
        Swal.fire({
          title: '¡Cambiado!',
          text: 'El estado del producto ha sido actualizado.',
          icon: 'success',
        });
    });
  };

  //handlers para enviar los datos del producto al formulario
  const handleEditProduct = (product:IProducto) => {
    console.log('Editar producto:', product);
    setProduct(product);
    navigate('/productos/editar');
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
      <tr
        ref={rowRef}
        className="hover:bg-[#f5f3f4] transition-colors border-b border-[#c4c6cd] last:border-b-0"
        onContextMenu={handleContextMenu}
      >
        {/* Imagen */}
        <td className="px-6 py-4">
          <div className="w-11 h-11 rounded-lg overflow-hidden bg-[#efedef] flex items-center justify-center border border-[#c4c6cd]">
            <img
              src={product.image}
              alt={product.nombre}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/48x48?text=IMG';
              }}
            />
          </div>
        </td>

        {/* Nombre */}
        <td className="px-6 py-4">
          <p className="text-[15px] font-semibold text-[#041627] leading-tight">{product.nombre}</p>
          <p className="text-[12px] text-[#595f66] mt-0.5">{product.subtitle}</p>
        </td>

        {/* SKU */}
        <td className="px-6 py-4 text-[13px] text-[#44474c] font-mono">{product.codigo_barras}</td>

        {/* Categoría */}
        <td className="px-6 py-4">
          {(() => {
            const categoryName =
              typeof product.categoria === 'string'
                ? product.categoria
                : product.categoria?.nombre || 'Sin categoría';
            const badgeClass =
              categoryBadge[categoryName as CategoryType] || 'bg-[#e8edf5] text-[#34495e]';

            return (
              <span
                className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${badgeClass}`}
              >
                {categoryName}
              </span>
            );
          })()}
        </td>

        {/* Stock */}
        <td className="px-6 py-4 text-center">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full flex-shrink-0 ${stockDot[product.stockStatus]}`}
              />
              <span className="text-[13px] text-[#44474c]">{product.stockUnits} uds.</span>
            </div>
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded uppercase ${stockBadge[product.stockStatus]}`}
            >
              {stockLabel[product.stockStatus]}
            </span>
          </div>
        </td>

        {/* Costo */}
        <td className="px-6 py-4 text-right text-[14px] text-[#44474c]">{fmt(product.cost)}</td>

        {/* Precio */}
        <td className="px-6 py-4 text-right text-[14px] font-bold text-[#041627]">
          {fmt(product.precio_base)}
        </td>

        {/* Acciones */}
      </tr>
      {menu &&
        createPortal(
          <div
            className="fixed z-50 bg-white border border-[#c4c6cd] rounded-lg shadow-lg py-1 min-w-[220px]"
            style={{ top: menu.y, left: menu.x }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => handleEditProduct(product)}
              className="w-full px-4 py-2 text-left text-[13px] text-[#44474c] hover:bg-[#f5f3f4] flex items-center gap-2"
            >
              <PencilIcon size={14} /> Editar producto
            </button>

            <button
              onClick={() => {
                onChangeImage(product.id);
                setMenu(null);
              }}
              className="w-full px-4 py-2 text-left text-[13px] text-[#44474c] hover:bg-[#f5f3f4] flex items-center gap-2"
            >
              <ImageIcon size={14} /> Cambiar imagen
            </button>

            <div className="my-1 border-t border-[#efedef]" />

            <button
              onClick={() => {
                onAddStock?.(product.id);
                setMenu(null);
              }}
              className="w-full px-4 py-2 text-left text-[13px] text-[#44474c] hover:bg-[#f5f3f4] flex items-center gap-2"
            >
              <PackagePlusIcon size={14} /> Aumentar stock
            </button>

            <button
              onClick={() => {
                onOffer?.(product.id);
                setMenu(null);
              }}
              className="w-full px-4 py-2 text-left text-[13px] text-[#44474c] hover:bg-[#f5f3f4] flex items-center gap-2 justify-between"
            >
              <span className="flex items-center gap-2">
                <TagIcon size={14} /> Aplicar oferta
              </span>
              <span className="text-[11px] bg-amber-100 text-amber-700 px-2 rounded-full">%</span>
            </button>

            <div className="my-1 border-t border-[#efedef]" />

            <button
              onClick={handleToggleStatus}
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

export default ProductRow;
