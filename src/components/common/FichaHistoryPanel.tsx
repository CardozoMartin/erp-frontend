import { Clock } from 'lucide-react';
import type { ReactNode } from 'react';

export type FichaHistoryEvent = {
  id: string;
  accion: string;
  descripcion?: string | null;
  created_at: string;
};

type Props<T extends FichaHistoryEvent> = {
  title?: string;
  subtitle?: string;
  events: T[];
  isLoading?: boolean;
  labels?: Record<string, string>;
  emptyTitle?: string;
  emptyDescription?: string;
  getActorName: (event: T) => string;
  getChanges: (event: T) => string[];
  maxChanges?: number;
  className?: string;
  headerExtra?: ReactNode;
  variant?: 'aside' | 'section';
};

const formatDateTime = (value: string) => {
  if (!value) return '-';
  return new Date(value).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'S';

const FichaHistoryPanel = <T extends FichaHistoryEvent>({
  title = 'Historial',
  subtitle = 'Cambios y movimientos de la ficha',
  events,
  isLoading = false,
  labels = {},
  emptyTitle = 'Sin movimientos cargados',
  emptyDescription = 'Aca se vera quien hizo cambios y que paso.',
  getActorName,
  getChanges,
  maxChanges = 5,
  className = '',
  headerExtra,
  variant = 'aside',
}: Props<T>) => {
  const Wrapper = variant === 'aside' ? 'aside' : 'section';
  const wrapperClass =
    variant === 'aside'
      ? `hidden min-h-[550px] flex-col overflow-hidden rounded-md border border-[#e2e8f0] bg-[#f8fafc] shadow-[0_4px_20px_rgba(0,0,0,0.03)] xl:flex ${className}`
      : `flex min-h-0 flex-col overflow-hidden rounded-md border border-[#e2e8f0] bg-[#f8fafc] ${className}`;

  return (
    <Wrapper className={wrapperClass}>
      <div className="border-b border-slate-200 bg-white px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#041627]">
              {title}
            </h2>
            <p className="mt-1 text-xs text-gray-400">{subtitle}</p>
          </div>
          {headerExtra}
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center text-sm font-semibold text-gray-400">
          <Clock size={20} className="mb-2 text-[#075E54]" />
          Cargando historial...
        </div>
      ) : events.length ? (
        <div className="flex-1 overflow-y-auto px-5 py-5">
          <div className="flex flex-col gap-4">
            {events.map((event) => {
              const actorName = getActorName(event);
              const changes = getChanges(event);
              const visibleChanges = changes.slice(0, maxChanges);

              return (
                <div key={event.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#075E54] text-[11px] font-bold text-white shadow-sm">
                      {initials(actorName)}
                    </div>
                    <div className="mt-2 h-full w-px bg-slate-200" />
                  </div>

                  <div className="flex-1 rounded-md border border-slate-200 bg-white p-3 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[13px] font-extrabold text-[#041627]">{actorName}</p>
                        <p className="mt-0.5 text-[11px] font-semibold uppercase text-[#075E54]">
                          {labels[event.accion] ?? event.accion}
                        </p>
                      </div>
                      <span className="shrink-0 text-[11px] font-semibold text-gray-400">
                        {formatDateTime(event.created_at)}
                      </span>
                    </div>

                    {event.descripcion ? (
                      <p className="mt-2 text-[12px] leading-relaxed text-gray-600">
                        {event.descripcion}
                      </p>
                    ) : null}

                    {visibleChanges.length ? (
                      <div className="mt-3 flex flex-col gap-1.5">
                        {visibleChanges.map((change) => (
                          <div
                            key={change}
                            className="rounded border border-slate-100 bg-slate-50 px-2 py-1.5 text-[11px] font-medium text-gray-600"
                          >
                            {change}
                          </div>
                        ))}
                        {changes.length > maxChanges ? (
                          <span className="text-[11px] font-semibold text-gray-400">
                            +{changes.length - maxChanges} cambios mas
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm">
            <Clock size={20} className="text-[#075E54]" />
          </div>
          <p className="mt-4 text-sm font-bold text-[#041627]">{emptyTitle}</p>
          <p className="mt-1 text-xs leading-relaxed text-gray-400">{emptyDescription}</p>
        </div>
      )}
    </Wrapper>
  );
};

export default FichaHistoryPanel;
