import { useNavigate } from 'react-router-dom';
import FormEmployers, {
  type EmpleadoCreatePayload,
} from '../components/Form/FormEmployers';
import {
  useGetRoles,
  useGetSucursalesActivas,
  usePostEmpleado,
} from '../hooks/useEmpleados';
import { asignarEmpleadoSucursalFn } from '../api/empleadosApi';

export default function EmpleadoCreatePage() {
  const navigate = useNavigate();
  const rolesQuery = useGetRoles();
  const sucursalesQuery = useGetSucursalesActivas();
  const postEmpleado = usePostEmpleado();

  const handleSubmit = async (data: EmpleadoCreatePayload) => {
    const empleado = await postEmpleado.mutateAsync({
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

    const sucursalesExtra = data.sucursalIds.filter(
      (sucursalId) => sucursalId !== data.sucursalId,
    );

    if (sucursalesExtra.length > 0) {
      await Promise.all(
        sucursalesExtra.map((sucursalId) =>
          asignarEmpleadoSucursalFn(empleado.id, sucursalId, false),
        ),
      );
    }

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
