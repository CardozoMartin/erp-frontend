import { BrowserRouter, Route, Routes } from "react-router-dom";
import Navbar from "./components/common/Navbar";
import ProductosPages from "./modules/Productos/Pages/ProductosPages";
import PuntoDeVentaPages from "./modules/PuntoDeVenta/Pages/PuntoDeVentaPages";
import ProductCategoryPages from "./modules/Productos/Pages/ProductCategoryPages";
import ProductForm from "./modules/Productos/components/ProductForm";
import SucursalPages from "./modules/Sucursal/Pages/SucursalPages";
import SucursalForm from "./modules/Sucursal/components/SucursalForm";

const Router = () => {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<div>Home</div>} />

        <Route path="/punto-venta" element={<PuntoDeVentaPages />} />
        {/* Rutas del Modulo de Producto */}
        <Route path="/productos" element={<ProductosPages />} />
        <Route path="/productos/nuevo" element={<ProductForm />} />
        <Route path="/productos/category" element={<ProductCategoryPages />} />
        <Route path="/sucursales" element={<SucursalPages />} />
        <Route path="/sucursales/nuevo" element={<SucursalForm />} />
      </Routes>
    </BrowserRouter>
  );
};

export default Router;
