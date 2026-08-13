import { AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import type { ArcaEstado } from '../types/arca.type';

interface Props {
  estado?: ArcaEstado;
  configurado: boolean;
}

const ESTILOS: Record<ArcaEstado, { clase: string; texto: string }> = {
  activo: {
    clase: 'border-[#cfe2de] bg-[#f3fbf9] text-[#075E54]',
    texto: 'Conectado con ARCA',
  },
  pendiente: {
    clase: 'border-[#f6d58f] bg-[#fff8e6] text-[#8a5a00]',
    texto: 'Pendiente de verificacion',
  },
  error: {
    clase: 'border-[#f3b4ae] bg-[#fef3f2] text-[#b42318]',
    texto: 'Error de conexion',
  },
};

const ICONOS: Record<ArcaEstado, typeof CheckCircle2> = {
  activo: CheckCircle2,
  pendiente: Clock,
  error: AlertTriangle,
};

const ArcaEstadoBadge = ({ estado, configurado }: Props) => {
  if (!configurado) {
    return (
      <span className="inline-flex items-center gap-1 rounded border border-[#c4c6cd] bg-[#f4f5f6] px-3 py-1 text-[12px] font-bold text-[#44474c]">
        Sin configurar
      </span>
    );
  }

  const actual = estado ?? 'pendiente';
  const { clase, texto } = ESTILOS[actual];
  const Icono = ICONOS[actual];

  return (
    <span className={`inline-flex items-center gap-1 rounded border px-3 py-1 text-[12px] font-bold ${clase}`}>
      <Icono size={14} />
      {texto}
    </span>
  );
};

export default ArcaEstadoBadge;
