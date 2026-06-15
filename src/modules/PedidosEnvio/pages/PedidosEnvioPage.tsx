import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import AccessDenied from '../../../components/common/AccessDenied';
import { useAuthStore } from '../../../store/auth.store';
import { getClientesFn } from '../../Clientes/api/clientes.api';
import { getEmpleadosFn } from '../../Empleados/api/empleadosApi';
import { getProductosFn } from '../../Productos/api/productoApi';
import { toNumber } from '../../POSAuxiliares/utils/format';
import { useCajaAbierta, useMediosPagoActivos } from '../../PuntoDeVenta/hooks/usePos';
import { useHistorialPedidoEnvio, usePedidosEnvio, usePedidosEnvioMutations } from '../hooks/usePedidosEnvio';
import type { EstadoPedidoEnvio, IPedidoEnvio, MedioPagoPedidoEnvio } from '../types/pedido-envio.type';
import { PedidoDetalle } from '../components/pedidos/PedidoDetalle';
import { PedidoFormulario } from '../components/pedidos/PedidoFormulario';
import { PedidoLista } from '../components/pedidos/PedidoLista';
import { clienteNombre, newItem, productoPrecio, todayKey } from '../utils/pedidos.utils';
import type { PedidoItemDraft } from '../utils/pedidos.utils';

