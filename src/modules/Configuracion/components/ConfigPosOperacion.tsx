import { ToggleLeft } from 'lucide-react';
import type { UseFormRegister } from 'react-hook-form';
import type { ConfiguracionPosPayload } from '../../POSAuxiliares/types/pos-aux.type';

interface Props {
  register: UseFormRegister<ConfiguracionPosPayload>;
  watchedModoPos: string;
  stockOptions: { value: string; label: string }[];
}

export const ConfigPosOperacion = ({ register, watchedModoPos: _, stockOptions }: Props) => (
  <div className="grid gap-4 lg:grid-cols-2">
    <section className="rounded border border-[#c4c6cd] bg-[#fbf9fa]">
      <div className="border-b border-[#c4c6cd] px-4 py-3 text-[13px] font-bold uppercase tracking-wide text-[#44474c]">
        Operacion de venta
      </div>
      <div className="grid gap-4 p-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">Modo POS</span>
          <select
            {...register('modo_pos')}
            className="h-10 w-full rounded border border-[#c4c6cd] bg-white px-3 text-[14px] text-[#041627] outline-none focus:border-[#075E54]"
          >
            <option value="SIMPLE">Simple: vende y cobra</option>
            <option value="MULTICAJA">Multicaja independiente</option>
            <option value="CAJA_CENTRALIZADA">Caja centralizada</option>
            <option value="CON_DESPACHO">Con despacho</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">Descuento de stock</span>
          <select
            {...register('descuento_stock')}
            className="h-10 w-full rounded border border-[#c4c6cd] bg-white px-3 text-[14px] text-[#041627] outline-none focus:border-[#075E54]"
          >
            {stockOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">Vigencia cotizacion en horas</span>
          <input
            type="number"
            min={1}
            {...register('cotizacion_vigencia_horas', { valueAsNumber: true })}
            className="h-10 w-full rounded border border-[#c4c6cd] bg-white px-3 text-[14px] text-[#041627] outline-none focus:border-[#075E54]"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">Punto venta ARCA</span>
          <input
            maxLength={4}
            placeholder="0001"
            {...register('punto_venta_arca')}
            className="h-10 w-full rounded border border-[#c4c6cd] bg-white px-3 text-[14px] text-[#041627] outline-none focus:border-[#075E54]"
          />
        </label>
      </div>
    </section>

    <section className="rounded border border-[#c4c6cd] bg-[#fbf9fa]">
      <div className="border-b border-[#c4c6cd] px-4 py-3 text-[13px] font-bold uppercase tracking-wide text-[#44474c]">
        Opciones comerciales
      </div>
      <div className="space-y-3 p-4">
        {[
          ['permitir_pago_mixto', 'Permitir pago mixto'],
          ['permitir_listas_precio', 'Usar listas de precio'],
          ['permitir_cotizaciones', 'Permitir cotizaciones'],
          ['permitir_cuenta_corriente', 'Permitir cuenta corriente'],
        ].map(([name, label]) => (
          <label key={name} className="flex items-center justify-between gap-3 rounded border border-[#c4c6cd] bg-white px-3 py-3">
            <span className="flex items-center gap-2 text-[14px] font-semibold text-[#041627]">
              <ToggleLeft size={16} className="text-[#075E54]" />
              {label}
            </span>
            <input
              type="checkbox"
              {...register(name as keyof ConfiguracionPosPayload)}
              className="h-4 w-4 accent-[#075E54]"
            />
          </label>
        ))}
      </div>
    </section>

    <section className="rounded border border-[#c4c6cd] bg-[#fbf9fa] lg:col-span-2">
      <div className="border-b border-[#c4c6cd] px-4 py-3 text-[13px] font-bold uppercase tracking-wide text-[#44474c]">
        Numeracion y prefijos
      </div>
      <div className="grid gap-4 p-4 md:grid-cols-4">
        {[
          ['prefijo_ticket', 'Ticket'],
          ['prefijo_cotizacion', 'Cotizacion'],
          ['prefijo_remito', 'Remito'],
          ['prefijo_nota_credito', 'Nota credito'],
        ].map(([name, label]) => (
          <label key={name} className="block">
            <span className="mb-1 block text-[12px] font-semibold text-[#44474c]">{label}</span>
            <input
              maxLength={20}
              {...register(name as keyof ConfiguracionPosPayload)}
              className="h-10 w-full rounded border border-[#c4c6cd] bg-white px-3 text-[14px] font-semibold uppercase text-[#041627] outline-none focus:border-[#075E54]"
            />
          </label>
        ))}
      </div>
    </section>
  </div>
);
