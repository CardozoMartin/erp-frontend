import { Ban, Printer, ReceiptText } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useAuthStore } from '../../../store/auth.store';
import AccessDenied from '../../../components/common/AccessDenied';
import DataTable from '../../../components/common/DataTable';
import type { DataTableColumn } from '../../../components/common/DataTable';
import ComprobanteFicha from '../../POSAuxiliares/components/ComprobanteFicha';
import { useConfiguracionPos, useFacturacionAux, usePosAuxMutation } from '../../POSAuxiliares/hooks/usePosAux';
import type { IComprobanteAux } from '../../POSAuxiliares/types/pos-aux.type';
import { dateTime, money, shortId } from '../../POSAuxiliares/utils/format';
import { imprimirComprobante } from '../../POSAuxiliares/utils/printComprobante';
import { hasAnyPermission, POS_PERMISSIONS } from '../../POSAuxiliares/utils/posPermissions';

const FacturacionPage = () => {
  const permisos = useAuthStore((state) => state.permisos);
  const puedeVerFacturacion = hasAnyPermission(permisos, POS_PERMISSIONS.ventasVer, POS_PERMISSIONS.reportesVer, POS_PERMISSIONS.reportesVentas);
  const puedeAnularFiscal = permisos.includes(POS_PERMISSIONS.ventasCancelarPagada);
  const facturacionQuery = useFacturacionAux(puedeVerFacturacion);
  const configQuery = useConfiguracionPos();
  const mutations = usePosAuxMutation();
  const comprobantes = useMemo(() => facturacionQuery.data ?? [], [facturacionQuery.data]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedComprobante = useMemo(
    () => comprobantes.find((comprobante) => comprobante.id === selectedId) ?? comprobantes[0] ?? null,
    [comprobantes, selectedId],
  );
  const printComprobante = (comprobante: IComprobanteAux) =>
    imprimirComprobante(comprobante, { titulo: comprobante.tipo, config: configQuery.data });
  const columns: DataTableColumn<IComprobanteAux>[] = [
    {
      key: 'numero',
      header: 'Numero',
      render: (comprobante) => <span className="font-semibold text-[#041627]">{comprobante.numero}</span>,
    },
    { key: 'tipo', header: 'Tipo', render: (comprobante) => comprobante.tipo },
    { key: 'estado', header: 'Estado', render: (comprobante) => comprobante.estado },
    { key: 'origen', header: 'Venta origen', render: (comprobante) => shortId(comprobante.comprobante_origen_id) },
    { key: 'fecha', header: 'Fecha', render: (comprobante) => dateTime(comprobante.created_at) },
    {
      key: 'total',
      header: 'Total',
      align: 'right',
      render: (comprobante) => <span className="font-semibold">{money(comprobante.total)}</span>,
    },
    {
      key: 'accion',
      header: 'Accion',
      align: 'right',
      render: (comprobante) => (
        <>
          <button
            onClick={() => printComprobante(comprobante)}
            className="mr-2 inline-flex items-center gap-2 rounded border border-[#c4c6cd] bg-white px-3 py-2 text-[12px] font-semibold text-[#041627] hover:bg-[#f4f5f6]"
          >
            <Printer size={14} />
            Imprimir
          </button>
          <button
            onClick={() => mutations.anularFiscal.mutate({ id: comprobante.id, motivo: 'Anulado desde front' })}
            disabled={!puedeAnularFiscal || comprobante.estado === 'ANULADO'}
            className="inline-flex items-center gap-2 rounded border border-[#f1c7c7] bg-[#fff5f5] px-3 py-2 text-[12px] font-semibold text-[#b42318] hover:bg-[#fdecec] disabled:opacity-50"
          >
            <Ban size={14} />
            Anular
          </button>
        </>
      ),
    },
  ];

  if (!puedeVerFacturacion) {
    return (
      <AccessDenied
        title="Sin permisos para facturacion"
        message="Necesitas ventas.ver o permisos de reportes para consultar tickets y facturas."
      />
    );
  }

  return (
    <div className="min-h-[calc(100vh-52px)] bg-[#f3f4f6] px-4 py-4">
      <div className="mx-auto grid max-w-[1500px] gap-4 xl:grid-cols-[1fr_1fr]">
        <section className="rounded-lg border border-[#c4c6cd] bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-[#c4c6cd] px-4 py-3">
            <ReceiptText size={17} className="text-[#075E54]" />
            <div>
              <div className="text-[15px] font-bold text-[#041627]">Facturacion y tickets</div>
              <div className="text-[13px] text-[#44474c]">Comprobantes fiscales emitidos desde ventas</div>
            </div>
          </div>

          <DataTable
            rows={comprobantes}
            columns={columns}
            getRowKey={(comprobante) => comprobante.id}
            isLoading={facturacionQuery.isLoading}
            loadingMessage="Cargando comprobantes fiscales..."
            emptyMessage="Sin comprobantes fiscales"
            onRowClick={(comprobante) => setSelectedId(comprobante.id)}
            rowClassName={(comprobante) =>
              selectedComprobante?.id === comprobante.id ? 'bg-[#eef8f6]' : ''
            }
            getContextActions={(comprobante) => [
              {
                label: 'Ver ficha',
                icon: <ReceiptText size={14} />,
                onClick: () => setSelectedId(comprobante.id),
              },
              {
                label: 'Imprimir',
                icon: <Printer size={14} />,
                onClick: () => printComprobante(comprobante),
              },
              {
                label: 'Anular comprobante',
                icon: <Ban size={14} />,
                danger: true,
                disabled: !puedeAnularFiscal || comprobante.estado === 'ANULADO',
                dividerBefore: true,
                onClick: () => mutations.anularFiscal.mutate({ id: comprobante.id, motivo: 'Anulado desde menu contextual' }),
              },
            ]}
          />
        </section>

        <ComprobanteFicha
          comprobante={selectedComprobante}
          title="Ficha fiscal"
          emptyTitle="Seleccione un comprobante"
          emptyDescription="Aca se vera el ticket o factura emitida."
          onPrint={printComprobante}
          actions={
            selectedComprobante ? (
              <button
                type="button"
                onClick={() => mutations.anularFiscal.mutate({ id: selectedComprobante.id, motivo: 'Anulado desde ficha' })}
                disabled={!puedeAnularFiscal || selectedComprobante.estado === 'ANULADO'}
                className="flex h-9 items-center gap-2 rounded border border-[#f1c7c7] bg-[#fff5f5] px-3 text-[12px] font-semibold text-[#b42318] hover:bg-[#fdecec] disabled:opacity-50"
              >
                <Ban size={14} />
                Anular
              </button>
            ) : null
          }
        />
      </div>
    </div>
  );
};

export default FacturacionPage;
