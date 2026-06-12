import { CreditCard, Download, Eye, Loader2, Mail, MapPin, Phone, Plus, Printer, Save, Search, UserRound, Wallet, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useGetEmpleados } from '../../Empleados/hooks/useEmpleados';
import FichaHistoryPanel from '../../../components/common/FichaHistoryPanel';
import DataTable from '../../../components/common/DataTable';
import type { DataTableColumn } from '../../../components/common/DataTable';
import { useAuditoriaAux, useMovimientosCuentaCorrienteAux, usePosAuxMutation, useServiciosSucursal } from '../../POSAuxiliares/hooks/usePosAux';
import type { IMovimientoCuentaCorrienteAux } from '../../POSAuxiliares/types/pos-aux.type';
import { dateTime } from '../../POSAuxiliares/utils/format';
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
  altura: string;
  barrio: string;
  localidad: string;
  codigo_postal: string;
  referencia_entrega: string;
  usarCuentaCorriente: boolean;
  credito_sin_limite: boolean;
  limite_credito: number;
  tipo_vencimiento: TipoVencimientoCuenta;
  valor_vencimiento: number;
  recargo_activo: boolean;
  recargo_porcentaje_diario: number;
};

type TipoResumenEmail = 'CARGOS' | 'COMPRAS' | 'CARGOS_Y_RECARGOS' | 'TODOS';

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
  altura: '',
  barrio: '',
  localidad: '',
  codigo_postal: '',
  referencia_entrega: '',
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

const csvValue = (value: unknown) => {
  const text = String(value ?? '').replace(/"/g, '""');
  return `"${text}"`;
};

const downloadTextFile = (filename: string, content: string, type: string) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const clienteNombre = (cliente: ICliente) =>
  cliente.razon_social || `${cliente.nombre} ${cliente.apellido ?? ''}`.trim();

const movimientoProductos = (movimiento: IMovimientoCuentaCorrienteAux) =>
  movimiento.comprobante?.items ?? [];

const movimientoProductosTexto = (movimiento: IMovimientoCuentaCorrienteAux) => {
  const items = movimientoProductos(movimiento);
  if (!items.length) return '';
  return items
    .map(
      (item) =>
        `${Number(item.cantidad ?? 0)} x ${item.descripcion} (${money(item.subtotal)})`,
    )
    .join(' | ');
};

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
    altura: values.altura.trim() || null,
    barrio: values.barrio.trim() || null,
    localidad: values.localidad.trim() || null,
    codigo_postal: values.codigo_postal.trim() || null,
    referencia_entrega: values.referencia_entrega.trim() || null,
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
  altura: cliente.altura ?? '',
  barrio: cliente.barrio ?? '',
  localidad: cliente.localidad ?? '',
  codigo_postal: cliente.codigo_postal ?? '',
  referencia_entrega: cliente.referencia_entrega ?? '',
  usarCuentaCorriente: !!cliente.cuentaCorriente,
  credito_sin_limite: !!cliente.cuentaCorriente && Number(cliente.cuentaCorriente.limite_credito ?? 0) === 0,
  limite_credito: Number(cliente.cuentaCorriente?.limite_credito ?? 0),
  tipo_vencimiento: cliente.cuentaCorriente?.planPago?.tipo_vencimiento ?? 'DIA_FIJO',
  valor_vencimiento: Number(cliente.cuentaCorriente?.planPago?.valor_vencimiento ?? 10),
  recargo_activo: cliente.cuentaCorriente?.planPago?.recargo_activo ?? false,
  recargo_porcentaje_diario: Number(cliente.cuentaCorriente?.planPago?.recargo_porcentaje_diario ?? 0),
});

const clienteHistoryLabels: Record<string, string> = {
  CREAR_CLIENTE: 'Creo el cliente',
  ACTUALIZAR_CLIENTE: 'Actualizo la ficha',
  ACTIVAR_CUENTA_CORRIENTE: 'Activo cuenta corriente',
  CARGO_CUENTA_CORRIENTE: 'Cargo cuenta corriente',
  PAGO_CUENTA_CORRIENTE: 'Registro pago',
  NOTA_CREDITO_CUENTA_CORRIENTE: 'Aplico nota de credito',
};

