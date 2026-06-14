import {
  Calculator,
  CreditCard,
  Loader2,
  Minus,
  Plus,
  QrCode,
  ReceiptText,
  Search,
  Send,
  Trash2,
} from 'lucide-react';
import DataTable from '../../../components/common/DataTable';
import type { DataTableColumn } from '../../../components/common/DataTable';
import type { IProducto } from '../../Productos/types/productos.type';
import type { ICartItem, IComprobantePos, IMedioPago, IListaPrecioPos } from '../types/pos.type';
import type { PaymentDraft } from '../utils/pos.utils';
import {
  applyPriceList,
  describePriceList,
  formatCurrency,
  getProductCode,
  getStockForBranch,
  getStockLocationForBranch,
  toNumber,
} from '../utils/pos.utils';
import type { ICaja } from '../../Cajas/types/caja.type';

interface PosAccessSubset {
  puedeVender: boolean;
  puedeVenderYCobrar: boolean;
  puedeCrearVentaPendiente: boolean;
  puedeCobrarPendiente: boolean;
}

interface Props {
  sucursalId: string | null | undefined;
  filteredProducts: IProducto[];
  productsLoading: boolean;
  cartItems: ICartItem[];
  mediosPago: IMedioPago[];
  selectedPaymentId: string;
  selectedLista: IListaPrecioPos | undefined;
  paymentDrafts: PaymentDraft[];
  cajaAbierta: ICaja | null | undefined;
  posAccess: PosAccessSubset;
  permitePagoMixto: boolean;
  muestraControlesCobro: boolean;
  permiteCobroDirecto: boolean;
  usaFlujoSeparado: boolean;
  usaDespacho: boolean;
  permiteCotizaciones: boolean;
  mercadoPagoDisponible: boolean;
  puedeUsarCuentaCorriente: (clienteId?: string | null) => boolean;
  selectedClienteId: string;
  cuentaSeleccionada: { activa?: boolean; saldo?: number | string; limite_credito?: number | string } | null;
  saldoCuentaSeleccionada: number;
  limiteCuentaSeleccionada: number;
  disponibleCuentaSeleccionada: number;
  permiteCuentaCorriente: boolean;
  ventasPendientes: IComprobantePos[];
  pendientesLoading: boolean;
  search: string;
  subtotal: number;
  total: number;
  isBusy: boolean;
  ventaCompletaIsPending: boolean;
  crearVentaQrIsPending: boolean;
  crearOrdenQrIsPending: boolean;
  crearCuentaCorrienteIsPending: boolean;
  cobrarPendienteIsPending: boolean;
  onSearchChange: (value: string) => void;
  onAddProduct: (product: IProducto) => void;
  onChangeQuantity: (productId: string | undefined, delta: number) => void;
  onRemoveProduct: (productId: string | undefined) => void;
  onClearCart: () => void;
  onCotizar: () => void;
  onEnviarACaja: () => void;
  onCargarCuentaCorriente: () => void;
  onFinalizar: () => void;
  onCobrarQrCarrito: () => void;
  onCobrarPendiente: (venta: IComprobantePos) => void;
  onAddPaymentDraft: () => void;
  onUpdatePaymentDraft: (id: string, patch: Partial<PaymentDraft>) => void;
  onRemovePaymentDraft: (id: string) => void;
}

