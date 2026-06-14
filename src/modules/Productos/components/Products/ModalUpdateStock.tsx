import { Building2, Minus, Package, Plus, X } from 'lucide-react';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import Swal from 'sweetalert2';
import { useAjustarStockProducto } from '../../hooks/useProductos';
import { useGetSucursales } from '../../../Sucursal/hooks/useSucursal';
import { formatStockQuantity } from '../../utils/stockFormat';

interface ProductStockItem {
  sucursal_id?: string | null;
  cantidad?: number | string;
  cantidad_minima?: number | string;
}

interface ProductForStock {
  id?: string | number;
  nombre: string;
  unidad_venta?: string;
  es_fraccionable?: boolean;
  stock?: ProductStockItem[];
}

interface ModalUpdateStockProps {
  isActive: boolean;
  onClose: () => void;
  product: ProductForStock;
}

interface StockAdjustmentForm {
  sucursal_id: string;
  operation: 'add' | 'subtract';
  quantity: number;
}

const ModalUpdateStock = ({ isActive, onClose, product }: ModalUpdateStockProps) => {
  const { data: sucursales } = useGetSucursales(1, 1000);
  const { mutate: adjustStock, isPending } = useAjustarStockProducto();
  const defaultSucursalId = product.stock?.[0]?.sucursal_id ?? '';
  const { register, handleSubmit, watch, setValue } = useForm<StockAdjustmentForm>({
    defaultValues: {
      sucursal_id: defaultSucursalId,
      operation: 'add',
      quantity: 1,
    },
  });

  const sucursalId = watch('sucursal_id');
  const operation = watch('operation');
  const quantity = Number(watch('quantity') || 0);
  const sucursalesActivas = sucursales?.data ?? [];
  const stockItems = product.stock ?? [];
  const totalStock = stockItems.reduce(
    (total, item) => total + Number(item.cantidad ?? 0),
    0
  );
  const selectedStock = useMemo(
    () =>
      stockItems.find((item) =>
        sucursalId ? item.sucursal_id === sucursalId : !item.sucursal_id
      ),
    [stockItems, sucursalId]
  );

  const currentQuantity = Number(selectedStock?.cantidad ?? 0);
  const nextQuantity =
    operation === 'add' ? currentQuantity + quantity : currentQuantity - quantity;
  const quantityStep =
    product.unidad_venta === 'UNIDAD' && !product.es_fraccionable ? 1 : 0.001;
  const selectedBranchName =
    sucursalesActivas.find((sucursal: any) => sucursal.id === sucursalId)?.nombre ??
    'Stock general';

  const onSubmit = (formData: StockAdjustmentForm) => {
    if (!product.id) {
      Swal.fire('Producto invalido', 'No se pudo identificar el producto.', 'error');
      return;
    }

    const parsedQuantity = Number(formData.quantity);
    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      Swal.fire('Cantidad invalida', 'Ingresa una cantidad mayor a cero.', 'warning');
      return;
    }

    const resultingQuantity =
      formData.operation === 'add'
        ? currentQuantity + parsedQuantity
        : currentQuantity - parsedQuantity;

    if (resultingQuantity < 0) {
      Swal.fire(
        'Stock insuficiente',
        'La resta no puede dejar el stock en negativo.',
        'warning'
      );
      return;
    }

    adjustStock(
      {
        productoId: String(product.id),
        cantidad: parsedQuantity,
        operacion: formData.operation === 'add' ? 'AUMENTAR' : 'RESTAR',
        sucursal_id: formData.sucursal_id || null,
      },
      {
        onSuccess: () => {
          Swal.fire({
            icon: 'success',
            title: 'Stock actualizado',
            text: `${selectedBranchName}: ${formatStockQuantity(
              currentQuantity,
              product.unidad_venta,
              product.es_fraccionable
            )} -> ${formatStockQuantity(
              resultingQuantity,
              product.unidad_venta,
              product.es_fraccionable
            )}`,
            timer: 1800,
            showConfirmButton: false,
          });
          onClose();
        },
        onError: (error: any) => {
          const data = error?.response?.data;
          Swal.fire({
            icon: 'error',
            title: 'No se pudo actualizar',
            text: data?.message || data?.mensaje || 'Revisa los datos e intenta nuevamente.',
            confirmButtonColor: '#075E54',
          });
        },
      }
    );
  };

  if (!isActive) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center px-4"
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-[#fbf9fa] rounded-lg w-full max-w-[460px] shadow-2xl overflow-hidden"
      >
        <div className="bg-[#075E54] text-white px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Package size={16} />
            Actualizar stock
          </div>
          <button type="button" onClick={onClose} className="hover:text-white/70 cursor-pointer">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          <div className="bg-white border border-gray-200 rounded-md px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Producto
            </p>
            <div className="flex items-start justify-between gap-4 mt-0.5">
              <p className="text-base font-bold text-[#041627]">{product.nombre}</p>
              <div className="text-right shrink-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Stock total
                </p>
                <p className="text-lg font-black text-[#075E54] leading-none mt-1">
                  {formatStockQuantity(totalStock, product.unidad_venta, product.es_fraccionable)}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-bold uppercase tracking-wider text-gray-500">
              Sucursal
            </label>
            <div className="relative">
              <Building2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                {...register('sucursal_id')}
                className="w-full h-10 pl-9 pr-3 bg-white border border-gray-300 rounded text-sm font-semibold text-[#041627] outline-none focus:border-[#075E54] focus:ring-2 focus:ring-[#075E54]/15"
              >
                <option value="">Stock general</option>
                {sucursalesActivas.map((sucursal: any) => (
                  <option key={sucursal.id} value={sucursal.id}>
                    {sucursal.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setValue('operation', 'add')}
              className={`h-10 rounded border text-sm font-bold flex items-center justify-center gap-2 transition ${
                operation === 'add'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                  : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
              }`}
            >
              <Plus size={15} />
              Aumentar
            </button>
            <button
              type="button"
              onClick={() => setValue('operation', 'subtract')}
              className={`h-10 rounded border text-sm font-bold flex items-center justify-center gap-2 transition ${
                operation === 'subtract'
                  ? 'bg-rose-50 border-rose-300 text-rose-700'
                  : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
              }`}
            >
              <Minus size={15} />
              Restar
            </button>
          </div>

          <div className="grid grid-cols-[1fr_120px] gap-3 items-end">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-bold uppercase tracking-wider text-gray-500">
                Cantidad a {operation === 'add' ? 'sumar' : 'restar'}
              </label>
              <input
                type="number"
                min={quantityStep}
                step={quantityStep}
                {...register('quantity', { valueAsNumber: true })}
                className="h-10 bg-white border border-gray-300 rounded px-3 text-sm font-semibold text-[#041627] outline-none focus:border-[#075E54] focus:ring-2 focus:ring-[#075E54]/15"
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setValue('quantity', Math.max(quantityStep, quantity - quantityStep))}
                className="w-9 h-9 rounded border border-gray-300 bg-white flex items-center justify-center hover:bg-gray-100"
              >
                <Minus size={14} />
              </button>
              <button
                type="button"
                onClick={() => setValue('quantity', quantity + quantityStep)}
                className="w-9 h-9 rounded border border-gray-300 bg-white flex items-center justify-center hover:bg-gray-100"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-gray-200 rounded-md p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Stock actual en {selectedBranchName}
              </p>
              <p className="text-2xl font-black text-[#041627] mt-1">
                {formatStockQuantity(currentQuantity, product.unidad_venta, product.es_fraccionable)}
              </p>
            </div>
            <div className="bg-white border border-[#075E54]/25 rounded-md p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#075E54]">
                Stock resultante
              </p>
              <p className={`text-2xl font-black mt-1 ${nextQuantity < 0 ? 'text-rose-600' : 'text-[#075E54]'}`}>
                {formatStockQuantity(nextQuantity, product.unidad_venta, product.es_fraccionable)}
              </p>
            </div>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-gray-200 flex justify-end gap-2 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 border border-gray-300 rounded text-sm text-gray-600 bg-white hover:bg-gray-50 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isPending || nextQuantity < 0}
            className="px-4 py-1.5 bg-[#075E54] text-white rounded text-sm font-medium hover:bg-[#064d45] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Guardar cambios
          </button>
        </div>
      </form>
    </div>
  );
};

export default ModalUpdateStock;
