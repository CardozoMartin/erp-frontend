import { CreditCard, Mail, MapPin, Phone, Plus, Save, Search, UserRound, Wallet } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useClientes, useClienteMutations } from '../hooks/useClientes';
import type { ICliente, IClientePayload, TipoCliente, TipoVencimientoCuenta } from '../types/cliente.type';

type ClienteFormValues = {
  nombre: string;
  apellido: string;
  razon_social: string;
  tipo: TipoCliente;
  cuit: string;
  dni: string;
  email: string;
  telefono: string;
  direccion: string;
  usarCuentaCorriente: boolean;
  credito_sin_limite: boolean;
  limite_credito: number;
  tipo_vencimiento: TipoVencimientoCuenta;
  valor_vencimiento: number;
  recargo_activo: boolean;
  recargo_porcentaje_diario: number;
};

const defaultValues: ClienteFormValues = {
  nombre: '',
  apellido: '',
  razon_social: '',
  tipo: 'CONSUMIDOR_FINAL',
  cuit: '',
  dni: '',
  email: '',
  telefono: '',
  direccion: '',
  usarCuentaCorriente: false,
  credito_sin_limite: false,
  limite_credito: 0,
  tipo_vencimiento: 'DIA_FIJO',
  valor_vencimiento: 10,
  recargo_activo: false,
  recargo_porcentaje_diario: 0,
};

const money = (value: unknown) =>
  Number(value ?? 0).toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  });

const clienteNombre = (cliente: ICliente) =>
  cliente.razon_social || `${cliente.nombre} ${cliente.apellido ?? ''}`.trim();

const toPayload = (values: ClienteFormValues): IClientePayload => {
  const payload: IClientePayload = {
    nombre: values.nombre.trim(),
    apellido: values.apellido.trim() || null,
    razon_social: values.razon_social.trim() || null,
    tipo: values.tipo,
    cuit: values.cuit.trim() || null,
    dni: values.dni.trim() || null,
    email: values.email.trim() || null,
    telefono: values.telefono.trim() || null,
    direccion: values.direccion.trim() || null,
  };

  if (values.usarCuentaCorriente) {
    payload.cuentaCorriente = {
      limite_credito: values.credito_sin_limite ? 0 : Number(values.limite_credito || 0),
      planPago: {
        tipo_vencimiento: values.tipo_vencimiento,
        valor_vencimiento: Number(values.valor_vencimiento || 1),
        recargo_activo: values.recargo_activo,
        recargo_porcentaje_diario: values.recargo_activo
          ? Number(values.recargo_porcentaje_diario || 0)
          : 0,
      },
    };
  }

  return payload;
};

const valuesFromCliente = (cliente: ICliente): ClienteFormValues => ({
  nombre: cliente.nombre ?? '',
  apellido: cliente.apellido ?? '',
  razon_social: cliente.razon_social ?? '',
  tipo: cliente.tipo ?? 'CONSUMIDOR_FINAL',
  cuit: cliente.cuit ?? '',
  dni: cliente.dni ?? '',
  email: cliente.email ?? '',
  telefono: cliente.telefono ?? '',
  direccion: cliente.direccion ?? '',
  usarCuentaCorriente: !!cliente.cuentaCorriente,
  credito_sin_limite: !!cliente.cuentaCorriente && Number(cliente.cuentaCorriente.limite_credito ?? 0) === 0,
  limite_credito: Number(cliente.cuentaCorriente?.limite_credito ?? 0),
  tipo_vencimiento: cliente.cuentaCorriente?.planPago?.tipo_vencimiento ?? 'DIA_FIJO',
  valor_vencimiento: Number(cliente.cuentaCorriente?.planPago?.valor_vencimiento ?? 10),
  recargo_activo: cliente.cuentaCorriente?.planPago?.recargo_activo ?? false,
  recargo_porcentaje_diario: Number(cliente.cuentaCorriente?.planPago?.recargo_porcentaje_diario ?? 0),
});

