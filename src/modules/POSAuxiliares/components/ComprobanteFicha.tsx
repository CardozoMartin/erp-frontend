import { BadgeCheck, CreditCard, FileText, Printer, ShieldAlert, UserRound, Wallet } from 'lucide-react';
import type { ReactNode } from 'react';
import DataTable from '../../../components/common/DataTable';
import type { DataTableColumn } from '../../../components/common/DataTable';
import type { IComprobanteAux } from '../types/pos-aux.type';
import { dateTime, money, shortId, toNumber } from '../utils/format';

type ComprobanteItem = NonNullable<IComprobanteAux['items']>[number];

type Props = {
  comprobante: IComprobanteAux | null;
  title?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  onPrint?: (comprobante: IComprobanteAux) => void;
  actions?: ReactNode;
  children?: ReactNode;
};

const itemColumns: DataTableColumn<ComprobanteItem>[] = [
  {
    key: 'producto',
    header: 'Producto',
    render: (item) => (
      <div className="min-w-0">
        <div className="truncate font-semibold text-[#041627]">{item.descripcion}</div>
        <div className="text-[12px] text-[#44474c]">{money(item.precio_unitario)}</div>
      </div>
    ),
  },
  {
    key: 'cantidad',
    header: 'Cant.',
    align: 'center',
    render: (item) => <span className="font-medium text-[#041627]">x{toNumber(item.cantidad)}</span>,
  },
  {
    key: 'subtotal',
    header: 'Subtotal',
    align: 'right',
    render: (item) => <span className="font-bold text-[#041627]">{money(item.subtotal)}</span>,
  },
];

const arcaLabel: Record<string, string> = {
  NO_REQUIERE: 'No requiere',
  PENDIENTE: 'Pendiente',
  AUTORIZADO: 'Autorizado',
  RECHAZADO: 'Rechazado',
  MANUAL: 'Manual',
};

const arcaBadgeClass = (estado?: string | null) => {
  if (estado === 'AUTORIZADO') return 'border-[#cfe2de] bg-[#f3fbf9] text-[#075E54]';
  if (estado === 'RECHAZADO') return 'border-[#f1c7c7] bg-[#fff5f5] text-[#b42318]';
  if (estado === 'PENDIENTE') return 'border-[#f6d9a8] bg-[#fff8eb] text-[#92400e]';
  if (estado === 'MANUAL') return 'border-[#c7d2fe] bg-[#eef2ff] text-[#3730a3]';
  return 'border-[#e5e7eb] bg-[#f8fafc] text-[#44474c]';
};

const isFacturaFiscal = (comprobante: IComprobanteAux) =>
  ['FACTURA_A', 'FACTURA_B', 'FACTURA_C'].includes(comprobante.tipo);

