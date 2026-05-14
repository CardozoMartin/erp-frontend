import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Input, Label } from '../../Productos/components/FormComponents';
import { usePostSucursal } from '../hooks/useSucursal';

const DEFAULT_EMPRESA_ID = import.meta.env.VITE_DEMO_EMPRESA_ID || '00000000-0000-0000-0000-000000000001';

export default function SucursalForm() {
  const navigate = useNavigate();
  const { mutate, isLoading } = usePostSucursal();

  const [empresaId, setEmpresaId] = useState(DEFAULT_EMPRESA_ID);
  const [nombre, setNombre] = useState('');
  const [direccion, setDireccion] = useState('');
  const [telefono, setTelefono] = useState('');
  const [activa, setActiva] = useState(true);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    mutate(
      {
        empresa_id: empresaId,
        nombre: nombre.trim(),
        direccion: direccion.trim() || null,
        telefono: telefono.trim() || null,
        activa,
      },
      {
        onSuccess: () => {
          navigate('/sucursales');
        },
      },
    );
  };

  return (
    <div className="max-w-[900px] mx-auto px-6 py-8">
      <header className="mb-6">
        <h2 className="text-2xl font-semibold text-[#041627]">Crear nueva sucursal</h2>
        <p className="text-sm text-[#5f6771] mt-2">Registra una nueva sucursal para asignar stock y operaciones por ubicación.</p>
      </header>

      <Card>
        <form onSubmit={handleSubmit} className="grid gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Empresa ID</Label>
              <Input
                type="text"
                value={empresaId}
                onChange={(e) => setEmpresaId(e.target.value)}
                placeholder="ID de la empresa"
              />
            </div>
            <div>
              <Label>Nombre de la sucursal</Label>
              <Input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Casa Central"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Dirección</Label>
              <Input
                type="text"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                placeholder="Av. San Martín 1234"
              />
            </div>
            <div>
              <Label>Teléfono</Label>
              <Input
                type="text"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="381 123 4567"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              id="activa"
              type="checkbox"
              className="h-4 w-4 text-[#041627] border-gray-300 rounded"
              checked={activa}
              onChange={(e) => setActiva(e.target.checked)}
            />
            <label htmlFor="activa" className="text-sm text-[#44474c] font-medium">
              Sucursal activa
            </label>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/sucursales')}
              className="px-5 py-2 text-sm font-medium border border-[#c4c6cd] rounded-sm text-[#44474c] hover:bg-[#efedef] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 text-sm font-medium bg-[#075E54] hover:bg-[#1e8e4f] text-white rounded-sm transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Guardando...' : 'Guardar sucursal'}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
