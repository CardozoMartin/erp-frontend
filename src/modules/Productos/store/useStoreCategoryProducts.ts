import { create } from 'zustand';

interface Category {
  id: number;
  name: string;
  store: string;
  storeColor: 'primary' | 'tertiary' | 'secondary' | 'error';
  description: string;
  products: number;
  icon: string;
  color_identificador?: string;
  padre_id?: string | null;
}

//En el store vamos a guardar la categoria para pasarla al modal para editarla
interface ICategoryStore {
  category: Category | null;
  setCategory: (category: Category | null) => void;
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}

export const useCategoryStore = create<ICategoryStore>((set) => ({
  category: null,
  setCategory: (category) => set({ category }),
  isModalOpen: false,
  openModal: () => {
    set({ isModalOpen: true });
  },
  closeModal: () => set({ isModalOpen: false, category: null }),
}));
