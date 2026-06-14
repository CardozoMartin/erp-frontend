import { ImageIcon, PackagePlusIcon, PencilIcon, TagIcon, TrashIcon } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { usePermisos } from '../../../../store/usePermisos';
import { useServiciosSucursal } from '../../../POSAuxiliares/hooks/usePosAux';
import { useProductStore } from '../../store/useProductStore';
import type { IProducto } from '../../types/productos.type';
import type { ProductoColumnaKey } from '../../utils/columnas.utils';
import {
  calcularDiasVencimiento,
  calcularEstadoStock,
  formatMoneda,
} from '../../utils/producto.utils';
import { formatStockQuantity } from '../../utils/stockFormat';
import ModalUpdateStock from './ModalUpdateStock';
import ImageNoAvaible from '../../../../../public/img/product_no_avaible.png';

// Re-exportado para compatibilidad con código existente que importa desde aquí
export type { ProductoColumnaKey as ProductTableColumnKey };

type EstadoStock = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

const STOCK_BADGE: Record<EstadoStock, string> = {
  IN_STOCK: 'bg-[#e6f4ea] text-[#1e7e34]',
  LOW_STOCK: 'bg-[#fff8e1] text-[#856404]',
  OUT_OF_STOCK: 'bg-[#fce8e8] text-[#ba1a1a]',
};

const STOCK_DOT: Record<EstadoStock, string> = {
  IN_STOCK: 'bg-[#1e7e34]',
  LOW_STOCK: 'bg-[#856404]',
  OUT_OF_STOCK: 'bg-[#ba1a1a]',
};

const STOCK_LABEL: Record<EstadoStock, string> = {
  IN_STOCK: 'En Stock',
  LOW_STOCK: 'Stock Bajo',
  OUT_OF_STOCK: 'Sin Stock',
};

const resolverVencimientoDisplay = (producto: IProducto): { label: string; className: string } => {
  if (!producto.tiene_vencimiento) return { label: 'No controla', className: 'bg-gray-100 text-gray-500' };

  const dias = calcularDiasVencimiento(producto.lotes ?? []);
  if (dias === null) return { label: 'Sin lotes', className: 'bg-amber-50 text-amber-700' };
  if (dias < 0) return { label: 'Vencido', className: 'bg-red-100 text-red-700' };
  if (dias <= 7) return { label: `${dias} dias`, className: 'bg-red-50 text-red-700' };
  if (dias <= 30) return { label: `${dias} dias`, className: 'bg-amber-50 text-amber-700' };
  return { label: `${dias} dias`, className: 'bg-green-50 text-green-700' };
};

const CELL_ALIGN: Record<ProductoColumnaKey, string> = {
  imagen: 'text-left',
  producto: 'text-left',
  codigo: 'text-left',
  categoria: 'text-left',
  stock: 'text-center',
  costo: 'text-right',
  venta: 'text-right',
  margen: 'text-right',
  vencimiento: 'text-center',
};

