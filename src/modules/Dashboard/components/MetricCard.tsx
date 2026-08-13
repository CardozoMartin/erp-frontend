import type { LucideIcon } from 'lucide-react';

interface Props {
  label: string;
  value: string;
  subValue?: string;
  icon: LucideIcon;
  color: 'green' | 'blue' | 'amber' | 'purple' | 'red';
  loading?: boolean;
}

const colorMap = {
  green: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    icon: 'bg-emerald-100 text-emerald-600',
    value: 'text-emerald-700',
  },
  blue: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: 'bg-blue-100 text-blue-600',
    value: 'text-blue-700',
  },
  amber: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: 'bg-amber-100 text-amber-600',
    value: 'text-amber-700',
  },
  purple: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    icon: 'bg-purple-100 text-purple-600',
    value: 'text-purple-700',
  },
  red: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: 'bg-red-100 text-red-600',
    value: 'text-red-700',
  },
};

export const MetricCard = ({ label, value, subValue, icon: Icon, color, loading }: Props) => {
  const c = colorMap[color];

  return (
    <div className={`flex items-center gap-4 rounded-xl border ${c.border} ${c.bg} px-5 py-4`}>
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${c.icon}`}>
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <p className="text-[12px] font-medium text-gray-500">{label}</p>
        {loading ? (
          <div className="mt-1 h-6 w-24 animate-pulse rounded bg-gray-200" />
        ) : (
          <p className={`text-[22px] font-bold leading-tight ${c.value}`}>{value}</p>
        )}
        {subValue && !loading && (
          <p className="text-[11px] text-gray-400">{subValue}</p>
        )}
      </div>
    </div>
  );
};
