import { useNavigate } from 'react-router-dom';
import FormEmployers, {
  type EmpleadoCreatePayload,
} from '../components/Form/FormEmployers';
import {
  useGetRoles,
  useGetSucursalesActivas,
  usePostEmpleado,
} from '../hooks/useEmpleados';

export default function EmpleadoCreatePage() {
  const navigate = useNavigate();
  const rolesQuery = useGetRoles();
  const sucursalesQuery = useGetSucursalesActivas();
  const postEmpleado = usePostEmpleado();

  const handleSubmit = async (data: EmpleadoCreatePayload) => {
    await postEmpleado.mutateAsync({
      nombreCompleto: data.nombreCompleto.trim(),
      email: data.email.trim(),
      telefono: data.telefono.trim(),
      direccion: data.direccion.trim(),
      cargo: data.cargo.trim(),
      contrasena: data.password,
      rolesIds: data.rolesIds,
      sucursalId: data.sucursalId || undefined,
      esSucursalPrincipal: data.sucursalId ? true : undefined,
    });

    navigate('/empleados');
  };

  return (
    <FormEmployers
      onSubmit={handleSubmit}
      onCancel={() => navigate('/empleados')}
      availableRoles={rolesQuery.data ?? []}
      availableSucursales={sucursalesQuery.data ?? []}
      loadingCatalogs={rolesQuery.isLoading || sucursalesQuery.isLoading}
      submitError={postEmpleado.error ?? null}
    />
  );
}
