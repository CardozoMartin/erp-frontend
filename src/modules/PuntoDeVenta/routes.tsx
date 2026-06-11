import type { RouteObject } from 'react-router';
import PuntoDeVentaPages from './Pages/PuntoDeVentaPages';
import VentasCajaPage from './Pages/VentasCajaPage';

export const puntoDeVentaRoutes: RouteObject[] = [
  {
    path: 'punto-venta',
    children: [
      {
        index: true,
        element: <PuntoDeVentaPages />,
      },
      {
        path: 'ventas-caja',
        element: <VentasCajaPage />,
      },
    ],
  },
];
