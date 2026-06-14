import {
  ArrowLeft,
  Banknote,
  CheckCircle2,
  ClipboardList,
  History,
  Eye,
  Minus,
  PackagePlus,
  Plus,
  ReceiptText,
  Search,
  Send,
  Truck,
  UserPlus,
  UserRound,
  WalletCards,
  XCircle,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import AccessDenied from '../../../components/common/AccessDenied';
import DataTable from '../../../components/common/DataTable';
import type { DataTableColumn } from '../../../components/common/DataTable';
import { useAuthStore } from '../../../store/auth.store';
import { getClientesFn } from '../../Clientes/api/clientes.api';
import { getEmpleadosFn } from '../../Empleados/api/empleadosApi';
import { getProductosFn } from '../../Productos/api/productoApi';
import type { IProducto } from '../../Productos/types/productos.type';
import { dateTime, money, toNumber } from '../../POSAuxiliares/utils/format';
import { useCajaAbierta, useMediosPagoActivos } from '../../PuntoDeVenta/hooks/usePos';
import { useHistorialPedidoEnvio, usePedidosEnvio, usePedidosEnvioMutations } from '../hooks/usePedidosEnvio';
import type {
  EstadoPagoPedidoEnvio,
  EstadoPedidoEnvio,
  IPedidoEnvio,
  MedioPagoPedidoEnvio,
} from '../types/pedido-envio.type';

type ViewMode = 'list' | 'new' | 'edit' | 'detail';
type PedidoItemDraft = {
  id: string;
  producto_id: string;
  cantidad: string;
  precio_unitario: string;
};

const estadoClass: Record<EstadoPedidoEnvio, string> = {
  PENDIENTE: 'border-[#f6d58f] bg-[#fff8e6] text-[#8a5a00]',
  PREPARANDO: 'border-[#bfd7ff] bg-[#f2f7ff] text-[#1d4f91]',
  EN_CAMINO: 'border-[#cfe2de] bg-[#eef8f6] text-[#075E54]',
  ENTREGADO: 'border-[#cfe2de] bg-[#f3fbf9] text-[#075E54]',
  CANCELADO: 'border-[#f1c7c7] bg-[#fff5f5] text-[#b42318]',
};

const pagoClass: Record<EstadoPagoPedidoEnvio, string> = {
  PENDIENTE_PAGO: 'border-[#f6d58f] bg-[#fff8e6] text-[#8a5a00]',
  PAGADO: 'border-[#cfe2de] bg-[#f3fbf9] text-[#075E54]',
  PENDIENTE_RENDICION: 'border-[#f6d58f] bg-[#fff8e6] text-[#8a5a00]',
  RENDIDO: 'border-[#cfe2de] bg-[#eef8f6] text-[#075E54]',
};

const estadoLabel: Record<EstadoPedidoEnvio, string> = {
  PENDIENTE: 'Pendiente',
  PREPARANDO: 'Preparando',
  EN_CAMINO: 'En camino',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado',
};

const pagoLabel: Record<EstadoPagoPedidoEnvio, string> = {
  PENDIENTE_PAGO: 'Pendiente pago',
  PAGADO: 'Pagado',
  PENDIENTE_RENDICION: 'Pendiente rendicion',
  RENDIDO: 'Rendido',
};

const medioPagoLabel: Record<MedioPagoPedidoEnvio, string> = {
  EFECTIVO: 'Efectivo',
  TRANSFERENCIA: 'Transferencia',
  OTRO: 'Otro',
};

const accionHistorialLabel: Record<string, string> = {
  CREAR_PEDIDO_ENVIO: 'Pedido creado',
  EDITAR_PEDIDO_ENVIO: 'Pedido editado',
  CAMBIAR_ESTADO_PEDIDO_ENVIO: 'Cambio de estado',
  RENDIR_PEDIDO_ENVIO: 'Rendicion registrada',
};

const newItem = (): PedidoItemDraft => ({
  id: crypto.randomUUID(),
  producto_id: '',
  cantidad: '1',
  precio_unitario: '',
});

const clienteNombre = (cliente?: { nombre?: string; apellido?: string | null; razon_social?: string | null } | null) =>
  cliente?.razon_social || `${cliente?.nombre ?? ''} ${cliente?.apellido ?? ''}`.trim() || 'Cliente';

const productoPrecio = (producto?: IProducto | null) =>
  toNumber(producto?.precio_venta ?? producto?.precio_base);

const todayKey = () => new Date().toISOString().slice(0, 10);

const PedidosEnvioPage = () => {
  const permisos = useAuthStore((state) => state.permisos);
  const puedeVer = permisos.includes('ventas.ver') || permisos.includes('ventas.crear');
  const puedeCrear = permisos.includes('ventas.crear');
  const puedeRendir = permisos.includes('caja.cobrar') || permisos.includes('ventas.crear');
  const pedidosQuery = usePedidosEnvio();
  const mutations = usePedidosEnvioMutations();
  const clientesQuery = useQuery({ queryKey: ['pedidos-envio', 'clientes'], queryFn: getClientesFn, enabled: puedeVer });
  const empleadosQuery = useQuery({ queryKey: ['pedidos-envio', 'empleados'], queryFn: () => getEmpleadosFn(1, 200), enabled: puedeVer });
  const productosQuery = useQuery({ queryKey: ['pedidos-envio', 'productos'], queryFn: () => getProductosFn(1, 300), enabled: puedeVer });
  const cajaQuery = useCajaAbierta();
  const mediosPagoQuery = useMediosPagoActivos();

  const [view, setView] = useState<ViewMode>('list');
  const [search, setSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const historialQuery = useHistorialPedidoEnvio(view === 'detail' ? selectedId : null);
  const [clienteId, setClienteId] = useState('');
  const [direccion, setDireccion] = useState('');
  const [localidad, setLocalidad] = useState('');
  const [barrio, setBarrio] = useState('');
  const [codigoPostal, setCodigoPostal] = useState('');
  const [telefono, setTelefono] = useState('');
  const [referencia, setReferencia] = useState('');
  const [fechaProgramada, setFechaProgramada] = useState('');
  const [repartidorId, setRepartidorId] = useState('');
  const [medioPago, setMedioPago] = useState<MedioPagoPedidoEnvio>('EFECTIVO');
  const [transferenciaPagada, setTransferenciaPagada] = useState(true);
  const [observaciones, setObservaciones] = useState('');
  const [items, setItems] = useState<PedidoItemDraft[]>([newItem()]);
  const [montoRendido, setMontoRendido] = useState('');
  const [referenciaPago, setReferenciaPago] = useState('');
  const [medioPagoRendidoId, setMedioPagoRendidoId] = useState('');

  const clientes = clientesQuery.data ?? [];
  const empleados = empleadosQuery.data?.data ?? [];
  const productosResponse = productosQuery.data;
  const productos = (Array.isArray(productosResponse) ? productosResponse : productosResponse?.data ?? [])
    .filter((producto) => producto.activo && producto.activo_pos);
  const cajaAbierta = cajaQuery.data;
  const mediosPago = mediosPagoQuery.data ?? [];
  const pedidos = pedidosQuery.data ?? [];

  const clientesById = useMemo(() => new Map(clientes.map((cliente) => [cliente.id, cliente])), [clientes]);
  const empleadosById = useMemo(() => new Map(empleados.map((empleado) => [empleado.id, empleado])), [empleados]);
  const productosById = useMemo(() => new Map(productos.map((producto) => [producto.id, producto])), [productos]);
  const pedidosDelDia = useMemo(
    () => pedidos.filter((pedido) => new Date(pedido.created_at).toISOString().slice(0, 10) === todayKey()),
    [pedidos],
  );
  const pedidosFiltrados = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return pedidosDelDia;
    return pedidosDelDia.filter((pedido) => {
      const cliente = clienteNombre(clientesById.get(pedido.cliente_id)).toLowerCase();
      const productosPedido = pedido.comprobante?.items?.map((item) => item.descripcion).join(' ').toLowerCase() ?? '';
      return (
        cliente.includes(term) ||
        pedido.direccion_entrega.toLowerCase().includes(term) ||
        pedido.estado.toLowerCase().includes(term) ||
        pedido.estado_pago.toLowerCase().includes(term) ||
        productosPedido.includes(term)
      );
    });
  }, [clientesById, pedidosDelDia, search]);
  const productosFiltrados = useMemo(() => {
    const term = productSearch.trim().toLowerCase();
    if (!term) return productos.slice(0, 20);
    return productos
      .filter((producto) =>
        [producto.nombre, producto.descripcion, producto.codigo_barras, producto.categoria?.nombre]
          .join(' ')
          .toLowerCase()
          .includes(term),
      )
      .slice(0, 30);
  }, [productSearch, productos]);
  const selectedPedido = selectedId ? pedidos.find((pedido) => pedido.id === selectedId) ?? null : null;
  const totalDraft = items.reduce((sum, item) => {
    const producto = productosById.get(item.producto_id);
    const precio = item.precio_unitario === '' ? productoPrecio(producto) : toNumber(item.precio_unitario);
    return sum + toNumber(item.cantidad) * precio;
  }, 0);

  const resetForm = () => {
    setClienteId('');
    setDireccion('');
    setLocalidad('');
    setBarrio('');
    setCodigoPostal('');
    setTelefono('');
    setReferencia('');
    setFechaProgramada('');
    setRepartidorId('');
    setMedioPago('EFECTIVO');
    setTransferenciaPagada(true);
    setObservaciones('');
    setItems([newItem()]);
    setProductSearch('');
  };

  const abrirDetalle = (pedido: IPedidoEnvio) => {
    setSelectedId(pedido.id);
    setMontoRendido(String(toNumber(pedido.comprobante?.total)));
    setReferenciaPago('');
    setMedioPagoRendidoId('');
    setView('detail');
  };

  const abrirEdicion = (pedido: IPedidoEnvio) => {
    setSelectedId(pedido.id);
    setClienteId(pedido.cliente_id);
    setDireccion(pedido.direccion_entrega ?? '');
    setLocalidad(pedido.localidad_entrega ?? '');
    setBarrio(pedido.barrio_entrega ?? '');
    setCodigoPostal(pedido.codigo_postal_entrega ?? '');
    setTelefono(pedido.telefono_contacto ?? '');
    setReferencia(pedido.referencia_entrega ?? '');
    setFechaProgramada(pedido.fecha_programada ? pedido.fecha_programada.slice(0, 16) : '');
    setRepartidorId(pedido.empleado_repartidor_id ?? '');
    setMedioPago(pedido.medio_pago_previsto);
    setTransferenciaPagada(pedido.estado_pago === 'PAGADO');
    setObservaciones(pedido.observaciones ?? '');
    setItems(
      (pedido.comprobante?.items ?? [])
        .filter((item) => item.producto_id)
        .map((item) => ({
          id: item.id,
          producto_id: item.producto_id!,
          cantidad: String(toNumber(item.cantidad)),
          precio_unitario: String(toNumber(item.precio_unitario)),
        })),
    );
    setView('edit');
  };

  const addProduct = (producto: IProducto) => {
    const productoId = producto.id;
    if (!productoId) return;
    setItems((current) => {
      const existing = current.find((item) => item.producto_id === productoId);
      if (existing) {
        return current.map((item) =>
          item.id === existing.id ? { ...item, cantidad: String(toNumber(item.cantidad) + 1) } : item,
        );
      }
      const empty = current.find((item) => !item.producto_id);
      if (empty) {
        return current.map((item) =>
          item.id === empty.id
            ? { ...item, producto_id: productoId, cantidad: '1', precio_unitario: String(productoPrecio(producto)) }
            : item,
        );
      }
      return [...current, { id: crypto.randomUUID(), producto_id: productoId, cantidad: '1', precio_unitario: String(productoPrecio(producto)) }];
    });
  };

  const updateItem = (id: string, patch: Partial<PedidoItemDraft>) => {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const changeQuantity = (itemId: string, delta: number) => {
    setItems((current) =>
      current
        .map((item) => (item.id === itemId ? { ...item, cantidad: String(Math.max(0, toNumber(item.cantidad) + delta)) } : item))
        .filter((item) => item.producto_id && toNumber(item.cantidad) > 0),
    );
  };

  const guardarPedido = () => {
    const itemsValidos = items
      .filter((item) => item.producto_id && toNumber(item.cantidad) > 0)
      .map((item) => ({
        producto_id: item.producto_id,
        cantidad: toNumber(item.cantidad),
        precio_unitario: item.precio_unitario === '' ? undefined : toNumber(item.precio_unitario),
      }));

    if (!clienteId) {
      window.alert('Seleccione un cliente. Para uno nuevo use el formulario de clientes.');
      return;
    }
    if (!direccion.trim()) {
      window.alert('Ingrese la direccion de entrega');
      return;
    }
    if (!itemsValidos.length) {
      window.alert('Agregue al menos un producto');
      return;
    }
    if (!cajaAbierta?.id && view !== 'edit') {
      window.alert('Debe haber una caja abierta para crear el pedido');
      return;
    }

    const payload = {
      caja_id: cajaAbierta?.id ?? selectedPedido?.comprobante?.caja_id ?? '',
      cliente_id: clienteId,
      empleado_repartidor_id: repartidorId || null,
      medio_pago_previsto: medioPago,
      estado_pago: medioPago === 'TRANSFERENCIA' && transferenciaPagada ? 'PAGADO' as const : undefined,
      direccion_entrega: direccion,
      localidad_entrega: localidad || null,
      barrio_entrega: barrio || null,
      codigo_postal_entrega: codigoPostal || null,
      telefono_contacto: telefono || null,
      referencia_entrega: referencia || null,
      fecha_programada: fechaProgramada || null,
      observaciones: observaciones || null,
      items: itemsValidos,
    };

    if (view === 'edit' && selectedPedido) {
      mutations.editar.mutate(
        { ...payload, id: selectedPedido.id },
        {
          onSuccess: (pedido) => {
            setSelectedId(pedido.id);
            resetForm();
            setView('detail');
          },
        },
      );
      return;
    }

    mutations.crear.mutate(
      {
        ...payload,
        cliente_id: clienteId,
      },
      {
        onSuccess: (pedido) => {
          setSelectedId(pedido.id);
          resetForm();
          setView('detail');
        },
      },
    );
  };

  const cambiarEstado = (pedido: IPedidoEnvio, estado: EstadoPedidoEnvio) => {
    mutations.cambiarEstado.mutate({
      id: pedido.id,
      estado,
      empleado_repartidor_id: repartidorId || pedido.empleado_repartidor_id || null,
    });
  };

  const rendir = (pedido: IPedidoEnvio) => {
    if (!puedeRendir) {
      window.alert('No tenes permisos para rendir pedidos');
      return;
    }
    if (pedido.estado_pago === 'RENDIDO') {
      window.alert('Este pedido ya fue rendido');
      return;
    }
    const medioPagoSeleccionado =
      medioPagoRendidoId ||
      mediosPago.find((medio) => {
        if (pedido.medio_pago_previsto === 'EFECTIVO') return medio.tipo === 'efectivo';
        if (pedido.medio_pago_previsto === 'TRANSFERENCIA') return medio.tipo === 'transferencia';
        return medio.tipo === 'otro';
      })?.id ||
      '';

    if (!cajaAbierta?.id) {
      window.alert('Debe haber una caja abierta para rendir el pedido');
      return;
    }
    if (!medioPagoSeleccionado) {
      window.alert('Seleccione el medio de pago real para registrar la rendicion');
      return;
    }

    mutations.rendir.mutate({
      id: pedido.id,
      caja_id: cajaAbierta.id,
      medio_pago_id: medioPagoSeleccionado,
      monto_rendido: montoRendido ? toNumber(montoRendido) : toNumber(pedido.comprobante?.total),
      referencia_pago: referenciaPago || null,
      observaciones: 'Rendicion registrada desde pedidos de envio',
    });
  };

  const pedidoColumns: DataTableColumn<IPedidoEnvio>[] = [
    { key: 'hora', header: 'Hora', render: (pedido) => dateTime(pedido.created_at) },
    {
      key: 'cliente',
      header: 'Cliente',
      render: (pedido) => (
        <div className="min-w-0">
          <div className="truncate font-bold text-[#041627]">{clienteNombre(clientesById.get(pedido.cliente_id))}</div>
          <div className="mt-1 truncate text-[12px] text-[#44474c]">{pedido.telefono_contacto || 'Sin telefono'}</div>
        </div>
      ),
    },
    {
      key: 'direccion',
      header: 'Direccion',
      render: (pedido) => (
        <div className="min-w-0">
          <div className="truncate font-semibold text-[#041627]">{pedido.direccion_entrega}</div>
          <div className="mt-1 truncate text-[12px] text-[#44474c]">
            {[pedido.barrio_entrega, pedido.localidad_entrega, pedido.codigo_postal_entrega ? `CP ${pedido.codigo_postal_entrega}` : null].filter(Boolean).join(' | ') || 'Sin zona'}
          </div>
        </div>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (pedido) => (
        <span className={`rounded border px-2 py-1 text-[11px] font-semibold ${estadoClass[pedido.estado]}`}>
          {estadoLabel[pedido.estado]}
        </span>
      ),
    },
    {
      key: 'pago',
      header: 'Pago',
      render: (pedido) => (
        <span className={`rounded border px-2 py-1 text-[11px] font-semibold ${pagoClass[pedido.estado_pago]}`}>
          {pagoLabel[pedido.estado_pago]}
        </span>
      ),
    },
    {
      key: 'repartidor',
      header: 'Asignado',
      render: (pedido) =>
        pedido.empleado_repartidor_id
          ? empleadosById.get(pedido.empleado_repartidor_id)?.nombreCompleto ?? 'Asignado'
          : 'Sin asignar',
    },
    {
      key: 'total',
      header: 'Total',
      align: 'right',
      render: (pedido) => <span className="font-bold text-[#041627]">{money(pedido.comprobante?.total ?? 0)}</span>,
    },
  ];

  if (!puedeVer) {
    return (
      <AccessDenied
        title="Sin permisos para pedidos de envio"
        message="Necesitas permisos de ventas para consultar esta seccion."
      />
    );
  }

  if (view === 'new' || view === 'edit') {
    const editing = view === 'edit';
    return (
      <div className="min-h-[calc(100vh-52px)] bg-[#f3f4f6] px-4 py-4">
        <section className="mx-auto max-w-[1500px] rounded-lg border border-[#c4c6cd] bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#c4c6cd] px-4 py-3">
            <div>
              <div className="flex items-center gap-2 text-[18px] font-bold text-[#041627]">
                <PackagePlus size={18} className="text-[#075E54]" />
                {editing ? 'Editar pedido de envio' : 'Nuevo pedido de envio'}
              </div>
              <div className="text-[13px] text-[#44474c]">Carga separada del tablero diario.</div>
            </div>
            <button
              type="button"
              onClick={() => setView('list')}
              className="flex h-9 items-center gap-2 rounded border border-[#c4c6cd] bg-white px-3 text-[13px] font-semibold text-[#041627]"
            >
              <ArrowLeft size={15} />
              Volver a pedidos
            </button>
          </div>

          <div className="grid gap-3 p-4 lg:grid-cols-2">
            <div className="grid gap-2 sm:grid-cols-[1fr_auto] lg:col-span-2">
              <select
                value={clienteId}
                onChange={(event) => {
                  const cliente = clientesById.get(event.target.value);
                  const direccionCompleta = [cliente?.direccion, cliente?.altura].filter(Boolean).join(' ');
                  setClienteId(event.target.value);
                  setDireccion(direccionCompleta);
                  setTelefono(cliente?.telefono ?? '');
                  setBarrio(cliente?.barrio ?? '');
                  setLocalidad(cliente?.localidad ?? '');
                  setCodigoPostal(cliente?.codigo_postal ?? '');
                  setReferencia(cliente?.referencia_entrega ?? '');
                }}
                disabled={editing}
                className="h-9 rounded border border-[#c4c6cd] bg-white px-3 text-[13px] outline-none focus:border-[#075E54] disabled:bg-[#f4f5f6]"
              >
                <option value="">Seleccionar cliente cargado</option>
                {clientes.map((cliente) => (
                  <option key={cliente.id} value={cliente.id}>
                    {clienteNombre(cliente)}
                  </option>
                ))}
              </select>
              <Link
                to="/clientes/nuevo"
                className="flex h-9 items-center justify-center gap-2 rounded border border-[#cfe2de] bg-[#f3fbf9] px-3 text-[13px] font-semibold text-[#075E54]"
              >
                <UserPlus size={15} />
                Nuevo cliente
              </Link>
            </div>
            <input value={direccion} onChange={(event) => setDireccion(event.target.value)} placeholder="Direccion de entrega" className="h-9 rounded border border-[#c4c6cd] px-3 text-[13px] outline-none focus:border-[#075E54]" />
            <input value={telefono} onChange={(event) => setTelefono(event.target.value)} placeholder="Telefono de contacto" className="h-9 rounded border border-[#c4c6cd] px-3 text-[13px] outline-none focus:border-[#075E54]" />
            <input value={localidad} onChange={(event) => setLocalidad(event.target.value)} placeholder="Localidad" className="h-9 rounded border border-[#c4c6cd] px-3 text-[13px] outline-none focus:border-[#075E54]" />
            <input value={barrio} onChange={(event) => setBarrio(event.target.value)} placeholder="Barrio" className="h-9 rounded border border-[#c4c6cd] px-3 text-[13px] outline-none focus:border-[#075E54]" />
            <input value={codigoPostal} onChange={(event) => setCodigoPostal(event.target.value)} placeholder="Codigo postal" className="h-9 rounded border border-[#c4c6cd] px-3 text-[13px] outline-none focus:border-[#075E54]" />
            <input value={referencia} onChange={(event) => setReferencia(event.target.value)} placeholder="Referencia de entrega" className="h-9 rounded border border-[#c4c6cd] px-3 text-[13px] outline-none focus:border-[#075E54]" />
            <input type="datetime-local" value={fechaProgramada} onChange={(event) => setFechaProgramada(event.target.value)} className="h-9 rounded border border-[#c4c6cd] px-3 text-[13px] outline-none focus:border-[#075E54]" />
            <select value={repartidorId} onChange={(event) => setRepartidorId(event.target.value)} className="h-9 rounded border border-[#c4c6cd] bg-white px-3 text-[13px] outline-none focus:border-[#075E54]">
              <option value="">Repartidor sin asignar</option>
              {empleados.map((empleado) => <option key={empleado.id} value={empleado.id}>{empleado.nombreCompleto}</option>)}
            </select>
            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <select value={medioPago} onChange={(event) => setMedioPago(event.target.value as MedioPagoPedidoEnvio)} className="h-9 rounded border border-[#c4c6cd] bg-white px-3 text-[13px] outline-none focus:border-[#075E54]">
                <option value="EFECTIVO">Efectivo al entregar</option>
                <option value="TRANSFERENCIA">Transferencia</option>
                <option value="OTRO">Otro medio</option>
              </select>
              <label className="flex h-9 items-center gap-2 rounded border border-[#c4c6cd] px-3 text-[12px] font-semibold text-[#041627]">
                Transferencia pagada
                <input type="checkbox" checked={transferenciaPagada} disabled={medioPago !== 'TRANSFERENCIA'} onChange={(event) => setTransferenciaPagada(event.target.checked)} className="h-4 w-4 accent-[#075E54]" />
              </label>
            </div>
          </div>

          <div className="grid gap-4 border-t border-[#c4c6cd] p-4 lg:grid-cols-[1fr_0.9fr]">
            <div className="rounded border border-[#c4c6cd]">
              <div className="border-b border-[#c4c6cd] p-3">
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#44474c]" />
                  <input value={productSearch} onChange={(event) => setProductSearch(event.target.value)} placeholder="Buscar producto por nombre o codigo" className="h-9 w-full rounded border border-[#c4c6cd] bg-white pl-9 pr-3 text-[13px] outline-none focus:border-[#075E54]" />
                </div>
              </div>
              <div className="max-h-[360px] overflow-auto">
                {productosFiltrados.map((producto) => (
                  <button key={producto.id} type="button" onClick={() => addProduct(producto)} className="grid w-full grid-cols-[1fr_auto] gap-3 border-b border-[#e5e7eb] px-3 py-2 text-left hover:bg-[#f8fafc]">
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-bold text-[#041627]">{producto.nombre}</span>
                      <span className="block truncate text-[12px] text-[#44474c]">{producto.codigo_barras || producto.categoria?.nombre || 'Sin codigo'}</span>
                    </span>
                    <span className="text-right text-[13px] font-bold text-[#075E54]">{money(productoPrecio(producto))}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded border border-[#c4c6cd]">
              <div className="flex items-center justify-between border-b border-[#c4c6cd] px-3 py-3">
                <div className="text-[13px] font-bold text-[#041627]">Carrito del pedido</div>
                <div className="text-[13px] font-bold text-[#075E54]">{money(totalDraft)}</div>
              </div>
              <div className="max-h-[360px] overflow-auto">
                {items.filter((item) => item.producto_id).map((item) => {
                  const producto = productosById.get(item.producto_id);
                  const precio = item.precio_unitario === '' ? productoPrecio(producto) : toNumber(item.precio_unitario);
                  return (
                    <div key={item.id} className="border-b border-[#e5e7eb] px-3 py-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-[13px] font-bold text-[#041627]">{producto?.nombre ?? 'Producto'}</div>
                          <div className="text-[12px] text-[#44474c]">{money(precio)} c/u</div>
                        </div>
                        <div className="text-right text-[13px] font-bold text-[#041627]">{money(precio * toNumber(item.cantidad))}</div>
                      </div>
                      <div className="mt-2 grid grid-cols-[32px_1fr_32px_80px_32px] gap-2">
                        <button type="button" onClick={() => changeQuantity(item.id, -1)} className="flex h-8 items-center justify-center rounded border border-[#c4c6cd] bg-white"><Minus size={14} /></button>
                        <input type="number" min={0.01} value={item.cantidad} onChange={(event) => updateItem(item.id, { cantidad: event.target.value })} className="h-8 rounded border border-[#c4c6cd] px-2 text-center text-[13px] outline-none focus:border-[#075E54]" />
                        <button type="button" onClick={() => changeQuantity(item.id, 1)} className="flex h-8 items-center justify-center rounded border border-[#c4c6cd] bg-white"><Plus size={14} /></button>
                        <input type="number" min={0} value={item.precio_unitario} onChange={(event) => updateItem(item.id, { precio_unitario: event.target.value })} className="h-8 rounded border border-[#c4c6cd] px-2 text-right text-[13px] outline-none focus:border-[#075E54]" />
                        <button type="button" onClick={() => setItems((current) => current.filter((currentItem) => currentItem.id !== item.id))} className="flex h-8 items-center justify-center rounded border border-[#f1c7c7] bg-[#fff5f5] text-[#b42318]"><XCircle size={14} /></button>
                      </div>
                    </div>
                  );
                })}
                {!items.some((item) => item.producto_id) ? <div className="px-3 py-8 text-center text-[13px] text-[#44474c]">Busque productos y agreguelos al pedido.</div> : null}
              </div>
            </div>
          </div>

          <div className="grid gap-3 border-t border-[#c4c6cd] p-4 md:grid-cols-[1fr_180px]">
            <textarea value={observaciones} onChange={(event) => setObservaciones(event.target.value)} placeholder="Observaciones del pedido" className="min-h-[74px] rounded border border-[#c4c6cd] px-3 py-2 text-[13px] outline-none focus:border-[#075E54]" />
            <button type="button" onClick={guardarPedido} disabled={!puedeCrear || mutations.crear.isPending || mutations.editar.isPending} className="flex h-[74px] items-center justify-center gap-2 rounded bg-[#075E54] px-4 text-[13px] font-semibold text-white disabled:opacity-60">
              <PackagePlus size={16} />
              {editing ? 'Guardar cambios' : 'Crear pedido'}
            </button>
          </div>
        </section>
      </div>
    );
  }

  if (view === 'detail') {
    return (
      <div className="min-h-[calc(100vh-52px)] bg-[#f3f4f6] px-4 py-4">
        <section className="mx-auto max-w-[1500px] rounded-lg border border-[#c4c6cd] bg-white shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#c4c6cd] px-4 py-3">
            <div>
              <div className="flex items-center gap-2 text-[18px] font-bold text-[#041627]">
                <ClipboardList size={18} className="text-[#075E54]" />
                Ficha del pedido
              </div>
              <div className="text-[13px] text-[#44474c]">Cliente, entrega, productos, asignacion y rendicion.</div>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedPedido && !['ENTREGADO', 'CANCELADO'].includes(selectedPedido.estado) && !['PAGADO', 'RENDIDO'].includes(selectedPedido.estado_pago) ? (
                <button type="button" onClick={() => abrirEdicion(selectedPedido)} className="flex h-9 items-center gap-2 rounded border border-[#cfe2de] bg-[#f3fbf9] px-3 text-[13px] font-semibold text-[#075E54]">
                  <PackagePlus size={15} />
                  Editar pedido
                </button>
              ) : null}
              <button type="button" onClick={() => setView('list')} className="flex h-9 items-center gap-2 rounded border border-[#c4c6cd] bg-white px-3 text-[13px] font-semibold text-[#041627]">
                <ArrowLeft size={15} />
                Volver a tabla
              </button>
            </div>
          </div>

          {!selectedPedido ? (
            <div className="px-4 py-12 text-center text-[14px] text-[#44474c]">Seleccione un pedido desde la tabla.</div>
          ) : (
            <div className="p-4">
              <div className="grid gap-3 md:grid-cols-4">
                <InfoBox label="Cliente" value={clienteNombre(clientesById.get(selectedPedido.cliente_id))} />
                <InfoBox label="Total" value={money(selectedPedido.comprobante?.total ?? 0)} />
                <InfoBox label="Pago" value={medioPagoLabel[selectedPedido.medio_pago_previsto]} />
                <InfoBox label="Repartidor" value={selectedPedido.empleado_repartidor_id ? empleadosById.get(selectedPedido.empleado_repartidor_id)?.nombreCompleto ?? 'Asignado' : 'Sin asignar'} />
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <InfoBox label="Direccion" value={selectedPedido.direccion_entrega} />
                <InfoBox label="Zona" value={[selectedPedido.barrio_entrega, selectedPedido.localidad_entrega, selectedPedido.codigo_postal_entrega ? `CP ${selectedPedido.codigo_postal_entrega}` : null].filter(Boolean).join(' | ') || 'Sin zona'} />
                <InfoBox label="Telefono" value={selectedPedido.telefono_contacto || 'Sin telefono'} />
              </div>

              <div className="mt-4 rounded border border-[#e5e7eb] bg-white">
                {(selectedPedido.comprobante?.items ?? []).map((item) => (
                  <div key={item.id} className="grid grid-cols-[1fr_80px_120px] border-b border-[#e5e7eb] px-3 py-2 text-[13px] last:border-b-0">
                    <span className="font-semibold text-[#041627]">{item.descripcion}</span>
                    <span className="text-right text-[#44474c]">{toNumber(item.cantidad)}</span>
                    <span className="text-right font-semibold text-[#041627]">{money(item.subtotal)}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 grid gap-2 md:grid-cols-4">
                <button type="button" onClick={() => cambiarEstado(selectedPedido, 'PREPARANDO')} disabled={selectedPedido.estado !== 'PENDIENTE' || mutations.cambiarEstado.isPending} className="flex h-9 items-center justify-center gap-2 rounded border border-[#bfd7ff] bg-[#f2f7ff] text-[13px] font-semibold text-[#1d4f91] disabled:opacity-50"><ReceiptText size={15} />Preparar</button>
                <button type="button" onClick={() => cambiarEstado(selectedPedido, 'EN_CAMINO')} disabled={['EN_CAMINO', 'ENTREGADO', 'CANCELADO'].includes(selectedPedido.estado) || mutations.cambiarEstado.isPending} className="flex h-9 items-center justify-center gap-2 rounded border border-[#cfe2de] bg-[#eef8f6] text-[13px] font-semibold text-[#075E54] disabled:opacity-50"><Send size={15} />En camino</button>
                <button type="button" onClick={() => cambiarEstado(selectedPedido, 'ENTREGADO')} disabled={['ENTREGADO', 'CANCELADO'].includes(selectedPedido.estado) || mutations.cambiarEstado.isPending} className="flex h-9 items-center justify-center gap-2 rounded bg-[#075E54] text-[13px] font-semibold text-white disabled:opacity-50"><CheckCircle2 size={15} />Entregado</button>
                <button type="button" onClick={() => cambiarEstado(selectedPedido, 'CANCELADO')} disabled={['ENTREGADO', 'CANCELADO'].includes(selectedPedido.estado) || mutations.cambiarEstado.isPending} className="flex h-9 items-center justify-center gap-2 rounded border border-[#f1c7c7] bg-[#fff5f5] text-[13px] font-semibold text-[#b42318] disabled:opacity-50"><XCircle size={15} />Cancelar</button>
              </div>

              <div className="mt-4 grid gap-3 border-t border-[#c4c6cd] pt-4 md:grid-cols-[1fr_1fr_1fr_160px]">
                {!cajaAbierta ? (
                  <div className="rounded border border-[#f6d58f] bg-[#fff8e6] px-3 py-2 text-[12px] font-semibold text-[#8a5a00] md:col-span-4">
                    Para rendir el dinero debe haber una caja abierta.
                  </div>
                ) : null}
                <input type="number" min={0} value={montoRendido} onChange={(event) => setMontoRendido(event.target.value)} placeholder={`Monto rendido ${money(selectedPedido.comprobante?.total ?? 0)}`} className="h-9 rounded border border-[#c4c6cd] px-3 text-[13px] outline-none focus:border-[#075E54]" />
                <input value={referenciaPago} onChange={(event) => setReferenciaPago(event.target.value)} placeholder="Referencia de pago o comprobante" className="h-9 rounded border border-[#c4c6cd] px-3 text-[13px] outline-none focus:border-[#075E54]" />
                <select value={medioPagoRendidoId} onChange={(event) => setMedioPagoRendidoId(event.target.value)} className="h-9 rounded border border-[#c4c6cd] bg-white px-3 text-[13px] outline-none focus:border-[#075E54]">
                  <option value="">Medio sugerido: {medioPagoLabel[selectedPedido.medio_pago_previsto]}</option>
                  {mediosPago.map((medio) => <option key={medio.id} value={medio.id}>{medio.nombre}</option>)}
                </select>
                <button type="button" onClick={() => rendir(selectedPedido)} disabled={selectedPedido.estado_pago === 'RENDIDO' || mutations.rendir.isPending} className="flex h-9 items-center justify-center gap-2 rounded bg-[#075E54] px-3 text-[13px] font-semibold text-white disabled:opacity-50">
                  {selectedPedido.medio_pago_previsto === 'EFECTIVO' ? <Banknote size={15} /> : <WalletCards size={15} />}
                  Rendir
                </button>
              </div>

              <div className="mt-5 border-t border-[#c4c6cd] pt-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-[15px] font-bold text-[#041627]">
                    <History size={17} className="text-[#075E54]" />
                    Historial del pedido
                  </div>
                  <button
                    type="button"
                    onClick={() => historialQuery.refetch()}
                    className="h-8 rounded border border-[#c4c6cd] bg-white px-3 text-[12px] font-semibold text-[#041627]"
                  >
                    Actualizar
                  </button>
                </div>

                {historialQuery.isLoading ? (
                  <div className="rounded border border-[#e5e7eb] bg-[#fbfbfc] px-3 py-6 text-center text-[13px] text-[#44474c]">
                    Cargando historial del pedido...
                  </div>
                ) : (historialQuery.data ?? []).length === 0 ? (
                  <div className="rounded border border-[#e5e7eb] bg-[#fbfbfc] px-3 py-6 text-center text-[13px] text-[#44474c]">
                    Todavia no hay eventos registrados para este pedido.
                  </div>
                ) : (
                  <div className="rounded border border-[#e5e7eb] bg-white">
                    {(historialQuery.data ?? []).map((evento) => {
                      const empleado = evento.empleado_id ? empleadosById.get(evento.empleado_id) : null;
                      const cambiosItems = [
                        evento.metadata?.items_agregados?.length ? `${evento.metadata.items_agregados.length} agregado(s)` : null,
                        evento.metadata?.items_eliminados?.length ? `${evento.metadata.items_eliminados.length} eliminado(s)` : null,
                        evento.metadata?.items_modificados?.length ? `${evento.metadata.items_modificados.length} modificado(s)` : null,
                      ].filter(Boolean).join(' | ');
                      return (
                        <div key={evento.id} className="grid gap-3 border-b border-[#e5e7eb] px-3 py-3 last:border-b-0 md:grid-cols-[170px_1fr]">
                          <div className="text-[12px] font-semibold text-[#59616b]">{dateTime(evento.created_at)}</div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[13px] font-bold text-[#041627]">
                                {accionHistorialLabel[evento.accion] ?? evento.accion}
                              </span>
                              <span className="inline-flex items-center gap-1 rounded border border-[#d7d9de] bg-[#fbfbfc] px-2 py-0.5 text-[11px] font-semibold text-[#44474c]">
                                <UserRound size={12} />
                                {empleado?.nombreCompleto ?? evento.empleado_id ?? 'Sistema'}
                              </span>
                            </div>
                            {evento.descripcion ? (
                              <div className="mt-1 text-[13px] text-[#44474c]">{evento.descripcion}</div>
                            ) : null}
                            {evento.antes?.estado || evento.despues?.estado ? (
                              <div className="mt-2 text-[12px] text-[#59616b]">
                                Estado: {evento.antes?.estado ?? '-'} {'->'} {evento.despues?.estado ?? '-'}
                              </div>
                            ) : null}
                            {evento.despues?.monto_rendido ? (
                              <div className="mt-2 text-[12px] font-semibold text-[#075E54]">
                                Monto rendido: {money(evento.despues.monto_rendido)}
                              </div>
                            ) : null}
                            {cambiosItems ? (
                              <div className="mt-2 text-[12px] text-[#59616b]">
                                Productos: {cambiosItems}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-52px)] bg-[#f3f4f6] px-4 py-4">
      <section className="mx-auto max-w-[1500px] rounded-lg border border-[#c4c6cd] bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#c4c6cd] px-4 py-3">
          <div>
            <div className="flex items-center gap-2 text-[18px] font-bold text-[#041627]">
              <Truck size={18} className="text-[#075E54]" />
              Pedidos de envio del dia
            </div>
            <div className="text-[13px] text-[#44474c]">Tabla operativa de pedidos creados hoy.</div>
          </div>
          <button
            type="button"
            onClick={() => {
              resetForm();
              setSelectedId(null);
              setView('new');
            }}
            disabled={!puedeCrear}
            className="flex h-9 items-center gap-2 rounded bg-[#075E54] px-3 text-[13px] font-semibold text-white disabled:opacity-60"
          >
            <Plus size={15} />
            Nuevo pedido
          </button>
        </div>

        <div className="border-b border-[#c4c6cd] bg-[#fbfbfc] p-3">
          <div className="relative max-w-[420px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#44474c]" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar cliente, direccion, estado o producto" className="h-9 w-full rounded border border-[#c4c6cd] bg-white pl-9 pr-3 text-[13px] outline-none focus:border-[#075E54]" />
          </div>
        </div>

        <DataTable
          rows={pedidosFiltrados}
          columns={pedidoColumns}
          getRowKey={(pedido) => pedido.id}
          isLoading={pedidosQuery.isLoading}
          loadingMessage="Cargando pedidos del dia..."
          emptyMessage="Sin pedidos de envio cargados hoy."
          emptyTitle="No hay pedidos de envio cargados"
          emptyDescription="Cuando registres pedidos para entregar, van a aparecer aca para prepararlos, asignarlos y rendirlos."
          minWidth="1120px"
          onRowClick={abrirDetalle}
          getContextActions={(pedido) => [
            { label: 'Ver detalles', icon: <Eye size={14} />, onClick: () => abrirDetalle(pedido) },
            {
              label: 'Editar pedido',
              icon: <PackagePlus size={14} />,
              disabled: ['ENTREGADO', 'CANCELADO'].includes(pedido.estado) || ['PAGADO', 'RENDIDO'].includes(pedido.estado_pago),
              onClick: () => abrirEdicion(pedido),
            },
            { label: 'Marcar preparando', icon: <ReceiptText size={14} />, disabled: pedido.estado !== 'PENDIENTE', onClick: () => cambiarEstado(pedido, 'PREPARANDO') },
            { label: 'Marcar en camino', icon: <Send size={14} />, disabled: ['EN_CAMINO', 'ENTREGADO', 'CANCELADO'].includes(pedido.estado), onClick: () => cambiarEstado(pedido, 'EN_CAMINO') },
            { label: 'Cancelar pedido', icon: <XCircle size={14} />, danger: true, dividerBefore: true, disabled: ['ENTREGADO', 'CANCELADO'].includes(pedido.estado), onClick: () => cambiarEstado(pedido, 'CANCELADO') },
          ]}
        />
      </section>
    </div>
  );
};

const InfoBox = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded border border-[#e5e7eb] bg-[#fbfbfc] px-3 py-2">
    <div className="text-[11px] font-bold uppercase text-[#44474c]">{label}</div>
    <div className="mt-1 truncate text-[14px] font-semibold text-[#041627]">{value}</div>
  </div>
);

export default PedidosEnvioPage;
