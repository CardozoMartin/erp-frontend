import { Barcode, ImageOff, PackageSearch, Search } from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import type { IProducto } from '../../../Productos/types/productos.type';
import type { IListaPrecioPos } from '../../types/pos.type';
import { useBarcodeScan } from '../../hooks/useBarcodeScan';
import {
  applyPriceList,
  formatCurrency,
  getOfertaVigente,
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

/** Imagen destacada del producto para el POS, con fallback al rol PRINCIPAL. */
const getImagenPos = (producto: IProducto): string | null => {
  const imagenes = producto.imagenes ?? [];
  if (imagenes.length === 0) return null;
  const preferida =
    imagenes.find((img) => img.rol === 'PRINCIPAL_POS') ??
    imagenes.find((img) => img.rol === 'PRINCIPAL') ??
    imagenes[0];
  return preferida?.url ?? null;
};

export const ProductosGrilla = ({
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
  const [imagenesRotas, setImagenesRotas] = useState<Record<string, boolean>>({});

  const manejarScan = useCallback(
    (codigo: string) => {
      if (!puedeVender) return;

      // Coincidencia exacta por codigo de barras: se agrega sin pasar por la busqueda
      const exacto = productos.find((p) => p.codigo_barras === codigo);
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

      onBusquedaChange(codigo);
    },
    [productos, sucursalId, puedeVender, onAgregar, onBusquedaChange],
  );

  useBarcodeScan({ onScan: manejarScan, habilitado: puedeVender });

  return (
    <section className="flex min-h-0 flex-col">
      {/* Buscador */}
      <div className="px-5 pb-3 pt-4">
        <div className="relative">
          <Search
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#64748b]"
          />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => onBusquedaChange(e.target.value)}
            placeholder="Buscar por nombre o código..."
            className="h-12 w-full rounded-xl border border-[#dbe0e6] bg-white pl-12 pr-12 text-[15px] text-[#041627] outline-none transition-colors placeholder:text-[#94a3b8] focus:border-[#075E54] focus:ring-2 focus:ring-[#075E54]/10"
          />
          <Barcode
            size={18}
            className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors ${
              flashCodigo ? 'text-[#075E54]' : 'text-[#c4c6cd]'
            }`}
          />
        </div>
      </div>

      {/* Grilla */}
      <div className="min-h-0 flex-1 overflow-auto px-5 pb-5">
        {cargando ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-[260px] animate-pulse rounded-xl border border-[#e5e7eb] bg-white"
              >
                <div className="h-[150px] rounded-t-xl bg-[#eef1f6]" />
                <div className="space-y-2 p-3">
                  <div className="h-3 w-1/3 rounded bg-[#eef1f6]" />
                  <div className="h-4 w-4/5 rounded bg-[#eef1f6]" />
                  <div className="h-4 w-1/2 rounded bg-[#eef1f6]" />
                </div>
              </div>
            ))}
          </div>
        ) : productos.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-[#94a3b8]">
            <PackageSearch size={40} strokeWidth={1.4} />
            <p className="text-[15px] font-semibold text-[#64748b]">
              {busqueda.trim()
                ? 'No se encontraron productos para esa búsqueda'
                : 'Buscá un producto para empezar'}
            </p>
            <p className="text-[13px]">
              Podés buscar por nombre, código o escanear con el lector
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-4">
            {productos.map((producto) => {
              const stock = getStockForBranch(producto, sucursalId);
              const sinStock = stock <= 0;
              const deshabilitado = sinStock || !puedeVender;
              const oferta = getOfertaVigente(producto.ofertas);
              const precioFinal = applyPriceList(getProductPrice(producto), selectedLista);
              const precioOriginal = applyPriceList(
                Number(producto.precio_venta ?? producto.precio_base ?? 0),
                selectedLista,
              );
              const clave = producto.id ?? producto.codigo_barras ?? producto.nombre;
              const imagen = getImagenPos(producto);
              const mostrarImagen = imagen && !imagenesRotas[clave];

              return (
                <button
                  key={clave}
                  type="button"
                  disabled={deshabilitado}
                  onClick={() => !deshabilitado && onAgregar(producto)}
                  title={deshabilitado && sinStock ? 'Sin stock disponible' : producto.nombre}
                  className={[
                    'group flex flex-col overflow-hidden rounded-xl border bg-white text-left transition-all',
                    deshabilitado
                      ? 'cursor-not-allowed border-[#e5e7eb] opacity-55'
                      : 'cursor-pointer border-[#e5e7eb] hover:-translate-y-0.5 hover:border-[#075E54] hover:shadow-lg hover:shadow-[#075E54]/10 focus-visible:border-[#075E54] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#075E54]/20',
                  ].join(' ')}
                >
                  {/* Imagen */}
                  <div className="relative flex h-[150px] items-center justify-center overflow-hidden bg-[#eef2fb]">
                    {mostrarImagen ? (
                      <img
                        src={imagen}
                        alt={producto.nombre}
                        loading="lazy"
                        onError={() =>
                          setImagenesRotas((prev) => ({ ...prev, [clave]: true }))
                        }
                        className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                      />
                    ) : (
                      <ImageOff size={30} strokeWidth={1.4} className="text-[#a9b6cf]" />
                    )}

                    {oferta && (
                      <span className="absolute left-2 top-2 rounded-md bg-[#075E54] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
                        Oferta
                      </span>
                    )}
                    {sinStock && (
                      <span className="absolute right-2 top-2 rounded-md bg-[#b42318] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
                        Sin stock
                      </span>
                    )}
                  </div>

                  {/* Datos */}
                  <div className="flex flex-1 flex-col gap-1 px-3 pb-3 pt-2.5">
                    <span className="truncate text-[10px] font-semibold uppercase tracking-wider text-[#8b93a7]">
                      {producto.categoria?.nombre ?? 'Sin categoría'}
                    </span>
                    <span className="line-clamp-2 text-[14px] font-semibold leading-snug text-[#041627]">
                      {producto.nombre}
                    </span>

                    <div className="mt-auto flex items-end justify-between gap-2 pt-1.5">
                      <div className="flex flex-col leading-tight">
                        {oferta && (
                          <span className="text-[11px] text-[#9ca3af] line-through">
                            {formatCurrency(precioOriginal)}
                          </span>
                        )}
                        <span
                          className={`text-[16px] font-bold ${
                            oferta ? 'text-[#2e7d32]' : 'text-[#041627]'
                          }`}
                        >
                          {formatCurrency(precioFinal)}
                        </span>
                      </div>
                      <span
                        className={`shrink-0 text-[11px] font-semibold ${
                          sinStock ? 'text-[#b42318]' : 'text-[#64748b]'
                        }`}
                      >
                        {stock} u.
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
