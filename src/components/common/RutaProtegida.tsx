import { matchPath, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import Navbar from './Navbar';

interface Props {
  permiso?: string;
  conLayout?: boolean;
}

export function RutaProtegida({ permiso, conLayout = true }: Props) {
  const token = useAuthStore((s) => s.token);
  const tienePermiso = useAuthStore((s) => s.tienePermiso);
  const rutas = useAuthStore((s) => s.rutas);
  const rutaInicio = useAuthStore((s) => s.rutaInicio);
  const location = useLocation();

  if (!token) return <Navigate to="/login" replace />;

  if (location.pathname === '/') {
    return <Navigate to={rutaInicio || '/sin-acceso'} replace />;
  }

  if (permiso && !tienePermiso(permiso)) {
    return <Navigate to="/sin-acceso" replace />;
  }

  const tieneRuta = rutas.some((ruta) =>
    matchPath({ path: ruta.path, end: true }, location.pathname),
  );

  if (!tieneRuta) {
    return <Navigate to="/sin-acceso" replace />;
  }

  if (conLayout) {
    return (
      <>
        <Navbar />
        <Outlet />
      </>
    );
  }

  return <Outlet />;
}
