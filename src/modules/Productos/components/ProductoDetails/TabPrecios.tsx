import { Tag, Calendar, Award, BadgePercent, TrendingDown } from 'lucide-react';
import { formatPrice } from '../../Pages/Productdetailview';
import { OfertasSection } from '../ProductFormSections/OfertasSection';
import { useFormContext } from 'react-hook-form';

const TabPrecios = ({ product, isEditing }: any) => {
  const formContext = useFormContext();
  const watchedTieneVariantes = formContext ? formContext.watch('tiene_variantes') : product?.tiene_variantes;

  if (watchedTieneVariantes) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-3 bg-slate-50 border border-slate-200/50 rounded-lg p-8 max-w-lg mx-auto my-4 shadow-sm">
        <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 border border-amber-200 shadow-inner">
          <BadgePercent size={26} className="stroke-[1.5]" />
        </div>
        <h4 className="text-base font-bold text-[#041627]">Precios y Ofertas por Variantes</h4>
        <p className="text-xs text-gray-500 max-w-sm leading-relaxed">
          Este producto tiene la configuración de variantes activa. Los precios y campañas de descuento específicos se gestionan en la pestaña de <strong>Variantes</strong>.
        </p>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="p-4 bg-white rounded border border-slate-100">
        <div className="flex items-center gap-2 mb-4 bg-slate-50 p-3 rounded text-xs text-gray-500 border border-slate-150">
          <Tag size={14} className="text-[#075E54] shrink-0" />
          <span>Configura campañas de ofertas y descuentos temporales para este producto. Las ofertas se activarán de forma automática durante las fechas definidas.</span>
        </div>
        <OfertasSection namePrefix="ofertas" />
      </div>
    );
  }

  const ofertas = product?.ofertas ?? [];

  return (
    <div className="flex flex-col gap-6 pt-3">
      
      {/* Grid: Base Price & Campaigns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Side: Base Price Box */}
        <div className="md:col-span-1 bg-gradient-to-br from-[#075E54]/5 to-transparent border border-[#075E54]/20 rounded-xl p-6 flex flex-col justify-between shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#075E54]/5 rounded-full translate-x-8 -translate-y-8" />
          <div>
            <span className="text-[10px] font-bold text-[#075E54] uppercase tracking-widest bg-[#075E54]/10 px-2 py-0.5 rounded">
              Tarifa Regular
            </span>
            <p className="text-sm font-extrabold text-[#041627] mt-4 uppercase tracking-wider">Precio de Venta Base</p>
            <p className="text-xs text-gray-400 mt-0.5">Precio estándar sin impuestos aplicados.</p>
          </div>
          <div className="mt-8">
            <p className="text-4xl font-black text-[#075E54] tracking-tight leading-none">
              {formatPrice(product?.precio_base)}
            </p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">
              por {product?.unidad_venta?.toLowerCase() ?? 'unidad'}
            </p>
          </div>
        </div>

        {/* Right Side: Discounts & Offers Timeline */}
        <div className="md:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <p className="text-sm font-extrabold text-[#041627] uppercase tracking-wider mb-4 flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <Award size={15} className="text-[#075E54]" />
            Campañas y Ofertas Especiales
          </p>

          <div className="flex flex-col gap-4">
            {ofertas.map((o: any, idx: number) => {
              // Calcular porcentaje si aplica
              const precioOferta = Number(o.precio_oferta ?? o.precio ?? 0);
              const precioBase = Number(product.precio_base ?? 0);
              const tienePorcentaje = o.porcentaje_descuento > 0 || (precioBase > 0 && precioOferta < precioBase);
              const pct = o.porcentaje_descuento || (precioBase > 0 ? Math.round((1 - (precioOferta / precioBase)) * 100) : 0);

              return (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-[#DCF8C6]/10 hover:bg-[#DCF8C6]/20 transition-all rounded-lg border border-[#DCF8C6] shadow-sm relative overflow-hidden group"
                >
                  {/* Decorative side ticket border */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#075E54] group-hover:w-1.5 transition-all" />
                  
                  <div className="flex items-start gap-3 pl-2">
                    <div className="p-2 bg-white rounded-md border border-[#DCF8C6] text-[#075E54] shrink-0 mt-0.5">
                      <TrendingDown size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#041627] flex items-center gap-2">
                        {o.nombre ?? `Oferta Especial ${idx + 1}`}
                        {tienePorcentaje && pct > 0 && (
                          <span className="text-[9px] font-black text-[#075E54] bg-[#DCF8C6] px-1.5 py-0.5 rounded tracking-wide uppercase">
                            -{pct}% OFF
                          </span>
                        )}
                      </p>
                      <p className="text-[11px] text-gray-500 font-semibold mt-1 flex items-center gap-1">
                        <Calendar size={11} className="text-gray-400" />
                        Vigencia: {o.fecha_inicio} → {o.fecha_fin}
                      </p>
                    </div>
                  </div>

                  <div className="text-right mt-3 sm:mt-0 pl-11 sm:pl-0 shrink-0">
                    <span className="text-xs font-semibold text-gray-400 line-through">
                      {formatPrice(product.precio_base)}
                    </span>
                    <p className="text-lg font-black text-[#075E54] tracking-tight leading-none mt-0.5">
                      {formatPrice(precioOferta)}
                    </p>
                  </div>
                </div>
              );
            })}

            {ofertas.length === 0 && (
              <div className="text-center py-12 text-gray-400 flex flex-col items-center justify-center gap-2">
                <BadgePercent size={32} className="opacity-25 text-gray-400 stroke-[1.5]" />
                <p className="text-sm font-medium">No se registran ofertas activas para este producto.</p>
                <p className="text-xs text-gray-400">Las ofertas permiten fijar tarifas de descuento automáticas por fecha.</p>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}

export default TabPrecios;
