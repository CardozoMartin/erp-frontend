import { AlertTriangle } from 'lucide-react';
import { LotesSection } from '../ProductFormSections/LotesSection';
import { useFormContext } from 'react-hook-form';

const TabLotes = ({ product, isEditing }: any) => {
  const formContext = useFormContext();
  const watch = formContext?.watch;

  const watchedTieneVariantes = watch ? watch('tiene_variantes') : product?.tiene_variantes;
  const watchedTieneVencimiento = watch ? watch('tiene_vencimiento') : product?.tiene_vencimiento;

  if (watchedTieneVariantes) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-white border border-gray-200 rounded-lg p-6 text-center gap-3">
        <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 border border-amber-200">
          <AlertTriangle size={24} />
        </div>
        <h4 className="text-base font-semibold text-[#041627]">Lotes gestionados por variante</h4>
        <p className="text-sm text-gray-500 max-w-md">
          Este producto tiene variantes habilitadas. Los lotes de cada variante deben gestionarse individualmente desde la pestaña de <strong>Variantes</strong>.
        </p>
      </div>
    );
  }

  if (!watchedTieneVencimiento) {
    return (
      <div className="text-center py-20 text-gray-400 text-sm bg-white border border-gray-200 rounded-lg p-5">
        Este producto no controla vencimientos. Habilítalo en la pestaña <strong>Resumen</strong> para gestionar lotes.
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="bg-white p-6 rounded-md border border-gray-200">
        <LotesSection namePrefix="lotes" />
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      {(product?.lotes ?? []).map((l: any, idx: number) => {
        const dias = Math.ceil((new Date(l.fecha_vencimiento).getTime() - new Date().getTime()) / 86400000);
        const vencido = dias < 0;
        const proximo = dias >= 0 && dias <= 30;
        return (
          <div
            key={idx}
            className={`bg-white border rounded-lg px-5 py-4 flex justify-between items-center
              ${vencido ? 'border-red-300' : proximo ? 'border-amber-300' : 'border-gray-200'}`}
          >
            <div>
              <p className="text-sm font-medium text-[#041627]">Lote {l.numero ?? idx + 1}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Vence: {l.fecha_vencimiento} · {vencido ? '¡Vencido!' : `${dias} días restantes`}
              </p>
            </div>
            <span
              className={`text-[11px] font-medium px-3 py-1 rounded-full
                ${vencido ? 'bg-red-100 text-red-700' : proximo ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}
            >
              {vencido ? 'Vencido' : proximo ? 'Próximo a vencer' : 'Vigente'}
            </span>
          </div>
        );
      })}
      {(product?.lotes ?? []).length === 0 && (
        <p className="text-sm text-gray-400 text-center py-12">No hay lotes cargados.</p>
      )}
    </div>
  );
};

export default TabLotes;
