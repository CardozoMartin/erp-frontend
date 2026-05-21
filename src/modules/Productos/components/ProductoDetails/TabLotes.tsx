import { Clock, Calendar, ShieldCheck, XCircle, Hourglass, Info } from 'lucide-react';
import { LotesSection } from '../ProductFormSections/LotesSection';
import { useFormContext } from 'react-hook-form';

const TabLotes = ({ product, isEditing }: any) => {
  const formContext = useFormContext();
  const watch = formContext?.watch;

  const watchedTieneVariantes = watch ? watch('tiene_variantes') : product?.tiene_variantes;
  const watchedTieneVencimiento = watch ? watch('tiene_vencimiento') : product?.tiene_vencimiento;

  if (watchedTieneVariantes) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-3 bg-slate-50 border border-slate-200/50 rounded-lg p-8 max-w-lg mx-auto my-4 shadow-sm">
        <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 border border-amber-200 shadow-inner">
          <Clock size={26} className="stroke-[1.5]" />
        </div>
        <h4 className="text-base font-bold text-[#041627]">Lotes por Variante</h4>
        <p className="text-xs text-gray-500 max-w-sm leading-relaxed">
          Este producto tiene la configuración de variantes activa. El seguimiento de lotes y fechas de vencimiento de cada variante debe gestionarse individualmente desde la pestaña de <strong>Variantes</strong>.
        </p>
      </div>
    );
  }

  if (!watchedTieneVencimiento) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-3 bg-slate-50 border border-slate-200/50 rounded-lg p-8 max-w-lg mx-auto my-4 shadow-sm">
        <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center text-gray-400 border border-gray-200 shadow-inner">
          <Calendar size={26} className="stroke-[1.5]" />
        </div>
        <h4 className="text-base font-bold text-[#041627]">Seguimiento de Lotes Inactivo</h4>
        <p className="text-xs text-gray-500 max-w-sm leading-relaxed">
          Este producto no controla vencimientos por lotes. Habilita la opción de control de vencimientos en la pestaña <strong>Información General</strong> para activar la trazabilidad.
        </p>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="p-4 bg-white rounded border border-slate-100">
        <div className="flex items-center gap-2 mb-4 bg-slate-50 p-3 rounded text-xs text-gray-500 border border-slate-150">
          <Info size={14} className="text-[#075E54] shrink-0" />
          <span>Configura la numeración de los lotes de stock, cantidades de carga y sus correspondientes fechas de vencimiento para el control de inventario.</span>
        </div>
        <LotesSection namePrefix="lotes" />
      </div>
    );
  }

  const lotes = product?.lotes ?? [];

  return (
    <div className="flex flex-col gap-5 pt-3">
      
      {/* Header Info */}
      <div className="border-b border-slate-100 pb-3">
        <p className="text-sm font-extrabold text-[#041627] uppercase tracking-wider flex items-center gap-1.5">
          <Clock size={15} className="text-[#075E54]" />
          Trazabilidad y Control de Lotes
        </p>
        <p className="text-xs text-gray-400 mt-0.5">Control semafórico automático según proximidad de vencimiento.</p>
      </div>

      {/* Lotes Grid */}
      <div className="flex flex-col gap-3">
        {lotes.map((l: any, idx: number) => {
          const dias = Math.ceil((new Date(l.fecha_vencimiento).getTime() - new Date().getTime()) / 86400000);
          const vencido = dias < 0;
          const proximo = dias >= 0 && dias <= 30;

          return (
            <div
              key={idx}
              className={`bg-white border rounded-lg p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all hover:shadow-md
                ${vencido 
                  ? 'border-rose-300 bg-rose-50/10' 
                  : proximo 
                    ? 'border-amber-300 bg-amber-50/10' 
                    : 'border-slate-200 hover:border-[#075E54]/40'}`}
            >
              {/* Lote details */}
              <div className="flex items-start gap-3">
                <div className={`p-2.5 rounded-md shrink-0 mt-0.5
                  ${vencido 
                    ? 'bg-rose-50 text-rose-600' 
                    : proximo 
                      ? 'bg-amber-50 text-amber-600' 
                      : 'bg-emerald-50 text-emerald-600'}`}>
                  {vencido ? <XCircle size={18} /> : proximo ? <Hourglass size={18} /> : <ShieldCheck size={18} />}
                </div>
                <div>
                  <p className="text-sm font-bold text-[#041627] flex items-center gap-2">
                    Lote: <span className="font-mono text-gray-600 font-semibold">{l.numero_lote ?? l.numero ?? `LOTE-${idx + 1}`}</span>
                  </p>
                  <p className="text-[11px] text-gray-400 font-semibold mt-1 flex items-center gap-1.5">
                    <Calendar size={11} className="text-gray-400" />
                    Vence el: <span className="font-bold text-gray-600">{l.fecha_vencimiento}</span>
                    ·
                    <span className={`font-bold
                      ${vencido ? 'text-rose-600' : proximo ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {vencido ? '¡Ya vencido!' : `${dias} días restantes`}
                    </span>
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="shrink-0 pl-11 sm:pl-0 w-full sm:w-auto text-left sm:text-right">
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border
                    ${vencido 
                      ? 'bg-rose-50 border-rose-200 text-rose-700' 
                      : proximo 
                        ? 'bg-amber-50 border-amber-200 text-amber-700' 
                        : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${vencido ? 'bg-rose-500' : proximo ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                  {vencido ? 'Vencido' : proximo ? 'Próximo a Vencer' : 'Vigente'}
                </span>
              </div>

            </div>
          );
        })}

        {lotes.length === 0 && (
          <div className="text-center py-16 border border-dashed border-gray-200 rounded-lg bg-slate-50 text-gray-400 flex flex-col items-center justify-center gap-2">
            <Clock size={36} className="opacity-25 text-gray-400 stroke-[1.5]" />
            <p className="text-sm font-medium">No se registran lotes para este producto.</p>
            <p className="text-xs text-gray-400">El inventario se gestiona por lotes para un control estricto de las fechas de vencimiento.</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default TabLotes;
