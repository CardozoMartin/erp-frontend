import { RouteObject } from 'react-router-dom';
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
