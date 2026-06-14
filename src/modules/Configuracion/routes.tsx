import type { RouteObject } from 'react-router';
import AjustesPage from './pages/AjustesPage';
import ConfiguracionPosPage from './pages/ConfiguracionPosPage';
import ConfiguracionEmailPage from './pages/ConfiguracionEmailPage';
import ConfiguracionCloudinaryPage from './pages/ConfiguracionCloudinaryPage';
import ConfiguracionMercadoPagoPage from './pages/ConfiguracionMercadoPagoPage';

export const configuracionRoutes: RouteObject[] = [
  {
    path: 'ajustes',
    element: <AjustesPage />,
  },
  {
    path: 'configuracion-pos',
    element: <ConfiguracionPosPage />,
  },
  {
    path: 'configuracion-email',
    element: <ConfiguracionEmailPage />,
  },
  {
    path: 'configuracion-cloudinary',
    element: <ConfiguracionCloudinaryPage />,
  },
  {
    path: 'configuracion-mercadopago',
    element: <ConfiguracionMercadoPagoPage />,
  },
];
