import { PenIcon, TrashIcon } from 'lucide-react';

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
}: {
  product: Product;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}) => {
  return (
    <tr className="hover:bg-[#f5f3f4] transition-colors border-b border-[#c4c6cd] last:border-b-0">
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
          const badgeClass = categoryBadge[categoryName as CategoryType] || 'bg-[#e8edf5] text-[#34495e]';

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
      <td className="px-6 py-4">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => onEdit(product.id)}
            className="p-1 text-[#595f66] hover:text-[#fd9308] cursor-pointer transition-colors rounded"
            aria-label={`Editar ${product.nombre}`}
          >
            <PenIcon />
          </button>
          <button
            onClick={() => onDelete(product.id)}
            className="p-1 text-[#595f66] hover:text-[#ba1a1a] cursor-pointer transition-colors rounded"
            aria-label={`Eliminar ${product.nombre}`}
          >
            <TrashIcon />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default ProductRow;
