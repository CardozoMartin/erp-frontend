import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/auth.store';
import { getRutaInicioPermitida } from '../../../utils/authNavigation';

const SinAccesoPage = () => {
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const rutaInicio = useAuthStore((s) => s.rutaInicio);
  const rutas = useAuthStore((s) => s.rutas);
  const destino = token ? getRutaInicioPermitida(rutaInicio, rutas) : '/login';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-4xl font-bold text-gray-800">403</h1>
      <p className="text-gray-500">No tenes permisos para acceder a esta seccion.</p>
      <button
        onClick={() => navigate(destino)}
        className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition"
      >
        {token ? 'Volver al inicio' : 'Ir al login'}
      </button>
    </div>
  );
};

export default SinAccesoPage;
