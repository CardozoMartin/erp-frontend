import { CheckCircle2, Clock, Send, XCircle } from 'lucide-react';
import DataTable from '../../../components/common/DataTable';
import type { DataTableColumn } from '../../../components/common/DataTable';
import { useCotizacionesAux, usePosAuxMutation } from '../../POSAuxiliares/hooks/usePosAux';
import type { IComprobanteAux } from '../../POSAuxiliares/types/pos-aux.type';
import { dateTime, money } from '../../POSAuxiliares/utils/format';

const CotizacionesPage = () => {
  const cotizacionesQuery = useCotizacionesAux();
  const mutations = usePosAuxMutation();
  const cotizaciones = cotizacionesQuery.data ?? [];
  const columns: DataTableColumn<IComprobanteAux>[] = [
    {
      key: 'numero',
      header: 'Numero',
      render: (cotizacion) => <span className="font-semibold text-[#041627]">{cotizacion.numero}</span>,
    },
    { key: 'estado', header: 'Estado', render: (cotizacion) => cotizacion.estado },
    { key: 'fecha', header: 'Fecha', render: (cotizacion) => dateTime(cotizacion.created_at) },
    {
      key: 'total',
      header: 'Total',
      align: 'right',
      render: (cotizacion) => <span className="font-semibold">{money(cotizacion.total)}</span>,
    },
    {
      key: 'acciones',
      header: 'Acciones',
      align: 'right',
      render: (cotizacion) => (
        <div className="flex justify-end gap-2">
          <button
            onClick={() => mutations.cambiarCotizacion.mutate({ id: cotizacion.id, accion: 'enviar' })}
            className="rounded border border-[#c4c6cd] bg-white p-2 text-[#041627] hover:bg-[#f4f5f6]"
            title="Enviar"
          >
            <Send size={14} />
          </button>
          <button
            onClick={() => mutations.cambiarCotizacion.mutate({ id: cotizacion.id, accion: 'aceptar' })}
            className="rounded border border-[#cfe2de] bg-[#f3fbf9] p-2 text-[#075E54] hover:bg-[#e8f7f3]"
            title="Aceptar"
          >
            <CheckCircle2 size={14} />
          </button>
          <button
            onClick={() => mutations.cambiarCotizacion.mutate({ id: cotizacion.id, accion: 'convertir-venta' })}
            className="rounded bg-[#075E54] px-3 py-2 text-[12px] font-semibold text-white hover:bg-[#0b6d62]"
          >
            Venta
          </button>
          <button
            onClick={() => mutations.cambiarCotizacion.mutate({ id: cotizacion.id, accion: 'rechazar' })}
            className="rounded border border-[#f1c7c7] bg-[#fff5f5] p-2 text-[#b42318] hover:bg-[#fdecec]"
            title="Rechazar"
          >
            <XCircle size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-[calc(100vh-52px)] bg-[#f3f4f6] px-4 py-4">
      <div className="mx-auto max-w-[1500px] rounded-lg border border-[#c4c6cd] bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-[#c4c6cd] px-4 py-3">
          <div>
            <div className="text-[15px] font-bold text-[#041627]">Cotizaciones</div>
            <div className="text-[13px] text-[#44474c]">Presupuestos creados desde POS y comprobantes</div>
          </div>
          <button
            onClick={() => mutations.vencerCotizaciones.mutate()}
            className="flex h-9 items-center gap-2 rounded border border-[#c4c6cd] bg-white px-3 text-[13px] font-semibold text-[#041627] hover:bg-[#f4f5f6]"
          >
            <Clock size={15} />
            Vencer expiradas
          </button>
        </div>

        <DataTable
          rows={cotizaciones}
          columns={columns}
          getRowKey={(cotizacion) => cotizacion.id}
          isLoading={cotizacionesQuery.isLoading}
          loadingMessage="Cargando cotizaciones..."
          emptyMessage="Sin cotizaciones"
          getContextActions={(cotizacion) => [
            {
              label: 'Enviar',
              icon: <Send size={14} />,
              onClick: () => mutations.cambiarCotizacion.mutate({ id: cotizacion.id, accion: 'enviar' }),
            },
            {
              label: 'Aceptar',
              icon: <CheckCircle2 size={14} />,
              onClick: () => mutations.cambiarCotizacion.mutate({ id: cotizacion.id, accion: 'aceptar' }),
            },
            {
              label: 'Convertir a venta',
              badge: 'POS',
              onClick: () => mutations.cambiarCotizacion.mutate({ id: cotizacion.id, accion: 'convertir-venta' }),
            },
            {
              label: 'Rechazar',
              icon: <XCircle size={14} />,
              danger: true,
              dividerBefore: true,
              onClick: () => mutations.cambiarCotizacion.mutate({ id: cotizacion.id, accion: 'rechazar' }),
            },
          ]}
        />
      </div>
    </div>
  );
};

export default CotizacionesPage;
