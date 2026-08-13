import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { IReporteVentaDia } from '../../POSAuxiliares/types/pos-aux.type';
import { toNumber } from '../../POSAuxiliares/utils/format';

interface Props {
  data: IReporteVentaDia[];
  loading: boolean;
}

const formatFecha = (value: string) => {
  const d = new Date(value + 'T00:00:00');
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
};

const formatMoney = (value: number) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
    notation: 'compact',
  }).format(value);

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-md text-[12px]">
      <p className="font-semibold text-gray-600 mb-1">{formatFecha(label ?? '')}</p>
      <p className="text-emerald-700 font-bold">
        {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(payload[0].value)}
      </p>
    </div>
  );
};

export const VentasAreaChart = ({ data, loading }: Props) => {
  if (loading) {
    return <div className="h-52 animate-pulse rounded-lg bg-gray-100" />;
  }

  const chartData = data.map((d) => ({ fecha: d.fecha, total: toNumber(d.total) }));

  if (!chartData.length) {
    return (
      <div className="flex h-52 items-center justify-center text-[13px] text-gray-400">
        Sin ventas en el período
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="fecha"
          tickFormatter={formatFecha}
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={formatMoney}
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
          width={60}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="total"
          stroke="#10b981"
          strokeWidth={2}
          fill="url(#colorTotal)"
          dot={false}
          activeDot={{ r: 4, fill: '#10b981' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};
