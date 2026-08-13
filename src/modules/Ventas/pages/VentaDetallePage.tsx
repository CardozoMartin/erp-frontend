import { ArrowLeft, CreditCard, FileText, Loader2, Mail, PackageCheck, Pencil, Printer, ReceiptText, RotateCcw, Save, Truck, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import AccessDenied from '../../../components/common/AccessDenied';
import FichaHistoryPanel from '../../../components/common/FichaHistoryPanel';
import { useAuthStore } from '../../../store/auth.store';
import { useGetEmpleados } from '../../Empleados/hooks/useEmpleados';
import { useCajaAbierta, useCobrarVentaPendiente, useMediosPagoActivos } from '../../PuntoDeVenta/hooks/usePos';
import type { IMedioPago, TipoPagoPos } from '../../PuntoDeVenta/types/pos.type';
import VentaDetalleFicha from '../../POSAuxiliares/components/VentaDetalleFicha';
import { useAuditoriaAux, useConfiguracionPos, useDespachosAux, usePosAuxMutation, useServiciosSucursal, useVentasGeneralAux } from '../../POSAuxiliares/hooks/usePosAux';
import type { IAuditoriaEventoAux, IComprobanteAux, IDespachoAux, IVentaGeneralAux } from '../../POSAuxiliares/types/pos-aux.type';
import { obtenerQrFiscalFn } from '../../POSAuxiliares/api/posAux.api';
import { money, toNumber } from '../../POSAuxiliares/utils/format';
import { hasAnyPermission, POS_PERMISSIONS } from '../../POSAuxiliares/utils/posPermissions';
import { imprimirComprobante } from '../../POSAuxiliares/utils/printComprobante';

type TipoFiscal = 'TICKET' | 'FACTURA_A' | 'FACTURA_B' | 'FACTURA_C';
type MotivoPendiente = '' | 'RETIRA_LUEGO' | 'SIN_STOCK' | 'EN_GARANTIA';
type EntregaDraft = Record<string, { cantidad: string; motivo: MotivoPendiente }>;
type DestinoNC = 'SOLO_EMITIR' | 'SALDO_CUENTA' | 'REEMBOLSO';
type NcItemDraft = Record<string, string>;

const toInputDate = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
};

const motivoLabel: Record<Exclude<MotivoPendiente, ''>, string> = {
  RETIRA_LUEGO: 'Retira luego',
  SIN_STOCK: 'Sin stock',
  EN_GARANTIA: 'En garantia',
};

const mapMedioPagoToTipo = (medio?: IMedioPago): TipoPagoPos => {
  if (!medio) return 'EFECTIVO';
  const nombre = medio.nombre.toLowerCase();
  if (medio.tipo === 'efectivo') return 'EFECTIVO';
  if (medio.tipo === 'transferencia') return 'TRANSFERENCIA';
  if (medio.tipo === 'qr') return 'QR';
  if (medio.tipo === 'tarjeta' && nombre.includes('deb')) return 'TARJETA_DEBITO';
  if (medio.tipo === 'tarjeta') return 'TARJETA_CREDITO';
  return 'OTRO';
};

const comprobanteHistoryLabels: Record<string, string> = {
  CREAR_COMPROBANTE: 'Creo la venta',
  ACTUALIZAR_COMPROBANTE: 'Actualizo la venta',
  CAMBIAR_ESTADO_COMPROBANTE: 'Cambio estado',
  COBRAR_COMPROBANTE: 'Cobro registrado',
  ENVIAR_COMPROBANTE_EMAIL: 'Envio por email',
};

const buildDraft = (despacho?: IDespachoAux | null): EntregaDraft => {
  if (!despacho) return {};
  return despacho.items.reduce<EntregaDraft>((acc, item) => {
    acc[item.id] = {
      cantidad: String(toNumber(item.cantidad_pendiente)),
      motivo: (item.motivo_pendiente as MotivoPendiente) ?? '',
    };
    return acc;
  }, {});
};

const comprobanteHistoryChanges = (evento: IAuditoriaEventoAux) => {
  const cambios: string[] = [];
  const antes = evento.antes ?? {};
  const despues = evento.despues ?? {};
  const metadata = evento.metadata ?? {};

  if (antes.estado || despues.estado) {
    cambios.push(`Estado: ${antes.estado ?? '-'} -> ${despues.estado ?? '-'}`);
  }
  if (antes.total !== undefined || despues.total !== undefined) {
    cambios.push(`Total: ${money(antes.total as number | string)} -> ${money(despues.total as number | string)}`);
  }
  if (despues.caja_id || metadata.caja_id) {
    cambios.push(`Caja: ${String((despues.caja_id ?? metadata.caja_id) as string).slice(0, 8)}`);
  }
  if (metadata.total_pagado) {
    cambios.push(`Total pagado: ${money(metadata.total_pagado as number | string)}`);
  }
  if (Array.isArray(metadata.pagos) && metadata.pagos.length) {
    cambios.push(`Pagos: ${metadata.pagos.length}`);
  }

  const items = metadata.items as
    | { agregados?: unknown[]; eliminados?: unknown[]; modificados?: unknown[] }
    | undefined;
  if (items?.agregados?.length) cambios.push(`Items agregados: ${items.agregados.length}`);
  if (items?.eliminados?.length) cambios.push(`Items eliminados: ${items.eliminados.length}`);
  if (items?.modificados?.length) cambios.push(`Items modificados: ${items.modificados.length}`);
  if (metadata.cantidad_items) cambios.push(`Items: ${metadata.cantidad_items}`);

  return cambios.filter(Boolean);
};

