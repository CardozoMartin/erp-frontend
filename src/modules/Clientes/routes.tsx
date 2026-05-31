import type { RouteObject } from 'react-router';
import ClientesPage from './pages/ClientesPage';

export const clientesRoutes: RouteObject[] = [
  {
    path: 'clientes',
    element: <ClientesPage />,
  },
];
