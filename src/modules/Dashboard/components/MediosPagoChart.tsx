import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { IReporteMedioPago } from '../../POSAuxiliares/types/pos-aux.type';
import { toNumber } from '../../POSAuxiliares/utils/format';

interface Props {
  data: IReporteMedioPago[];
  loading: boolean;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#f97316'];

const formatMoney = (value: number) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value);

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { name: string; value: number }[];
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-md text-[12px]">
      <p className="font-semibold text-gray-700">{payload[0].name}</p>
      <p className="text-gray-600">{formatMoney(payload[0].value)}</p>
    </div>
  );
};

export const MediosPagoChart = ({ data, loading }: Props) => {
  if (loading) {
    return <div className="h-52 animate-pulse rounded-lg bg-gray-100" />;
  }

  const chartData = data
    .map((d) => ({ name: d.medio_pago, value: toNumber(d.total) }))
    .filter((d) => d.value > 0);

  if (!chartData.length) {
    return (
      <div className="flex h-52 items-center justify-center text-[13px] text-gray-400">
        Sin cobros en el período
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="45%"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={3}
          dataKey="value"
        >
          {chartData.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};
