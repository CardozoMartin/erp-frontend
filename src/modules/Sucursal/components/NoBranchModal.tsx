import { Store } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const NoBranchModal = ({ isOpen, onClose }: Props) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl border border-[#c4c6cd] p-8 w-full max-w-md mx-4 shadow-lg"
        onClick={(e) => e.stopPropagation()}
        style={{ fontFamily: "Inter, sans-serif" }}
      >
        {/* Ícono + mensaje */}
        <div className="flex flex-col items-center text-center gap-3 mb-6">
          <div className="w-13 h-13 rounded-full bg-amber-100 flex items-center justify-center">
            <span className="text-2xl"><Store /></span>
          </div>
          <div>
            <p className="text-[16px] font-semibold text-[#041627] mb-1.5">
              Sin sucursales configuradas
            </p>
            <p className="text-[13px] text-[#44474c] leading-relaxed">
              Para cargar productos necesitás tener al menos una sucursal
              creada. Las sucursales permiten organizar el inventario por
              ubicación.
            </p>
          </div>
        </div>

        {/* Acciones */}
        <div className="border-t border-[#c4c6cd] pt-5 flex flex-col gap-2">
          <button
            onClick={() => navigate("/sucursales")}
            className="w-full py-2.5 bg-[#075E54] hover:bg-[#1e8e4f] text-white text-[14px] font-medium rounded-md transition-colors cursor-pointer"
          >
            Crear sucursal ahora
          </button>
          <button
            onClick={onClose}
            className="w-full py-2.5 text-[#44474c] text-[14px] border border-[#c4c6cd] rounded-md hover:bg-[#efedef] transition-colors cursor-pointer text-red-600"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default NoBranchModal;
