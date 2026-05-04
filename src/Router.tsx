import { BrowserRouter, Route, Routes } from "react-router-dom";
import Navbar from "./components/common/Navbar";
import ProductosPages from "./modules/Productos/Pages/ProductosPages";
import PuntoDeVentaPages from "./modules/PuntoDeVenta/Pages/PuntoDeVentaPages";

const Router = () => {
  return (
    <BrowserRouter>
    <Navbar />
    <Routes>
        <Route path="/" element={<div>Home</div>} />
        <Route path="/punto-venta" element={<PuntoDeVentaPages />} />
        <Route path="/productos" element={<ProductosPages />} />
    </Routes>
    </BrowserRouter>
    
  );
};

export default Router;
