import {
  Calculator,
  CreditCard,
  Plus,
  ReceiptText,
  Search,
  Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';

type PriceList = {
  id: string;
  nombre: string;
};

type PaymentMethod = {
  id: string;
  nombre: string;
};

type Product = {
  id: string;
  nombre: string;
  sku: string;
  precio: number;
};

type CartItem = Product & {
  cantidad: number;
};

type PosCapabilities = {
  canSell: boolean;
  canCharge: boolean;
  canSendToCentralCashier: boolean;
  canReceiveTransferredSales: boolean;
  canTransferSaleToAnotherTerminal: boolean;
};

const priceLists: PriceList[] = [
  { id: 'minorista', nombre: 'Minorista' },
  { id: 'mayorista', nombre: 'Mayorista' },
  { id: 'promocion', nombre: 'Promocion' },
];

const paymentMethods: PaymentMethod[] = [
  { id: 'efectivo', nombre: 'Efectivo' },
  { id: 'debito', nombre: 'Tarjeta Debito' },
  { id: 'credito', nombre: 'Tarjeta Credito' },
  { id: 'transferencia', nombre: 'Transferencia' },
  { id: 'qr', nombre: 'QR' },
];

const products: Product[] = [
  { id: '1', nombre: 'Yerba 500g', sku: 'YER-500', precio: 4850 },
  { id: '2', nombre: 'Cafe Blend 250g', sku: 'CAF-250', precio: 6900 },
  { id: '3', nombre: 'Galletas Artesanales', sku: 'GAL-180', precio: 3200 },
  { id: '4', nombre: 'Taza Termica 350ml', sku: 'TAZ-350', precio: 12400 },
  { id: '5', nombre: 'Sandwich Caprese', sku: 'SND-CAP', precio: 8700 },
  { id: '6', nombre: 'Jugo Natural 1L', sku: 'JUG-1L', precio: 4100 },
];

const initialCart: CartItem[] = [
  { ...products[0], cantidad: 1 },
  { ...products[2], cantidad: 2 },
];

// Mock inicial para dejar la UI lista para futuras configuraciones por rol/caja.
const mockCapabilities: PosCapabilities = {
  canSell: true,
  canCharge: true,
  canSendToCentralCashier: true,
  canReceiveTransferredSales: true,
  canTransferSaleToAnotherTerminal: true,
};

const formatCurrency = (value: number) =>
  value.toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  });

