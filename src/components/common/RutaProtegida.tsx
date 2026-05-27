// components/common/RutaProtegida.tsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../../store/auth.store";

interface Props {
  permiso?: string;
}

export function RutaProtegida({ permiso }: Props) {
  const token = useAuthStore((s) => s.token);
  const tienePermiso = useAuthStore((s) => s.tienePermiso);

  // Sin sesión → login
  if (!token) return <Navigate to="/login" replace />;

  // Sin permiso → sin acceso
  if (permiso && !tienePermiso(permiso)) {
    return <Navigate to="/sin-acceso" replace />;
  }

  return <Outlet />;
}
