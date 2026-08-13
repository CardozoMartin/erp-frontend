import type { RouteObject } from 'react-router';
import DashboardPage from './pages/DashboardPage';

export const dashboardRoutes: RouteObject[] = [
  { path: 'dashboard', element: <DashboardPage /> },
];