const PuntoDeVentaPages = () => {
  const [search, setSearch] = useState('');
  const [selectedPriceList, setSelectedPriceList] = useState(priceLists[0].id);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(
    paymentMethods[0].id,
  );
  const [cartItems] = useState<CartItem[]>(initialCart);
  const capabilities = mockCapabilities;

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return products;

    return products.filter((product) => {
      return (
        product.nombre.toLowerCase().includes(term) ||
        product.sku.toLowerCase().includes(term)
      );
    });
  }, [search]);

  const subtotal = cartItems.reduce(
    (total, item) => total + item.precio * item.cantidad,
    0,
  );
  const total = subtotal;
  const selectedPaymentLabel =
    paymentMethods.find((method) => method.id === selectedPaymentMethod)
      ?.nombre ?? '-';

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#f3f4f6] px-4 py-4">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-4">
        <section className="rounded-lg border border-[#c4c6cd] bg-white shadow-sm">
          <div className="grid gap-3 border-b border-[#c4c6cd] px-4 py-3 lg:grid-cols-[180px_180px_160px_160px_1fr_160px]">
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[#44474c]">
                Lista de precio
              </label>
              <select
                value={selectedPriceList}
                onChange={(event) => setSelectedPriceList(event.target.value)}
                className="w-full rounded border border-[#c4c6cd] bg-white px-3 py-2 text-[14px] text-[#041627] outline-none focus:border-[#075E54]"
              >
                {priceLists.map((list) => (
                  <option key={list.id} value={list.id}>
                    {list.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[#44474c]">
                Medio de pago
              </label>
              {capabilities.canCharge ? (
                <select
                  value={selectedPaymentMethod}
                  onChange={(event) =>
                    setSelectedPaymentMethod(event.target.value)
                  }
                  className="w-full rounded border border-[#c4c6cd] bg-white px-3 py-2 text-[14px] text-[#041627] outline-none focus:border-[#075E54]"
                >
                  {paymentMethods.map((method) => (
                    <option key={method.id} value={method.id}>
                      {method.nombre}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  value="Cobro en caja central"
                  readOnly
                  className="w-full rounded border border-[#c4c6cd] bg-[#f8f9fa] px-3 py-2 text-[14px] text-[#041627] outline-none"
                />
              )}
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[#44474c]">
                Vendedor
              </label>
              <input
                value="Carlos Lopez"
                readOnly
                className="w-full rounded border border-[#c4c6cd] bg-[#f8f9fa] px-3 py-2 text-[14px] text-[#041627] outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[#44474c]">
                Sucursal
              </label>
              <input
                value="Casa Central"
                readOnly
                className="w-full rounded border border-[#c4c6cd] bg-[#f8f9fa] px-3 py-2 text-[14px] text-[#041627] outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[#44474c]">
                Fecha
              </label>
              <input
                value="26/05/2026 10:30"
                readOnly
                className="w-full rounded border border-[#c4c6cd] bg-[#f8f9fa] px-3 py-2 text-[14px] text-[#041627] outline-none"
              />
            </div>

            <div className="flex items-end">
              <button className="flex w-full items-center justify-center gap-2 rounded bg-[#075E54] px-4 py-2 text-[14px] font-medium text-white transition-colors hover:bg-[#0b6d62]">
                <ReceiptText size={16} />
                Cotizacion
              </button>
            </div>
          </div>

          <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
            <section className="border-b border-[#c4c6cd] lg:border-b-0 lg:border-r">
              <div className="border-b border-[#c4c6cd] bg-[#fbf9fa] px-4 py-3">
                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#44474c]"
                  />
                  <input
                    type="text"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Buscar producto por nombre o codigo"
                    className="w-full rounded border border-[#c4c6cd] bg-white py-2 pl-10 pr-3 text-[14px] text-[#041627] outline-none focus:border-[#075E54]"
                  />
                </div>
              </div>

              <div className="max-h-[560px] overflow-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-[#f4f5f6]">
                      <th className="border-b border-[#c4c6cd] px-4 py-3 text-left text-[12px] font-bold uppercase tracking-wide text-[#44474c]">
                        Producto
                      </th>
                      <th className="border-b border-[#c4c6cd] px-4 py-3 text-left text-[12px] font-bold uppercase tracking-wide text-[#44474c]">
                        Codigo
                      </th>
                      <th className="border-b border-[#c4c6cd] px-4 py-3 text-right text-[12px] font-bold uppercase tracking-wide text-[#44474c]">
                        Precio
                      </th>
                      <th className="border-b border-[#c4c6cd] px-4 py-3 text-center text-[12px] font-bold uppercase tracking-wide text-[#44474c]">
                        Accion
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => (
                      <tr
                        key={product.id}
                        className="border-b border-[#e5e7eb] hover:bg-[#f8fafc]"
                      >
                        <td className="px-4 py-3 text-[14px] font-medium text-[#041627]">
                          {product.nombre}
                        </td>
                        <td className="px-4 py-3 text-[13px] text-[#44474c]">
                          {product.sku}
                        </td>
                        <td className="px-4 py-3 text-right text-[14px] font-semibold text-[#041627]">
                          {formatCurrency(product.precio)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button className="inline-flex items-center gap-1 rounded border border-[#c4c6cd] bg-white px-3 py-1.5 text-[12px] font-medium text-[#075E54] hover:bg-[#f3fbf9]">
                            <Plus size={14} />
                            Agregar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <aside className="flex flex-col">
              <div className="border-b border-[#c4c6cd] bg-[#fbf9fa] px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-[14px] font-semibold text-[#041627]">
                    <Calculator size={16} className="text-[#075E54]" />
                    Carrito
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {capabilities.canCharge ? (
                      <span className="rounded border border-[#cfe2de] bg-[#f3fbf9] px-2.5 py-1 text-[11px] font-medium text-[#075E54]">
                        Cobra: {selectedPaymentLabel}
                      </span>
                    ) : null}
                    {capabilities.canSendToCentralCashier ? (
                      <span className="rounded border border-[#f0d7a6] bg-[#fff7e8] px-2.5 py-1 text-[11px] font-medium text-[#9a6700]">
                        Enviar a caja central
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="max-h-[420px] flex-1 overflow-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-[#f4f5f6]">
                      <th className="border-b border-[#c4c6cd] px-4 py-3 text-left text-[12px] font-bold uppercase tracking-wide text-[#44474c]">
                        Producto
                      </th>
                      <th className="border-b border-[#c4c6cd] px-4 py-3 text-center text-[12px] font-bold uppercase tracking-wide text-[#44474c]">
                        Cant.
                      </th>
                      <th className="border-b border-[#c4c6cd] px-4 py-3 text-right text-[12px] font-bold uppercase tracking-wide text-[#44474c]">
                        Total
                      </th>
                      <th className="border-b border-[#c4c6cd] px-4 py-3 text-center text-[12px] font-bold uppercase tracking-wide text-[#44474c]">
                        Quitar
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {cartItems.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-[#e5e7eb] hover:bg-[#f8fafc]"
                      >
                        <td className="px-4 py-3 text-[14px] font-medium text-[#041627]">
                          {item.nombre}
                        </td>
                        <td className="px-4 py-3 text-center text-[14px] text-[#041627]">
                          {item.cantidad}
                        </td>
                        <td className="px-4 py-3 text-right text-[14px] font-semibold text-[#041627]">
                          {formatCurrency(item.precio * item.cantidad)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button className="inline-flex h-8 w-8 items-center justify-center rounded border border-[#f1c7c7] bg-[#fff5f5] text-[#b42318] hover:bg-[#fdecec]">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-[#c4c6cd] bg-[#fbf9fa] px-4 py-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[14px] text-[#44474c]">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[18px] font-bold text-[#041627]">
                    <span>Total</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <button className="rounded border border-[#c4c6cd] bg-white px-4 py-3 text-[14px] font-medium text-[#041627] hover:bg-[#f4f5f6]">
                    Limpiar
                  </button>
                  {capabilities.canCharge ? (
                    <button className="flex items-center justify-center gap-2 rounded bg-[#075E54] px-4 py-3 text-[14px] font-semibold text-white hover:bg-[#0b6d62]">
                      <CreditCard size={16} />
                      Finalizar venta
                    </button>
                  ) : capabilities.canSendToCentralCashier ? (
                    <button className="flex items-center justify-center gap-2 rounded bg-[#075E54] px-4 py-3 text-[14px] font-semibold text-white hover:bg-[#0b6d62]">
                      <ReceiptText size={16} />
                      Enviar a caja
                    </button>
                  ) : (
                    <button
                      disabled
                      className="flex items-center justify-center gap-2 rounded bg-[#c4c6cd] px-4 py-3 text-[14px] font-semibold text-white"
                    >
                      Accion no disponible
                    </button>
                  )}
                </div>

                {capabilities.canTransferSaleToAnotherTerminal ? (
                  <div className="mt-3">
                    <button className="w-full rounded border border-[#c4c6cd] bg-white px-4 py-3 text-[14px] font-medium text-[#041627] hover:bg-[#f4f5f6]">
                      Transferir venta a otra caja
                    </button>
                  </div>
                ) : null}

                {capabilities.canReceiveTransferredSales ? (
                  <div className="mt-4 rounded border border-[#c4c6cd] bg-white">
                    <div className="border-b border-[#c4c6cd] px-4 py-2 text-[12px] font-bold uppercase tracking-wide text-[#44474c]">
                      Ventas recibidas
                    </div>
                    <div className="space-y-2 px-4 py-3">
                      <div className="flex items-center justify-between rounded border border-[#e5e7eb] bg-[#f8fafc] px-3 py-2 text-[13px]">
                        <span className="font-medium text-[#041627]">
                          Pedido #POS-0182
                        </span>
                        <span className="text-[#44474c]">
                          {formatCurrency(15400)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded border border-[#e5e7eb] bg-[#f8fafc] px-3 py-2 text-[13px]">
                        <span className="font-medium text-[#041627]">
                          Pedido #POS-0183
                        </span>
                        <span className="text-[#44474c]">
                          {formatCurrency(28750)}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </aside>
          </div>
        </section>
      </div>
    </div>
  );
};

export default PuntoDeVentaPages;
