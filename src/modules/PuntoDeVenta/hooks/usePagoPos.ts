import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import type { IClientePos, IMedioPago, IPagoPosPayload } from '../types/pos.type';
import { mapMedioPagoToTipo, toNumber } from '../utils/pos.utils';
import type { PaymentDraft } from '../utils/pos.utils';

export type { PaymentDraft };

//Hook ─────────────────────────────────────────────────────────────────────

interface UsePagoPosParams {
  mediosPago: IMedioPago[];
  clientes: IClientePos[];
  selectedClienteId: string;
  permitePagoMixto: boolean;
  permiteCuentaCorriente: boolean;
}

export const usePagoPos = ({
  mediosPago,
  clientes,
  selectedClienteId,
  permitePagoMixto,
  permiteCuentaCorriente,
}: UsePagoPosParams) => {
  // selección explícita del usuario — vacío significa "usar el default"
  const [seleccionExplicita, setSelectedPaymentId] = useState('');
  const [paymentDrafts, setPaymentDrafts] = useState<PaymentDraft[]>([
    { id: crypto.randomUUID(), medioPagoId: '', monto: '', referencia: '' },
  ]);

  // 1.- Derivar el medio efectivo (no necesita estado propio)
  const medioEfectivo = useMemo(
    () =>
      mediosPago.find(m => m.tipo === 'efectivo') ??
      mediosPago.find(m => m.nombre.toLowerCase().includes('efectivo')) ??
      mediosPago[0],
    [mediosPago],
  );

  // 2.- El ID activo se resuelve: si hay selección explícita válida la usamos;
  //     si la selección es CC y el cliente no tiene CC activa, caemos al efectivo;
  //     si no hay selección, usamos el efectivo por defecto.
  const selectedPaymentId = useMemo(() => {
    if (!seleccionExplicita) return medioEfectivo?.id ?? '';
    if (seleccionExplicita === 'CUENTA_CORRIENTE') {
      const cliente = clientes.find(c => c.id === selectedClienteId);
      return cliente?.cuentaCorriente?.activa ? 'CUENTA_CORRIENTE' : (medioEfectivo?.id ?? '');
    }
    return seleccionExplicita;
  }, [seleccionExplicita, medioEfectivo, clientes, selectedClienteId]);

  const selectedPayment =
    selectedPaymentId === 'CUENTA_CORRIENTE'
      ? undefined
      : mediosPago.find(m => m.id === selectedPaymentId) ?? mediosPago[0];

  //Helpers de drafts ────────────────────────────────────────────────────

  const agregarDraft = () => {
    setPaymentDrafts(current => [
      ...current,
      { id: crypto.randomUUID(), medioPagoId: selectedPayment?.id ?? mediosPago[0]?.id ?? '', monto: '', referencia: '' },
    ]);
  };

  const actualizarDraft = (id: string, patch: Partial<PaymentDraft>) => {
    setPaymentDrafts(current => current.map(d => (d.id === id ? { ...d, ...patch } : d)));
  };

  const quitarDraft = (id: string) => {
    setPaymentDrafts(current => (current.length === 1 ? current : current.filter(d => d.id !== id)));
  };

  const resetearPagos = () => {
    setPaymentDrafts([{
      id: crypto.randomUUID(),
      medioPagoId: selectedPayment?.id ?? mediosPago[0]?.id ?? '',
      monto: '',
      referencia: '',
    }]);
  };

  const precargarPagoTotal = (total: number) => {
    setPaymentDrafts([{
      id: crypto.randomUUID(),
      medioPagoId: selectedPayment?.id ?? mediosPago[0]?.id ?? '',
      monto: String(total),
      referencia: '',
    }]);
  };

  //Helpers de validación ────────────────────────────────────────────────────

  const validarLimiteCC = (clienteId: string | null | undefined, monto: number): boolean => {
    const cliente = clientes.find(c => c.id === clienteId);
    if (!cliente?.cuentaCorriente?.activa) {
      toast.warning('El cliente no tiene cuenta corriente activa');
      return false;
    }
    const limite = toNumber(cliente.cuentaCorriente.limite_credito);
    const saldo = Math.max(0, toNumber(cliente.cuentaCorriente.saldo));
    if (limite > 0 && saldo + monto > limite) {
      toast.warning(`La cuenta corriente supera el límite disponible (${toNumber(Math.max(0, limite - saldo))})`);
      return false;
    }
    return true;
  };

  //Construir payload de pagos ───────────────────────────────────────────

  const construirPagos = (monto: number, clienteIdPago?: string | null): IPagoPosPayload[] | null => {
    if (permitePagoMixto) {
      const pagos = paymentDrafts
        .map(draft => ({
          draft,
          esCC: draft.medioPagoId === 'CUENTA_CORRIENTE',
          medio: mediosPago.find(m => m.id === (draft.medioPagoId || selectedPayment?.id || mediosPago[0]?.id)),
          importe: toNumber(draft.monto),
        }))
        .filter(p => (p.medio || p.esCC) && p.importe > 0);

      if (!pagos.length) { toast.warning('Agregue al menos un pago'); return null; }

      const clienteId = clienteIdPago || selectedClienteId;
      if (pagos.some(p => p.esCC) && !clienteId) {
        toast.warning('Seleccione un cliente para cobrar por cuenta corriente');
        return null;
      }
      if (pagos.some(p => p.esCC) && !permiteCuentaCorriente) {
        toast.warning('La cuenta corriente no está habilitada para esta sucursal');
        return null;
      }
      const totalCC = pagos.filter(p => p.esCC).reduce((sum, p) => sum + p.importe, 0);
      if (totalCC > 0 && !validarLimiteCC(clienteId, totalCC)) return null;

      if (Math.abs(pagos.reduce((sum, p) => sum + p.importe, 0) - monto) > 0.01) {
        toast.warning('La suma de pagos debe coincidir con el total');
        return null;
      }

      return pagos.map(({ draft, medio, importe, esCC }) => ({
        tipo: esCC ? 'CUENTA_CORRIENTE' : mapMedioPagoToTipo(medio),
        medio_pago_id: esCC ? null : medio!.id,
        monto: importe,
        referencia: draft.referencia.trim() || null,
      }));
    }

    // Pago simple
    if (selectedPaymentId === 'CUENTA_CORRIENTE') {
      const clienteId = clienteIdPago || selectedClienteId;
      if (!clienteId) { toast.warning('Seleccione un cliente para cobrar por cuenta corriente'); return null; }
      if (!permiteCuentaCorriente) { toast.warning('La cuenta corriente no está habilitada'); return null; }
      if (!validarLimiteCC(clienteId, monto)) return null;
      return [{ tipo: 'CUENTA_CORRIENTE', medio_pago_id: null, monto }];
    }

    if (!selectedPayment) { toast.warning('Seleccione un medio de pago'); return null; }
    return [{ tipo: mapMedioPagoToTipo(selectedPayment), medio_pago_id: selectedPayment.id, monto }];
  };

  return {
    selectedPaymentId,
    selectedPayment,
    paymentDrafts,
    setSelectedPaymentId,
    agregarDraft,
    actualizarDraft,
    quitarDraft,
    resetearPagos,
    precargarPagoTotal,
    construirPagos,
    validarLimiteCC,
  };
};