const ClientesPage = () => {
  const clientesQuery = useClientes();
  const mutations = useClienteMutations();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const form = useForm<ClienteFormValues>({ defaultValues });
  const usarCuentaCorriente = form.watch('usarCuentaCorriente');
  const creditoSinLimite = form.watch('credito_sin_limite');
  const recargoActivo = form.watch('recargo_activo');
  const tipoVencimiento = form.watch('tipo_vencimiento');

  const clientes = clientesQuery.data ?? [];
  const clientesFiltrados = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return clientes;
    return clientes.filter((cliente) => {
      const nombre = clienteNombre(cliente).toLowerCase();
      return (
        nombre.includes(term) ||
        (cliente.cuit ?? '').includes(term) ||
        (cliente.dni ?? '').includes(term) ||
        (cliente.telefono ?? '').includes(term)
      );
    });
  }, [clientes, search]);
  const selectedCliente = clientes.find((cliente) => cliente.id === selectedId) ?? null;

  useEffect(() => {
    if (creating) return;
    const cliente = selectedCliente ?? clientesFiltrados[0] ?? null;
    if (!cliente) {
      form.reset(defaultValues);
      return;
    }
    if (cliente.id !== selectedId) setSelectedId(cliente.id);
    form.reset(valuesFromCliente(cliente));
  }, [clientesFiltrados, creating, selectedCliente?.id]);

  const nuevoCliente = () => {
    setCreating(true);
    setSelectedId(null);
    form.reset(defaultValues);
  };

  const seleccionarCliente = (cliente: ICliente) => {
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
        },
      });
      return;
    }
    mutations.update.mutate({ id: selectedCliente.id, data: payload });
  };

  const saldo = Number(selectedCliente?.cuentaCorriente?.saldo ?? 0);

  return (
    <div className="min-h-[calc(100vh-52px)] bg-[#f3f4f6] px-4 py-4">
      <div className="mx-auto grid max-w-[1500px] gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <section className="rounded-lg border border-[#c4c6cd] bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-[#c4c6cd] px-4 py-3">
            <div className="flex items-center gap-2 text-[15px] font-bold text-[#041627]">
              <UserRound size={17} className="text-[#075E54]" />
              Clientes
            </div>
            <button
              type="button"
              onClick={nuevoCliente}
              className="flex h-9 items-center gap-2 rounded bg-[#075E54] px-3 text-[13px] font-semibold text-white hover:bg-[#0b6d62]"
            >
              <Plus size={15} />
              Nuevo
            </button>
          </div>

          <div className="border-b border-[#c4c6cd] bg-[#fbfbfc] p-3">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#44474c]" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar cliente, CUIT, DNI o telefono"
                className="h-9 w-full rounded border border-[#c4c6cd] bg-white pl-9 pr-3 text-[13px] outline-none focus:border-[#075E54]"
              />
            </div>
          </div>

          <div className="max-h-[680px] overflow-auto">
            {clientesFiltrados.map((cliente) => (
              <button
                key={cliente.id}
                type="button"
                onClick={() => seleccionarCliente(cliente)}
                className={`w-full border-b border-[#e5e7eb] px-4 py-3 text-left hover:bg-[#f8fafc] ${
                  selectedCliente?.id === cliente.id && !creating ? 'bg-[#eef8f6]' : 'bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-[14px] font-bold text-[#041627]">
                      {clienteNombre(cliente)}
                    </div>
                    <div className="mt-1 text-[12px] text-[#44474c]">
                      {cliente.cuit || cliente.dni || 'Sin documento'} | {cliente.tipo}
                    </div>
                  </div>
                  {cliente.cuentaCorriente ? (
                    <span className={`text-[13px] font-bold ${Number(cliente.cuentaCorriente.saldo) > 0 ? 'text-[#b42318]' : 'text-[#075E54]'}`}>
                      {money(cliente.cuentaCorriente.saldo)}
                    </span>
                  ) : null}
                </div>
              </button>
            ))}
            {!clientesFiltrados.length && !clientesQuery.isLoading ? (
              <div className="px-4 py-10 text-center text-[14px] text-[#44474c]">
                Sin clientes cargados.
              </div>
            ) : null}
          </div>
        </section>

        <form onSubmit={form.handleSubmit(onSubmit)} className="rounded-lg border border-[#c4c6cd] bg-white shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#c4c6cd] px-4 py-3">
            <div>
              <div className="text-[18px] font-bold text-[#041627]">
                {creating ? 'Nuevo cliente' : selectedCliente ? clienteNombre(selectedCliente) : 'Ficha de cliente'}
              </div>
              <div className="text-[13px] text-[#44474c]">
                Datos comerciales, contacto y cuenta corriente.
              </div>
            </div>
            <button
              type="submit"
              disabled={mutations.create.isPending || mutations.update.isPending}
              className="flex h-9 items-center gap-2 rounded bg-[#075E54] px-3 text-[13px] font-semibold text-white hover:bg-[#0b6d62] disabled:opacity-60"
            >
              <Save size={15} />
              Guardar
            </button>
          </div>

          {!creating && selectedCliente?.cuentaCorriente ? (
            <div className="grid gap-3 border-b border-[#c4c6cd] bg-[#fbfbfc] p-4 sm:grid-cols-3">
              <div className="rounded border border-[#e5e7eb] bg-white px-3 py-2">
                <div className="text-[11px] font-bold uppercase text-[#44474c]">Saldo</div>
                <div className={`mt-1 text-[15px] font-bold ${saldo > 0 ? 'text-[#b42318]' : 'text-[#075E54]'}`}>
                  {money(saldo)}
                </div>
              </div>
              <div className="rounded border border-[#e5e7eb] bg-white px-3 py-2">
                <div className="text-[11px] font-bold uppercase text-[#44474c]">Limite</div>
                <div className="mt-1 text-[15px] font-bold text-[#041627]">
                  {Number(selectedCliente.cuentaCorriente.limite_credito) > 0
                    ? money(selectedCliente.cuentaCorriente.limite_credito)
                    : 'Sin limite'}
                </div>
              </div>
              <div className="rounded border border-[#e5e7eb] bg-white px-3 py-2">
                <div className="text-[11px] font-bold uppercase text-[#44474c]">Disponible</div>
                <div className="mt-1 text-[15px] font-bold text-[#075E54]">
                  {Number(selectedCliente.cuentaCorriente.limite_credito) > 0
                    ? money(Number(selectedCliente.cuentaCorriente.limite_credito) - Math.max(saldo, 0))
                    : 'Sin limite'}
                </div>
              </div>
            </div>
          ) : null}

          <div className="grid gap-4 p-4">
            <section className="rounded border border-[#c4c6cd]">
              <div className="flex items-center gap-2 border-b border-[#c4c6cd] px-4 py-3 text-[13px] font-bold uppercase text-[#041627]">
                <UserRound size={15} className="text-[#075E54]" />
                Identificacion
              </div>
              <div className="grid gap-3 p-4 md:grid-cols-2">
                <label className="text-[12px] font-semibold text-[#041627]">
                  Nombre
                  <input {...form.register('nombre', { required: true })} className="mt-1 h-9 w-full rounded border border-[#c4c6cd] px-2 text-[13px] outline-none focus:border-[#075E54]" />
                </label>
                <label className="text-[12px] font-semibold text-[#041627]">
                  Apellido
                  <input {...form.register('apellido')} className="mt-1 h-9 w-full rounded border border-[#c4c6cd] px-2 text-[13px] outline-none focus:border-[#075E54]" />
                </label>
                <label className="text-[12px] font-semibold text-[#041627]">
                  Razon social
                  <input {...form.register('razon_social')} className="mt-1 h-9 w-full rounded border border-[#c4c6cd] px-2 text-[13px] outline-none focus:border-[#075E54]" />
                </label>
                <label className="text-[12px] font-semibold text-[#041627]">
                  Condicion fiscal
                  <select {...form.register('tipo')} className="mt-1 h-9 w-full rounded border border-[#c4c6cd] bg-white px-2 text-[13px] outline-none focus:border-[#075E54]">
                    <option value="CONSUMIDOR_FINAL">Consumidor final</option>
                    <option value="RESPONSABLE_INSCRIPTO">Responsable inscripto</option>
                    <option value="MONOTRIBUTISTA">Monotributista</option>
                    <option value="EXENTO">Exento</option>
                  </select>
                </label>
                <label className="text-[12px] font-semibold text-[#041627]">
                  CUIT
                  <input {...form.register('cuit')} className="mt-1 h-9 w-full rounded border border-[#c4c6cd] px-2 text-[13px] outline-none focus:border-[#075E54]" />
                </label>
                <label className="text-[12px] font-semibold text-[#041627]">
                  DNI
                  <input {...form.register('dni')} className="mt-1 h-9 w-full rounded border border-[#c4c6cd] px-2 text-[13px] outline-none focus:border-[#075E54]" />
                </label>
              </div>
            </section>

            <section className="rounded border border-[#c4c6cd]">
              <div className="flex items-center gap-2 border-b border-[#c4c6cd] px-4 py-3 text-[13px] font-bold uppercase text-[#041627]">
                <Mail size={15} className="text-[#075E54]" />
                Contacto y direccion
              </div>
              <div className="grid gap-3 p-4 md:grid-cols-2">
                <label className="text-[12px] font-semibold text-[#041627]">
                  Email
                  <div className="mt-1 flex h-9 items-center gap-2 rounded border border-[#c4c6cd] px-2">
                    <Mail size={14} className="text-[#075E54]" />
                    <input {...form.register('email')} className="min-w-0 flex-1 outline-none" />
                  </div>
                </label>
                <label className="text-[12px] font-semibold text-[#041627]">
                  Telefono
                  <div className="mt-1 flex h-9 items-center gap-2 rounded border border-[#c4c6cd] px-2">
                    <Phone size={14} className="text-[#075E54]" />
                    <input {...form.register('telefono')} className="min-w-0 flex-1 outline-none" />
                  </div>
                </label>
                <label className="md:col-span-2 text-[12px] font-semibold text-[#041627]">
                  Direccion
                  <div className="mt-1 flex min-h-9 items-center gap-2 rounded border border-[#c4c6cd] px-2">
                    <MapPin size={14} className="text-[#075E54]" />
                    <input {...form.register('direccion')} className="min-w-0 flex-1 py-2 outline-none" />
                  </div>
                </label>
              </div>
            </section>

            <section className="rounded border border-[#c4c6cd]">
              <div className="flex items-center justify-between border-b border-[#c4c6cd] px-4 py-3">
                <div className="flex items-center gap-2 text-[13px] font-bold uppercase text-[#041627]">
                  <Wallet size={15} className="text-[#075E54]" />
                  Cuenta corriente
                </div>
                <label className="flex items-center gap-2 text-[13px] font-semibold text-[#041627]">
                  Habilitar
                  <input type="checkbox" {...form.register('usarCuentaCorriente')} className="h-4 w-4 accent-[#075E54]" />
                </label>
              </div>
              {usarCuentaCorriente ? (
                <div className="grid gap-3 p-4 md:grid-cols-2">
                  <label className="flex h-9 items-center justify-between rounded border border-[#c4c6cd] px-3 text-[13px] font-semibold text-[#041627] md:col-span-2">
                    Sin limite de credito durante el periodo
                    <input type="checkbox" {...form.register('credito_sin_limite')} className="h-4 w-4 accent-[#075E54]" />
                  </label>
                  <label className="text-[12px] font-semibold text-[#041627]">
                    Limite de credito
                    <div className="mt-1 flex h-9 items-center gap-2 rounded border border-[#c4c6cd] px-2">
                      <CreditCard size={14} className="text-[#075E54]" />
                      <input
                        type="number"
                        min={0}
                        disabled={creditoSinLimite}
                        {...form.register('limite_credito', { valueAsNumber: true })}
                        className="min-w-0 flex-1 outline-none disabled:bg-transparent disabled:text-[#9ca3af]"
                      />
                    </div>
                  </label>
                  <label className="text-[12px] font-semibold text-[#041627]">
                    Tipo de vencimiento
                    <select {...form.register('tipo_vencimiento')} className="mt-1 h-9 w-full rounded border border-[#c4c6cd] bg-white px-2 text-[13px] outline-none focus:border-[#075E54]">
                      <option value="DIA_FIJO">Dia fijo del mes</option>
                      <option value="DIAS_DESDE_COMPRA">Dias desde compra</option>
                    </select>
                  </label>
                  <label className="text-[12px] font-semibold text-[#041627]">
                    {tipoVencimiento === 'DIA_FIJO' ? 'Dia de vencimiento' : 'Dias de credito'}
                    <input type="number" min={1} max={tipoVencimiento === 'DIA_FIJO' ? 31 : undefined} {...form.register('valor_vencimiento', { valueAsNumber: true })} className="mt-1 h-9 w-full rounded border border-[#c4c6cd] px-2 text-[13px] outline-none focus:border-[#075E54]" />
                  </label>
                  <div className="grid gap-2">
                    <label className="flex h-9 items-center justify-between rounded border border-[#c4c6cd] px-3 text-[13px] font-semibold text-[#041627]">
                      Calcular interes por mora
                      <input type="checkbox" {...form.register('recargo_activo')} className="h-4 w-4 accent-[#075E54]" />
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      disabled={!recargoActivo}
                      placeholder="Porcentaje diario"
                      {...form.register('recargo_porcentaje_diario', { valueAsNumber: true })}
                      className="h-9 rounded border border-[#c4c6cd] px-2 text-[13px] outline-none focus:border-[#075E54] disabled:bg-[#f4f5f6]"
                    />
                  </div>
                </div>
              ) : (
                <div className="px-4 py-8 text-center text-[14px] text-[#44474c]">
                  El cliente no tendra credito ni fiado hasta habilitar cuenta corriente.
                </div>
              )}
            </section>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClientesPage;
