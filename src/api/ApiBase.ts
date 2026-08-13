import axios from 'axios';
import { useAuthStore } from '../store/auth.store';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — agrega el token JWT a cada solicitud
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Flag para evitar múltiples refreshes simultáneos
let refreshPromise: Promise<string> | null = null;

const renovarToken = async (): Promise<string> => {
  const { refreshToken, setToken, cerrarSesion } = useAuthStore.getState();
  if (!refreshToken) {
    cerrarSesion();
    window.location.href = '/login';
    throw new Error('Sin refresh token');
  }

  try {
    const { data } = await axios.post<{ token: string; refreshToken: string }>(
      `${API_BASE_URL}/auth/refresh`,
      { refreshToken },
    );
    setToken(data.token, data.refreshToken);
    return data.token;
  } catch {
    cerrarSesion();
    window.location.href = '/login';
    throw new Error('Sesión expirada');
  }
};

// Response interceptor — renueva token en 401, muestra modal en 403
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const url: string = error.config?.url ?? '';
    const isRetry: boolean = error.config?._retry ?? false;

    // Rutas de auth — no reintentar para evitar loops
    const esRutaAuth = url.includes('/auth/login') || url.includes('/auth/refresh');

    if (status === 401 && !esRutaAuth && !isRetry) {
      error.config._retry = true;

      // Si ya hay un refresh en curso, esperar al mismo
      if (!refreshPromise) {
        refreshPromise = renovarToken().finally(() => {
          refreshPromise = null;
        });
      }

      try {
        const nuevoToken = await refreshPromise;
        error.config.headers.Authorization = `Bearer ${nuevoToken}`;
        return api(error.config);
      } catch {
        return Promise.reject(error);
      }
    }

    if (status === 401 && (esRutaAuth || isRetry)) {
      useAuthStore.getState().cerrarSesion();
      window.location.href = '/login';
    }

    if (status === 403) {
      const mensaje =
        error.response?.data?.mensaje ?? 'No tenés autorización para realizar esta acción.';
      window.dispatchEvent(new CustomEvent('permiso-denegado', { detail: { mensaje } }));
    }

    return Promise.reject(error);
  },
);