export default function PosVendedorView({
  sucursalId,
  filteredProducts,
  productsLoading,
  cartItems,
  mediosPago,
  selectedPaymentId,
  selectedLista,
  paymentDrafts,
  cajaAbierta,
  posAccess,
  permitePagoMixto,
  muestraControlesCobro,
  permiteCobroDirecto,
  usaFlujoSeparado,
  usaDespacho,
  permiteCotizaciones,
  mercadoPagoDisponible,
  puedeUsarCuentaCorriente,
  selectedClienteId,
  cuentaSeleccionada,
  saldoCuentaSeleccionada,
  limiteCuentaSeleccionada,
  disponibleCuentaSeleccionada,
  permiteCuentaCorriente,
  ventasPendientes,
  search,
  subtotal,
  total,
  isBusy,
  ventaCompletaIsPending,
  crearVentaQrIsPending,
  crearOrdenQrIsPending,
  crearCuentaCorrienteIsPending,
  cobrarPendienteIsPending,
  onSearchChange,
  onAddProduct,
  onChangeQuantity,
  onRemoveProduct,
  onClearCart,
  onCotizar,
  onEnviarACaja,
  onCargarCuentaCorriente,
  onFinalizar,
  onCobrarQrCarrito,
  onCobrarPendiente,
  onAddPaymentDraft,
  onUpdatePaymentDraft,
  onRemovePaymentDraft,
}: Props) {
  const selectedPayment =
    selectedPaymentId === 'CUENTA_CORRIENTE'
      ? undefined
      : mediosPago.find((m) => m.id === selectedPaymentId) ?? mediosPago[0];

  const productosColumns: DataTableColumn<IProducto>[] = [
    {
      key: 'producto',
      header: 'Producto',
      render: (product) => <span className="font-medium text-[#041627]">{product.nombre}</span>,
    },
    { key: 'codigo', header: 'Codigo', render: (product) => getProductCode(product) },
    {
      key: 'stock',
      header: 'Stock',
      align: 'right',
      render: (product) => getStockForBranch(product, sucursalId),
    },
    {
      key: 'ubicacion',
      header: 'Ubicacion',
      render: (product) => (
        <span className="block max-w-[240px] whitespace-normal text-[12px] leading-snug text-[#44474c]">
          {getStockLocationForBranch(product, sucursalId)}
        </span>
      ),
    },
    {
      key: 'precio',
      header: 'Precio',
      align: 'right',
      render: (product) => (
        <span className="font-semibold text-[#041627]">
          {formatCurrency(
            applyPriceList(
              Number(product.precio_venta ?? product.precio_base ?? 0),
              selectedLista,
            ),
          )}
        </span>
      ),
    },
    {
      key: 'accion',
      header: 'Accion',
      align: 'center',
      render: (product) => {
        const stock = getStockForBranch(product, sucursalId);
        return (
          <button
            type="button"
            onClick={() => onAddProduct(product)}
            disabled={stock <= 0 || !posAccess.puedeVender}
            className="inline-flex items-center gap-1 rounded border border-[#c4c6cd] bg-white px-3 py-1.5 text-[12px] font-medium text-[#075E54] hover:bg-[#f3fbf9] disabled:text-[#9ca3af]"
          >
            <Plus size={14} />
            Agregar
          </button>
        );
      },
    },
  ];

  const carritoColumns: DataTableColumn<ICartItem>[] = [
    {
      key: 'producto',
      header: 'Producto',
      render: (item) => <span className="font-medium text-[#041627]">{item.producto.nombre}</span>,
    },
    {
      key: 'cantidad',
      header: 'Cant.',
      align: 'center',
      render: (item) => (
        <div className="flex items-center justify-center gap-1">
          <button
            type="button"
            onClick={() => onChangeQuantity(item.producto.id, -1)}
            className="inline-flex h-7 w-7 items-center justify-center rounded border border-[#c4c6cd] bg-white text-[#041627] hover:bg-[#f4f5f6]"
          >
            <Minus size={13} />
          </button>
          <span className="inline-flex h-7 min-w-9 items-center justify-center rounded border border-[#e5e7eb] bg-[#f8fafc] px-2 text-[13px]">
            {item.cantidad}
          </span>
          <button
            type="button"
            onClick={() => onChangeQuantity(item.producto.id, 1)}
            className="inline-flex h-7 w-7 items-center justify-center rounded border border-[#c4c6cd] bg-white text-[#041627] hover:bg-[#f4f5f6]"
          >
            <Plus size={13} />
          </button>
        </div>
      ),
    },
    {
      key: 'total',
      header: 'Total',
      align: 'right',
      render: (item) => (
        <span className="font-semibold text-[#041627]">
          {formatCurrency(item.precioUnitario * item.cantidad)}
        </span>
      ),
    },
    {
      key: 'quitar',
      header: 'Quitar',
      align: 'center',
      render: (item) => (
        <button
          type="button"
          onClick={() => onRemoveProduct(item.producto.id)}
          className="inline-flex h-8 w-8 items-center justify-center rounded border border-[#f1c7c7] bg-[#fff5f5] text-[#b42318] hover:bg-[#fdecec]"
        >
          <Trash2 size={14} />
        </button>
      ),
    },
  ];

  return (
    <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
      <section className="border-b border-[#c4c6cd] lg:border-b-0 lg:border-r">
        {cuentaSeleccionada && permiteCuentaCorriente ? (
          <div className="grid gap-2 border-b border-[#c4c6cd] bg-[#f3fbf9] px-4 py-3 text-[12px] sm:grid-cols-3">
            <div>
              <span className="block font-bold uppercase text-[#44474c]">Cuenta corriente</span>
              <strong className="text-[#075E54]">Activa</strong>
            </div>
            <div>
              <span className="block font-bold uppercase text-[#44474c]">Saldo actual</span>
              <strong className={saldoCuentaSeleccionada > 0 ? 'text-[#b42318]' : 'text-[#075E54]'}>
                {formatCurrency(saldoCuentaSeleccionada)}
              </strong>
            </div>
            <div>
              <span className="block font-bold uppercase text-[#44474c]">Disponible</span>
              <strong className="text-[#041627]">
                {limiteCuentaSeleccionada > 0
                  ? formatCurrency(disponibleCuentaSeleccionada)
                  : 'Sin limite'}
              </strong>
            </div>
          </div>
        ) : null}

        <div className="border-b border-[#c4c6cd] bg-[#fbf9fa] px-4 py-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#44474c]" />
            <input
              type="text"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Buscar producto por nombre, codigo o ubicacion"
              className="w-full rounded border border-[#c4c6cd] bg-white py-2 pl-10 pr-3 text-[14px] text-[#041627] outline-none focus:border-[#075E54]"
            />
          </div>
        </div>

        <div className="max-h-[600px] overflow-auto">
          <DataTable
            rows={filteredProducts}
            columns={productosColumns}
            getRowKey={(product) => product.id ?? product.codigo_barras ?? product.nombre}
            isLoading={productsLoading}
            loadingMessage="Cargando productos"
            emptyMessage="No se encontraron productos."
            getContextActions={(product) => [
              {
                label: 'Agregar',
                icon: <Plus size={14} />,
                disabled: getStockForBranch(product, sucursalId) <= 0 || !posAccess.puedeVender,
                onClick: () => onAddProduct(product),
              },
            ]}
          />
        </div>
      </section>

      <aside className="flex flex-col">
        <div className="border-b border-[#c4c6cd] bg-[#fbf9fa] px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[14px] font-semibold text-[#041627]">
              <Calculator size={16} className="text-[#075E54]" />
              Carrito
            </div>
            <span className="rounded border border-[#cfe2de] bg-[#f3fbf9] px-2.5 py-1 text-[11px] font-medium text-[#075E54]">
              {cartItems.length} items
            </span>
          </div>
        </div>

        <div className="max-h-[360px] flex-1 overflow-auto">
          <DataTable
            rows={cartItems}
            columns={carritoColumns}
            getRowKey={(item) => item.producto.id ?? item.producto.nombre}
            emptyMessage="Carrito vacio."
            getContextActions={(item) => [
              {
                label: 'Sumar unidad',
                icon: <Plus size={14} />,
                onClick: () => onChangeQuantity(item.producto.id, 1),
              },
              {
                label: 'Restar unidad',
                icon: <Minus size={14} />,
                onClick: () => onChangeQuantity(item.producto.id, -1),
              },
              {
                label: 'Quitar producto',
                icon: <Trash2 size={14} />,
                danger: true,
                dividerBefore: true,
                onClick: () => onRemoveProduct(item.producto.id),
              },
            ]}
          />
        </div>

        <div className="border-t border-[#c4c6cd] bg-[#fbf9fa] px-4 py-4">
          <div className="space-y-2">
            {selectedLista ? (
              <div className="rounded border border-[#cfe2de] bg-white px-3 py-2 text-[12px] text-[#075E54]">
                <span className="font-semibold">{selectedLista.nombre}</span>
                <span className="ml-1 text-[#44474c]">{describePriceList(selectedLista)}</span>
              </div>
            ) : null}
            <div className="flex items-center justify-between text-[14px] text-[#44474c]">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-[18px] font-bold text-[#041627]">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>

          {muestraControlesCobro && permitePagoMixto ? (
            <div className="mt-4 rounded border border-[#c4c6cd] bg-white">
              <div className="flex items-center justify-between border-b border-[#c4c6cd] px-3 py-2">
                <span className="text-[12px] font-bold uppercase tracking-wide text-[#44474c]">Pagos</span>
                <button
                  type="button"
                  onClick={onAddPaymentDraft}
                  className="rounded border border-[#c4c6cd] bg-white px-2 py-1 text-[12px] font-semibold text-[#041627] hover:bg-[#f4f5f6]"
                >
                  Agregar pago
                </button>
              </div>
              <div className="space-y-2 p-3">
                {paymentDrafts.map((draft) => (
                  <div key={draft.id} className="grid gap-2 md:grid-cols-[1fr_110px_1fr_34px]">
                    <select
                      value={draft.medioPagoId || selectedPayment?.id || ''}
                      onChange={(event) => onUpdatePaymentDraft(draft.id, { medioPagoId: event.target.value })}
                      className="h-9 rounded border border-[#c4c6cd] bg-white px-2 text-[13px] outline-none focus:border-[#075E54]"
                    >
                      {puedeUsarCuentaCorriente(selectedClienteId) ? (
                        <option value="CUENTA_CORRIENTE">Cuenta corriente</option>
                      ) : null}
                      {mediosPago.map((method) => (
                        <option key={method.id} value={method.id}>{method.nombre}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={0}
                      value={draft.monto}
                      onChange={(event) => onUpdatePaymentDraft(draft.id, { monto: event.target.value })}
                      placeholder="Monto"
                      className="h-9 rounded border border-[#c4c6cd] px-2 text-[13px] outline-none focus:border-[#075E54]"
                    />
                    <input
                      value={draft.referencia}
                      onChange={(event) => onUpdatePaymentDraft(draft.id, { referencia: event.target.value })}
                      placeholder="Referencia"
                      className="h-9 rounded border border-[#c4c6cd] px-2 text-[13px] outline-none focus:border-[#075E54]"
                    />
                    <button
                      type="button"
                      onClick={() => onRemovePaymentDraft(draft.id)}
                      className="inline-flex h-9 items-center justify-center rounded border border-[#f1c7c7] bg-[#fff5f5] text-[#b42318] hover:bg-[#fdecec]"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-4 grid gap-3 sm:grid-cols-5">
            <button
              type="button"
              onClick={onClearCart}
              className="rounded border border-[#c4c6cd] bg-white px-4 py-3 text-[14px] font-medium text-[#041627] hover:bg-[#f4f5f6]"
            >
              Limpiar
            </button>
            {permiteCotizaciones ? (
              <button
                type="button"
                onClick={onCotizar}
                disabled={isBusy || !cartItems.length || !posAccess.puedeVender}
                className="flex items-center justify-center gap-2 rounded border border-[#c4c6cd] bg-white px-4 py-3 text-[14px] font-semibold text-[#041627] hover:bg-[#f4f5f6] disabled:opacity-60"
              >
                <ReceiptText size={16} />
                Cotizar
              </button>
            ) : null}
            {usaFlujoSeparado ? (
              <button
                type="button"
                onClick={onEnviarACaja}
                disabled={isBusy || !cartItems.length || !posAccess.puedeCrearVentaPendiente}
                className="flex items-center justify-center gap-2 rounded bg-[#075E54] px-4 py-3 text-[14px] font-semibold text-white hover:bg-[#0b6d62] disabled:opacity-60"
              >
                <Send size={16} />
                {usaDespacho ? 'Enviar a cobro' : 'Enviar a caja'}
              </button>
            ) : null}
            {usaFlujoSeparado && puedeUsarCuentaCorriente(selectedClienteId) ? (
              <button
                type="button"
                onClick={onCargarCuentaCorriente}
                disabled={isBusy || !cartItems.length || !posAccess.puedeCrearVentaPendiente}
                className="flex items-center justify-center gap-2 rounded bg-[#0f766e] px-4 py-3 text-[14px] font-semibold text-white hover:bg-[#115e59] disabled:opacity-60"
              >
                {crearCuentaCorrienteIsPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <CreditCard size={16} />
                )}
                Cuenta corriente
              </button>
            ) : null}
            {permiteCobroDirecto ? (
              <button
                type="button"
                onClick={onFinalizar}
                disabled={isBusy || !cartItems.length || !cajaAbierta || !posAccess.puedeVenderYCobrar}
                className="flex items-center justify-center gap-2 rounded bg-[#075E54] px-4 py-3 text-[14px] font-semibold text-white hover:bg-[#0b6d62] disabled:opacity-60"
              >
                {ventaCompletaIsPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <CreditCard size={16} />
                )}
                {usaDespacho ? 'Cobrar y despachar' : 'Cobrar'}
              </button>
            ) : null}
            {permiteCobroDirecto && mercadoPagoDisponible ? (
              <button
                type="button"
                onClick={onCobrarQrCarrito}
                disabled={isBusy || !cartItems.length || !cajaAbierta || !posAccess.puedeVenderYCobrar}
                className="flex items-center justify-center gap-2 rounded bg-[#0f766e] px-4 py-3 text-[14px] font-semibold text-white hover:bg-[#115e59] disabled:opacity-60"
              >
                {crearVentaQrIsPending || crearOrdenQrIsPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <QrCode size={16} />
                )}
                Cobrar QR
              </button>
            ) : null}
          </div>

          {usaFlujoSeparado && posAccess.puedeCobrarPendiente ? (
            <div className="mt-4 rounded border border-[#c4c6cd] bg-white">
              <div className="flex items-center justify-between border-b border-[#c4c6cd] px-4 py-2">
                <span className="text-[12px] font-bold uppercase tracking-wide text-[#44474c]">
                  Pendientes de cobro
                </span>
                <ReceiptText size={15} className="text-[#075E54]" />
              </div>
              <div className="max-h-[190px] overflow-auto px-3 py-3">
                {ventasPendientes.length === 0 ? (
                  <div className="rounded border border-dashed border-[#c4c6cd] px-3 py-5 text-center text-[13px] text-[#44474c]">
                    Sin ventas pendientes
                  </div>
                ) : (
                  <div className="space-y-2">
                    {ventasPendientes.map((venta) => (
                      <div
                        key={venta.id}
                        className="flex items-center justify-between gap-3 rounded border border-[#e5e7eb] bg-[#f8fafc] px-3 py-2"
                      >
                        <div className="min-w-0">
                          <div className="truncate text-[13px] font-semibold text-[#041627]">
                            {venta.numero}
                          </div>
                          <div className="text-[12px] text-[#44474c]">
                            {formatCurrency(toNumber(venta.total))}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => onCobrarPendiente(venta)}
                          disabled={cobrarPendienteIsPending || !posAccess.puedeCobrarPendiente}
                          className="rounded bg-[#075E54] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[#0b6d62] disabled:opacity-60"
                        >
                          Cobrar
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
