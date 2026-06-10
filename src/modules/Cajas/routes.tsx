import type { RouteObject } from 'react-router';
import CajaPages from './Pages/CajaPages';

export const cajasRoutes: RouteObject[] = [
  {
    path: 'caja',
    children: [
      { index: true, element: <CajaPages /> },
      { path: 'movimientos', element: <CajaPages /> },
      { path: 'cierre', element: <CajaPages /> },
      { path: 'ingreso', element: <CajaPages /> },
      { path: ':cajaId', element: <CajaPages /> },
      { path: ':cajaId/cierre', element: <CajaPages /> },
    ],
  },
];
