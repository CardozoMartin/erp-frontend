
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth.store'
import { api } from '../api/ApiBase'

export function useAuth() {
  const { setSession, cerrarSesion, tienePermiso } = useAuthStore()
  const navigate = useNavigate()

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password })
    setSession(data)
    navigate(data.rutaInicio)  // ← el back decide a dónde va
  }

  const logout = () => {
    cerrarSesion()
    navigate('/login')
  }

  return { login, logout, tienePermiso }
}