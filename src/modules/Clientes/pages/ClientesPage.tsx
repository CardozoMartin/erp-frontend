import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useGetEmpleados } from '../../Empleados/hooks/useEmpleados';
import { useAuditoriaAux, useMovimientosCuentaCorrienteAux, useServiciosSucursal } from '../../POSAuxiliares/hooks/usePosAux';
import { useClientes, useClienteMutations } from '../hooks/useClientes';
import type { ICliente } from '../types/cliente.type';
import ClientesListSection from '../components/ClientesListSection';
import ClienteCuentaCorrienteSection from '../components/ClienteCuentaCorrienteSection';
import ClienteFichaSection from '../components/ClienteFichaSection';
import { defaultValues, toPayload, valuesFromCliente, type ClienteFormValues } from '../utils/clientes.utils';

const ClientesPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { clienteId } = useParams();
  const isAccountView = !!clienteId && location.pathname.endsWith('/cuenta');
  const isListView = !clienteId && location.pathname !== '/clientes/nuevo';
  const isCreateRoute = location.pathname === '/clientes/nuevo';

  const clientesQuery = useClientes();
  const mutations = useClienteMutations();
  const serviciosQuery = useServiciosSucursal();
  const empleadosQuery = useGetEmpleados(1, 100);

  const [selectedId, setSelectedId] = useState<string | null>(clienteId ?? null);
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(isCreateRoute);

  const form = useForm<ClienteFormValues>({ defaultValues });
  const emailDisponible = !!serviciosQuery.data?.email.disponible;

  const clientes = clientesQuery.data ?? [];
  const clientesFiltrados = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return clientes;
    return clientes.filter((cliente) => {
      const nombre =
        (cliente.razon_social || `${cliente.nombre} ${cliente.apellido ?? ''}`.trim()).toLowerCase();
      return (
        nombre.includes(term) ||
        (cliente.cuit ?? '').includes(term) ||
        (cliente.dni ?? '').includes(term) ||
        (cliente.telefono ?? '').includes(term)
      );
    });
  }, [clientes, search]);

  const selectedCliente = clientes.find((c) => c.id === selectedId) ?? null;

  const movimientosCuentaQuery = useMovimientosCuentaCorrienteAux(
    selectedCliente?.cuentaCorriente ? selectedCliente.id : null,
  );
  const historialQuery = useAuditoriaAux(
    {
      page: 1,
      limit: 30,
      modulo: 'clientes',
      entidad: 'cliente',
      entidad_id: selectedCliente?.id ?? '',
    },
    !!selectedCliente?.id && !creating,
  );

  const empleadosById = useMemo(() => {
    const empleados = empleadosQuery.data?.data ?? [];
    return new Map(empleados.map((e) => [e.id, e]));
  }, [empleadosQuery.data]);

  useEffect(() => {
    if (clienteId) {
      setSelectedId(clienteId);
      setCreating(false);
      return;
    }
    if (isCreateRoute) {
      setSelectedId(null);
      setCreating(true);
      form.reset(defaultValues);
      return;
    }
    if (isListView) return;
    if (creating) return;
    const cliente = selectedCliente ?? clientesFiltrados[0] ?? null;
    if (!cliente) {
      form.reset(defaultValues);
      return;
    }
    if (cliente.id !== selectedId) setSelectedId(cliente.id);
    form.reset(valuesFromCliente(cliente));
  }, [clienteId, clientesFiltrados, creating, form, isCreateRoute, isListView, selectedCliente?.id]);

  const nuevoCliente = () => {
    navigate('/clientes/nuevo');
    setCreating(true);
    setSelectedId(null);
    form.reset(defaultValues);
  };

  const seleccionarCliente = (cliente: ICliente) => {
    navigate(`/clientes/${cliente.id}`);
    setCreating(false);
    setSelectedId(cliente.id);
    form.reset(valuesFromCliente(cliente));
  };

  const onSubmit = (values: ClienteFormValues) => {
    const payload = toPayload(values);
    if (creating || !selectedCliente) {
      mutations.create.mutate(payload, {
        onSuccess: (cliente) => {
          setCreating(false);
          setSelectedId(cliente.id);
          navigate(`/clientes/${cliente.id}`);
        },
      });
      return;
    }
    mutations.update.mutate({ id: selectedCliente.id, data: payload });
  };

  if (isListView) {
    return (
      <ClientesListSection
        clientes={clientesFiltrados}
        isLoading={clientesQuery.isLoading}
        search={search}
        onSearchChange={setSearch}
        onSelectCliente={seleccionarCliente}
        onNuevoCliente={nuevoCliente}
        onVerCuenta={(cliente) => navigate(`/clientes/${cliente.id}/cuenta`)}
      />
    );
  }

  if (isAccountView && selectedCliente) {
    return (
      <ClienteCuentaCorrienteSection
        selectedCliente={selectedCliente}
        movimientos={movimientosCuentaQuery.data ?? []}
        isLoading={movimientosCuentaQuery.isLoading}
        emailDisponible={emailDisponible}
        onVolver={() =>
          navigate(selectedCliente ? `/clientes/${selectedCliente.id}` : '/clientes')
        }
      />
    );
  }

  return (
    <ClienteFichaSection
      form={form}
      creating={creating}
      selectedCliente={selectedCliente}
      isSaving={mutations.create.isPending || mutations.update.isPending}
      historialCliente={historialQuery.data?.data ?? []}
      isLoadingHistorial={historialQuery.isLoading}
      empleadosById={empleadosById}
      onSubmit={onSubmit}
      onVolver={() => navigate('/clientes')}
      onVerCuenta={() =>
        selectedCliente ? navigate(`/clientes/${selectedCliente.id}/cuenta`) : undefined
      }
    />
  );
};

export default ClientesPage;
