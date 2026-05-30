import type { RouteObject } from 'react-router';
import CajaPages from './Pages/CajaPages';

export const cajasRoutes: RouteObject[] = [
  {
    path: 'cajas',
    children: [
      {
        index: true,
        element: <CajaPages />,
      },
      // Agrega más rutas aquí según sea necesario
      // {
      //   path: "nuevo",
      //   element: <CajaForm />,
      // },
      // {
      //   path: ":id/movimientos",
      //   element: <CajaMovimientos />,
      // },
    ],
  },
];
