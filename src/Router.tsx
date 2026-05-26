import type { RouteObject } from 'react-router';
import { BrowserRouter, useRoutes } from 'react-router-dom';
import Navbar from './components/common/Navbar';
import { cajasRoutes } from './modules/Cajas/routes';
import { empleadosRoutes } from './modules/Empleados/routes';
import { productosRoutes } from './modules/Productos/routes';
import { puntoDeVentaRoutes } from './modules/PuntoDeVenta/routes';
import { sucursalRoutes } from './modules/Sucursal/routes';

const appRoutes: RouteObject[] = [
  { path: '/', element: <div>Home</div> },
  ...puntoDeVentaRoutes,
  ...productosRoutes,
  ...sucursalRoutes,
  ...empleadosRoutes,
  ...cajasRoutes,
];

function AppRoutes() {
  return useRoutes(appRoutes);
}

const Router = () => {
  return (
    <BrowserRouter>
      <Navbar />
      <AppRoutes />
    </BrowserRouter>
  );
};

export default Router;
