import { Download, Loader2, Mail, Printer, Search, Wallet, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import DataTable from '../../../components/common/DataTable';
import type { DataTableColumn } from '../../../components/common/DataTable';
import { usePosAuxMutation } from '../../POSAuxiliares/hooks/usePosAux';
import type { IMovimientoCuentaCorrienteAux } from '../../POSAuxiliares/types/pos-aux.type';
import { dateTime } from '../../POSAuxiliares/utils/format';
import type { ICliente } from '../types/cliente.type';
import {
  buildCuentaCorrienteCsv,
  clienteNombre,
  downloadTextFile,
  imprimirCuentaCorriente,
  money,
  movimientoProductos,
  type TipoResumenEmail,
} from '../utils/clientes.utils';

interface Props {
  selectedCliente: ICliente;
  movimientos: IMovimientoCuentaCorrienteAux[];
  isLoading: boolean;
  emailDisponible: boolean;
  onVolver: () => void;
}

const movimientosColumns: DataTableColumn<IMovimientoCuentaCorrienteAux>[] = [
  { key: 'fecha', header: 'Fecha', render: (mov) => dateTime(mov.fecha) },
  {
    key: 'tipo',
    header: 'Tipo',
    render: (mov) => (
      <span className="rounded border border-[#c4c6cd] bg-[#fbf9fa] px-2 py-1 text-[11px] font-bold text-[#075E54]">
        {mov.tipo}
      </span>
    ),
  },
  {
    key: 'descripcion',
    header: 'Descripcion',
    render: (mov) => mov.descripcion || '-',
  },
  {
    key: 'productos',
    header: 'Productos',
    render: (mov) => {
      const items = movimientoProductos(mov);
      if (!items.length) {
        return (
          <span className="text-[12px] text-[#9ca3af]">
            {mov.comprobante_id ? 'Sin items cargados' : 'Movimiento manual'}
          </span>
        );
      }
      return (
        <div className="max-w-[360px] space-y-1">
          <div className="text-[12px] font-bold text-[#041627]">
            {mov.comprobante?.numero ?? mov.comprobante_id}
          </div>
          {items.slice(0, 4).map((item) => (
            <div key={item.id} className="flex justify-between gap-3 text-[12px] text-[#44474c]">
              <span className="min-w-0 truncate">
                {Number(item.cantidad ?? 0)} x {item.descripcion}
              </span>
              <span className="shrink-0 font-semibold text-[#041627]">{money(item.subtotal)}</span>
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
    render: (mov) => (
      <span className={`font-bold ${Number(mov.monto) >= 0 ? 'text-[#041627]' : 'text-[#075E54]'}`}>
        {money(mov.monto)}
      </span>
    ),
  },
];

export default function ClienteCuentaCorrienteSection({
  selectedCliente,
  movimientos,
  isLoading,
  emailDisponible,
  onVolver,
}: Props) {
  const posAuxMutations = usePosAuxMutation();
  const [search, setSearch] = useState('');
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailDestino, setEmailDestino] = useState('');
  const [emailMensaje, setEmailMensaje] = useState('');
  const [emailDesde, setEmailDesde] = useState('');
  const [emailHasta, setEmailHasta] = useState('');
  const [emailTipoResumen, setEmailTipoResumen] = useState<TipoResumenEmail>('CARGOS');
  const [emailAdjuntarPdf, setEmailAdjuntarPdf] = useState(true);

  const saldo = Number(selectedCliente.cuentaCorriente?.saldo ?? 0);
  const limiteCredito = Number(selectedCliente.cuentaCorriente?.limite_credito ?? 0);
  const disponibleCredito = limiteCredito > 0 ? Math.max(0, limiteCredito - Math.max(saldo, 0)) : 0;

  const movimientosFiltrados = search.trim()
    ? movimientos.filter((mov) => {
        const term = search.trim().toLowerCase();
        return [mov.tipo, mov.descripcion, mov.comprobante_id, mov.monto, dateTime(mov.fecha)]
          .join(' ')
          .toLowerCase()
          .includes(term);
      })
    : movimientos;

  const abrirEmail = () => {
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

  const enviarEmail = () => {
    if (!emailDisponible) {
      toast.warning('El servicio de email no esta configurado para esta sucursal');
      return;
    }
    if (!emailDestino.trim()) return;
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
      { onSuccess: () => { setEmailOpen(false); setEmailMensaje(''); } },
    );
  };

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
              {clienteNombre(selectedCliente)} | movimientos, saldo y credito.
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onVolver}
              className="flex h-9 items-center gap-2 rounded border border-[#c4c6cd] bg-white px-3 text-[13px] font-semibold text-[#041627] hover:bg-[#f4f5f6]"
            >
              Volver a ficha
            </button>
            {selectedCliente.cuentaCorriente ? (
              <>
                <button
                  type="button"
                  onClick={() =>
                    downloadTextFile(
                      `cuenta-corriente-${clienteNombre(selectedCliente).replace(/\s+/g, '-').toLowerCase()}.csv`,
                      buildCuentaCorrienteCsv(selectedCliente, movimientos),
                      'text/csv;charset=utf-8',
                    )
                  }
                  className="flex h-9 items-center gap-2 rounded border border-[#c4c6cd] bg-white px-3 text-[13px] font-semibold text-[#041627] hover:bg-[#f4f5f6]"
                >
                  <Download size={14} />
                  Excel
                </button>
                <button
                  type="button"
                  onClick={() => imprimirCuentaCorriente(selectedCliente, movimientos)}
                  className="flex h-9 items-center gap-2 rounded border border-[#c4c6cd] bg-white px-3 text-[13px] font-semibold text-[#041627] hover:bg-[#f4f5f6]"
                >
                  <Printer size={14} />
                  PDF
                </button>
                {emailDisponible ? (
                  <button
                    type="button"
                    onClick={abrirEmail}
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

        {!selectedCliente.cuentaCorriente ? (
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
                      onChange={(e) => setEmailDestino(e.target.value)}
                      className="mt-1 h-9 w-full rounded border border-[#c4c6cd] px-2 text-[13px] outline-none focus:border-[#075E54]"
                      placeholder="cliente@correo.com"
                    />
                  </label>
                  <label className="text-[12px] font-semibold text-[#041627]">
                    Mensaje
                    <input
                      value={emailMensaje}
                      onChange={(e) => setEmailMensaje(e.target.value)}
                      className="mt-1 h-9 w-full rounded border border-[#c4c6cd] px-2 text-[13px] outline-none focus:border-[#075E54]"
                      placeholder="Te enviamos el detalle de compras de tu cuenta corriente"
                    />
                  </label>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-[150px_150px_220px_1fr_auto]">
                  <label className="text-[12px] font-semibold text-[#041627]">
                    Desde
                    <input type="date" value={emailDesde} onChange={(e) => setEmailDesde(e.target.value)} className="mt-1 h-9 w-full rounded border border-[#c4c6cd] px-2 text-[13px] outline-none focus:border-[#075E54]" />
                  </label>
                  <label className="text-[12px] font-semibold text-[#041627]">
                    Hasta
                    <input type="date" value={emailHasta} onChange={(e) => setEmailHasta(e.target.value)} className="mt-1 h-9 w-full rounded border border-[#c4c6cd] px-2 text-[13px] outline-none focus:border-[#075E54]" />
                  </label>
                  <label className="text-[12px] font-semibold text-[#041627]">
                    Incluir
                    <select
                      value={emailTipoResumen}
                      onChange={(e) => setEmailTipoResumen(e.target.value as TipoResumenEmail)}
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
                      onChange={(e) => setEmailAdjuntarPdf(e.target.checked)}
                      className="h-4 w-4 accent-[#075E54]"
                    />
                    Adjuntar PDF
                  </label>
                  <button
                    type="button"
                    onClick={enviarEmail}
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
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar movimiento, comprobante, monto o fecha"
                  className="h-9 w-full rounded border border-[#c4c6cd] bg-white pl-9 pr-2 text-[13px] outline-none focus:border-[#075E54]"
                />
              </div>
            </div>

            <DataTable
              rows={movimientosFiltrados}
              columns={movimientosColumns}
              getRowKey={(mov) => mov.id}
              isLoading={isLoading}
              loadingMessage="Cargando movimientos de cuenta..."
              emptyMessage="Sin movimientos en la cuenta corriente."
              minWidth="980px"
              rowClassName={(mov) => (mov.omitido ? 'opacity-55' : '')}
            />
          </>
        )}
      </div>
    </div>
  );
}
