import type { RouteObject } from 'react-router';
import ProductForm from './components/ProductForm';
import ProductCategoryPages from './Pages/ProductCategoryPages';
import ProductDetailView from './Pages/Productdetailview';
import ProductosPages from './Pages/ProductosPages';
import ProductsMarcaPage from './Pages/ProductsMarcaPage';
import { RutaProtegida } from '../../components/common/RutaProtegida';

export const productosRoutes: RouteObject[] = [
  {
    path: 'productos',
    element: <RutaProtegida conLayout={false} />,
    children: [
      {
        index: true,
        element: <ProductosPages />,
      },
      {
        path: 'nuevo',
        element: <ProductForm />,
      },
      {
        path: 'detalles',
        element: <ProductDetailView />,
      },
      {
        path: 'category',
        element: <ProductCategoryPages />,
      },
      {
        path: 'marca',
        element: <ProductsMarcaPage />,
      },
    ],
  },
];