const clienteFieldLabels: Record<string, string> = {
  nombre: 'Nombre',
  apellido: 'Apellido',
  razon_social: 'Razon social',
  tipo: 'Condicion fiscal',
  cuit: 'CUIT',
  dni: 'DNI',
  email: 'Email',
  telefono: 'Telefono',
  direccion: 'Direccion',
  altura: 'Altura',
  barrio: 'Barrio',
  localidad: 'Localidad',
  codigo_postal: 'Codigo postal',
  referencia_entrega: 'Referencia de entrega',
  cuentaCorriente: 'Cuenta corriente',
};

const formatHistoryValue = (value: any) => {
  if (value === null || value === undefined || value === '') return 'vacio';
  if (typeof value === 'boolean') return value ? 'Si' : 'No';
  if (Array.isArray(value)) return `${value.length} item(s)`;
  if (typeof value === 'object') return 'datos actualizados';
  return String(value);
};

const clienteChanges = (before?: Record<string, any> | null, after?: Record<string, any> | null) => {
  if (!before && after) return ['Alta inicial del cliente'];
  if (!before || !after) return [];
  return Object.keys(clienteFieldLabels)
    .filter((key) => JSON.stringify(before[key] ?? null) !== JSON.stringify(after[key] ?? null))
    .map((key) => `${clienteFieldLabels[key]}: ${formatHistoryValue(before[key])} -> ${formatHistoryValue(after[key])}`);
};

const buildCuentaCorrienteCsv = (
  cliente: ICliente,
  movimientos: IMovimientoCuentaCorrienteAux[],
) => {
  const rows = movimientos.map((movimiento) => [
    dateTime(movimiento.fecha),
    movimiento.tipo,
    movimiento.descripcion ?? '',
    Number(movimiento.monto ?? 0),
    movimiento.comprobante_id ?? '',
    movimientoProductosTexto(movimiento),
    movimiento.omitido ? 'Si' : 'No',
  ]);
  const clienteRows = [
    ['Cliente', clienteNombre(cliente)],
    ['Documento', cliente.cuit || cliente.dni || ''],
    ['Saldo', Number(cliente.cuentaCorriente?.saldo ?? 0)],
    ['Limite', Number(cliente.cuentaCorriente?.limite_credito ?? 0) || 'Sin limite'],
    [],
  ];

  const headerConProductos = ['Fecha', 'Tipo', 'Descripcion', 'Monto', 'Comprobante', 'Productos', 'Omitido'];
  return [...clienteRows, headerConProductos, ...rows]
    .map((row) => row.map(csvValue).join(';'))
    .join('\n');
};

