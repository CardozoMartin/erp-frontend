export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  VERIFY_EMAIL: '/verify-email',

  DASHBOARD: '/dashboard',
  DEMO_STORE: (nombre: string) => `/demo/${nombre}`,

  PUBLIC_STORE: (slug: string) => `/tienda/${slug}`,
} as const;

export type RouteKey = keyof typeof ROUTES;