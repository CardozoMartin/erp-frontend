import { Calculator, CreditCard, FileText, Loader2, Mail, Plus, Search, Wallet, X, XCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import DataTable from '../../../components/common/DataTable';
import type { DataTableColumn } from '../../../components/common/DataTable';
import {
  useClientesCuentaCorrienteAux,
  useCajaAbiertaAux,
  useMovimientosCuentaCorrienteAux,
  usePosAuxMutation,
  useServiciosSucursal,
} from '../../POSAuxiliares/hooks/usePosAux';
import { useMediosPagoActivos } from '../../PuntoDeVenta/hooks/usePos';
import type { IMovimientoCuentaCorrienteAux } from '../../POSAuxiliares/types/pos-aux.type';
import { dateTime, money, shortId, toNumber } from '../../POSAuxiliares/utils/format';

type AccionCuenta = 'PAGO' | 'CARGO' | 'AJUSTE';
type TipoResumenEmail = 'CARGOS' | 'COMPRAS' | 'CARGOS_Y_RECARGOS' | 'TODOS';

const tipoClass: Record<string, string> = {
  CARGO: 'border-[#f6d58f] bg-[#fff8e6] text-[#8a5a00]',
  PAGO: 'border-[#cfe2de] bg-[#f3fbf9] text-[#075E54]',
  NOTA_CREDITO: 'border-[#cfe2de] bg-[#eef8f6] text-[#075E54]',
  RECARGO_INTERES: 'border-[#f1c7c7] bg-[#fff5f5] text-[#b42318]',
  AJUSTE: 'border-[#c4c6cd] bg-[#f8fafc] text-[#041627]',
};

const clienteNombre = (cliente: { nombre: string; apellido?: string | null; razon_social?: string | null }) =>
  cliente.razon_social || `${cliente.nombre} ${cliente.apellido ?? ''}`.trim();

const CuentaCorrienteAuxPage = () => {
  const clientesQuery = useClientesCuentaCorrienteAux();
  const cajaQuery = useCajaAbiertaAux();
  const mediosPagoQuery = useMediosPagoActivos();
  const serviciosQuery = useServiciosSucursal();
  const mutations = usePosAuxMutation();
  const [clienteId, setClienteId] = useState('');
  const [search, setSearch] = useState('');
  const [accion, setAccion] = useState<AccionCuenta>('PAGO');
  const [monto, setMonto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [medioPagoId, setMedioPagoId] = useState('');
  const [referenciaPago, setReferenciaPago] = useState('');
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [hastaRecargo, setHastaRecargo] = useState('');
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailDestino, setEmailDestino] = useState('');
  const [emailMensaje, setEmailMensaje] = useState('');
  const [emailDesde, setEmailDesde] = useState('');
  const [emailHasta, setEmailHasta] = useState('');
  const [emailTipoResumen, setEmailTipoResumen] = useState<TipoResumenEmail>('CARGOS');
  const [emailAdjuntarPdf, setEmailAdjuntarPdf] = useState(true);

  const clientes = (clientesQuery.data ?? []).filter((cliente) => cliente.cuentaCorriente?.activa);
  const cajaAbierta = cajaQuery.data;
  const mediosPago = mediosPagoQuery.data ?? [];
  const emailDisponible = !!serviciosQuery.data?.email.disponible;
  const clientesFiltrados = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return clientes;
    return clientes.filter((cliente) => {
      const nombre = clienteNombre(cliente).toLowerCase();
      return (
        nombre.includes(term) ||
        (cliente.cuit ?? '').includes(term) ||
        (cliente.dni ?? '').includes(term)
      );
    });
  }, [clientes, search]);

  const clienteSeleccionado =
    clientes.find((cliente) => cliente.id === clienteId) ??
    clientesFiltrados[0] ??
    null;
  const movimientosQuery = useMovimientosCuentaCorrienteAux(clienteSeleccionado?.id);
  const movimientos = movimientosQuery.data ?? [];
  const saldo = toNumber(clienteSeleccionado?.cuentaCorriente?.saldo);
  const limite = toNumber(clienteSeleccionado?.cuentaCorriente?.limite_credito);
  const totalCargos = movimientos
    .filter((movimiento) => movimiento.monto && toNumber(movimiento.monto) > 0 && !movimiento.omitido)
    .reduce((sum, movimiento) => sum + toNumber(movimiento.monto), 0);
  const totalCreditos = movimientos
    .filter((movimiento) => toNumber(movimiento.monto) < 0 && !movimiento.omitido)
    .reduce((sum, movimiento) => sum + Math.abs(toNumber(movimiento.monto)), 0);

  useEffect(() => {
    if (medioPagoId || !mediosPago.length) return;
    const efectivo =
      mediosPago.find((medio) => medio.tipo === 'efectivo') ??
      mediosPago.find((medio) => medio.nombre.toLowerCase().includes('efectivo')) ??
      mediosPago[0];
    setMedioPagoId(efectivo.id);
  }, [medioPagoId, mediosPago]);

  const ejecutarAccion = () => {
    if (!clienteSeleccionado) return;
    const valor = toNumber(monto);
    if (valor <= 0 && accion !== 'AJUSTE') {
      window.alert('Ingrese un monto valido');
      return;
    }
    if (accion === 'PAGO') {
      if (!cajaAbierta?.id) {
        window.alert('Abra una caja para registrar el ingreso del pago');
        return;
      }
      mutations.registrarPagoCuentaCorriente.mutate(
        {
          clienteId: clienteSeleccionado.id,
          monto: valor,
          descripcion: descripcion || 'Pago de cuenta corriente',
          caja_id: cajaAbierta.id,
          medio_pago_id: medioPagoId || undefined,
          referencia: referenciaPago || undefined,
        },
        { onSuccess: limpiarFormulario },
      );
      return;
    }
    if (accion === 'CARGO') {
      mutations.registrarCargoCuentaCorriente.mutate(
        {
          clienteId: clienteSeleccionado.id,
          monto: valor,
          descripcion: descripcion || 'Cargo manual de cuenta corriente',
          fecha_vencimiento: fechaVencimiento || undefined,
        },
        { onSuccess: limpiarFormulario },
      );
      return;
    }
    mutations.registrarAjusteCuentaCorriente.mutate(
      {
        clienteId: clienteSeleccionado.id,
        monto: toNumber(monto),
        descripcion: descripcion || 'Ajuste manual de cuenta corriente',
      },
      { onSuccess: limpiarFormulario },
    );
  };

  const limpiarFormulario = () => {
    setMonto('');
    setDescripcion('');
    setFechaVencimiento('');
    setReferenciaPago('');
  };

  const calcularRecargos = (soloSimular: boolean) => {
    if (!clienteSeleccionado) return;
    mutations.calcularRecargosCuentaCorriente.mutate({
      clienteId: clienteSeleccionado.id,
      hasta: hastaRecargo || undefined,
      solo_simular: soloSimular,
    });
  };

  const omitirRecargo = (movimiento: IMovimientoCuentaCorrienteAux) => {
    const confirmado = window.confirm('Omitir este recargo y descontarlo del saldo?');
    if (!confirmado) return;
    mutations.omitirRecargoCuentaCorriente.mutate(movimiento.id);
  };

  const abrirEmail = () => {
    if (!clienteSeleccionado) return;
    if (!emailDisponible) {
      toast.warning('El servicio de email no esta configurado para esta sucursal');
      return;
    }
    setEmailDestino(clienteSeleccionado.email ?? '');
    setEmailMensaje('');
    setEmailDesde('');
    setEmailHasta('');
    setEmailTipoResumen('CARGOS');
    setEmailAdjuntarPdf(true);
    setEmailOpen(true);
  };

  const enviarResumen = () => {
    if (!emailDisponible) {
      toast.warning('El servicio de email no esta configurado para esta sucursal');
      return;
    }
    if (!clienteSeleccionado || !emailDestino.trim()) return;
    mutations.enviarResumenCuentaCorrienteEmail.mutate(
      {
        clienteId: clienteSeleccionado.id,
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
  const movimientosColumns: DataTableColumn<IMovimientoCuentaCorrienteAux>[] = [
    {
      key: 'tipo',
      header: 'Tipo',
      render: (movimiento) => (
        <span className={`rounded border px-2 py-1 text-[11px] font-semibold ${tipoClass[movimiento.tipo] ?? tipoClass.AJUSTE}`}>
          {movimiento.tipo}
        </span>
      ),
    },
    {
      key: 'descripcion',
      header: 'Descripcion',
      render: (movimiento) => (
        <div className="text-[#041627]">
          <div className="font-semibold">{movimiento.descripcion || '-'}</div>
          {movimiento.comprobante_id ? (
            <div className="mt-1 flex items-center gap-1 text-[11px] text-[#44474c]">
              <FileText size={12} />
              {shortId(movimiento.comprobante_id)}
            </div>
          ) : null}
          {movimiento.omitido ? (
            <div className="mt-1 text-[11px] font-semibold text-[#b42318]">Recargo omitido</div>
          ) : null}
        </div>
      ),
    },
    {
      key: 'fecha',
      header: 'Fecha',
      render: (movimiento) => (
        <>
          {dateTime(movimiento.fecha)}
          {movimiento.fecha_vencimiento ? (
            <div className="mt-1 text-[11px]">Vence {dateTime(movimiento.fecha_vencimiento)}</div>
          ) : null}
        </>
      ),
    },
    {
      key: 'monto',
      header: 'Monto',
      align: 'right',
      render: (movimiento) => (
        <span className={`font-bold ${toNumber(movimiento.monto) > 0 ? 'text-[#b42318]' : 'text-[#075E54]'}`}>
          {money(movimiento.monto)}
        </span>
      ),
    },
    {
      key: 'accion',
      header: 'Accion',
      align: 'right',
      render: (movimiento) =>
        movimiento.tipo === 'RECARGO_INTERES' && !movimiento.omitido ? (
          <button
            type="button"
            onClick={() => omitirRecargo(movimiento)}
            className="inline-flex h-8 items-center gap-2 rounded border border-[#f1c7c7] bg-[#fff5f5] px-2 text-[12px] font-semibold text-[#b42318] hover:bg-[#fdecec]"
          >
            <XCircle size={14} />
            Omitir
          </button>
        ) : null,
    },
  ];

  return (
    <div className="min-h-[calc(100vh-52px)] bg-[#f3f4f6] px-4 py-4">
      <div className="mx-auto grid max-w-[1500px] gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <section className="rounded-lg border border-[#c4c6cd] bg-white shadow-sm">
          <div className="border-b border-[#c4c6cd] px-4 py-3">
            <div className="flex items-center gap-2 text-[15px] font-bold text-[#041627]">
              <Wallet size={17} className="text-[#075E54]" />
              Cuentas corrientes
            </div>
            <div className="mt-1 text-[13px] text-[#44474c]">
              Clientes con credito activo y saldo operativo.
            </div>
          </div>

          <div className="border-b border-[#c4c6cd] bg-[#fbfbfc] p-3">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#44474c]" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar cliente, CUIT o DNI"
                className="h-9 w-full rounded border border-[#c4c6cd] bg-white pl-9 pr-3 text-[13px] outline-none focus:border-[#075E54]"
              />
            </div>
          </div>

          <div className="max-h-[680px] overflow-auto">
            {clientesFiltrados.map((cliente) => {
              const clienteSaldo = toNumber(cliente.cuentaCorriente?.saldo);
              return (
                <button
                  key={cliente.id}
                  type="button"
                  onClick={() => setClienteId(cliente.id)}
                  className={`w-full border-b border-[#e5e7eb] px-4 py-3 text-left hover:bg-[#f8fafc] ${
                    clienteSeleccionado?.id === cliente.id ? 'bg-[#eef8f6]' : 'bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-[14px] font-bold text-[#041627]">
                        {clienteNombre(cliente)}
                      </div>
                    <div className="mt-1 text-[12px] text-[#44474c]">
                        {cliente.cuit || cliente.dni || 'Sin documento'} | Limite{' '}
                        {toNumber(cliente.cuentaCorriente?.limite_credito) > 0
                          ? money(cliente.cuentaCorriente?.limite_credito)
                          : 'Sin limite'}
                      </div>
                    </div>
                    <div className={`text-right text-[14px] font-bold ${clienteSaldo > 0 ? 'text-[#b42318]' : 'text-[#075E54]'}`}>
                      {money(clienteSaldo)}
                    </div>
                  </div>
                </button>
              );
            })}
            {!clientesFiltrados.length && !clientesQuery.isLoading ? (
              <div className="px-4 py-10 text-center text-[14px] text-[#44474c]">
                Sin clientes con cuenta corriente activa.
              </div>
            ) : null}
          </div>
        </section>

        <section className="rounded-lg border border-[#c4c6cd] bg-white shadow-sm">
          {clienteSeleccionado ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#c4c6cd] px-4 py-3">
                <div>
                  <div className="text-[18px] font-bold text-[#041627]">
                    {clienteNombre(clienteSeleccionado)}
                  </div>
                  <div className="text-[13px] text-[#44474c]">
                    Cuenta {shortId(clienteSeleccionado.cuentaCorriente?.id)} | {clienteSeleccionado.cuit || clienteSeleccionado.dni || 'Sin documento'}
                  </div>
                </div>
                <span className={`rounded border px-3 py-1.5 text-[12px] font-bold ${saldo > 0 ? 'border-[#f1c7c7] bg-[#fff5f5] text-[#b42318]' : 'border-[#cfe2de] bg-[#f3fbf9] text-[#075E54]'}`}>
                  Saldo {money(saldo)}
                </span>
                {emailDisponible ? (
                  <button
                    type="button"
                    onClick={abrirEmail}
                    className="inline-flex h-9 items-center gap-2 rounded border border-[#cfe2de] bg-[#f3fbf9] px-3 text-[12px] font-semibold text-[#075E54] hover:bg-[#e8f7f3]"
                  >
                    <Mail size={14} />
                    Enviar resumen
                  </button>
                ) : null}
              </div>

              {emailOpen && emailDisponible ? (
                <div className="border-b border-[#c4c6cd] bg-white p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="text-[14px] font-bold text-[#041627]">
                        Enviar resumen por email
                      </div>
                      <div className="text-[12px] text-[#44474c]">
                        Saldo actual {money(saldo)} | {movimientos.length} movimientos
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
                        placeholder="Te enviamos el resumen actualizado de tu cuenta"
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
                      onClick={enviarResumen}
                      disabled={
                        !emailDestino.trim() ||
                        mutations.enviarResumenCuentaCorrienteEmail.isPending
                      }
                      className="mt-auto inline-flex h-9 items-center justify-center gap-2 rounded bg-[#075E54] px-3 text-[12px] font-semibold text-white hover:bg-[#0b6d62] disabled:opacity-50"
                    >
                      {mutations.enviarResumenCuentaCorrienteEmail.isPending ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Mail size={14} />
                      )}
                      Enviar
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="grid gap-3 border-b border-[#c4c6cd] bg-[#fbfbfc] p-4 sm:grid-cols-4">
                <div className="rounded border border-[#e5e7eb] bg-white px-3 py-2">
                  <div className="text-[11px] font-bold uppercase text-[#44474c]">Saldo</div>
                  <div className="mt-1 text-[15px] font-bold text-[#041627]">{money(saldo)}</div>
                </div>
                <div className="rounded border border-[#e5e7eb] bg-white px-3 py-2">
                  <div className="text-[11px] font-bold uppercase text-[#44474c]">Limite</div>
                  <div className="mt-1 text-[15px] font-bold text-[#041627]">
                    {limite > 0 ? money(limite) : 'Sin limite'}
                  </div>
                </div>
                <div className="rounded border border-[#e5e7eb] bg-white px-3 py-2">
                  <div className="text-[11px] font-bold uppercase text-[#44474c]">Cargos</div>
                  <div className="mt-1 text-[15px] font-bold text-[#b42318]">{money(totalCargos)}</div>
                </div>
                <div className="rounded border border-[#e5e7eb] bg-white px-3 py-2">
                  <div className="text-[11px] font-bold uppercase text-[#44474c]">Pagos/creditos</div>
                  <div className="mt-1 text-[15px] font-bold text-[#075E54]">{money(totalCreditos)}</div>
                </div>
              </div>

              <div className="grid gap-3 border-b border-[#c4c6cd] p-4 lg:grid-cols-[180px_150px_1fr_150px_auto]">
                <select
                  value={accion}
                  onChange={(event) => setAccion(event.target.value as AccionCuenta)}
                  className="h-9 rounded border border-[#c4c6cd] bg-white px-2 text-[13px] outline-none focus:border-[#075E54]"
                >
                  <option value="PAGO">Registrar pago</option>
                  <option value="CARGO">Registrar cargo</option>
                  <option value="AJUSTE">Ajuste manual</option>
                </select>
                <input
                  type="number"
                  value={monto}
                  onChange={(event) => setMonto(event.target.value)}
                  placeholder="Monto"
                  className="h-9 rounded border border-[#c4c6cd] px-2 text-[13px] outline-none focus:border-[#075E54]"
                />
                <input
                  value={descripcion}
                  onChange={(event) => setDescripcion(event.target.value)}
                  placeholder="Descripcion"
                  className="h-9 rounded border border-[#c4c6cd] px-2 text-[13px] outline-none focus:border-[#075E54]"
                />
                <input
                  type="date"
                  value={fechaVencimiento}
                  onChange={(event) => setFechaVencimiento(event.target.value)}
                  disabled={accion !== 'CARGO'}
                  className="h-9 rounded border border-[#c4c6cd] px-2 text-[13px] outline-none focus:border-[#075E54] disabled:bg-[#f4f5f6]"
                />
                <button
                  type="button"
                  onClick={ejecutarAccion}
                  disabled={mutations.registrarPagoCuentaCorriente.isPending || mutations.registrarCargoCuentaCorriente.isPending}
                  className="flex h-9 items-center justify-center gap-2 rounded bg-[#075E54] px-3 text-[13px] font-semibold text-white hover:bg-[#0b6d62] disabled:opacity-60"
                >
                  {accion === 'PAGO' ? <CreditCard size={15} /> : <Plus size={15} />}
                  Guardar
                </button>
              </div>

              {accion === 'PAGO' ? (
                <div className="grid gap-3 border-b border-[#c4c6cd] bg-[#fbfbfc] p-4 md:grid-cols-[220px_220px_1fr]">
                  <div className="rounded border border-[#e5e7eb] bg-white px-3 py-2 text-[13px]">
                    <div className="text-[11px] font-bold uppercase text-[#44474c]">Caja destino</div>
                    <div className={`mt-1 font-semibold ${cajaAbierta ? 'text-[#075E54]' : 'text-[#b42318]'}`}>
                      {cajaAbierta ? `Abierta ${shortId(cajaAbierta.id)}` : 'Sin caja abierta'}
                    </div>
                  </div>
                  <label className="text-[12px] font-semibold text-[#041627]">
                    Medio de pago
                    <select
                      value={medioPagoId}
                      onChange={(event) => setMedioPagoId(event.target.value)}
                      className="mt-1 h-9 w-full rounded border border-[#c4c6cd] bg-white px-2 text-[13px] outline-none focus:border-[#075E54]"
                    >
                      <option value="">Sin medio</option>
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
                      placeholder="Nro. transferencia, cupón o nota"
                      className="mt-1 h-9 w-full rounded border border-[#c4c6cd] px-2 text-[13px] outline-none focus:border-[#075E54]"
                    />
                  </label>
                </div>
              ) : null}

              <div className="grid gap-3 border-b border-[#c4c6cd] bg-[#fbfbfc] p-4 sm:grid-cols-[180px_auto_auto_1fr]">
                <input
                  type="date"
                  value={hastaRecargo}
                  onChange={(event) => setHastaRecargo(event.target.value)}
                  className="h-9 rounded border border-[#c4c6cd] px-2 text-[13px] outline-none focus:border-[#075E54]"
                />
                <button
                  type="button"
                  onClick={() => calcularRecargos(true)}
                  className="flex h-9 items-center justify-center gap-2 rounded border border-[#c4c6cd] bg-white px-3 text-[13px] font-semibold text-[#041627] hover:bg-[#f4f5f6]"
                >
                  <Calculator size={15} />
                  Simular recargos
                </button>
                <button
                  type="button"
                  onClick={() => calcularRecargos(false)}
                  className="flex h-9 items-center justify-center gap-2 rounded border border-[#f6d58f] bg-[#fff8e6] px-3 text-[13px] font-semibold text-[#8a5a00] hover:bg-[#fff3ce]"
                >
                  Aplicar recargos
                </button>
                <div className="flex items-center text-[12px] text-[#44474c]">
                  La fecha vacia calcula hasta hoy.
                </div>
              </div>

              <div className="max-h-[430px] overflow-auto">
                <DataTable
                  rows={movimientos}
                  columns={movimientosColumns}
                  getRowKey={(movimiento) => movimiento.id}
                  isLoading={movimientosQuery.isLoading}
                  loadingMessage="Cargando movimientos..."
                  emptyMessage="Sin movimientos para este cliente."
                  rowClassName={(movimiento) => (movimiento.omitido ? 'opacity-55' : '')}
                  getContextActions={(movimiento) => [
                    {
                      label: 'Ver comprobante',
                      icon: <FileText size={14} />,
                      disabled: !movimiento.comprobante_id,
                    },
                    {
                      label: 'Omitir recargo',
                      icon: <XCircle size={14} />,
                      danger: true,
                      disabled: movimiento.tipo !== 'RECARGO_INTERES' || movimiento.omitido,
                      dividerBefore: true,
                      onClick: () => omitirRecargo(movimiento),
                    },
                  ]}
                />
              </div>
            </>
          ) : (
            <div className="flex min-h-[420px] items-center justify-center px-4 text-center text-[14px] text-[#44474c]">
              Seleccione un cliente para ver su cuenta corriente.
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default CuentaCorrienteAuxPage;
