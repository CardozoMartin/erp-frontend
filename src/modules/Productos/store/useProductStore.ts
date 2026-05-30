import { create } from "zustand";
import type { IProducto } from "../types/productos.type";

interface ProductStore {
  product: IProducto | null;
  setProduct: (product: IProducto) => void;
  setClearProduct: () => void;
}

//vamos a guardar el producto para pasarlo al formulario de producto para editarlo
export const useProductStore = create<ProductStore>((set) => ({
  product: null,
  setProduct: (product:IProducto) => set({ product }),
  setClearProduct: () => set({ product: null }),
}));
