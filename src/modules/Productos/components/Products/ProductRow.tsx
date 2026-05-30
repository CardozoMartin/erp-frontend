import { ImageIcon, PackagePlusIcon, PencilIcon, TagIcon, TrashIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { usePermisos } from '../../../../store/usePermisos';
import { useProductStore } from '../../store/useProductStore';
import type { IProducto } from '../../types/productos.type';
import { formatStockQuantity } from '../../utils/stockFormat';
import ModalUpdateStock from './ModalUpdateStock';

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
  id?: number | string;
  image?: string;
  imagenes?: { url?: string }[];
  nombre: string;
  subtitle?: string;
  codigo_barras: string;
  categoria?: ProductCategory;
  stock?: { cantidad?: number | string; cantidad_minima?: number | string }[];
  lotes?: { fecha_vencimiento?: string }[];
  stockUnits?: number;
  stockStatus?: StockStatus;
  cost?: number;
  precio_base: number;
  precio_costo?: number;
  precio_venta?: number;
  margen_ganancia?: number;
  unidad_venta?: string;
  es_fraccionable?: boolean;
  tiene_vencimiento?: boolean;
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

const getVencimientoStatus = (product: Product) => {
  if (!product.tiene_vencimiento) {
    return { label: 'No controla', className: 'bg-gray-100 text-gray-500' };
  }

  const fechas = (product.lotes ?? [])
    .map((lote) => lote.fecha_vencimiento)
    .filter(Boolean)
    .map((fecha) => new Date(fecha as string))
    .filter((fecha) => Number.isFinite(fecha.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());

  if (fechas.length === 0) return { label: 'Sin lotes', className: 'bg-amber-50 text-amber-700' };

  const dias = Math.ceil((fechas[0].getTime() - Date.now()) / 86400000);
  if (dias < 0) return { label: 'Vencido', className: 'bg-red-100 text-red-700' };
  if (dias <= 7) return { label: `${dias} dias`, className: 'bg-red-50 text-red-700' };
  if (dias <= 30) return { label: `${dias} dias`, className: 'bg-amber-50 text-amber-700' };
  return { label: `${dias} dias`, className: 'bg-green-50 text-green-700' };
};

const ProductRow = ({
  product,
  onChangeImage,
  onOffer,
}: {
  product: Product;
  onEdit?: (id: number | string) => void;
  onDelete?: (id: number | string) => void;
  onChangeImage: (product: Product) => void;
  onAddStock?: (id: number | string) => void;
  onOffer?: (id: number | string) => void;
}) => {
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const rowRef = useRef<HTMLTableRowElement>(null);
  const [openModalStock, setOpenModalStock] = useState(false);
  const navigate = useNavigate();
  const { tiene } = usePermisos();

  // Permisos individuales
  const puede_ver = tiene('productos.ver');
  const puede_editar = tiene('productos.editar');
  const puede_editar_stock = tiene('productos.stock.editar');
  const puede_crear_ofertas = tiene('productos.ofertas.crear');
  const puede_eliminar = tiene('productos.eliminar');

  // Verifica si tiene AL MENOS un permiso
  const tieneAlgunPermiso = puede_ver || puede_editar || puede_editar_stock || puede_crear_ofertas || puede_eliminar;

  const stockUnits =
    product.stockUnits ??
    (product.stock ?? []).reduce((total, item) => total + Number(item.cantidad ?? 0), 0);
  const stockMinimo = (product.stock ?? []).reduce(
    (total, item) => total + Number(item.cantidad_minima ?? 0),
    0
  );
  const stockStatus =
    product.stockStatus ??
    (stockUnits <= 0 ? 'OUT OF STOCK' : stockUnits <= stockMinimo ? 'LOW STOCK' : 'IN STOCK');
  const precioCosto = Number(product.precio_costo ?? product.cost ?? 0);
  const precioVenta = Number(product.precio_venta ?? product.precio_base ?? 0);
  const margen =
    product.margen_ganancia ??
    (precioCosto > 0 ? ((precioVenta - precioCosto) / precioCosto) * 100 : 0);
  const vencimiento = getVencimientoStatus(product);
  //Zustand para guardar el producto seleccionado para editarlo en el formulario de producto
  const { setProduct } = useProductStore();

  //handler para manejar el en cualquier parte del producto row
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setMenu({ x: e.clientX, y: e.clientY });
  };

  //handle para abrir el modal de stock
  const handleOpenModalStock = () => {
    setOpenModalStock(true);
    setMenu(null);
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
  const handleDetailProduct = (product: Product) => {
    console.log('Detalle producto:', product);
    setProduct(product as IProducto);
    navigate('/productos/detalles');
  };

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
              src={
                product.image ||
                product.imagenes?.[0]?.url ||
                'https://via.placeholder.com/48x48?text=IMG'
              }
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
          <p className="text-[12px] text-[#595f66] mt-0.5">
            {product.subtitle || product.unidad_venta || 'Producto'}
          </p>
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
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${stockDot[stockStatus]}`} />
              <span className="text-[13px] text-[#44474c]">
                {formatStockQuantity(stockUnits, product.unidad_venta, product.es_fraccionable)}{' '}
                uds.
              </span>
            </div>
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded uppercase ${stockBadge[stockStatus]}`}
            >
              {stockLabel[stockStatus]}
            </span>
          </div>
        </td>

        {/* Costo */}
        <td className="px-6 py-4 text-right text-[14px] text-[#44474c]">{fmt(precioCosto)}</td>

        {/* Precio */}
        <td className="px-6 py-4 text-right text-[14px] font-bold text-[#041627]">
          {fmt(precioVenta)}
        </td>

        <td className={`px-6 py-4 text-right text-[14px] font-bold ${margen >= 0 ? 'text-[#075E54]' : 'text-red-600'}`}>
          {Number(margen).toFixed(2)}%
        </td>

        <td className="px-6 py-4 text-center">
          <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold uppercase ${vencimiento.className}`}>
            {vencimiento.label}
          </span>
        </td>

        {/* Acciones */}
      </tr>

      {tieneAlgunPermiso
        ? menu &&
          createPortal(
            <div
              className="fixed z-50 bg-white border border-[#c4c6cd] rounded-lg shadow-lg py-1 min-w-[220px]"
              style={{ top: menu.y, left: menu.x }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Ver detalles - requiere productos.ver */}
              {puede_ver && (
                <button
                  onClick={() => handleDetailProduct(product)}
                  className="w-full px-4 py-2 text-left text-[13px] text-[#44474c] hover:bg-[#f5f3f4] flex items-center gap-2"
                >
                  <PencilIcon size={14} /> Ver detalles
                </button>
              )}

              {/* Cambiar imagen - requiere productos.editar */}
              {puede_editar && (
                <button
                  onClick={() => {
                    onChangeImage(product);
                    setMenu(null);
                  }}
                  className="w-full px-4 py-2 text-left text-[13px] text-[#44474c] hover:bg-[#f5f3f4] flex items-center gap-2"
                >
                  <ImageIcon size={14} /> Cambiar imagen
                </button>
              )}

              {/* Separador si hay permisos de edición */}
              {(puede_editar || puede_editar_stock) && <div className="my-1 border-t border-[#efedef]" />}

              {/* Aumentar stock - requiere productos.stock.editar */}
              {puede_editar_stock && (
                <button
                  onClick={handleOpenModalStock}
                  className="w-full px-4 py-2 text-left text-[13px] text-[#44474c] hover:bg-[#f5f3f4] flex items-center gap-2"
                >
                  <PackagePlusIcon size={14} /> Aumentar stock
                </button>
              )}

              {/* Aplicar oferta - requiere productos.ofertas.crear */}
              {puede_crear_ofertas && (
                <button
                  onClick={() => {
                    if (product.id) onOffer?.(product.id);
                    setMenu(null);
                  }}
                  className="w-full px-4 py-2 text-left text-[13px] text-[#44474c] hover:bg-[#f5f3f4] flex items-center gap-2 justify-between"
                >
                  <span className="flex items-center gap-2">
                    <TagIcon size={14} /> Aplicar oferta
                  </span>
                  <span className="text-[11px] bg-amber-100 text-amber-700 px-2 rounded-full">%</span>
                </button>
              )}

              {/* Separador si hay permisos destructivos */}
              {puede_eliminar && <div className="my-1 border-t border-[#efedef]" />}

              {/* Desactivar producto - requiere productos.eliminar */}
              {puede_eliminar && (
                <button
                  onClick={handleToggleStatus}
                  className="w-full px-4 py-2 text-left text-[13px] text-[#ba1a1a] hover:bg-[#fce8e8] flex items-center gap-2"
                >
                  <TrashIcon size={14} /> Desactivar producto
                </button>
              )}
            </div>,
            document.body
          )
        : menu &&
          createPortal(
            <div
              className="fixed z-50 bg-white border border-[#c4c6cd] rounded-lg shadow-lg py-1 min-w-[220px]"
              style={{ top: menu.y, left: menu.x }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-4 py-3">
                <p className="text-[13px] text-[#ba1a1a] font-medium">
                  No tienes permisos para editar este producto.
                </p>
              </div>
            </div>,
            document.body
          )}

      {/* Modal para actualizar el stock */}
      {openModalStock && (
        <ModalUpdateStock
          isActive={openModalStock}
          onClose={() => setOpenModalStock(false)}
          product={product}
        />
      )}
    </>
  );
};

export default ProductRow;
