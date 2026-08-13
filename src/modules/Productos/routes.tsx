import type { RouteObject } from 'react-router';
import ProductForm from './components/ProductForm';
import ProductCategoryPages from './Pages/ProductCategoryPages';
import ProductDetailView from './Pages/Productdetailview';
import ProductosPages from './Pages/ProductosPages';
import ProductsMarcaPage from './Pages/ProductsMarcaPage';
import ListasPrecioPage from './Pages/ListasPrecioPage';
import AlertasStockPage from './Pages/AlertasStockPage';
import ImportarProductosPage from './Pages/ImportarProductosPage';
import { RutaProtegida } from '../../components/common/RutaProtegida';

export const productosRoutes: RouteObject[] = [
  {
    path: 'listas-precio',
    element: <ListasPrecioPage />,
  },
  {
    path: 'productos/stock',
    element: <AlertasStockPage />,
  },
  {
    path: 'productos/importar',
    element: <ImportarProductosPage />,
  },
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