interface Props {
  product: IProducto;
  onChangeImage: (producto: IProducto) => void;
  onOffer?: (id: string) => void;
  visibleColumns: ProductoColumnaKey[];
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const ProductRow = ({ product, onChangeImage, onOffer, visibleColumns }: Props) => {
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const [modalStockAbierto, setModalStockAbierto] = useState(false);
  const rowRef = useRef<HTMLTableRowElement>(null);
  const navigate = useNavigate();
  const { tiene } = usePermisos();
  const serviciosQuery = useServiciosSucursal();
  const { setProduct } = useProductStore();

  const cloudinaryDisponible = !!serviciosQuery.data?.cloudinary.disponible;
  const puedeVer = tiene('productos.ver');
  const puedeEditar = tiene('productos.editar');
  const puedeAjustarStock = tiene('productos.ajustar-stock');
  const puedeCrearOfertas = tiene('productos.ofertas.crear');
  const puedeEliminar = tiene('productos.eliminar');
  const tieneAlgunPermiso = puedeVer || puedeEditar || puedeAjustarStock || puedeCrearOfertas || puedeEliminar;

  const cantidadStock = (product.stock ?? []).reduce((total, item) => total + Number(item.cantidad ?? 0), 0);
  const cantidadMinima = (product.stock ?? []).reduce((total, item) => total + Number(item.cantidad_minima ?? 0), 0);
  const estadoStock = calcularEstadoStock(cantidadStock, cantidadMinima);

  const precioCosto = Number(product.precio_costo ?? 0);
  const precioVenta = Number(product.precio_venta ?? product.precio_base ?? 0);
  const margen = product.margen_ganancia ?? (precioCosto > 0 ? ((precioVenta - precioCosto) / precioCosto) * 100 : 0);
  const vencimiento = resolverVencimientoDisplay(product);

  const nombreCategoria =
    typeof product.categoria === 'string'
      ? product.categoria
      : (product.categoria as { nombre?: string } | undefined)?.nombre ?? 'Sin categoria';

  const cells: Record<ProductoColumnaKey, ReactNode> = {
    imagen: (
      <div className="w-10 h-10 overflow-hidden bg-[#f1f3f4] flex items-center justify-center border border-[#d7d9de]">
        <img
          src={product.imagenes?.[0]?.url ?? ImageNoAvaible}
          alt={product.nombre}
          className="w-full h-full object-cover"
          onError={(e) => { (e.target as HTMLImageElement).src = ImageNoAvaible; }}
        />
      </div>
    ),
    producto: (
      <div className="min-w-55">
        <p className="text-[14px] font-semibold text-[#041627] leading-tight">{product.nombre}</p>
        <p className="text-[12px] text-[#595f66] mt-0.5">{product.unidad_venta ?? 'Producto'}</p>
      </div>
    ),
    codigo: <span className="font-mono text-[12px] text-[#44474c]">{product.codigo_barras}</span>,
    categoria: (
      <span className="text-[11px] font-semibold px-2.5 py-1 uppercase tracking-wide bg-[#e8edf5] text-[#34495e]">
        {nombreCategoria}
      </span>
    ),
    stock: (
      <div className="flex items-center justify-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full shrink-0 ${STOCK_DOT[estadoStock]}`} />
          <span className="text-[13px] text-[#44474c]">
            {formatStockQuantity(cantidadStock, product.unidad_venta, product.es_fraccionable)} uds.
          </span>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 uppercase ${STOCK_BADGE[estadoStock]}`}>
          {STOCK_LABEL[estadoStock]}
        </span>
      </div>
    ),
    costo: <span className="text-[13px] text-[#44474c]">{formatMoneda(precioCosto)}</span>,
    venta: <span className="text-[13px] font-semibold text-[#041627]">{formatMoneda(precioVenta)}</span>,
    margen: (
      <span className={`text-[13px] font-semibold ${margen >= 0 ? 'text-[#075E54]' : 'text-red-600'}`}>
        {Number(margen).toFixed(2)}%
      </span>
    ),
    vencimiento: (
      <span className={`inline-flex px-2.5 py-1 text-[11px] font-semibold uppercase ${vencimiento.className}`}>
        {vencimiento.label}
      </span>
    ),
  };

  const manejarContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setMenu({ x: e.clientX, y: e.clientY });
  };

  const manejarVerDetalle = () => {
    setProduct(product);
    navigate('/productos/detalles');
    setMenu(null);
  };

  const manejarDesactivar = () => {
    setMenu(null);
    Swal.fire({
      title: '¿Desactivar el producto?',
      text: 'Esta acción cambiará el estado del producto.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, desactivar',
    });
  };

  useEffect(() => {
    const cerrarMenu = () => setMenu(null);
    const cerrarSiFueraDeRow = (event: MouseEvent) => {
      if (rowRef.current && !rowRef.current.contains(event.target as Node)) {
        setMenu(null);
      }
    };
    window.addEventListener('click', cerrarMenu);
    window.addEventListener('contextmenu', cerrarSiFueraDeRow);
    return () => {
      window.removeEventListener('click', cerrarMenu);
      window.removeEventListener('contextmenu', cerrarSiFueraDeRow);
    };
  }, []);

  return (
    <>
      <tr
        ref={rowRef}
        className="hover:bg-[#f5f7f8] transition-colors border-b border-[#d7d9de] last:border-b-0"
        onContextMenu={manejarContextMenu}
      >
        {visibleColumns.map((col) => (
          <td key={col} className={`px-4 py-3 align-middle ${CELL_ALIGN[col]}`}>
            {cells[col]}
          </td>
        ))}
      </tr>

      {menu &&
        createPortal(
          <div
            className="fixed z-50 bg-white border border-[#c4c6cd] rounded shadow-lg py-1 min-w-55"
            style={{ top: menu.y, left: menu.x }}
            onClick={(e) => e.stopPropagation()}
          >
            {tieneAlgunPermiso ? (
              <>
                {puedeVer && (
                  <button
                    type="button"
                    onClick={manejarVerDetalle}
                    className="w-full px-4 py-2 text-left text-[13px] text-[#44474c] hover:bg-[#f5f3f4] flex items-center gap-2"
                  >
                    <PencilIcon size={14} /> Ver detalles
                  </button>
                )}
                {puedeEditar && cloudinaryDisponible && (
                  <button
                    type="button"
                    onClick={() => { onChangeImage(product); setMenu(null); }}
                    className="w-full px-4 py-2 text-left text-[13px] text-[#44474c] hover:bg-[#f5f3f4] flex items-center gap-2"
                  >
                    <ImageIcon size={14} /> Cambiar imagen
                  </button>
                )}
                {((puedeEditar && cloudinaryDisponible) || puedeAjustarStock) && (
                  <div className="my-1 border-t border-[#efedef]" />
                )}
                {puedeAjustarStock && (
                  <button
                    type="button"
                    onClick={() => { setModalStockAbierto(true); setMenu(null); }}
                    className="w-full px-4 py-2 text-left text-[13px] text-[#44474c] hover:bg-[#f5f3f4] flex items-center gap-2"
                  >
                    <PackagePlusIcon size={14} /> Aumentar stock
                  </button>
                )}
                {puedeCrearOfertas && (
                  <button
                    type="button"
                    onClick={() => { if (product.id) onOffer?.(product.id); setMenu(null); }}
                    className="w-full px-4 py-2 text-left text-[13px] text-[#44474c] hover:bg-[#f5f3f4] flex items-center gap-2 justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <TagIcon size={14} /> Aplicar oferta
                    </span>
                    <span className="text-[11px] bg-amber-100 text-amber-700 px-2 rounded-full">%</span>
                  </button>
                )}
                {puedeEliminar && (
                  <>
                    <div className="my-1 border-t border-[#efedef]" />
                    <button
                      type="button"
                      onClick={manejarDesactivar}
                      className="w-full px-4 py-2 text-left text-[13px] text-[#ba1a1a] hover:bg-[#fce8e8] flex items-center gap-2"
                    >
                      <TrashIcon size={14} /> Desactivar producto
                    </button>
                  </>
                )}
              </>
            ) : (
              <div className="px-4 py-3">
                <p className="text-[13px] text-[#ba1a1a] font-medium">
                  No tenés permisos para editar este producto.
                </p>
              </div>
            )}
          </div>,
          document.body
        )}

      {modalStockAbierto && (
        <ModalUpdateStock
          isActive={modalStockAbierto}
          onClose={() => setModalStockAbierto(false)}
          product={product}
        />
      )}
    </>
  );
};

export default ProductRow;