const VentaDetallePage = () => {
  const { id } = useParams<{ id: string }>();
  const permisos = useAuthStore((state) => state.permisos);
  const puedeVerVentas = hasAnyPermission(
    permisos,
    POS_PERMISSIONS.ventasVer,
    POS_PERMISSIONS.reportesVer,
    POS_PERMISSIONS.reportesVentas,
  );
  const ventasQuery = useVentasGeneralAux(puedeVerVentas);
  const configQuery = useConfiguracionPos();
  const despachosQuery = useDespachosAux(puedeVerVentas);
  const empleadosQuery = useGetEmpleados(1, 300, puedeVerVentas);
  const cajaAbiertaQuery = useCajaAbierta();
  const mediosPagoQuery = useMediosPagoActivos();
  const serviciosQuery = useServiciosSucursal();
  const cobrarPendienteMutation = useCobrarVentaPendiente();
  const mutations = usePosAuxMutation();
  const [tipoFiscal, setTipoFiscal] = useState<TipoFiscal>('TICKET');
  const [editing, setEditing] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [pagoOpen, setPagoOpen] = useState(false);
  const [ncOpen, setNcOpen] = useState(false);
  const [ncItems, setNcItems] = useState<NcItemDraft>({});
  const [ncDestino, setNcDestino] = useState<DestinoNC>('SOLO_EMITIR');
  const [ncReingresarStock, setNcReingresarStock] = useState(true);
  const [ncMedioPagoId, setNcMedioPagoId] = useState('');
  const [ncReferencia, setNcReferencia] = useState('');
  const [medioPagoId, setMedioPagoId] = useState('');
  const [referenciaPago, setReferenciaPago] = useState('');
  const [emailDestino, setEmailDestino] = useState('');
  const [emailMensaje, setEmailMensaje] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const venta = ventasQuery.data?.find((item) => item.comprobante.id === id) ?? null;
  const cajaAbierta = cajaAbiertaQuery.data;
  const mediosPago = mediosPagoQuery.data ?? [];
  const medioPagoSeleccionado = mediosPago.find((medio) => medio.id === medioPagoId) ?? null;
  const emailDisponible = !!serviciosQuery.data?.email.disponible;
  const historialQuery = useAuditoriaAux(
    {
      page: 1,
      limit: 80,
      entidad: 'comprobante',
      entidad_id: id ?? '',
    },
    puedeVerVentas && !!id,
  );
  const empleadosById = useMemo(
    () => new Map((empleadosQuery.data?.data ?? []).map((empleado) => [empleado.id, empleado])),
    [empleadosQuery.data],
  );
  const historialComprobante = historialQuery.data?.data ?? [];
  const despacho = useMemo(() => {
    if (!venta) return null;
    const ids = new Set([venta.comprobante.id, ...venta.fiscales.map((fiscal) => fiscal.id)]);
    return (despachosQuery.data ?? []).find((item) => ids.has(item.comprobante_id)) ?? null;
  }, [despachosQuery.data, venta]);
  const esCotizacion = !!venta && venta.comprobante.tipo === 'COTIZACION';
  const puedeFacturar =
    !!venta &&
    venta.comprobante.tipo === 'VENTA' &&
    !['ANULADO', 'CANCELADA'].includes(venta.comprobante.estado);
  const puedeEditar =
    !!venta &&
    ['BORRADOR', 'ENVIADO', 'PENDIENTE_COBRO'].includes(venta.comprobante.estado);
  const puedeCobrar = permisos.includes(POS_PERMISSIONS.cajaCobrar);
  const puedeNotaCredito =
    !!venta &&
    !esCotizacion &&
    permisos.includes(POS_PERMISSIONS.ventasCancelarPagada) &&
    ['COBRADA', 'EMITIDA', 'ENTREGADO', 'ENTREGADO_PARCIAL'].includes(venta.comprobante.estado) &&
    venta.comprobante.estado !== 'DEVUELTA';
  // Si la venta ya se facturo, la nota de credito debe emitirse contra la FACTURA:
  // es la que AFIP conoce. Sobre la venta interna saldria sin CAE y la factura
  // quedaria viva ante ARCA.
  const facturaVigente = useMemo(
    () =>
      venta?.fiscales?.find(
        (comprobante) =>
          comprobante.tipo?.startsWith('FACTURA') &&
          !['ANULADO', 'ANULADA'].includes(comprobante.estado),
      ) ?? null,
    [venta],
  );
  const origenNotaCredito = facturaVigente ?? venta?.comprobante ?? null;

  const puedeMarcarPagada =
    !!venta &&
    !esCotizacion &&
    puedeCobrar &&
    ['BORRADOR', 'PENDIENTE_COBRO'].includes(venta.comprobante.estado);
  const usaDespacho =
    !esCotizacion &&
    !['DEVUELTA', 'ANULADO', 'CANCELADA'].includes(venta?.comprobante.estado ?? '') &&
    (configQuery.data?.modo_pos === 'CON_DESPACHO' || !!despacho);
  const comprobanteParaEnviar = useMemo(() => {
    if (!venta) return null;
    return venta.fiscales[0] ?? venta.comprobante;
  }, [venta]);

  useEffect(() => {
    if (!venta) return;
    setObservaciones(venta.comprobante.observaciones ?? '');
    setFechaVencimiento(toInputDate(venta.comprobante.fecha_vencimiento));
  }, [venta]);

  useEffect(() => {
    if (!medioPagoId && mediosPago[0]) {
      setMedioPagoId(mediosPago[0].id);
    }
  }, [medioPagoId, mediosPago]);

  const abrirNotaCredito = () => {
    if (!venta) return;
    // Una nota puede colgar de la venta o de su factura. Se normaliza todo al item
    // de la VENTA, que es como se indexa la grilla de devolucion.
    const itemDeVentaPorItemFacturado = new Map(
      (facturaVigente?.items ?? []).map((item) => [item.id, item.comprobante_item_origen_id ?? item.id]),
    );
    const devueltosPorItem = new Map<string, number>();
    for (const nc of venta.notasCredito) {
      for (const ncItem of nc.items ?? []) {
        if (!ncItem.comprobante_item_origen_id) continue;
        const itemVenta =
          itemDeVentaPorItemFacturado.get(ncItem.comprobante_item_origen_id) ??
          ncItem.comprobante_item_origen_id;
        devueltosPorItem.set(
          itemVenta,
          (devueltosPorItem.get(itemVenta) ?? 0) + toNumber(ncItem.cantidad),
        );
      }
    }
    setNcItems(
      Object.fromEntries(
        (venta.comprobante.items ?? []).map((item) => {
          const disponible = Math.max(0, toNumber(item.cantidad) - (devueltosPorItem.get(item.id) ?? 0));
          return [item.id, String(disponible)];
        }),
      ),
    );
    setNcDestino('SOLO_EMITIR');
    setNcReingresarStock(true);
    setNcMedioPagoId(mediosPago[0]?.id ?? '');
    setNcReferencia('');
    setNcOpen(true);
  };

  const emitirNotaCredito = () => {
    if (!venta || !origenNotaCredito) return;
    // Los ncItems se indexan por item de la VENTA. Si la nota va contra la factura,
    // hay que traducirlos a los items de esa factura (comprobante_item_origen_id
    // apunta al item de la venta que le dio origen).
    const idsPorItemDeVenta = new Map(
      (origenNotaCredito.items ?? []).map((item) => [
        item.comprobante_item_origen_id ?? item.id,
        item.id,
      ]),
    );
    const itemsFiltrados = (venta.comprobante.items ?? [])
      .map((item) => ({
        comprobante_item_id: idsPorItemDeVenta.get(item.id) ?? item.id,
        cantidad: Number(ncItems[item.id] ?? 0),
      }))
      .filter((item) => item.cantidad > 0);
    if (!itemsFiltrados.length) {
      toast.warning('Seleccioná al menos un producto para devolver');
      return;
    }
    if (ncDestino === 'REEMBOLSO' && !cajaAbierta) {
      toast.warning('Necesitás una caja abierta para registrar el reembolso');
      return;
    }
    mutations.crearNotaCredito.mutate(
      {
        comprobante_origen_id: origenNotaCredito.id,
        items: itemsFiltrados,
        destino: ncDestino,
        reingresar_stock: ncReingresarStock,
        caja_id: ncDestino === 'REEMBOLSO' ? cajaAbierta?.id : undefined,
        medio_pago_id: ncDestino === 'REEMBOLSO' && ncMedioPagoId ? ncMedioPagoId : undefined,
        referencia: ncDestino === 'REEMBOLSO' && ncReferencia.trim() ? ncReferencia.trim() : undefined,
      },
      {
        // La nota recien emitida se imprime sola: es el comprobante que el cliente
        // se lleva, y desde el detalle de la venta no habia forma de recuperarla.
        onSuccess: (nota) => {
          setNcOpen(false);
          ventasQuery.refetch();
          historialQuery.refetch();
          void imprimirConQr(nota, 'Nota de credito');
        },
      },
    );
  };

  // El QR fiscal solo existe si el comprobante tiene CAE; lo genera el backend
  const imprimirConQr = async (comprobante: IComprobanteAux, titulo?: string) => {
    if (!venta) return;
    const qrDataUri = comprobante.cae ? await obtenerQrFiscalFn(comprobante.id) : null;
    imprimirComprobante(comprobante, {
      titulo: titulo ?? comprobante.tipo,
      config: configQuery.data,
      despacho,
      vendedor: venta.vendedor?.nombreCompleto,
      cajero: venta.cajero?.nombreCompleto,
      listaPrecio: venta.listaPrecio,
      ivaEstimado: venta.margen.iva_estimado,
      qrDataUri,
    });
  };

  const imprimir = () => {
    if (!venta) return;
    void imprimirConQr(venta.comprobante);
  };

  const emitirFiscal = () => {
    if (!venta || !puedeFacturar) return;
    mutations.emitirComprobanteVenta.mutate(
      { ventaId: venta.comprobante.id, tipo: tipoFiscal },
      { onSuccess: (comprobante) => void imprimirConQr(comprobante) },
    );
  };

  const guardarCambios = () => {
    if (!venta || !puedeEditar) return;
    mutations.actualizarComprobante.mutate(
      {
        id: venta.comprobante.id,
        observaciones: observaciones.trim() || null,
        fecha_vencimiento: fechaVencimiento || null,
      },
      {
        onSuccess: () => setEditing(false),
      },
    );
  };

  const enviarEmail = () => {
    if (!emailDisponible) {
      toast.warning('El servicio de email no esta configurado para esta sucursal');
      return;
    }
    if (!comprobanteParaEnviar || !emailDestino.trim()) return;
    mutations.enviarComprobanteEmail.mutate(
      {
        id: comprobanteParaEnviar.id,
        destino: emailDestino.trim(),
        mensaje: emailMensaje.trim() || undefined,
      },
      {
        onSuccess: () => {
          setEmailOpen(false);
          setEmailMensaje('');
        },
      },
    );
  };

  const marcarPagada = () => {
    if (!venta || !puedeMarcarPagada) return;
    if (!cajaAbierta) {
      toast.warning('Abra una caja para marcar la venta como pagada');
      return;
    }
    if (!medioPagoSeleccionado) {
      toast.warning('Seleccione un medio de pago');
      return;
    }
    if (medioPagoSeleccionado.requiereReferencia && !referenciaPago.trim()) {
      toast.warning(`El medio de pago "${medioPagoSeleccionado.nombre}" requiere referencia`);
      return;
    }

    cobrarPendienteMutation.mutate(
      {
        ventaId: venta.comprobante.id,
        cajaId: cajaAbierta.id,
        pagos: [
          {
            tipo: mapMedioPagoToTipo(medioPagoSeleccionado),
            medio_pago_id: medioPagoSeleccionado.id,
            monto: toNumber(venta.comprobante.total),
            referencia: referenciaPago.trim() || null,
          },
        ],
        emitirComprobante: false,
        tipoFiscal,
      },
      {
        onSuccess: () => {
          setPagoOpen(false);
          setReferenciaPago('');
          ventasQuery.refetch();
          historialQuery.refetch();
        },
      },
    );
  };

  if (!puedeVerVentas) {
    return (
      <AccessDenied
        title="Sin permisos para ventas"
        message="Necesitas ventas.ver o permisos de reportes para consultar detalles."
      />
    );
  }

  return (
    <div className="min-h-[calc(100vh-52px)] bg-[#f3f4f6] px-4 py-4">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#c4c6cd] bg-white px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2 text-[15px] font-bold text-[#041627]">
            <ReceiptText size={17} className="text-[#075E54]" />
            Detalle de venta
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {venta ? (
              <>
                <button
                  type="button"
                  onClick={imprimir}
                  className="inline-flex h-9 items-center gap-2 rounded border border-[#c4c6cd] bg-white px-3 text-[12px] font-semibold text-[#041627] hover:bg-[#f4f5f6]"
                >
                  <Printer size={14} />
                  Imprimir
                </button>
                <select
                  value={tipoFiscal}
                  onChange={(event) => setTipoFiscal(event.target.value as TipoFiscal)}
                  disabled={!puedeFacturar}
                  className="h-9 rounded border border-[#c4c6cd] bg-white px-2 text-[12px] font-semibold text-[#041627] outline-none disabled:opacity-50"
                >
                  <option value="TICKET">Ticket</option>
                  <option value="FACTURA_A">Factura A</option>
                  <option value="FACTURA_B">Factura B</option>
                  <option value="FACTURA_C">Factura C</option>
                </select>
                <button
                  type="button"
                  onClick={emitirFiscal}
                  disabled={!puedeFacturar || mutations.emitirComprobanteVenta.isPending}
                  className="inline-flex h-9 items-center gap-2 rounded bg-[#075E54] px-3 text-[12px] font-semibold text-white hover:bg-[#0b6d62] disabled:opacity-50"
                >
                  <FileText size={14} />
                  Emitir
                </button>
                {puedeMarcarPagada ? (
                  <button
                    type="button"
                    onClick={() => setPagoOpen((current) => !current)}
                    disabled={cobrarPendienteMutation.isPending}
                    className="inline-flex h-9 items-center gap-2 rounded bg-[#0f766e] px-3 text-[12px] font-semibold text-white hover:bg-[#115e59] disabled:opacity-50"
                  >
                    {cobrarPendienteMutation.isPending ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <CreditCard size={14} />
                    )}
                    Marcar pagada
                  </button>
                ) : null}
                {puedeNotaCredito ? (
                  <button
                    type="button"
                    onClick={abrirNotaCredito}
                    className="inline-flex h-9 items-center gap-2 rounded border border-[#f1c7c7] bg-[#fff5f5] px-3 text-[12px] font-semibold text-[#b42318] hover:bg-[#fdecec]"
                  >
                    <RotateCcw size={14} />
                    Nota de crédito
                  </button>
                ) : null}
                {emailDisponible ? (
                  <button
                    type="button"
                    onClick={() => setEmailOpen((current) => !current)}
                    className="inline-flex h-9 items-center gap-2 rounded border border-[#cfe2de] bg-[#f3fbf9] px-3 text-[12px] font-semibold text-[#075E54] hover:bg-[#e8f7f3]"
                  >
                    <Mail size={14} />
                    Enviar email
                  </button>
                ) : null}
                {usaDespacho ? (
                  <Link
                    to={
                      despacho
                        ? `/despachos?despachoId=${despacho.id}`
                        : `/despachos?comprobanteId=${venta.comprobante.id}`
                    }
                    className="inline-flex h-9 items-center gap-2 rounded border border-[#cfe2de] bg-[#f3fbf9] px-3 text-[12px] font-semibold text-[#075E54] hover:bg-[#e8f7f3]"
                  >
                    <Truck size={14} />
                    Ir a despacho
                  </Link>
                ) : null}
                <button
                  type="button"
                  onClick={() => setEditing((current) => !current)}
                  disabled={!puedeEditar}
                  className="inline-flex h-9 items-center gap-2 rounded border border-[#c4c6cd] bg-white px-3 text-[12px] font-semibold text-[#041627] hover:bg-[#f4f5f6] disabled:opacity-50"
                >
                  {editing ? <X size={14} /> : <Pencil size={14} />}
                  {editing ? 'Cancelar' : 'Editar'}
                </button>
              </>
            ) : null}
            <Link
              to="/ventas"
              className="inline-flex h-9 items-center gap-2 rounded border border-[#c4c6cd] bg-white px-3 text-[12px] font-semibold text-[#041627] hover:bg-[#f4f5f6]"
            >
              <ArrowLeft size={14} />
              Volver
            </Link>
          </div>
        </div>

        {ventasQuery.isLoading ? (
          <div className="rounded-lg border border-[#c4c6cd] bg-white px-4 py-10 text-center text-[14px] text-[#44474c]">
            Cargando detalle...
          </div>
        ) : venta ? (
          <>
            {editing ? (
              <div className="mb-4 rounded-lg border border-[#c4c6cd] bg-white p-4 shadow-sm">
                <div className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
                  <label className="text-[12px] font-semibold text-[#041627]">
                    Observaciones
                    <input
                      value={observaciones}
                      onChange={(event) => setObservaciones(event.target.value)}
                      className="mt-1 h-9 w-full rounded border border-[#c4c6cd] px-2 text-[13px] outline-none focus:border-[#075E54]"
                    />
                  </label>
                  <label className="text-[12px] font-semibold text-[#041627]">
                    Vencimiento
                    <input
                      type="date"
                      value={fechaVencimiento}
                      onChange={(event) => setFechaVencimiento(event.target.value)}
                      className="mt-1 h-9 w-full rounded border border-[#c4c6cd] px-2 text-[13px] outline-none focus:border-[#075E54]"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={guardarCambios}
                    disabled={mutations.actualizarComprobante.isPending}
                    className="mt-auto inline-flex h-9 items-center justify-center gap-2 rounded bg-[#075E54] px-3 text-[12px] font-semibold text-white hover:bg-[#0b6d62] disabled:opacity-50"
                  >
                    <Save size={14} />
                    Guardar
                  </button>
                </div>
              </div>
            ) : null}
            {emailOpen && emailDisponible ? (
              <div className="mb-4 rounded-lg border border-[#c4c6cd] bg-white p-4 shadow-sm">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-[14px] font-bold text-[#041627]">
                      Enviar comprobante por email
                    </div>
                    <div className="text-[12px] text-[#44474c]">
                      {comprobanteParaEnviar
                        ? `${comprobanteParaEnviar.tipo} ${comprobanteParaEnviar.numero}`
                        : 'Sin comprobante seleccionado'}
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
                <div className="grid gap-3 md:grid-cols-[260px_1fr_auto]">
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
                      placeholder="Te enviamos el comprobante de tu compra"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={enviarEmail}
                    disabled={
                      !emailDestino.trim() ||
                      !comprobanteParaEnviar ||
                      mutations.enviarComprobanteEmail.isPending
                    }
                    className="mt-auto inline-flex h-9 items-center justify-center gap-2 rounded bg-[#075E54] px-3 text-[12px] font-semibold text-white hover:bg-[#0b6d62] disabled:opacity-50"
                  >
                    {mutations.enviarComprobanteEmail.isPending ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Mail size={14} />
                    )}
                    Enviar
                  </button>
                </div>
              </div>
            ) : null}
            {pagoOpen && venta ? (
              <div className="mb-4 rounded-lg border border-[#c4c6cd] bg-white p-4 shadow-sm">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-[14px] font-bold text-[#041627]">
                      Marcar venta como pagada
                    </div>
                    <div className="text-[12px] text-[#44474c]">
                      Total a ingresar en caja: {money(venta.comprobante.total)}
                      {cajaAbierta ? ` | Caja ${cajaAbierta.id.slice(0, 8)}` : ' | Sin caja abierta'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPagoOpen(false)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded border border-[#c4c6cd] bg-white text-[#041627] hover:bg-[#f4f5f6]"
                    title="Cerrar"
                  >
                    <X size={14} />
                  </button>
                </div>
                <div className="grid gap-3 md:grid-cols-[260px_1fr_auto]">
                  <label className="text-[12px] font-semibold text-[#041627]">
                    Medio de pago
                    <select
                      value={medioPagoId}
                      onChange={(event) => setMedioPagoId(event.target.value)}
                      className="mt-1 h-9 w-full rounded border border-[#c4c6cd] bg-white px-2 text-[13px] outline-none focus:border-[#075E54]"
                    >
                      {mediosPago.map((medio) => (
                        <option key={medio.id} value={medio.id}>
                          {medio.nombre}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-[12px] font-semibold text-[#041627]">
                    Referencia
                    <input
                      value={referenciaPago}
                      onChange={(event) => setReferenciaPago(event.target.value)}
                      className="mt-1 h-9 w-full rounded border border-[#c4c6cd] px-2 text-[13px] outline-none focus:border-[#075E54]"
                      placeholder={
                        medioPagoSeleccionado?.requiereReferencia
                          ? 'Obligatoria para este medio'
                          : 'Opcional'
                      }
                    />
                  </label>
                  <button
                    type="button"
                    onClick={marcarPagada}
                    disabled={
                      !cajaAbierta ||
                      !medioPagoSeleccionado ||
                      cobrarPendienteMutation.isPending
                    }
                    className="mt-auto inline-flex h-9 items-center justify-center gap-2 rounded bg-[#075E54] px-3 text-[12px] font-semibold text-white hover:bg-[#0b6d62] disabled:opacity-50"
                  >
                    {cobrarPendienteMutation.isPending ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <CreditCard size={14} />
                    )}
                    Confirmar pago
                  </button>
                </div>
                {!cajaAbierta ? (
                  <div className="mt-3 rounded border border-[#f1c7c7] bg-[#fff5f5] px-3 py-2 text-[12px] font-semibold text-[#b42318]">
                    Necesitas una caja abierta para registrar el cobro.
                  </div>
                ) : null}
              </div>
            ) : null}
            {ncOpen && venta ? (
              <div className="mb-4 rounded-lg border border-[#f1c7c7] bg-white p-4 shadow-sm">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-[14px] font-bold text-[#041627]">Nota de crédito / Devolución</div>
                    <div className="text-[12px] text-[#44474c]">
                      Seleccioná los productos a devolver y el destino del importe.
                    </div>
                    {facturaVigente ? (
                      <div className="mt-1 text-[12px] font-semibold text-[#075E54]">
                        Se emitirá contra la factura {facturaVigente.numero} y se pedirá CAE a ARCA.
                      </div>
                    ) : (
                      <div className="mt-1 text-[12px] text-[#8a5a00]">
                        La venta no tiene factura: la nota será interna, sin CAE.
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setNcOpen(false)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded border border-[#c4c6cd] bg-white text-[#041627] hover:bg-[#f4f5f6]"
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* Items a devolver */}
                <div className="mb-3 overflow-auto rounded border border-[#e5e7eb]">
                  <table className="w-full min-w-[500px] border-collapse text-[13px]">
                    <thead className="bg-[#fbf9fa] text-[11px] font-bold uppercase text-[#44474c]">
                      <tr>
                        <th className="px-3 py-2 text-left">Producto</th>
                        <th className="px-3 py-2 text-right">Vendido</th>
                        <th className="px-3 py-2 text-right">Precio</th>
                        <th className="px-3 py-2 text-right w-32">Devolver</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(venta.comprobante.items ?? []).map((item) => (
                        <tr key={item.id} className="border-t border-[#e5e7eb]">
                          <td className="px-3 py-2 font-semibold text-[#041627]">{item.descripcion}</td>
                          <td className="px-3 py-2 text-right text-[#44474c]">{toNumber(item.cantidad)}</td>
                          <td className="px-3 py-2 text-right text-[#44474c]">{money(item.precio_unitario)}</td>
                          <td className="px-3 py-2 text-right">
                            <input
                              type="number"
                              min={0}
                              max={toNumber(item.cantidad)}
                              value={ncItems[item.id] ?? '0'}
                              onChange={(event) =>
                                setNcItems((prev) => ({ ...prev, [item.id]: event.target.value }))
                              }
                              className="h-8 w-24 rounded border border-[#c4c6cd] px-2 text-right text-[13px] outline-none focus:border-[#b42318]"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Opciones */}
                <div className="mb-3 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                  <label className="text-[12px] font-semibold text-[#041627]">
                    Destino del importe
                    <select
                      value={ncDestino}
                      onChange={(event) => setNcDestino(event.target.value as DestinoNC)}
                      className="mt-1 h-9 w-full rounded border border-[#c4c6cd] bg-white px-2 text-[13px] outline-none focus:border-[#b42318]"
                    >
                      <option value="SOLO_EMITIR">Solo emitir nota (sin movimiento)</option>
                      <option value="SALDO_CUENTA" disabled={!venta.comprobante.cliente_id}>
                        Saldo a favor en cuenta corriente
                      </option>
                      <option value="REEMBOLSO">Reembolso en efectivo (egreso de caja)</option>
                    </select>
                  </label>
                  {ncDestino === 'REEMBOLSO' ? (
                    <label className="text-[12px] font-semibold text-[#041627]">
                      Medio de devolución
                      <select
                        value={ncMedioPagoId}
                        onChange={(event) => setNcMedioPagoId(event.target.value)}
                        className="mt-1 h-9 w-full rounded border border-[#c4c6cd] bg-white px-2 text-[13px] outline-none focus:border-[#b42318]"
                      >
                        {mediosPago.map((medio) => (
                          <option key={medio.id} value={medio.id}>{medio.nombre}</option>
                        ))}
                      </select>
                    </label>
                  ) : (
                    <div />
                  )}
                  <label className="flex items-center gap-2 self-end pb-1 text-[13px] font-semibold text-[#041627]">
                    <input
                      type="checkbox"
                      checked={ncReingresarStock}
                      onChange={(event) => setNcReingresarStock(event.target.checked)}
                      className="h-4 w-4 accent-[#075E54]"
                    />
                    Reingresar stock
                  </label>
                </div>

                {ncDestino === 'REEMBOLSO' && (
                  <div className="mb-3">
                    <label className="text-[12px] font-semibold text-[#041627]">
                      Referencia (opcional)
                      <input
                        value={ncReferencia}
                        onChange={(event) => setNcReferencia(event.target.value)}
                        placeholder="Número de transferencia, recibo, etc."
                        className="mt-1 h-9 w-full rounded border border-[#c4c6cd] px-2 text-[13px] outline-none focus:border-[#b42318]"
                      />
                    </label>
                  </div>
                )}

                {ncDestino === 'REEMBOLSO' && !cajaAbierta && (
                  <div className="mb-3 rounded border border-[#f1c7c7] bg-[#fff5f5] px-3 py-2 text-[12px] font-semibold text-[#b42318]">
                    Necesitás una caja abierta para registrar el reembolso.
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={emitirNotaCredito}
                    disabled={mutations.crearNotaCredito.isPending || (ncDestino === 'REEMBOLSO' && !cajaAbierta)}
                    className="inline-flex h-9 items-center gap-2 rounded bg-[#b42318] px-4 text-[12px] font-semibold text-white hover:bg-[#9a1e14] disabled:opacity-50"
                  >
                    {mutations.crearNotaCredito.isPending ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <RotateCcw size={14} />
                    )}
                    Emitir nota de crédito
                  </button>
                </div>
              </div>
            ) : null}
            <VentaDetalleFicha
              venta={venta}
              onImprimirNota={(nota) => void imprimirConQr(nota, 'Nota de credito')}
            />
            <FichaHistoryPanel<IAuditoriaEventoAux>
              variant="section"
              className="mt-4 bg-white"
              title="Historial de la venta"
              subtitle="Creacion, cambios, cobros y estados del comprobante"
              events={historialComprobante}
              isLoading={historialQuery.isLoading}
              labels={comprobanteHistoryLabels}
              emptyTitle="Sin auditoria de venta"
              emptyDescription="Aca se vera quien creo, edito, cobro o cambio el estado de esta venta."
              getActorName={(evento) =>
                evento.empleado_id
                  ? empleadosById.get(evento.empleado_id)?.nombreCompleto ?? evento.empleado_id
                  : 'Sistema'
              }
              getChanges={(evento) => comprobanteHistoryChanges(evento)}
              maxChanges={8}
            />
            {usaDespacho ? (
              <DespachoVentaPanel
                venta={venta}
                despacho={despacho}
                puedeOperar={hasAnyPermission(
                  permisos,
                  POS_PERMISSIONS.depositoDespachar,
                  POS_PERMISSIONS.depositoRecepcionar,
                )}
                mutations={mutations}
              />
            ) : null}
          </>
        ) : (
          <div className="rounded-lg border border-[#c4c6cd] bg-white px-4 py-10 text-center text-[14px] text-[#44474c]">
            No se encontro la venta solicitada.
          </div>
        )}
      </div>
    </div>
  );
};

const DespachoVentaPanel = ({
  venta,
  despacho,
  puedeOperar,
  mutations,
}: {
  venta: IVentaGeneralAux;
  despacho: IDespachoAux | null;
  puedeOperar: boolean;
  mutations: ReturnType<typeof usePosAuxMutation>;
}) => {
  const [generarRemito, setGenerarRemito] = useState(false);
  const [observaciones, setObservaciones] = useState('');
  const [draft, setDraft] = useState<EntregaDraft>({});

  useEffect(() => {
    setDraft(buildDraft(despacho));
    setObservaciones(despacho?.observaciones ?? '');
  }, [despacho]);

  const puedeCrearDespacho =
    !despacho &&
    venta.comprobante.tipo === 'VENTA' &&
    ['COBRADA', 'ENTREGADO_PARCIAL', 'ENTREGADO'].includes(venta.comprobante.estado);
  const puedeEntregar =
    !!despacho &&
    puedeOperar &&
    !['ENTREGADO', 'ANULADO'].includes(despacho.estado);
  const resumen = despacho?.items.reduce(
    (acc, item) => ({
      solicitado: acc.solicitado + toNumber(item.cantidad_solicitada),
      entregado: acc.entregado + toNumber(item.cantidad_despachada),
      pendiente: acc.pendiente + toNumber(item.cantidad_pendiente),
    }),
    { solicitado: 0, entregado: 0, pendiente: 0 },
  ) ?? { solicitado: 0, entregado: 0, pendiente: 0 };

  const updateDraft = (itemId: string, patch: Partial<EntregaDraft[string]>) => {
    setDraft((current) => ({
      ...current,
      [itemId]: {
        cantidad: current[itemId]?.cantidad ?? '0',
        motivo: current[itemId]?.motivo ?? '',
        ...patch,
      },
    }));
  };

  const crearDespacho = () => {
    if (!puedeOperar || !puedeCrearDespacho) return;
    mutations.crearDespacho.mutate({
      comprobante_id: venta.comprobante.id,
      observaciones: 'Despacho creado desde detalle de venta',
    });
  };

  const entregar = () => {
    if (!despacho || !puedeEntregar) return;
    const itemsPendientes = despacho.items.filter(
      (item) => toNumber(item.cantidad_pendiente) > 0,
    );
    const items = itemsPendientes.map((item) => {
      const pendiente = toNumber(item.cantidad_pendiente);
      const cantidad = Math.min(Math.max(toNumber(draft[item.id]?.cantidad), 0), pendiente);
      const motivo = draft[item.id]?.motivo || null;
      return {
        despacho_item_id: item.id,
        cantidad_despachada: cantidad,
        motivo_pendiente: cantidad < pendiente ? motivo : null,
      };
    });
    const sinMotivo = itemsPendientes.find((item, index) => {
      const pendiente = toNumber(item.cantidad_pendiente);
      return items[index].cantidad_despachada < pendiente && !items[index].motivo_pendiente;
    });
    if (sinMotivo) {
      window.alert(`Indique motivo pendiente para ${sinMotivo.descripcion}`);
      return;
    }
    mutations.entregarDespacho.mutate({
      despacho,
      generar_remito: generarRemito,
      observaciones,
      items,
    });
  };

  return (
    <section className="mt-4 rounded-lg border border-[#c4c6cd] bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#c4c6cd] px-4 py-3">
        <div className="flex items-center gap-2 text-[15px] font-bold text-[#041627]">
          <Truck size={17} className="text-[#075E54]" />
          Despacho
        </div>
        {despacho ? (
          <span className="rounded border border-[#cfe2de] bg-[#f3fbf9] px-2.5 py-1 text-[11px] font-semibold text-[#075E54]">
            {despacho.estado}
          </span>
        ) : (
          <button
            type="button"
            onClick={crearDespacho}
            disabled={!puedeOperar || !puedeCrearDespacho || mutations.crearDespacho.isPending}
            className="inline-flex h-9 items-center gap-2 rounded bg-[#075E54] px-3 text-[12px] font-semibold text-white hover:bg-[#0b6d62] disabled:opacity-50"
          >
            <PackageCheck size={14} />
            Crear despacho
          </button>
        )}
      </div>

      {despacho ? (
        <div className="p-4">
          <div className="mb-3 grid gap-2 text-[13px] md:grid-cols-3">
            <Resumen label="Solicitado" value={resumen.solicitado} />
            <Resumen label="Entregado" value={resumen.entregado} />
            <Resumen label="Pendiente" value={resumen.pendiente} danger={resumen.pendiente > 0} />
          </div>
          <div className="overflow-auto rounded border border-[#c4c6cd]">
            <table className="w-full min-w-[860px] border-collapse text-[13px]">
              <thead className="bg-[#fbf9fa] text-[#44474c]">
                <tr>
                  <th className="px-3 py-2 text-left">Producto</th>
                  <th className="px-3 py-2 text-right">Solicitado</th>
                  <th className="px-3 py-2 text-right">Entregado</th>
                  <th className="px-3 py-2 text-right">Pendiente</th>
                  <th className="px-3 py-2 text-right">Entregar ahora</th>
                  <th className="px-3 py-2 text-left">Motivo pendiente</th>
                </tr>
              </thead>
              <tbody>
                {despacho.items.map((item) => {
                  const pendiente = toNumber(item.cantidad_pendiente);
                  return (
                    <tr key={item.id} className="border-t border-[#e5e7eb]">
                      <td className="px-3 py-2 font-semibold text-[#041627]">{item.descripcion}</td>
                      <td className="px-3 py-2 text-right">{toNumber(item.cantidad_solicitada)}</td>
                      <td className="px-3 py-2 text-right">{toNumber(item.cantidad_despachada)}</td>
                      <td className="px-3 py-2 text-right font-bold text-[#b42318]">{pendiente}</td>
                      <td className="px-3 py-2 text-right">
                        <input
                          type="number"
                          min={0}
                          max={pendiente}
                          disabled={!puedeEntregar || pendiente === 0}
                          value={draft[item.id]?.cantidad ?? '0'}
                          onChange={(event) => updateDraft(item.id, { cantidad: event.target.value })}
                          className="h-9 w-28 rounded border border-[#c4c6cd] px-2 text-right outline-none focus:border-[#075E54] disabled:bg-[#f4f5f6]"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <select
                          disabled={!puedeEntregar || pendiente === 0}
                          value={draft[item.id]?.motivo ?? ''}
                          onChange={(event) => updateDraft(item.id, { motivo: event.target.value as MotivoPendiente })}
                          className="h-9 w-full rounded border border-[#c4c6cd] bg-white px-2 outline-none focus:border-[#075E54] disabled:bg-[#f4f5f6]"
                        >
                          <option value="">Sin motivo</option>
                          {Object.entries(motivoLabel).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto_auto]">
            <input
              value={observaciones}
              onChange={(event) => setObservaciones(event.target.value)}
              placeholder="Observaciones de entrega"
              className="h-9 rounded border border-[#c4c6cd] px-2 text-[13px] outline-none focus:border-[#075E54]"
            />
            <label className="flex h-9 items-center gap-2 rounded border border-[#c4c6cd] bg-white px-3 text-[13px] font-semibold text-[#041627]">
              <input
                type="checkbox"
                checked={generarRemito}
                onChange={(event) => setGenerarRemito(event.target.checked)}
                className="h-4 w-4 accent-[#075E54]"
              />
              Generar remito
            </label>
            <button
              type="button"
              onClick={entregar}
              disabled={!puedeEntregar || mutations.entregarDespacho.isPending}
              className="inline-flex h-9 items-center justify-center gap-2 rounded bg-[#075E54] px-3 text-[12px] font-semibold text-white hover:bg-[#0b6d62] disabled:opacity-50"
            >
              <PackageCheck size={14} />
              Registrar entrega
            </button>
          </div>
        </div>
      ) : (
        <div className="px-4 py-8 text-center text-[14px] text-[#44474c]">
          Esta venta todavia no tiene despacho generado.
        </div>
      )}
    </section>
  );
};

const Resumen = ({ label, value, danger = false }: { label: string; value: number; danger?: boolean }) => (
  <div className="rounded border border-[#e5e7eb] bg-[#fbf9fa] px-3 py-2">
    <div className="text-[11px] font-bold uppercase text-[#44474c]">{label}</div>
    <div className={`mt-1 text-[16px] font-bold ${danger ? 'text-[#b42318]' : 'text-[#041627]'}`}>{value}</div>
  </div>
);

export default VentaDetallePage;
