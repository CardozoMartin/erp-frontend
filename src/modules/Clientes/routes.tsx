import type { RouteObject } from 'react-router';
import ClientesPage from './pages/ClientesPage';
import CuentaCorrientePage from './pages/CuentaCorrientePage';

export const clientesRoutes: RouteObject[] = [
  {
    path: 'clientes',
    element: <ClientesPage />,
  },
  {
    path: 'clientes/nuevo',
    element: <ClientesPage />,
  },
  {
    path: 'clientes/:clienteId',
    element: <ClientesPage />,
  },
  {
    path: 'clientes/:clienteId/cuenta',
    element: <ClientesPage />,
  },
  {
    path: 'cuenta-corriente',
    element: <CuentaCorrientePage />,
  },
];
