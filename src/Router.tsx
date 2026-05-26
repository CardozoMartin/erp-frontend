import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Navbar from './components/common/Navbar';
// Importar rutas de cada módulo
import { cajasRoutes } from './modules/Cajas/routes';
import { empleadosRoutes } from './modules/Empleados/routes';
import { productosRoutes } from './modules/Productos/routes';
import { puntoDeVentaRoutes } from './modules/PuntoDeVenta/routes';
import { sucursalRoutes } from './modules/Sucursal/routes';

const Router = () => {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<div>Home</div>} />

        {/* Rutas de Módulos */}
        {puntoDeVentaRoutes.map((route) => (
          <Route key={route.path} {...route} />
        ))}
        {productosRoutes.map((route) => (
          <Route key={route.path} {...route} />
        ))}
        {sucursalRoutes.map((route) => (
          <Route key={route.path} {...route} />
        ))}
        {empleadosRoutes.map((route) => (
          <Route key={route.path} {...route} />
        ))}
        {cajasRoutes.map((route) => (
          <Route key={route.path} {...route} />
        ))}
      </Routes>
    </BrowserRouter>
  );
};

export default Router;
