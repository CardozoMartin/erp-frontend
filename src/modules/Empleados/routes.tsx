import type { RouteObject } from 'react-router';
import EmpleadosPages from './pages/EmpleadosPages';
import EmpleadoDetailView from './pages/Empleadodetailview';
import EmpleadoCreatePage from './pages/EmpleadoCreatePage';

export const empleadosRoutes: RouteObject[] = [
  {
    path: 'empleados',
    children: [
      {
        index: true,
        element: <EmpleadosPages />,
      },
      { path: 'nuevo', element: <EmpleadoCreatePage /> },
      { path: ':id', element: <EmpleadoDetailView /> },
      // Agrega más rutas aquí según sea necesario
      // {
      //   path: "nuevo",
      //   element: <EmpleadoForm />,
      // },
      // {
      //   path: ":id/editar",
      //   element: <EmpleadoForm />,
      // },
    ],
  },
];
