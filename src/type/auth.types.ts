// types/auth.types.ts
export interface LoginResponse {
  token: string

  empleado: {
    id: string
    nombreCompleto: string
    email: string
    cargo: string
    foto_url: string | null
  }

  permisos: string[]          // ['ventas.crear', 'caja.cobrar', ...]

  rutas: {
    path: string              // '/pos/ventas'
    label: string             // 'Vendedor Cajero'
  }[]

  rutaInicio: string          // '/pos/ventas'

  sucursales: {
    id: string
    nombre: string
    esPrincipal: boolean
  }[]
}