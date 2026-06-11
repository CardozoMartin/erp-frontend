import type { RouteObject } from 'react-router';
import ConfiguracionPosPage from './Pages/ConfiguracionPosPage';
import CotizacionesAuxPage from './Pages/CotizacionesAuxPage';
import CuentaCorrienteAuxPage from './Pages/CuentaCorrienteAuxPage';
import DespachosAuxPage from './Pages/DespachosAuxPage';
import FacturacionAuxPage from './Pages/FacturacionAuxPage';
import ListasPrecioAuxPage from './Pages/ListasPrecioAuxPage';
import NotasCreditoAuxPage from './Pages/NotasCreditoAuxPage';
import ReportesPosAuxPage from './Pages/ReportesPosAuxPage';
import AuditoriaAuxPage from './Pages/AuditoriaAuxPage';
import ConfiguracionEmailPage from './Pages/ConfiguracionEmailPage';
import ConfiguracionCloudinaryPage from './Pages/ConfiguracionCloudinaryPage';
import ConfiguracionMercadoPagoPage from './Pages/ConfiguracionMercadoPagoPage';
import VentaDetalleAuxPage from './Pages/VentaDetalleAuxPage';
import VentasGeneralAuxPage from './Pages/VentasGeneralAuxPage';
import VentasPosAuxPage from './Pages/VentasPosAuxPage';
import AjustesPage from './Pages/AjustesPage';

export const posAuxiliaresRoutes: RouteObject[] = [
  {
    path: 'ajustes',
    element: <AjustesPage />,
  },
  {
    path: 'configuracion-pos',
    element: <ConfiguracionPosPage />,
  },
  {
    path: 'configuracion-email',
    element: <ConfiguracionEmailPage />,
  },
  {
    path: 'configuracion-cloudinary',
    element: <ConfiguracionCloudinaryPage />,
  },
  {
    path: 'configuracion-mercadopago',
    element: <ConfiguracionMercadoPagoPage />,
  },
  {
    path: 'ventas/:id',
    element: <VentaDetalleAuxPage />,
  },
  {
    path: 'ventas',
    element: <VentasGeneralAuxPage />,
  },
  {
    path: 'cotizaciones',
    element: <CotizacionesAuxPage />,
  },
  {
    path: 'facturacion',
    element: <FacturacionAuxPage />,
  },
  {
    path: 'ventas-pos',
    element: <VentasPosAuxPage />,
  },
  {
    path: 'despachos',
    element: <DespachosAuxPage />,
  },
  {
    path: 'notas-credito',
    element: <NotasCreditoAuxPage />,
  },
  {
    path: 'cuenta-corriente',
    element: <CuentaCorrienteAuxPage />,
  },
  {
    path: 'listas-precio',
    element: <ListasPrecioAuxPage />,
  },
  {
    path: 'reportes-pos',
    element: <ReportesPosAuxPage />,
  },
  {
    path: 'auditoria',
    element: <AuditoriaAuxPage />,
  },
];
