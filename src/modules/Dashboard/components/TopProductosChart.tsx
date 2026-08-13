import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { IReporteProducto } from '../../POSAuxiliares/types/pos-aux.type';
import { toNumber } from '../../POSAuxiliares/utils/format';

interface Props {
  data: IReporteProducto[];
  loading: boolean;
}

const formatMoney = (value: number) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
    notation: 'compact',
  }).format(value);

const truncate = (str: string, max = 18) =>
  str.length > max ? str.slice(0, max) + '…' : str;

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: { name: string }; value: number }[];
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-md text-[12px]">
      <p className="font-semibold text-gray-700 mb-1">{payload[0].payload.name}</p>
      <p className="text-blue-600">{formatMoney(payload[0].value)}</p>
    </div>
  );
};

const BAR_COLORS = ['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#c084fc'];

export const TopProductosChart = ({ data, loading }: Props) => {
  if (loading) {
    return <div className="h-52 animate-pulse rounded-lg bg-gray-100" />;
  }

  const top5 = data
    .slice(0, 5)
    .map((d) => ({ name: d.producto, value: toNumber(d.total), cant: d.cantidad }));

  if (!top5.length) {
    return (
      <div className="flex h-52 items-center justify-center text-[13px] text-gray-400">
        Sin productos vendidos en el período
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart
        data={top5}
        layout="vertical"
        margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
        <XAxis
          type="number"
          tickFormatter={formatMoney}
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          tickFormatter={(v) => truncate(v)}
          tick={{ fontSize: 11, fill: '#6b7280' }}
          axisLine={false}
          tickLine={false}
          width={110}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
          {top5.map((_, index) => (
            <Cell key={index} fill={BAR_COLORS[index % BAR_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};
