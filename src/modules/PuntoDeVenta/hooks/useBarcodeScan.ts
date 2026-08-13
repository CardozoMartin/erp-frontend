import { useEffect, useRef } from 'react';

interface Opciones {
  onScan: (codigo: string) => void;
  // Los lectores típicamente envían todos los chars en < 80ms
  // Ponemos 100ms como margen seguro
  umbralMs?: number;
  habilitado?: boolean;
}

export const useBarcodeScan = ({ onScan, umbralMs = 100, habilitado = true }: Opciones) => {
  const bufferRef = useRef('');
  const tiempoUltimoRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!habilitado) return;

    const manejarKeydown = (e: KeyboardEvent) => {
      // Ignorar si el foco está en un input/textarea/select (el usuario está escribiendo)
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      const ahora = Date.now();
      const delta = ahora - tiempoUltimoRef.current;
      tiempoUltimoRef.current = ahora;

      // Si pasó demasiado tiempo desde el último char, es tipeo humano → resetear buffer
      if (delta > umbralMs && bufferRef.current.length > 0) {
        bufferRef.current = '';
      }

      if (e.key === 'Enter') {
        const codigo = bufferRef.current.trim();
        bufferRef.current = '';
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (codigo.length >= 3) onScan(codigo);
        return;
      }

      // Acumular solo caracteres imprimibles
      if (e.key.length === 1) {
        bufferRef.current += e.key;

        // Timeout de seguridad: si no llega Enter en 300ms, limpiamos el buffer
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          bufferRef.current = '';
        }, 300);
      }
    };

    window.addEventListener('keydown', manejarKeydown);
    return () => {
      window.removeEventListener('keydown', manejarKeydown);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [onScan, umbralMs, habilitado]);
};
