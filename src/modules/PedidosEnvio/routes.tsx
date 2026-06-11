import type { RouteObject } from 'react-router';
import PedidosEnvioPage from './pages/PedidosEnvioPage';

export const pedidosEnvioRoutes: RouteObject[] = [
  {
    path: 'pedidos-envio',
    element: <PedidosEnvioPage />,
  },
];
