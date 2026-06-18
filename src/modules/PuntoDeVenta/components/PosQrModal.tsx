import { useEffect, useState } from 'react';
import { formatCurrency } from '../utils/pos.utils';
import type { QrOrderState } from '../utils/pos.utils';

// ── Barra rayada estilo MP ────────────────────────────────────────────────────
const BarraEspera = () => (
  <div className="h-7 w-full overflow-hidden border border-[#009EE3]/30 bg-[#e8f7fd]">
    <div
      className="h-full w-full"
      style={{
        background: `repeating-linear-gradient(
          -55deg,
          #009EE3 0px,
          #009EE3 16px,
          #FFD700 16px,
          #FFD700 32px
        )`,
        backgroundSize: '64px 100%',
        animation: 'barraSlide 1s linear infinite',
      }}
    />
    <style>{`
      @keyframes barraSlide {
        from { background-position: 0 0; }
        to   { background-position: 64px 0; }
      }
    `}</style>
  </div>
);

// ── Check animado ─────────────────────────────────────────────────────────────
const CheckAnimado = () => {
  const [listo, setListo] = useState(false);
  useEffect(() => { const t = setTimeout(() => setListo(true), 60); return () => clearTimeout(t); }, []);
  return (
    <div className="relative flex items-center justify-center">
      <div
        className="absolute rounded-full bg-[#009EE3]/15 transition-all duration-700 ease-out"
        style={{ width: listo ? 200 : 96, height: listo ? 200 : 96, opacity: listo ? 0 : 1 }}
      />
      <div
        className="relative z-10 flex h-24 w-24 items-center justify-center rounded-full bg-[#009EE3] transition-shadow duration-500"
        style={{ boxShadow: listo ? '0 0 0 10px rgba(0,158,227,.12)' : 'none' }}
      >
        <svg viewBox="0 0 52 52" className="h-12 w-12" fill="none">
          <path
            d="M13 26 L22 35 L39 17"
            stroke="white"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="40"
            strokeDashoffset={listo ? 0 : 40}
            style={{ transition: 'stroke-dashoffset .45s ease .1s' }}
          />
        </svg>
      </div>
    </div>
  );
};

// ── Modal ─────────────────────────────────────────────────────────────────────
interface Props {
  qrOrder: QrOrderState;
  isCancelando: boolean;
  onCancelar: () => void;
}

export default function PosQrModal({ qrOrder, isCancelando, onCancelar }: Props) {
  const confirmed = qrOrder.status === 'confirmed';

  return (
    <div className="fixed inset-0 z-80 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
      <div
        className="w-full max-w-sm overflow-hidden bg-white shadow-2xl"
        style={{ animation: 'modalIn .2s cubic-bezier(.34,1.56,.64,1)' }}
      >
        <style>{`@keyframes modalIn{from{opacity:0;transform:scale(.92)}to{opacity:1;transform:scale(1)}}`}</style>

        {/* Header azul MP */}
        <div className="flex items-center justify-between bg-[#009EE3] px-5 py-4">
          <span className="text-[16px] font-bold tracking-wide text-white">mercado pago</span>
          {!confirmed && (
            <button
              type="button"
              onClick={onCancelar}
              disabled={isCancelando}
              className="rounded-full bg-white/20 px-3 py-1 text-[12px] font-semibold text-white hover:bg-white/30 disabled:opacity-60"
            >
              {isCancelando ? 'Cancelando…' : 'Cancelar'}
            </button>
          )}
        </div>

        {/* Cuerpo */}
        <div className="flex flex-col items-center px-7 pb-8 pt-7">
          {confirmed ? (
            <>
              <CheckAnimado />
              <p className="mt-6 text-[20px] font-bold text-[#009EE3]">¡Pago aprobado!</p>
              <p className="mt-1 text-[34px] font-extrabold tracking-tight text-[#041627]">
                {formatCurrency(qrOrder.total)}
              </p>
              <p className="mt-1 text-[13px] text-[#44474c]">
                Comprobante <span className="font-semibold text-[#041627]">{qrOrder.numero}</span>
              </p>
              <div className="mt-6 w-full">
                <div className="h-7 w-full overflow-hidden rounded-full bg-[#009EE3]">
                  <div className="h-full w-full rounded-full bg-[#009EE3]" />
                </div>
              </div>
              <p className="mt-3 text-[12px] text-[#44474c]">Actualizando caja y stock…</p>
            </>
          ) : (
            <>
              <p className="text-[20px] font-bold text-[#041627]">Esperando pago</p>
              <p className="mt-1 text-[34px] font-extrabold tracking-tight text-[#041627]">
                {formatCurrency(qrOrder.total)}
              </p>
              <p className="mt-1 text-[13px] text-[#44474c]">
                Venta <span className="font-semibold text-[#041627]">{qrOrder.numero}</span>
              </p>
              <div className="mt-6 w-full">
                <BarraEspera />
              </div>
              <p className="mt-3 text-center text-[12px] text-[#44474c]">
                El cliente escanea el QR de la caja. No cerrés esta pantalla.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