const ComprobanteFicha = ({
  comprobante,
  title = 'Ficha de comprobante',
  emptyTitle = 'Seleccione un comprobante',
  emptyDescription = 'Aca se vera el detalle completo.',
  onPrint,
  actions,
  children,
}: Props) => {
  if (!comprobante) {
    return (
      <section className="flex min-h-[360px] flex-col items-center justify-center gap-2 rounded-lg border border-[#c4c6cd] bg-white px-4 text-center text-[#44474c] shadow-sm">
        <FileText size={24} />
        <div className="text-[15px] font-bold text-[#041627]">{emptyTitle}</div>
        <p className="max-w-sm text-[13px]">{emptyDescription}</p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-lg border border-[#c4c6cd] bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#c4c6cd] px-4 py-3">
        <div>
          <div className="text-[18px] font-bold text-[#041627]">{comprobante.numero}</div>
          <div className="text-[13px] text-[#44474c]">
            {title} | {comprobante.tipo} | {comprobante.estado} | {dateTime(comprobante.created_at)}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {onPrint ? (
            <button
              type="button"
              onClick={() => onPrint(comprobante)}
              className="flex h-9 items-center gap-2 rounded border border-[#c4c6cd] bg-white px-3 text-[12px] font-semibold text-[#041627] hover:bg-[#f4f5f6]"
            >
              <Printer size={14} />
              Imprimir
            </button>
          ) : null}
          {actions}
        </div>
      </div>

      <div className="grid gap-3 border-b border-[#c4c6cd] p-4 sm:grid-cols-3">
        <div className="rounded border border-[#e5e7eb] bg-[#f8fafc] px-3 py-2">
          <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wide text-[#44474c]">
            <UserRound size={14} />
            Cliente
          </div>
          <div className="mt-1 text-[14px] font-semibold text-[#041627]">
            {comprobante.cliente_id ? shortId(comprobante.cliente_id) : 'Consumidor final'}
          </div>
        </div>
        <div className="rounded border border-[#e5e7eb] bg-[#f8fafc] px-3 py-2">
          <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wide text-[#44474c]">
            <Wallet size={14} />
            Caja
          </div>
          <div className="mt-1 text-[14px] font-semibold text-[#041627]">
            {comprobante.caja_id ? shortId(comprobante.caja_id) : 'Sin caja'}
          </div>
        </div>
        <div className="rounded border border-[#cfe2de] bg-[#f3fbf9] px-3 py-2">
          <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wide text-[#075E54]">
            <CreditCard size={14} />
            Total
          </div>
          <div className="mt-1 text-[16px] font-bold text-[#041627]">{money(comprobante.total)}</div>
        </div>
      </div>

      {isFacturaFiscal(comprobante) ? (
        <div className="border-b border-[#c4c6cd] p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[13px] font-bold uppercase text-[#041627]">
              {comprobante.arca_estado === 'RECHAZADO' ? <ShieldAlert size={15} /> : <BadgeCheck size={15} />}
              Estado ARCA
            </div>
            <span className={`rounded border px-2.5 py-1 text-[11px] font-semibold ${arcaBadgeClass(comprobante.arca_estado)}`}>
              {arcaLabel[comprobante.arca_estado ?? ''] ?? comprobante.arca_estado ?? 'Pendiente'}
            </span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <FiscalInfo label="Modo" value={comprobante.arca_modo ?? '-'} />
            <FiscalInfo label="CAE" value={comprobante.cae ?? '-'} />
            <FiscalInfo label="Vencimiento CAE" value={comprobante.cae_vencimiento ? dateTime(comprobante.cae_vencimiento) : '-'} />
            <FiscalInfo label="Codigo fiscal" value={comprobante.codigo_fiscal ?? '-'} />
          </div>
          {comprobante.arca_error_mensaje ? (
            <div className="mt-3 rounded border border-[#f1c7c7] bg-[#fff5f5] px-3 py-2 text-[12px] font-semibold text-[#b42318]">
              {comprobante.arca_error_codigo ? `${comprobante.arca_error_codigo}: ` : ''}
              {comprobante.arca_error_mensaje}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="border-b border-[#c4c6cd]">
        <div className="border-b border-[#e5e7eb] px-4 py-3 text-[12px] font-bold uppercase tracking-wide text-[#44474c]">
          Items
        </div>
        <DataTable
          rows={comprobante.items ?? []}
          columns={itemColumns}
          getRowKey={(item) => item.id}
          emptyMessage="Sin items registrados."
        />
      </div>

      <div className="grid gap-4 p-4 lg:grid-cols-[1fr_260px]">
        <div className="rounded border border-[#e5e7eb] bg-[#f8fafc] px-3 py-3">
          <div className="text-[12px] font-bold uppercase tracking-wide text-[#44474c]">
            Observaciones
          </div>
          <p className="mt-2 min-h-10 text-[13px] text-[#44474c]">
            {comprobante.observaciones || 'Sin observaciones.'}
          </p>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[14px] text-[#44474c]">
            <span>Subtotal</span>
            <span>{money(comprobante.subtotal)}</span>
          </div>
          <div className="flex items-center justify-between text-[14px] text-[#44474c]">
            <span>Descuentos</span>
            <span>{money(comprobante.descuento_total)}</span>
          </div>
          <div className="flex items-center justify-between text-[14px] text-[#44474c]">
            <span>Recargos</span>
            <span>{money(comprobante.recargo_total)}</span>
          </div>
          <div className="flex items-center justify-between border-t border-[#c4c6cd] pt-2 text-[18px] font-bold text-[#041627]">
            <span>Total</span>
            <span>{money(comprobante.total)}</span>
          </div>
        </div>
      </div>

      {children}
    </section>
  );
};

const FiscalInfo = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded border border-[#e5e7eb] bg-[#f8fafc] px-3 py-2">
    <div className="text-[11px] font-bold uppercase text-[#44474c]">{label}</div>
    <div className="mt-1 truncate text-[13px] font-semibold text-[#041627]">{value}</div>
  </div>
);

export default ComprobanteFicha;
