import type { RouteObject } from 'react-router';
import CotizacionesAuxPage from './Pages/CotizacionesAuxPage';
import DespachosAuxPage from './Pages/DespachosAuxPage';
import FacturacionAuxPage from './Pages/FacturacionAuxPage';
import NotasCreditoAuxPage from './Pages/NotasCreditoAuxPage';
import ReportesPosAuxPage from './Pages/ReportesPosAuxPage';
import AuditoriaAuxPage from './Pages/AuditoriaAuxPage';
import VentaDetalleAuxPage from './Pages/VentaDetalleAuxPage';
import VentasGeneralAuxPage from './Pages/VentasGeneralAuxPage';
import VentasPosAuxPage from './Pages/VentasPosAuxPage';

// Páginas migradas a sus módulos propios — importadas desde allí para mantener rutas funcionales
import AjustesPage from '../Configuracion/pages/AjustesPage';
import ConfiguracionPosPage from '../Configuracion/pages/ConfiguracionPosPage';
import ConfiguracionEmailPage from '../Configuracion/pages/ConfiguracionEmailPage';
import ConfiguracionCloudinaryPage from '../Configuracion/pages/ConfiguracionCloudinaryPage';
import ConfiguracionMercadoPagoPage from '../Configuracion/pages/ConfiguracionMercadoPagoPage';
import CuentaCorrientePage from '../Clientes/pages/CuentaCorrientePage';
import ListasPrecioPage from '../Productos/pages/ListasPrecioPage';

export const posAuxiliaresRoutes: RouteObject[] = [
  // Configuracion — migrada a Configuracion/
  { path: 'ajustes', element: <AjustesPage /> },
  { path: 'configuracion-pos', element: <ConfiguracionPosPage /> },
  { path: 'configuracion-email', element: <ConfiguracionEmailPage /> },
  { path: 'configuracion-cloudinary', element: <ConfiguracionCloudinaryPage /> },
  { path: 'configuracion-mercadopago', element: <ConfiguracionMercadoPagoPage /> },

  // Clientes — migrada a Clientes/
  { path: 'cuenta-corriente', element: <CuentaCorrientePage /> },

  // Productos — migrada a Productos/
  { path: 'listas-precio', element: <ListasPrecioPage /> },

  // Ventas y operaciones — pendiente migración Fase 2
  { path: 'ventas/:id', element: <VentaDetalleAuxPage /> },
  { path: 'ventas', element: <VentasGeneralAuxPage /> },
  { path: 'cotizaciones', element: <CotizacionesAuxPage /> },
  { path: 'facturacion', element: <FacturacionAuxPage /> },
  { path: 'ventas-pos', element: <VentasPosAuxPage /> },
  { path: 'despachos', element: <DespachosAuxPage /> },
  { path: 'notas-credito', element: <NotasCreditoAuxPage /> },

  // Reportes y auditoría — pendiente migración Fase 2
  { path: 'reportes-pos', element: <ReportesPosAuxPage /> },
  { path: 'auditoria', element: <AuditoriaAuxPage /> },
];
