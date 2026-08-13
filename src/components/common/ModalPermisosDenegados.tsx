import { ShieldAlert } from 'lucide-react';
import { useEffect, useState } from 'react';

export function ModalPermisosDenegados() {
  const [mensaje, setMensaje] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ mensaje: string }>).detail;
      setMensaje(detail.mensaje);
    };
    window.addEventListener('permiso-denegado', handler);
    return () => window.removeEventListener('permiso-denegado', handler);
  }, []);

  if (!mensaje) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={() => setMensaje(null)}
    >
      <div
        className="bg-white rounded-xl border border-[#c4c6cd] p-8 w-full max-w-md mx-4 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center gap-3 mb-6">
          <div className="w-13 h-13 rounded-full bg-red-100 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <p className="text-[16px] font-semibold text-[#041627] mb-1.5">Acción no permitida</p>
            <p className="text-[13px] text-[#44474c] leading-relaxed">{mensaje}</p>
          </div>
        </div>
        <div className="border-t border-[#c4c6cd] pt-5">
          <button
            onClick={() => setMensaje(null)}
            className="w-full py-2.5 text-[14px] font-medium rounded-md bg-[#075E54] hover:bg-[#064d45] text-white transition-colors cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
