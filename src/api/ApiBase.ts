import axios from "axios";
import { useAuthStore } from "../store/auth.store";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para agregar el token de autenticación a cada solicitud
// Request interceptor — agrega el token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — maneja 401/403
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url ?? "";

    if (status === 401 && !url.includes("/auth/login")) {
      // Token expirado o inválido en solicitudes protegidas → cerrar sesión
      useAuthStore.getState().cerrarSesion();
      window.location.href = "/login";
    }
    if (status === 403) {
      // Sin permiso → redirigir o mostrar error
      console.warn("Sin permisos para esta acción");
    }
    return Promise.reject(error);
  },
);
