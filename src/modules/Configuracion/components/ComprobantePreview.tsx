const sampleItems = [
  { name: 'Fanta naranja 2L', qty: 2, price: '$2.100', total: '$4.200' },
  { name: 'Pan lactal', qty: 1, price: '$1.650', total: '$1.650' },
  { name: 'Yerba suave 1kg', qty: 1, price: '$3.300', total: '$3.300' },
];

interface Props {
  formato: string;
  diseno: string;
  storeName: string;
  domicilio: string;
  cuit: string;
  mensaje: string;
}

export const ComprobantePreview = ({ formato, diseno, storeName, domicilio, cuit, mensaje }: Props) => {
  const isThermal = formato === 'TICKET_80MM' || formato === 'TICKET_58MM';

  const wrapperClass = [
    'mx-auto overflow-hidden bg-white text-[#111827] shadow-sm',
    isThermal
      ? formato === 'TICKET_58MM'
        ? 'w-[230px] font-mono text-[10px]'
        : 'w-[310px] font-mono text-[11px]'
      : 'w-full max-w-[720px] text-[12px]',
    diseno === 'WAVE'
      ? 'rounded-t-2xl'
      : diseno === 'CLASICO'
        ? 'border border-[#111827]'
        : 'border border-dashed border-[#9ca3af]',
  ].join(' ');

  const headerClass = [
    'relative px-4 py-4',
    diseno === 'WAVE'
      ? 'bg-[#075E54] text-white'
      : diseno === 'CLASICO'
        ? 'border-b-2 border-[#111827]'
        : 'border-b border-dashed border-[#111827] text-center',
  ].join(' ');

  return (
    <div className="border-t border-[#c4c6cd] bg-white px-4 py-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <div className="text-[13px] font-bold uppercase tracking-wide text-[#44474c]">Vista previa</div>
          <div className="text-[12px] text-[#44474c]">Simula el comprobante que se imprimira desde el POS.</div>
        </div>
        <span className="rounded border border-[#cfe2de] bg-[#f3fbf9] px-2.5 py-1 text-[11px] font-bold text-[#075E54]">
          {formato === 'BOLETA_A4' ? 'A4' : formato === 'TICKET_58MM' ? '58 mm' : '80 mm'}
        </span>
      </div>

      <div className="overflow-auto rounded border border-[#e5e7eb] bg-[#f3f4f6] p-4">
        <div className={wrapperClass}>
          <div className={headerClass}>
            {diseno === 'WAVE' ? (
              <div className="absolute bottom-[-18px] left-0 h-9 w-full rounded-[0_0_50%_50%] bg-[#075E54]" />
            ) : null}
            <div className="relative">
              <div className={`${isThermal ? 'text-center text-[16px]' : 'text-[22px]'} font-black uppercase`}>
                {storeName}
              </div>
              <div className={`${isThermal ? 'text-center text-[10px]' : 'mt-1 text-[12px]'} opacity-80`}>
                {domicilio || 'Domicilio comercial'}
              </div>
              <div className={`${isThermal ? 'text-center text-[10px]' : 'text-[12px]'} opacity-80`}>
                CUIT {cuit || '20-00000000-0'}
              </div>
            </div>
          </div>

          <div className={`${diseno === 'WAVE' ? 'pt-8' : 'pt-4'} px-4 pb-4`}>
            <div className={`${isThermal ? 'text-center' : 'flex items-center justify-between'} font-bold uppercase`}>
              <span>Ticket</span>
              <span>Nro. TKT-000123</span>
            </div>
            <div className={`mt-3 grid gap-1 ${isThermal ? '' : 'grid-cols-3'}`}>
              <div>Fecha: 01/06/2026 14:32</div>
              <div>Cliente: Consumidor final</div>
              <div>Caja: Mostrador</div>
            </div>

            <div className="mt-4 border-t border-[#d1d5db] pt-3">
              {sampleItems.map((item) => (
                <div
                  key={item.name}
                  className={`grid gap-2 border-b border-[#e5e7eb] py-2 ${
                    isThermal ? 'grid-cols-[1fr_auto]' : 'grid-cols-[1fr_60px_90px_90px]'
                  }`}
                >
                  <div className="font-semibold">{item.name}</div>
                  {isThermal ? (
                    <div className="text-right">
                      <div>x{item.qty}</div>
                      <strong>{item.total}</strong>
                    </div>
                  ) : (
                    <>
                      <div className="text-right">x{item.qty}</div>
                      <div className="text-right">{item.price}</div>
                      <div className="text-right font-bold">{item.total}</div>
                    </>
                  )}
                </div>
              ))}
            </div>

            <div className="ml-auto mt-4 max-w-[260px] space-y-1">
              <div className="flex justify-between"><span>Subtotal</span><strong>$9.150</strong></div>
              <div className="flex justify-between"><span>Descuento</span><strong>$0</strong></div>
              <div className="flex justify-between border-t border-[#111827] pt-2 text-[16px] font-black">
                <span>Total</span><span>$9.150</span>
              </div>
            </div>

            {mensaje ? (
              <div className={`mt-4 whitespace-pre-wrap border-t border-dashed border-[#9ca3af] pt-3 ${isThermal ? 'text-center' : ''}`}>
                {mensaje}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
