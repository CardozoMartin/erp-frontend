import { RouteObject } from 'react-router-dom';
import SucursalPages from './Pages/SucursalPages';
import SucursalForm from './components/SucursalForm';

export const sucursalRoutes: RouteObject[] = [
  {
    path: 'sucursales',
    children: [
      {
        index: true,
        element: <SucursalPages />,
      },
      {
        path: 'nuevo',
        element: <SucursalForm />,
      },
      // {
      //   path: ":id/editar",
      //   element: <SucursalForm />,
      // },
    ],
  },
];
