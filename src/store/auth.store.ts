// stores/auth.store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { LoginResponse } from '../type/auth.types'


interface Sucursal {
  id: string
  nombre: string
  esPrincipal: boolean
}

interface Ruta {
  path: string
  label: string
}

interface Empleado {
  id: string
  nombreCompleto: string
  email: string
  cargo: string
  foto_url: string | null
}

interface AuthState {
  token: string | null
  empleado: Empleado | null
  permisos: string[]
  rutas: Ruta[]
  rutaInicio: string
  sucursales: Sucursal[]
  sucursalActiva: Sucursal | null

  // Acciones
  setSession: (data: LoginResponse) => void
  cerrarSesion: () => void
  tienePermiso: (permiso: string) => boolean
  setSucursalActiva: (sucursal: Sucursal) => void
  cambiarSucursalActiva: (token: string, sucursal: Pick<Sucursal, 'id' | 'nombre'>) => void
}

const getSucursalDefault = (sucursales: Sucursal[], sucursalActivaId?: string | null) =>
  sucursales.find((s) => s.id === sucursalActivaId) ??
  sucursales.find((s) => s.esPrincipal) ??
  sucursales[0] ??
  null;

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      empleado: null,
      permisos: [],
      rutas: [],
      rutaInicio: '/',
      sucursales: [],
      sucursalActiva: null,

      setSession: (data) => set({
        token: data.token,
        empleado: data.empleado,
        permisos: data.permisos,
        rutas: data.rutas,
        rutaInicio: data.rutaInicio,
        sucursales: data.sucursales,
        sucursalActiva: getSucursalDefault(data.sucursales, data.sucursalActivaId),
      }),

      cerrarSesion: () => set({
        token: null,
        empleado: null,
        permisos: [],
        rutas: [],
        rutaInicio: '/',
        sucursales: [],
        sucursalActiva: null,
      }),

      tienePermiso: (permiso) => get().permisos.includes(permiso),

      setSucursalActiva: (sucursal) => set({ sucursalActiva: sucursal }),
      cambiarSucursalActiva: (token, sucursal) =>
        set((state) => {
          const sucursalEnSesion =
            state.sucursales.find((item) => item.id === sucursal.id) ?? {
              ...sucursal,
              esPrincipal: false,
            };

          return {
            token,
            sucursales: state.sucursales.some((item) => item.id === sucursal.id)
              ? state.sucursales
              : [...state.sucursales, sucursalEnSesion],
            sucursalActiva: sucursalEnSesion,
          };
        }),
    }),
    {
      name: 'auth-session', // clave en localStorage
      merge: (persistedState, currentState) => {
        const state = {
          ...currentState,
          ...(persistedState as Partial<AuthState>),
        };
        if (!state.sucursalActiva && state.sucursales?.length) {
          state.sucursalActiva = getSucursalDefault(state.sucursales);
        }
        return state;
      },
      partialize: (state) => ({
        // Solo persistir esto, no las funciones
        token: state.token,
        empleado: state.empleado,
        permisos: state.permisos,
        rutas: state.rutas,
        rutaInicio: state.rutaInicio,
        sucursales: state.sucursales,
        sucursalActiva: state.sucursalActiva,
      }),
    }
  )
)
