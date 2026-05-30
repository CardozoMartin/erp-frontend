import { useMemo } from "react";
import { useAuthStore } from "./auth.store";

export const usePermisos = () => {
  const { permisos } = useAuthStore();

  const permisosSet = useMemo(() => new Set(permisos), [permisos]);
  return {
    tiene: (permiso: string) => permisosSet.has(permiso),
    tieneAlguno: (...lista: string[]) => lista.some(p => permisosSet.has(p)),
    tieneTodos: (...lista: string[]) => lista.every(p => permisosSet.has(p)),
  };
};
