// Configuración centralizada de estilos por estado
type EstadoComprobante =
  | 'BORRADOR'
  | 'ENVIADO'
  | 'ACEPTADO'
  | 'VENCIDO'
  | 'RECHAZADO'
  | 'PENDIENTE_COBRO'
  | 'COBRADA'
  | 'EMITIDO'
  | 'EMITIDA'
  | 'PENDIENTE'
  | 'ENTREGADO_PARCIAL'
  | 'ENTREGADO'
  | 'ANULADO'
  | 'CANCELADA'
  | 'DEVUELTA'
  | 'APLICADA'
  | 'REEMBOLSADA';

const ESTADO_CONFIG: Record<string, { label: string; className: string }> = {
  PENDIENTE_COBRO: {
    label: 'Pendiente de cobro',
    className: 'border border-amber-400 bg-amber-50 text-amber-700',
  },
  COBRADA: {
    label: 'Cobrada',
    className: 'border border-emerald-400 bg-emerald-50 text-emerald-700',
  },
  ENTREGADO_PARCIAL: {
    label: 'Entrega parcial',
    className: 'border border-blue-400 bg-blue-50 text-blue-700',
  },
  ENTREGADO: {
    label: 'Entregado',
    className: 'border border-emerald-500 bg-emerald-50 text-emerald-800',
  },
  ANULADO: {
    label: 'Anulado',
    className: 'border border-red-400 bg-red-50 text-red-700',
  },
  CANCELADA: {
    label: 'Cancelada',
    className: 'border border-red-500 bg-red-50 text-red-800',
  },
} satisfies Partial<Record<EstadoComprobante, { label: string; className: string }>>;

// Fallback para estados no mapeados
const ESTADO_FALLBACK = {
  label: 'Desconocido',
  className: 'border border-gray-300 bg-gray-50 text-gray-600',
};

interface EstadoBadgeProps {
  estado: string;
}

export const EstadoBadge = ({ estado }: EstadoBadgeProps) => {
  const config = ESTADO_CONFIG[estado] ?? ESTADO_FALLBACK;

  return (
    <span
      className={`inline-flex items-center rounded px-2.5 py-1 text-[11px] font-semibold ${config.className}`}
    >
      {config.label}
    </span>
  );
};
