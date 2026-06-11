import { createPortal } from 'react-dom';
import { useEffect } from 'react';
import type { ReactNode } from 'react';

export type TableContextMenuAction = {
  label: string;
  icon?: ReactNode;
  onClick?: () => void;
  danger?: boolean;
  disabled?: boolean;
  dividerBefore?: boolean;
  badge?: string;
};

type Props = {
  x: number;
  y: number;
  actions: TableContextMenuAction[];
  onClose: () => void;
};

const TableContextMenu = ({ x, y, actions, onClose }: Props) => {
  useEffect(() => {
    const close = () => onClose();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('click', close);
    window.addEventListener('scroll', close, true);
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      window.removeEventListener('click', close);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [onClose]);

  return createPortal(
    <div
      className="fixed z-50 min-w-[220px] rounded-lg border border-[#c4c6cd] bg-white py-1 shadow-lg"
      style={{ top: y, left: x }}
      onClick={(event) => event.stopPropagation()}
      onContextMenu={(event) => event.preventDefault()}
    >
      {actions.map((action, index) => (
        <div key={`${action.label}-${index}`}>
          {action.dividerBefore ? <div className="my-1 border-t border-[#efedef]" /> : null}
          <button
            type="button"
            disabled={action.disabled}
            onClick={() => {
              if (action.disabled) return;
              onClose();
              action.onClick?.();
            }}
            className={`flex w-full items-center justify-between gap-2 px-4 py-2 text-left text-[13px] disabled:cursor-not-allowed disabled:opacity-50 ${
              action.danger
                ? 'text-[#ba1a1a] hover:bg-[#fce8e8]'
                : 'text-[#44474c] hover:bg-[#f5f3f4]'
            }`}
          >
            <span className="flex items-center gap-2">
              {action.icon}
              {action.label}
            </span>
            {action.badge ? (
              <span className="rounded-full bg-amber-100 px-2 text-[11px] text-amber-700">
                {action.badge}
              </span>
            ) : null}
          </button>
        </div>
      ))}
    </div>,
    document.body,
  );
};

export default TableContextMenu;
