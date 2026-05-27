// Router.tsx
import type { RouteObject } from 'react-router'
import { BrowserRouter, useRoutes } from 'react-router-dom'
import { RutaProtegida } from './components/common/RutaProtegida'
import Navbar from './components/common/Navbar'

import { cajasRoutes } from './modules/Cajas/routes'
import { empleadosRoutes } from './modules/Empleados/routes'
import { productosRoutes } from './modules/Productos/routes'
import { puntoDeVentaRoutes } from './modules/PuntoDeVenta/routes'
import { sucursalRoutes } from './modules/Sucursal/routes'
import LoginPage from './modules/Auth/Page/LoginPage'
import SinAccesoPage from './modules/Auth/Page/SinAccesoPage'

const appRoutes: RouteObject[] = [
  // Rutas públicas
  { path: '/login', element: <LoginPage /> },
  { path: '/sin-acceso', element: <SinAccesoPage /> },

  // Layout protegido — requiere sesión mínimo
  {
    path: '/',
    element: <RutaProtegida />,   // ← sin permiso = solo verifica token
    children: [
      { index: true, element: <div>Home</div> },
      ...puntoDeVentaRoutes,
      ...productosRoutes,
      ...sucursalRoutes,
      ...empleadosRoutes,
      ...cajasRoutes,
    ],
  },
]

function AppRoutes() {
  return useRoutes(appRoutes)
}

const Router = () => {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}

export default Router