const imprimirCuentaCorriente = (
  cliente: ICliente,
  movimientos: IMovimientoCuentaCorrienteAux[],
) => {
  const rows = movimientos
    .map(
      (movimiento) => {
        const productos = movimientoProductos(movimiento);
        const productosRows = productos.length
          ? productos
              .map(
                (item) =>
                  `<div>${Number(item.cantidad ?? 0)} x ${item.descripcion} - ${money(item.subtotal)}</div>`,
              )
              .join('')
          : '-';
        return `
        <tr>
          <td>${dateTime(movimiento.fecha)}</td>
          <td>${movimiento.tipo}</td>
          <td>${movimiento.descripcion ?? ''}</td>
          <td>${productosRows}</td>
          <td style="text-align:right">${money(movimiento.monto)}</td>
          <td>${movimiento.omitido ? 'Si' : 'No'}</td>
        </tr>
      `;
      },
    )
    .join('');
  const win = window.open('', '_blank', 'width=980,height=720');
  if (!win) return;
  win.document.write(`
    <html>
      <head>
        <title>Cuenta corriente - ${clienteNombre(cliente)}</title>
        <style>
          body { font-family: Arial, sans-serif; color: #041627; padding: 24px; }
          h1 { font-size: 22px; margin: 0 0 6px; }
          .meta { color: #44474c; font-size: 13px; margin-bottom: 18px; }
          .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 18px; }
          .box { border: 1px solid #c4c6cd; padding: 10px; border-radius: 4px; }
          .label { font-size: 11px; text-transform: uppercase; color: #44474c; font-weight: 700; }
          .value { margin-top: 5px; font-size: 16px; font-weight: 800; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th, td { border-bottom: 1px solid #d9dce2; padding: 8px; text-align: left; }
          th { background: #f4f5f6; text-transform: uppercase; font-size: 11px; }
          @media print { button { display: none; } }
        </style>
      </head>
      <body>
        <button onclick="window.print()">Imprimir / guardar PDF</button>
        <h1>${clienteNombre(cliente)}</h1>
        <div class="meta">${cliente.cuit || cliente.dni || 'Sin documento'} | ${cliente.tipo}</div>
        <div class="summary">
          <div class="box"><div class="label">Saldo</div><div class="value">${money(cliente.cuentaCorriente?.saldo)}</div></div>
          <div class="box"><div class="label">Limite</div><div class="value">${Number(cliente.cuentaCorriente?.limite_credito) > 0 ? money(cliente.cuentaCorriente?.limite_credito) : 'Sin limite'}</div></div>
          <div class="box"><div class="label">Movimientos</div><div class="value">${movimientos.length}</div></div>
        </div>
        <table>
          <thead>
            <tr><th>Fecha</th><th>Tipo</th><th>Descripcion</th><th>Productos</th><th style="text-align:right">Monto</th><th>Omitido</th></tr>
          </thead>
          <tbody>${rows || '<tr><td colspan="6">Sin movimientos</td></tr>'}</tbody>
        </table>
      </body>
    </html>
  `);
  win.document.close();
};

const ClientesPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { clienteId } = useParams();
  const isAccountView = !!clienteId && location.pathname.endsWith('/cuenta');
  const isListView = !clienteId && location.pathname !== '/clientes/nuevo';
  const isCreateRoute = location.pathname === '/clientes/nuevo';
  const clientesQuery = useClientes();
  const mutations = useClienteMutations();
  const posAuxMutations = usePosAuxMutation();
  const serviciosQuery = useServiciosSucursal();
  const empleadosQuery = useGetEmpleados(1, 100);
  const [selectedId, setSelectedId] = useState<string | null>(clienteId ?? null);
  const [search, setSearch] = useState('');
  const [movimientosSearch, setMovimientosSearch] = useState('');
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailDestino, setEmailDestino] = useState('');
  const [emailMensaje, setEmailMensaje] = useState('');
  const [emailDesde, setEmailDesde] = useState('');
  const [emailHasta, setEmailHasta] = useState('');
  const [emailTipoResumen, setEmailTipoResumen] = useState<TipoResumenEmail>('CARGOS');
  const [emailAdjuntarPdf, setEmailAdjuntarPdf] = useState(true);
  const [creating, setCreating] = useState(isCreateRoute);
  const form = useForm<ClienteFormValues>({ defaultValues });
  const usarCuentaCorriente = form.watch('usarCuentaCorriente');
  const creditoSinLimite = form.watch('credito_sin_limite');
  const recargoActivo = form.watch('recargo_activo');
  const tipoVencimiento = form.watch('tipo_vencimiento');
  const emailDisponible = !!serviciosQuery.data?.email.disponible;

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
    return new Map(empleados.map((empleado) => [empleado.id, empleado]));
  }, [empleadosQuery.data]);
  const historialCliente = historialQuery.data?.data ?? [];
  const movimientosCuenta = movimientosCuentaQuery.data ?? [];
  const movimientosCuentaFiltrados = useMemo(() => {
    const term = movimientosSearch.trim().toLowerCase();
    if (!term) return movimientosCuenta;
    return movimientosCuenta.filter((movimiento) =>
      [
        movimiento.tipo,
        movimiento.descripcion,
        movimiento.comprobante_id,
        movimientoProductosTexto(movimiento),
        movimiento.monto,
        dateTime(movimiento.fecha),
      ]
        .join(' ')
        .toLowerCase()
        .includes(term),
    );
  }, [movimientosCuenta, movimientosSearch]);

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

  const saldo = Number(selectedCliente?.cuentaCorriente?.saldo ?? 0);
  const limiteCredito = Number(selectedCliente?.cuentaCorriente?.limite_credito ?? 0);
  const disponibleCredito =
    limiteCredito > 0 ? Math.max(0, limiteCredito - Math.max(saldo, 0)) : 0;
  const movimientosColumns: DataTableColumn<IMovimientoCuentaCorrienteAux>[] = [
    { key: 'fecha', header: 'Fecha', render: (movimiento) => dateTime(movimiento.fecha) },
    {
      key: 'tipo',
      header: 'Tipo',
      render: (movimiento) => (
        <span className="rounded border border-[#c4c6cd] bg-[#fbf9fa] px-2 py-1 text-[11px] font-bold text-[#075E54]">
          {movimiento.tipo}
        </span>
      ),
    },
    {
      key: 'descripcion',
      header: 'Descripcion',
      render: (movimiento) => movimiento.descripcion || '-',
    },
    {
      key: 'productos',
      header: 'Productos',
      render: (movimiento) => {
        const items = movimientoProductos(movimiento);
        if (!items.length) {
          return (
            <span className="text-[12px] text-[#9ca3af]">
              {movimiento.comprobante_id ? 'Sin items cargados' : 'Movimiento manual'}
            </span>
          );
        }

        return (
          <div className="max-w-[360px] space-y-1">
            <div className="text-[12px] font-bold text-[#041627]">
              {movimiento.comprobante?.numero ?? movimiento.comprobante_id}
            </div>
            {items.slice(0, 4).map((item) => (
              <div key={item.id} className="flex justify-between gap-3 text-[12px] text-[#44474c]">
                <span className="min-w-0 truncate">
                  {Number(item.cantidad ?? 0)} x {item.descripcion}
                </span>
                <span className="shrink-0 font-semibold text-[#041627]">
                  {money(item.subtotal)}
                </span>
              </div>
            ))}
            {items.length > 4 ? (
              <div className="text-[11px] font-semibold text-[#075E54]">
                +{items.length - 4} producto(s) mas
              </div>
            ) : null}
          </div>
        );
      },
    },
    {
      key: 'monto',
      header: 'Monto',
      align: 'right',
      render: (movimiento) => (
        <span className={`font-bold ${Number(movimiento.monto) >= 0 ? 'text-[#041627]' : 'text-[#075E54]'}`}>
          {money(movimiento.monto)}
        </span>
      ),
    },
  ];

  const clientesColumns: DataTableColumn<ICliente>[] = [
    {
      key: 'cliente',
      header: 'Cliente',
      render: (cliente) => (
        <div className="min-w-0">
          <div className="truncate font-bold text-[#041627]">{clienteNombre(cliente)}</div>
          <div className="mt-1 text-[12px] text-[#44474c]">{cliente.tipo}</div>
        </div>
      ),
    },
    {
      key: 'documento',
      header: 'Documento',
      render: (cliente) => cliente.cuit || cliente.dni || '-',
    },
    {
      key: 'contacto',
      header: 'Contacto',
      render: (cliente) => (
        <div className="space-y-1 text-[12px] text-[#44474c]">
          <div>{cliente.telefono || '-'}</div>
          <div className="truncate">{cliente.email || ''}</div>
        </div>
      ),
    },
    {
      key: 'cuenta',
      header: 'Cuenta',
      align: 'right',
      render: (cliente) =>
        cliente.cuentaCorriente ? (
          <span
            className={`font-bold ${
              Number(cliente.cuentaCorriente.saldo) > 0 ? 'text-[#b42318]' : 'text-[#075E54]'
            }`}
          >
            {money(cliente.cuentaCorriente.saldo)}
          </span>
        ) : (
          <span className="text-[12px] text-[#9ca3af]">Sin cuenta</span>
        ),
    },
  ];

  const exportarCuentaCsv = () => {
    if (!selectedCliente) return;
    downloadTextFile(
      `cuenta-corriente-${clienteNombre(selectedCliente).replace(/\s+/g, '-').toLowerCase()}.csv`,
      buildCuentaCorrienteCsv(selectedCliente, movimientosCuenta),
      'text/csv;charset=utf-8',
    );
  };

  const abrirEmailCuenta = () => {
    if (!selectedCliente) return;
    if (!emailDisponible) {
      toast.warning('El servicio de email no esta configurado para esta sucursal');
      return;
    }
    setEmailDestino(selectedCliente.email ?? '');
    setEmailMensaje('');
    setEmailDesde('');
    setEmailHasta('');
    setEmailTipoResumen('CARGOS');
    setEmailAdjuntarPdf(true);
    setEmailOpen(true);
  };

  const enviarEmailCuenta = () => {
    if (!emailDisponible) {
      toast.warning('El servicio de email no esta configurado para esta sucursal');
      return;
    }
    if (!selectedCliente || !emailDestino.trim()) return;
    posAuxMutations.enviarResumenCuentaCorrienteEmail.mutate(
      {
        clienteId: selectedCliente.id,
        destino: emailDestino.trim(),
        mensaje: emailMensaje.trim() || undefined,
        desde: emailDesde || undefined,
        hasta: emailHasta || undefined,
        tipo_resumen: emailTipoResumen,
        adjuntar_pdf: emailAdjuntarPdf,
      },
      {
        onSuccess: () => {
          setEmailOpen(false);
          setEmailMensaje('');
        },
      },
    );
  };

  if (isListView) {
    return (
      <div className="min-h-[calc(100vh-52px)] bg-[#f3f4f6] px-4 py-4">
        <section className="mx-auto max-w-[1500px] rounded-lg border border-[#c4c6cd] bg-white shadow-sm">
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

          <DataTable
            rows={clientesFiltrados}
            columns={clientesColumns}
            getRowKey={(cliente) => cliente.id}
            isLoading={clientesQuery.isLoading}
            loadingMessage="Cargando clientes..."
            emptyMessage="Sin clientes cargados."
            minWidth="920px"
            onRowClick={seleccionarCliente}
            getContextActions={(cliente) => [
              {
                label: 'Ver detalles',
                icon: <Eye size={14} />,
                onClick: () => seleccionarCliente(cliente),
              },
                {
                  label: 'Ver cuenta corriente',
                  icon: <Wallet size={14} />,
                  disabled: !cliente.cuentaCorriente,
                  onClick: () => navigate(`/clientes/${cliente.id}/cuenta`),
                },
              {
                label: 'Nueva venta POS',
                icon: <CreditCard size={14} />,
                dividerBefore: true,
              },
            ]}
          />
        </section>
      </div>
    );
  }

  if (isAccountView) {
    return (
      <div className="min-h-[calc(100vh-52px)] bg-[#f3f4f6] px-4 py-4">
        <div className="mx-auto max-w-[1400px] rounded-lg border border-[#c4c6cd] bg-white shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#c4c6cd] px-4 py-3">
            <div>
              <div className="flex items-center gap-2 text-[18px] font-bold text-[#041627]">
                <Wallet size={18} className="text-[#075E54]" />
                Cuenta corriente
              </div>
              <div className="text-[13px] text-[#44474c]">
                {selectedCliente ? clienteNombre(selectedCliente) : 'Cliente'} | movimientos, saldo y credito.
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => navigate(selectedCliente ? `/clientes/${selectedCliente.id}` : '/clientes')}
                className="flex h-9 items-center gap-2 rounded border border-[#c4c6cd] bg-white px-3 text-[13px] font-semibold text-[#041627] hover:bg-[#f4f5f6]"
              >
                Volver a ficha
              </button>
              {selectedCliente?.cuentaCorriente ? (
                <>
                  <button
                    type="button"
                    onClick={exportarCuentaCsv}
                    className="flex h-9 items-center gap-2 rounded border border-[#c4c6cd] bg-white px-3 text-[13px] font-semibold text-[#041627] hover:bg-[#f4f5f6]"
                  >
                    <Download size={14} />
                    Excel
                  </button>
                  <button
                    type="button"
                    onClick={() => imprimirCuentaCorriente(selectedCliente, movimientosCuenta)}
                    className="flex h-9 items-center gap-2 rounded border border-[#c4c6cd] bg-white px-3 text-[13px] font-semibold text-[#041627] hover:bg-[#f4f5f6]"
                  >
                    <Printer size={14} />
                    PDF
                  </button>
                  {emailDisponible ? (
                    <button
                      type="button"
                      onClick={abrirEmailCuenta}
                      className="flex h-9 items-center gap-2 rounded border border-[#cfe2de] bg-[#f3fbf9] px-3 text-[13px] font-semibold text-[#075E54] hover:bg-[#e8f7f3]"
                    >
                      <Mail size={14} />
                      Enviar email
                    </button>
                  ) : null}
                </>
              ) : null}
            </div>
          </div>

          {!selectedCliente ? (
            <div className="px-4 py-12 text-center text-[14px] text-[#44474c]">
              No se encontro el cliente.
            </div>
          ) : !selectedCliente.cuentaCorriente ? (
            <div className="px-4 py-12 text-center text-[14px] text-[#44474c]">
              Este cliente no tiene cuenta corriente activa.
            </div>
          ) : (
            <>
              {emailOpen && emailDisponible ? (
                <div className="border-b border-[#c4c6cd] bg-white p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="text-[14px] font-bold text-[#041627]">
                        Enviar cuenta corriente por email
                      </div>
                      <div className="text-[12px] text-[#44474c]">
                        PDF con compras/cargos filtrados por periodo
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEmailOpen(false)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded border border-[#c4c6cd] bg-white text-[#041627] hover:bg-[#f4f5f6]"
                      title="Cerrar"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div className="grid gap-3 md:grid-cols-[260px_1fr]">
                    <label className="text-[12px] font-semibold text-[#041627]">
                      Email del cliente
                      <input
                        type="email"
                        value={emailDestino}
                        onChange={(event) => setEmailDestino(event.target.value)}
                        className="mt-1 h-9 w-full rounded border border-[#c4c6cd] px-2 text-[13px] outline-none focus:border-[#075E54]"
                        placeholder="cliente@correo.com"
                      />
                    </label>
                    <label className="text-[12px] font-semibold text-[#041627]">
                      Mensaje
                      <input
                        value={emailMensaje}
                        onChange={(event) => setEmailMensaje(event.target.value)}
                        className="mt-1 h-9 w-full rounded border border-[#c4c6cd] px-2 text-[13px] outline-none focus:border-[#075E54]"
                        placeholder="Te enviamos el detalle de compras de tu cuenta corriente"
                      />
                    </label>
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-[150px_150px_220px_1fr_auto]">
                    <label className="text-[12px] font-semibold text-[#041627]">
                      Desde
                      <input
                        type="date"
                        value={emailDesde}
                        onChange={(event) => setEmailDesde(event.target.value)}
                        className="mt-1 h-9 w-full rounded border border-[#c4c6cd] px-2 text-[13px] outline-none focus:border-[#075E54]"
                      />
                    </label>
                    <label className="text-[12px] font-semibold text-[#041627]">
                      Hasta
                      <input
                        type="date"
                        value={emailHasta}
                        onChange={(event) => setEmailHasta(event.target.value)}
                        className="mt-1 h-9 w-full rounded border border-[#c4c6cd] px-2 text-[13px] outline-none focus:border-[#075E54]"
                      />
                    </label>
                    <label className="text-[12px] font-semibold text-[#041627]">
                      Incluir
                      <select
                        value={emailTipoResumen}
                        onChange={(event) => setEmailTipoResumen(event.target.value as TipoResumenEmail)}
                        className="mt-1 h-9 w-full rounded border border-[#c4c6cd] bg-white px-2 text-[13px] outline-none focus:border-[#075E54]"
                      >
                        <option value="CARGOS">Compras y cargos</option>
                        <option value="COMPRAS">Solo compras con comprobante</option>
                        <option value="CARGOS_Y_RECARGOS">Compras, cargos y recargos</option>
                        <option value="TODOS">Todos los movimientos</option>
                      </select>
                    </label>
                    <label className="mt-auto flex h-9 items-center gap-2 rounded border border-[#c4c6cd] bg-white px-3 text-[12px] font-semibold text-[#041627]">
                      <input
                        type="checkbox"
                        checked={emailAdjuntarPdf}
                        onChange={(event) => setEmailAdjuntarPdf(event.target.checked)}
                        className="h-4 w-4 accent-[#075E54]"
                      />
                      Adjuntar PDF
                    </label>
                    <button
                      type="button"
                      onClick={enviarEmailCuenta}
                      disabled={
                        !emailDestino.trim() ||
                        posAuxMutations.enviarResumenCuentaCorrienteEmail.isPending
                      }
                      className="mt-auto inline-flex h-9 items-center justify-center gap-2 rounded bg-[#075E54] px-3 text-[12px] font-semibold text-white hover:bg-[#0b6d62] disabled:opacity-50"
                    >
                      {posAuxMutations.enviarResumenCuentaCorrienteEmail.isPending ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Mail size={14} />
                      )}
                      Enviar
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="grid gap-3 border-b border-[#c4c6cd] bg-[#fbfbfc] p-4 md:grid-cols-4">
                <div className="rounded border border-[#e5e7eb] bg-white px-3 py-2">
                  <div className="text-[11px] font-bold uppercase text-[#44474c]">Saldo actual</div>
                  <div className={`mt-1 text-[18px] font-bold ${saldo > 0 ? 'text-[#b42318]' : 'text-[#075E54]'}`}>
                    {money(saldo)}
                  </div>
                </div>
                <div className="rounded border border-[#e5e7eb] bg-white px-3 py-2">
                  <div className="text-[11px] font-bold uppercase text-[#44474c]">Limite</div>
                  <div className="mt-1 text-[18px] font-bold text-[#041627]">
                    {limiteCredito > 0 ? money(limiteCredito) : 'Sin limite'}
                  </div>
                </div>
                <div className="rounded border border-[#e5e7eb] bg-white px-3 py-2">
                  <div className="text-[11px] font-bold uppercase text-[#44474c]">Disponible</div>
                  <div className="mt-1 text-[18px] font-bold text-[#075E54]">
                    {limiteCredito > 0 ? money(disponibleCredito) : 'Sin limite'}
                  </div>
                </div>
                <div className="rounded border border-[#e5e7eb] bg-white px-3 py-2">
                  <div className="text-[11px] font-bold uppercase text-[#44474c]">Condicion</div>
                  <div className="mt-1 text-[13px] font-bold text-[#041627]">
                    {selectedCliente.cuentaCorriente.planPago?.tipo_vencimiento === 'DIAS_DESDE_COMPRA'
                      ? `${selectedCliente.cuentaCorriente.planPago.valor_vencimiento} dias`
                      : `Del 1 al ${selectedCliente.cuentaCorriente.planPago?.valor_vencimiento ?? 10}`}
                  </div>
                </div>
              </div>

              <div className="border-b border-[#c4c6cd] bg-white p-4">
                <div className="relative max-w-[360px]">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#44474c]" />
                  <input
                    value={movimientosSearch}
                    onChange={(event) => setMovimientosSearch(event.target.value)}
                    placeholder="Buscar movimiento, comprobante, monto o fecha"
                    className="h-9 w-full rounded border border-[#c4c6cd] bg-white pl-9 pr-2 text-[13px] outline-none focus:border-[#075E54]"
                  />
                </div>
              </div>

              <DataTable
                rows={movimientosCuentaFiltrados}
                columns={movimientosColumns}
                getRowKey={(movimiento) => movimiento.id}
                isLoading={movimientosCuentaQuery.isLoading}
                loadingMessage="Cargando movimientos de cuenta..."
                emptyMessage="Sin movimientos en la cuenta corriente."
                minWidth="980px"
                rowClassName={(movimiento) => (movimiento.omitido ? 'opacity-55' : '')}
              />
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-52px)] bg-[#f3f4f6] px-4 py-4">
      <div className="mx-auto grid max-w-[1500px] gap-4 xl:grid-cols-[1fr_360px]">
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
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => navigate('/clientes')}
                className="flex h-9 items-center gap-2 rounded border border-[#c4c6cd] bg-white px-3 text-[13px] font-semibold text-[#041627] hover:bg-[#f4f5f6]"
              >
                Volver
              </button>
              {!creating && selectedCliente?.cuentaCorriente ? (
                <button
                  type="button"
                  onClick={() => navigate(`/clientes/${selectedCliente.id}/cuenta`)}
                  className="flex h-9 items-center gap-2 rounded border border-[#c4c6cd] bg-white px-3 text-[13px] font-semibold text-[#041627] hover:bg-[#f4f5f6]"
                >
                  <Wallet size={15} />
                  Ver cuenta
                </button>
              ) : null}
              <button
                type="submit"
                disabled={mutations.create.isPending || mutations.update.isPending}
                className="flex h-9 items-center gap-2 rounded bg-[#075E54] px-3 text-[13px] font-semibold text-white hover:bg-[#0b6d62] disabled:opacity-60"
              >
                <Save size={15} />
                Guardar
              </button>
            </div>
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
                  Calle / direccion
                  <div className="mt-1 flex min-h-9 items-center gap-2 rounded border border-[#c4c6cd] px-2">
                    <MapPin size={14} className="text-[#075E54]" />
                    <input {...form.register('direccion')} className="min-w-0 flex-1 py-2 outline-none" />
                  </div>
                </label>
                <label className="text-[12px] font-semibold text-[#041627]">
                  Altura
                  <input {...form.register('altura')} className="mt-1 h-9 w-full rounded border border-[#c4c6cd] px-2 text-[13px] outline-none focus:border-[#075E54]" />
                </label>
                <label className="text-[12px] font-semibold text-[#041627]">
                  Codigo postal
                  <input {...form.register('codigo_postal')} className="mt-1 h-9 w-full rounded border border-[#c4c6cd] px-2 text-[13px] outline-none focus:border-[#075E54]" />
                </label>
                <label className="text-[12px] font-semibold text-[#041627]">
                  Barrio
                  <input {...form.register('barrio')} className="mt-1 h-9 w-full rounded border border-[#c4c6cd] px-2 text-[13px] outline-none focus:border-[#075E54]" />
                </label>
                <label className="text-[12px] font-semibold text-[#041627]">
                  Localidad
                  <input {...form.register('localidad')} className="mt-1 h-9 w-full rounded border border-[#c4c6cd] px-2 text-[13px] outline-none focus:border-[#075E54]" />
                </label>
                <label className="md:col-span-2 text-[12px] font-semibold text-[#041627]">
                  Referencia de entrega
                  <input {...form.register('referencia_entrega')} className="mt-1 h-9 w-full rounded border border-[#c4c6cd] px-2 text-[13px] outline-none focus:border-[#075E54]" />
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

        <FichaHistoryPanel
          className="min-h-[620px] rounded-lg border-[#c4c6cd] shadow-sm"
          title="Historial"
          subtitle="Cambios y movimientos del cliente"
          events={historialCliente}
          isLoading={historialQuery.isLoading}
          labels={clienteHistoryLabels}
          emptyDescription="Aca se vera quien cambio el cliente y que paso."
          getActorName={(evento: any) => {
            const empleado = evento.empleado_id ? empleadosById.get(evento.empleado_id) : null;
            return empleado?.nombreCompleto ?? 'Sistema';
          }}
          getChanges={(evento: any) => clienteChanges(evento.antes, evento.despues)}
        />
      </div>
    </div>
  );
};

export default ClientesPage;
