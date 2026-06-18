import type { RouteObject } from 'react-router';
import VentasPage from './pages/VentasPage';
import VentasPosPage from './pages/VentasPosPage';
import VentaDetallePage from './pages/VentaDetallePage';
import FacturacionPage from './pages/FacturacionPage';
import NotasCreditoPage from './pages/NotasCreditoPage';
import CotizacionesPage from './pages/CotizacionesPage';
import DespachosPage from './pages/DespachosPage';
import ReportesPosPage from './pages/ReportesPosPage';
import ReportesContablesPage from './pages/ReportesContablesPage';
import AuditoriaPage from './pages/AuditoriaPage';

export const ventasRoutes: RouteObject[] = [
  { path: 'ventas', element: <VentasPage /> },
  { path: 'ventas/:id', element: <VentaDetallePage /> },
  { path: 'ventas-pos', element: <VentasPosPage /> },
  { path: 'facturacion', element: <FacturacionPage /> },
  { path: 'notas-credito', element: <NotasCreditoPage /> },
  { path: 'cotizaciones', element: <CotizacionesPage /> },
  { path: 'despachos', element: <DespachosPage /> },
  { path: 'reportes-pos', element: <ReportesPosPage /> },
  { path: 'reportes-contables', element: <ReportesContablesPage /> },
  { path: 'auditoria', element: <AuditoriaPage /> },
];
