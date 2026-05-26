import { RouteObject } from 'react-router-dom';
import EmpleadoDetailView from './pages/Empleadodetailview';

export const empleadosRoutes: RouteObject[] = [
  {
    path: 'empleados',
    children: [
      {
        index: true,
        element: <EmpleadoDetailView />,
      },
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
