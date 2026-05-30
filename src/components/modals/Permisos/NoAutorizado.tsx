// components/AlertModal.tsx
import type { ComponentType, SVGProps } from 'react';
import { useNavigate } from 'react-router-dom';

interface AlertModalAction {
  label: string;
  /** Si se pasa navigateTo, navega. Si no, ejecuta onClick */
  navigateTo?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
}

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Ícono de Lucide a mostrar */
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  iconBgColor?: string;   // Tailwind class, ej: 'bg-amber-100'
  iconColor?: string;     // Tailwind class, ej: 'text-amber-600'
  title: string;
  description: string;
  actions?: AlertModalAction[];
}

const VARIANT_STYLES: Record<NonNullable<AlertModalAction['variant']>, string> = {
  primary:   'bg-[#075E54] hover:bg-[#1e8e4f] text-white border-transparent',
  secondary: 'text-[#44474c] border border-[#c4c6cd] hover:bg-[#efedef]',
  danger:    'text-red-600 border border-red-200 hover:bg-red-50',
};

export default function AlertModal({
  isOpen,
  onClose,
  icon: Icon,
  iconBgColor = 'bg-amber-100',
  iconColor = 'text-amber-600',
  title,
  description,
  actions = [],
}: AlertModalProps) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleAction = (action: AlertModalAction) => {
    if (action.navigateTo) {
      navigate(action.navigateTo);
    } else {
      action.onClick?.();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl border border-[#c4c6cd] p-8 w-full max-w-md mx-4 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ícono + mensaje */}
        <div className="flex flex-col items-center text-center gap-3 mb-6">
          <div className={`w-13 h-13 rounded-full ${iconBgColor} flex items-center justify-center`}>
            <Icon className={`w-6 h-6 ${iconColor}`} />
          </div>
          <div>
            <p className="text-[16px] font-semibold text-[#041627] mb-1.5">
              {title}
            </p>
            <p className="text-[13px] text-[#44474c] leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        {/* Acciones */}
        {actions.length > 0 && (
          <div className="border-t border-[#c4c6cd] pt-5 flex flex-col gap-2">
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={() => handleAction(action)}
                className={`w-full py-2.5 text-[14px] font-medium rounded-md transition-colors cursor-pointer ${
                  VARIANT_STYLES[action.variant ?? 'secondary']
                }`}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}