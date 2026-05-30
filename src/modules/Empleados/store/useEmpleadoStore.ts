import { create } from 'zustand';
import type { IEmpleado } from '../types/empleado.type';

interface EmpleadoStore {
  empleado: IEmpleado | null;
  setEmpleado: (empleado: IEmpleado) => void;
  clearEmpleado: () => void;
}

// Store simple para compartir el empleado seleccionado entre la tabla y la ficha.
export const useEmpleadoStore = create<EmpleadoStore>((set) => ({
  empleado: null,
  setEmpleado: (empleado) => set({ empleado }),
  clearEmpleado: () => set({ empleado: null }),
}));
