import type { RouteObject } from 'react-router';
import PuntoDeVentaPages from './Pages/PuntoDeVentaPages';

export const puntoDeVentaRoutes: RouteObject[] = [
  {
    path: 'punto-venta',
    children: [
      {
        index: true,
        element: <PuntoDeVentaPages />,
      },
      // Agrega más rutas aquí según sea necesario
      // {
      //   path: "nuevo",
      //   element: <PuntoDeVentaForm />,
      // },
    ],
  },
];
