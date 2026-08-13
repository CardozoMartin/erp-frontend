import { Barcode, Search } from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import DataTable from '../../../../components/common/DataTable';
import type { DataTableColumn } from '../../../../components/common/DataTable';
import type { IProducto } from '../../../Productos/types/productos.type';
import type { IListaPrecioPos } from '../../types/pos.type';
import { useBarcodeScan } from '../../hooks/useBarcodeScan';
import {
  applyPriceList,
  formatCurrency,
  getOfertaVigente,
  getProductCode,
  getProductPrice,
  getStockForBranch,
} from '../../utils/pos.utils';

interface Props {
  productos: IProducto[];
  cargando: boolean;
  sucursalId: string | null | undefined;
  busqueda: string;
  selectedLista: IListaPrecioPos | undefined;
  puedeVender: boolean;
  onBusquedaChange: (valor: string) => void;
  onAgregar: (producto: IProducto) => void;
}

export const ProductosBuscador = ({
  productos,
  cargando,
  sucursalId,
  busqueda,
  selectedLista,
  puedeVender,
  onBusquedaChange,
  onAgregar,
}: Props) => {
  const [flashCodigo, setFlashCodigo] = useState<string | null>(null);

  const manejarClickFila = (p: IProducto) => {
    const stock = getStockForBranch(p, sucursalId);
    if (stock <= 0 || !puedeVender) return;
    onAgregar(p);
  };

  const manejarScan = useCallback((codigo: string) => {
    if (!puedeVender) return;

    // Buscar coincidencia exacta por código de barras primero, luego parcial
    const exacto = productos.find(p => p.codigo_barras === codigo);
    if (exacto) {
      const stock = getStockForBranch(exacto, sucursalId);
      if (stock <= 0) {
        toast.warning(`Sin stock: ${exacto.nombre}`);
        return;
      }
      setFlashCodigo(codigo);
      setTimeout(() => setFlashCodigo(null), 800);
      onAgregar(exacto);
      return;
    }

    // Sin coincidencia exacta → poner el código en el buscador para que el usuario vea las opciones
    onBusquedaChange(codigo);
  }, [productos, sucursalId, puedeVender, onAgregar, onBusquedaChange]);

  useBarcodeScan({ onScan: manejarScan, habilitado: puedeVender });

  const columnas: DataTableColumn<IProducto>[] = [
    {
      key: 'codigo',
      header: 'Código',
      className: 'w-[120px]',
      render: p => (
        <span className="font-mono text-[12px] text-[#44474c]">
          {getProductCode(p)}
        </span>
      ),
    },
    {
      key: 'producto',
      header: 'Producto',
      render: p => {
        const oferta = getOfertaVigente(p.ofertas);
        return (
          <div className="flex items-center gap-2">
            <span className="font-medium text-[#041627] leading-snug">{p.nombre}</span>
            {oferta && (
              <span className="shrink-0 rounded bg-[#e8f5e9] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#2e7d32]">
                Oferta
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'stock',
      header: 'Stock',
      align: 'center',
      className: 'w-[70px]',
      render: p => {
        const stock = getStockForBranch(p, sucursalId);
        return (
          <span className={`font-semibold text-[13px] ${stock <= 0 ? 'text-red-400' : 'text-[#041627]'}`}>
            {stock}
          </span>
        );
      },
    },
    {
      key: 'precio',
      header: 'Precio',
      align: 'right',
      className: 'w-[120px]',
      render: p => {
        const oferta = getOfertaVigente(p.ofertas);
        const precioBase = getProductPrice(p);
        const precioFinal = applyPriceList(precioBase, selectedLista);
        const precioOriginal = applyPriceList(
          Number(p.precio_venta ?? p.precio_base ?? 0),
          selectedLista,
        );
        return (
          <div className="flex flex-col items-end leading-tight">
            {oferta && (
              <span className="text-[11px] text-[#9ca3af] line-through">
                {formatCurrency(precioOriginal)}
              </span>
            )}
            <span className={`font-bold text-[14px] ${oferta ? 'text-[#2e7d32]' : 'text-[#041627]'}`}>
              {formatCurrency(precioFinal)}
            </span>
          </div>
        );
      },
    },
  ];

  return (
    <section className="flex flex-col border-b border-[#c4c6cd] lg:border-b-0 lg:border-r">
      {/* Buscador */}
      <div className="border-b border-[#c4c6cd] bg-[#fbf9fa] px-4 py-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#44474c]" />
          <input
            type="text"
            value={busqueda}
            onChange={e => onBusquedaChange(e.target.value)}
            placeholder="Buscar por nombre o código..."
            className="w-full rounded border border-[#c4c6cd] bg-white py-2 pl-10 pr-10 text-[14px] text-[#041627] outline-none focus:border-[#075E54]"
          />
          {/* Indicador lector activo / flash al escanear */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Barcode
              size={16}
              className={`transition-colors ${flashCodigo ? 'text-[#075E54]' : 'text-[#c4c6cd]'}`}
            />
          </div>
        </div>
      </div>

      {/* Hint */}
      <div className="bg-[#f0faf8] px-4 py-1.5 text-[11px] text-[#075E54] font-medium border-b border-[#d0ede9]">
        Hacé clic en una fila para agregar · El lector de código agrega automáticamente
      </div>

      {/* Tabla */}
      <div className="flex-1 overflow-auto">
        {!busqueda.trim() ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-[#9ca3af]">
            <Search size={36} strokeWidth={1.4} />
            <p className="text-[14px] font-medium">Escribí para buscar productos</p>
            <p className="text-[12px]">Podés buscar por nombre o código de barras</p>
          </div>
        ) : (
          <DataTable
            rows={productos}
            columns={columnas}
            getRowKey={p => p.id ?? p.codigo_barras ?? p.nombre}
            isLoading={cargando}
            loadingMessage="Cargando productos..."
            emptyMessage="No se encontraron productos para esa búsqueda."
            emptyVariant="plain"
            onRowClick={manejarClickFila}
            rowClassName={p => {
              const stock = getStockForBranch(p, sucursalId);
              if (stock <= 0 || !puedeVender) return 'opacity-40 cursor-not-allowed';
              return 'cursor-pointer';
            }}
          />
        )}
      </div>
    </section>
  );
};
