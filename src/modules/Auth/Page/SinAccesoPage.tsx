import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/auth.store';


const SinAccesoPage = () => {
  const navigate = useNavigate();
  const rutaInicio = useAuthStore((s) => s.rutaInicio);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-4xl font-bold text-gray-800">403</h1>
      <p className="text-gray-500">No tenés permisos para acceder a esta sección.</p>
      <button
        onClick={() => navigate(rutaInicio)}
        className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition"
      >
        Volver al inicio
      </button>
    </div>
  );
};

export default SinAccesoPage;