type ViewMode = 'list' | 'new' | 'edit' | 'detail';

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

  // Form state (new/edit)
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

  // Detail/rendicion state
  const [montoRendido, setMontoRendido] = useState('');
  const [referenciaPago, setReferenciaPago] = useState('');
  const [medioPagoRendidoId, setMedioPagoRendidoId] = useState('');

  const clientes = clientesQuery.data ?? [];
  const empleados = empleadosQuery.data?.data ?? [];
  const productosResponse = productosQuery.data;
  const productos = (Array.isArray(productosResponse) ? productosResponse : productosResponse?.data ?? [])
    .filter((p) => p.activo && p.activo_pos);
  const cajaAbierta = cajaQuery.data ?? null;
  const mediosPago = mediosPagoQuery.data ?? [];
  const pedidos = pedidosQuery.data ?? [];

  const clientesById = useMemo(() => new Map(clientes.map((c) => [c.id, c])), [clientes]);
  const empleadosById = useMemo(() => new Map(empleados.map((e) => [e.id, e])), [empleados]);
  const productosById = useMemo(() => new Map(productos.map((p) => [p.id, p])), [productos]);

  const pedidosDelDia = useMemo(
    () => pedidos.filter((p) => new Date(p.created_at).toISOString().slice(0, 10) === todayKey()),
    [pedidos],
  );

  const pedidosFiltrados = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return pedidosDelDia;
    return pedidosDelDia.filter((p) => {
      const cliente = clienteNombre(clientesById.get(p.cliente_id)).toLowerCase();
      const prods = p.comprobante?.items?.map((i) => i.descripcion).join(' ').toLowerCase() ?? '';
      return cliente.includes(term) || p.direccion_entrega.toLowerCase().includes(term) || p.estado.toLowerCase().includes(term) || p.estado_pago.toLowerCase().includes(term) || prods.includes(term);
    });
  }, [clientesById, pedidosDelDia, search]);

  const productosFiltrados = useMemo(() => {
    const term = productSearch.trim().toLowerCase();
    if (!term) return productos.slice(0, 20);
    return productos.filter((p) => [p.nombre, p.descripcion, p.codigo_barras, p.categoria?.nombre].join(' ').toLowerCase().includes(term)).slice(0, 30);
  }, [productSearch, productos]);

  const selectedPedido = selectedId ? pedidos.find((p) => p.id === selectedId) ?? null : null;

  const resetForm = () => {
    setClienteId(''); setDireccion(''); setLocalidad(''); setBarrio('');
    setCodigoPostal(''); setTelefono(''); setReferencia(''); setFechaProgramada('');
    setRepartidorId(''); setMedioPago('EFECTIVO'); setTransferenciaPagada(true);
    setObservaciones(''); setItems([newItem()]); setProductSearch('');
  };

  const abrirDetalle = (pedido: IPedidoEnvio) => {
    setSelectedId(pedido.id);
    setMontoRendido(String(toNumber(pedido.comprobante?.total)));
    setReferenciaPago(''); setMedioPagoRendidoId('');
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
        .filter((i) => i.producto_id)
        .map((i) => ({ id: i.id, producto_id: i.producto_id!, cantidad: String(toNumber(i.cantidad)), precio_unitario: String(toNumber(i.precio_unitario)) })),
    );
    setView('edit');
  };

  const addProduct = (producto: import('../../Productos/types/productos.type').IProducto) => {
    if (!producto.id) return;
    setItems((cur) => {
      const existing = cur.find((i) => i.producto_id === producto.id);
      if (existing) return cur.map((i) => i.id === existing.id ? { ...i, cantidad: String(toNumber(i.cantidad) + 1) } : i);
      const empty = cur.find((i) => !i.producto_id);
      if (empty) return cur.map((i) => i.id === empty.id ? { ...i, producto_id: producto.id, cantidad: '1', precio_unitario: String(productoPrecio(producto)) } : i);
      return [...cur, { id: crypto.randomUUID(), producto_id: producto.id, cantidad: '1', precio_unitario: String(productoPrecio(producto)) }];
    });
  };

  const updateItem = (id: string, patch: Partial<PedidoItemDraft>) =>
    setItems((cur) => cur.map((i) => i.id === id ? { ...i, ...patch } : i));

  const changeQuantity = (id: string, delta: number) =>
    setItems((cur) => cur.map((i) => i.id === id ? { ...i, cantidad: String(Math.max(0, toNumber(i.cantidad) + delta)) } : i).filter((i) => i.producto_id && toNumber(i.cantidad) > 0));

  const guardarPedido = () => {
    const itemsValidos = items.filter((i) => i.producto_id && toNumber(i.cantidad) > 0).map((i) => ({
      producto_id: i.producto_id,
      cantidad: toNumber(i.cantidad),
      precio_unitario: i.precio_unitario === '' ? undefined : toNumber(i.precio_unitario),
    }));
    if (!clienteId) { window.alert('Seleccione un cliente.'); return; }
    if (!direccion.trim()) { window.alert('Ingrese la direccion de entrega'); return; }
    if (!itemsValidos.length) { window.alert('Agregue al menos un producto'); return; }
    if (!cajaAbierta?.id && view !== 'edit') { window.alert('Debe haber una caja abierta para crear el pedido'); return; }

    const payload = {
      caja_id: cajaAbierta?.id ?? selectedPedido?.comprobante?.caja_id ?? '',
      cliente_id: clienteId,
      empleado_repartidor_id: repartidorId || null,
      medio_pago_previsto: medioPago,
      estado_pago: medioPago === 'TRANSFERENCIA' && transferenciaPagada ? 'PAGADO' as const : undefined,
      direccion_entrega: direccion,
      localidad_entrega: localidad || null, barrio_entrega: barrio || null,
      codigo_postal_entrega: codigoPostal || null, telefono_contacto: telefono || null,
      referencia_entrega: referencia || null, fecha_programada: fechaProgramada || null,
      observaciones: observaciones || null, items: itemsValidos,
    };

    if (view === 'edit' && selectedPedido) {
      mutations.editar.mutate({ ...payload, id: selectedPedido.id }, { onSuccess: (p) => { setSelectedId(p.id); resetForm(); setView('detail'); } });
    } else {
      mutations.crear.mutate({ ...payload, cliente_id: clienteId }, { onSuccess: (p) => { setSelectedId(p.id); resetForm(); setView('detail'); } });
    }
  };

  const cambiarEstado = (pedido: IPedidoEnvio, estado: EstadoPedidoEnvio) =>
    mutations.cambiarEstado.mutate({ id: pedido.id, estado, empleado_repartidor_id: repartidorId || pedido.empleado_repartidor_id || null });

  const rendir = (pedido: IPedidoEnvio) => {
    if (!puedeRendir) { window.alert('No tenes permisos para rendir pedidos'); return; }
    if (pedido.estado_pago === 'RENDIDO') { window.alert('Este pedido ya fue rendido'); return; }
    const medio = medioPagoRendidoId || mediosPago.find((m) => {
      if (pedido.medio_pago_previsto === 'EFECTIVO') return m.tipo === 'efectivo';
      if (pedido.medio_pago_previsto === 'TRANSFERENCIA') return m.tipo === 'transferencia';
      return m.tipo === 'otro';
    })?.id || '';
    if (!cajaAbierta?.id) { window.alert('Debe haber una caja abierta para rendir el pedido'); return; }
    if (!medio) { window.alert('Seleccione el medio de pago real para registrar la rendicion'); return; }
    mutations.rendir.mutate({ id: pedido.id, caja_id: cajaAbierta.id, medio_pago_id: medio, monto_rendido: montoRendido ? toNumber(montoRendido) : toNumber(pedido.comprobante?.total), referencia_pago: referenciaPago || null, observaciones: 'Rendicion registrada desde pedidos de envio' });
  };

  if (!puedeVer) return <AccessDenied title="Sin permisos para pedidos de envio" message="Necesitas permisos de ventas para consultar esta seccion." />;

  if (view === 'new' || view === 'edit') {
    return (
      <PedidoFormulario
        isEditing={view === 'edit'}
        puedeCrear={puedeCrear}
        isPending={mutations.crear.isPending || mutations.editar.isPending}
        cajaAbierta={cajaAbierta}
        clientes={clientes}
        clientesById={clientesById}
        empleados={empleados}
        productos={productos}
        productosFiltrados={productosFiltrados}
        productosById={productosById}
        productSearch={productSearch} onProductSearchChange={setProductSearch}
        clienteId={clienteId} onClienteChange={setClienteId}
        direccion={direccion} onDireccionChange={setDireccion}
        telefono={telefono} onTelefonoChange={setTelefono}
        localidad={localidad} onLocalidadChange={setLocalidad}
        barrio={barrio} onBarrioChange={setBarrio}
        codigoPostal={codigoPostal} onCodigoPostalChange={setCodigoPostal}
        referencia={referencia} onReferenciaChange={setReferencia}
        fechaProgramada={fechaProgramada} onFechaProgramadaChange={setFechaProgramada}
        repartidorId={repartidorId} onRepartidorChange={setRepartidorId}
        medioPago={medioPago} onMedioPagoChange={setMedioPago}
        transferenciaPagada={transferenciaPagada} onTransferenciaPagadaChange={setTransferenciaPagada}
        observaciones={observaciones} onObservacionesChange={setObservaciones}
        items={items}
        onAddProduct={addProduct}
        onUpdateItem={updateItem}
        onChangeQuantity={changeQuantity}
        onRemoveItem={(id) => setItems((cur) => cur.filter((i) => i.id !== id))}
        onGuardar={guardarPedido}
        onVolver={() => setView('list')}
      />
    );
  }

  if (view === 'detail') {
    return (
      <PedidoDetalle
        pedido={selectedPedido}
        historial={historialQuery.data ?? []}
        isLoadingHistorial={historialQuery.isLoading}
        clientesById={clientesById}
        empleadosById={empleadosById}
        mediosPago={mediosPago}
        cajaAbierta={cajaAbierta}
        isMutating={mutations.cambiarEstado.isPending || mutations.rendir.isPending}
        montoRendido={montoRendido} onMontoRendidoChange={setMontoRendido}
        referenciaPago={referenciaPago} onReferenciaPagoChange={setReferenciaPago}
        medioPagoRendidoId={medioPagoRendidoId} onMedioPagoRendidoIdChange={setMedioPagoRendidoId}
        onVolver={() => setView('list')}
        onEditar={abrirEdicion}
        onCambiarEstado={cambiarEstado}
        onRendir={rendir}
        onRefreshHistorial={() => historialQuery.refetch()}
      />
    );
  }

  return (
    <PedidoLista
      pedidos={pedidosFiltrados}
      isLoading={pedidosQuery.isLoading}
      search={search} onSearchChange={setSearch}
      clientesById={clientesById}
      empleadosById={empleadosById}
      puedeCrear={puedeCrear}
      onNuevo={() => { resetForm(); setSelectedId(null); setView('new'); }}
      onDetalle={abrirDetalle}
      onEditar={abrirEdicion}
      onCambiarEstado={cambiarEstado}
    />
  );
};

export default PedidosEnvioPage;
