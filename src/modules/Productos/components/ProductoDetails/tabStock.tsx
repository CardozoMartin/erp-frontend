import { AlertTriangle, Building2, HelpCircle, Layers, MapPin, Package } from 'lucide-react';
import { useFormContext } from 'react-hook-form';
import { useGetSucursales } from '../../../Sucursal/hooks/useSucursal';
import { StockSection } from '../ProductFormSections/StockSection';
import { formatStockQuantity } from '../../utils/stockFormat';

const formatStockLocation = (stock: any) => {
  const parts = [
    stock.deposito,
    stock.pasillo,
    stock.estante,
    stock.sector,
    stock.codigo_ubicacion ? `Cod. ${stock.codigo_ubicacion}` : null,
    stock.ubicacion_referencia,
  ]
    .map((part) => part?.toString?.().trim())
    .filter(Boolean);

  return parts.length ? parts.join(' | ') : 'Sin ubicacion cargada';
};

const TabStock = ({ product, onOpenStockModal, isEditing }: any) => {
  const { data: sucursales } = useGetSucursales();
  const sucursalesActivas = sucursales?.data ?? [];
  const sucursalesById = new Map(
    sucursalesActivas.map((sucursal: any) => [sucursal.id, sucursal.nombre]),
  );
  const formContext = useFormContext();
  const watchedTieneVariantes = formContext
    ? formContext.watch('tiene_variantes')
    : product?.tiene_variantes;

  if (watchedTieneVariantes) {
    return (
      <div className="mx-auto my-4 flex max-w-lg flex-col items-center justify-center gap-3 rounded-lg border border-slate-200/50 bg-slate-50 p-8 py-16 text-center shadow-sm">
        <div className="flex h-14 w-14 items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-amber-500 shadow-inner">
          <Layers size={26} className="stroke-[1.5]" />
        </div>
        <h4 className="text-base font-bold text-[#041627]">Stock Gestionado por Variantes</h4>
        <p className="max-w-sm text-xs leading-relaxed text-gray-500">
          Este producto tiene variantes activas. Las cantidades y ubicaciones deben configurarse
          individualmente en la pestana de <strong>Variantes</strong>.
        </p>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="rounded border border-slate-100 bg-white p-4">
        <div className="mb-4 flex items-center gap-2 rounded border border-slate-150 bg-slate-50 p-3 text-xs text-gray-500">
          <HelpCircle size={14} className="shrink-0 text-[#075E54]" />
          <span>
            Configura cantidades, inventario minimo y ubicacion fisica por sucursal. Dejar la
            sucursal vacia actuara como stock general.
          </span>
        </div>
        <StockSection namePrefix="stock" sucursales={sucursalesActivas} />
      </div>
    );
  }

  const stocks = product?.stock ?? [];

  return (
    <div className="flex flex-col gap-5 pt-3">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <p className="flex items-center gap-1.5 text-sm font-extrabold uppercase tracking-wider text-[#041627]">
            <Building2 size={15} className="text-[#075E54]" />
            Inventario por Sucursal
          </p>
          <p className="mt-0.5 text-xs text-gray-400">
            Control de existencias fisicas y ubicacion en deposito/local.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenStockModal}
          className="flex cursor-pointer items-center gap-1.5 rounded bg-[#075E54] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#064d45] hover:shadow"
        >
          <Package size={13} />
          Ajuste Rapido de Stock
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {stocks.map((stock: any, index: number) => {
          const cantidad = Number(stock.cantidad ?? 0);
          const cantidadMinima = Number(stock.cantidad_minima ?? 0);
          const bajo = cantidad <= cantidadMinima;
          const sucursalNombre =
            stock.sucursal_nombre ??
            (stock.sucursal_id ? sucursalesById.get(stock.sucursal_id) : 'Stock general') ??
            `Sucursal ${index + 1}`;

          return (
            <div
              key={stock.id ?? index}
              className={`flex items-center justify-between rounded-lg border bg-white p-5 transition-all hover:shadow-md ${
                bajo
                  ? 'border-rose-300 bg-rose-50/20 shadow-[0_2px_12px_rgba(239,68,68,0.03)]'
                  : 'border-slate-200 hover:border-[#075E54]/40'
              }`}
            >
              <div className="flex min-w-0 items-start gap-3">
                <div
                  className={`mt-0.5 shrink-0 rounded-md p-2 ${
                    bajo ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-gray-500'
                  }`}
                >
                  <MapPin size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#041627]">{sucursalNombre}</p>
                  <p className="mt-0.5 text-[11px] font-semibold text-gray-400">
                    Stock Minimo:{' '}
                    <span className="font-bold text-gray-600">
                      {formatStockQuantity(cantidadMinima, product?.unidad_venta, product?.es_fraccionable)} U
                    </span>
                  </p>
                  <p className="mt-2 max-w-[280px] text-[11px] font-medium leading-relaxed text-[#595f66]">
                    {formatStockLocation(stock)}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                {bajo && (
                  <span className="flex animate-pulse items-center gap-1 rounded border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-700">
                    <AlertTriangle size={10} /> Stock Bajo
                  </span>
                )}
                <div className="text-right">
                  <p className={`text-3xl font-black leading-none tracking-tight ${bajo ? 'text-rose-600' : 'text-[#075E54]'}`}>
                    {formatStockQuantity(cantidad, product?.unidad_venta, product?.es_fraccionable)}
                  </p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    unidades
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {stocks.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-gray-200 bg-slate-50 py-16 text-center text-gray-400">
          <Package size={36} className="text-gray-400 opacity-25 stroke-[1.5]" />
          <p className="text-sm font-medium">
            No se registran existencias configuradas para este producto.
          </p>
          <p className="text-xs text-gray-400">
            Presiona el boton de ajuste rapido para agregar stock.
          </p>
        </div>
      )}
    </div>
  );
};

export default TabStock;
