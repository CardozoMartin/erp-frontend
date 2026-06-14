import { create } from 'zustand';
import type { ICartItem, IListaPrecioPos } from '../types/pos.type';
import type { IProducto } from '../../Productos/types/productos.type';
import { applyPriceList, getProductPrice, getStockForBranch } from '../utils/pos.utils';

// ─── Tipos locales ────────────────────────────────────────────────────────────

interface CarritoStore {
  items: ICartItem[];
  // 1.- Agregar producto al carrito respetando el stock disponible
  agregarProducto: (producto: IProducto, sucursalId: string | null | undefined, listaActiva: IListaPrecioPos | undefined, puedeAplicarLista: boolean) => 'ok' | 'sin_stock';
  // 2.- Cambiar la cantidad de un item del carrito
  cambiarCantidad: (productoId: string, delta: number, sucursalId: string | null | undefined) => void;
  // 3.- Quitar un producto del carrito
  quitarProducto: (productoId: string) => void;
  // 4.- Limpiar el carrito por completo
  limpiarCarrito: () => void;
  // 5.- Recalcular precios al cambiar de lista de precios
  recalcularPrecios: (listaActiva: IListaPrecioPos | undefined, puedeAplicarLista: boolean) => void;
}

export const useCarritoStore = create<CarritoStore>((set, get) => ({
  items: [],

  agregarProducto: (producto, sucursalId, listaActiva, puedeAplicarLista) => {
    const stock = getStockForBranch(producto, sucursalId);
    const cantidadActual = get().items.find(i => i.producto.id === producto.id)?.cantidad ?? 0;
    if (stock <= cantidadActual) return 'sin_stock';

    const precio = applyPriceList(
      getProductPrice(producto),
      puedeAplicarLista ? listaActiva : undefined,
    );

    set(estado => {
      const existe = estado.items.find(i => i.producto.id === producto.id);
      if (existe) {
        return {
          items: estado.items.map(i =>
            i.producto.id === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i,
          ),
        };
      }
      return { items: [...estado.items, { producto, cantidad: 1, precioUnitario: precio }] };
    });

    return 'ok';
  },

  cambiarCantidad: (productoId, delta, sucursalId) => {
    set(estado => ({
      items: estado.items
        .map(item => {
          if (item.producto.id !== productoId) return item;
          const stock = getStockForBranch(item.producto, sucursalId);
          return { ...item, cantidad: Math.max(0, Math.min(item.cantidad + delta, stock)) };
        })
        .filter(item => item.cantidad > 0),
    }));
  },

  quitarProducto: (productoId) => {
    set(estado => ({ items: estado.items.filter(i => i.producto.id !== productoId) }));
  },

  limpiarCarrito: () => set({ items: [] }),

  recalcularPrecios: (listaActiva, puedeAplicarLista) => {
    set(estado => ({
      items: estado.items.map(item => ({
        ...item,
        precioUnitario: applyPriceList(
          getProductPrice(item.producto),
          puedeAplicarLista ? listaActiva : undefined,
        ),
      })),
    }));
  },
}));
