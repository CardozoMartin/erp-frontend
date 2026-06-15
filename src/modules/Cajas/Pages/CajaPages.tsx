import { useMemo } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useAuthStore } from '../../../store/auth.store';
import AccessDenied from '../../../components/common/AccessDenied';
import { useCajaAbierta, useResumenCaja } from '../hooks/useCaja';
import type { CajaMovimientoEvent } from '../types/caja.type';
import { hasAnyPermission, POS_PERMISSIONS } from '../utils/cajaPermissions';
import { CajaListado } from '../components/CajaListado';
import { CajaDetalle } from '../components/CajaDetalle';
import { CajaCierre } from '../components/CajaCierre';
import { CajaOperativa } from '../components/CajaOperativa';

const CajaPages = () => {
  const location = useLocation();
  const { cajaId } = useParams();
  const permisos = useAuthStore((s) => s.permisos);

  const puedeVerCaja = hasAnyPermission(permisos, POS_PERMISSIONS.cajaVer, POS_PERMISSIONS.reportesVer, POS_PERMISSIONS.reportesCaja, POS_PERMISSIONS.configPos);
  const puedeAbrirCaja = permisos.includes(POS_PERMISSIONS.cajaAbrir);

  // 1.- Determinar vista activa por pathname
  const isListadoCajas = !cajaId && location.pathname === '/caja';
  const isOperativa = location.pathname.includes('/caja/movimientos') || location.pathname === '/caja/ingreso';
  const isDetalleCaja = !!cajaId && !location.pathname.endsWith('/cierre');
  const isCierreCaja = !!cajaId && location.pathname.endsWith('/cierre');

  // 2.- Datos compartidos entre Detalle y Cierre
  const cajaAbiertaQuery = useCajaAbierta(puedeVerCaja || puedeAbrirCaja);
  const cajaAbierta = cajaAbiertaQuery.data ?? null;
  const resumenId = cajaId ?? cajaAbierta?.id;
  const resumenQuery = useResumenCaja(resumenId, puedeVerCaja && !!resumenId);
  const cajaEnDetalle = resumenQuery.data?.caja ?? cajaAbierta;

  const movimientosCaja = useMemo<CajaMovimientoEvent[]>(
    () =>
      (cajaEnDetalle?.movimientos ?? []).map((m) => ({
        id: m.id,
        accion: m.tipo,
        descripcion: m.descripcion,
        created_at: m.fecha,
        monto: m.monto,
        categoria_egreso: m.categoria_egreso,
        entidad_nombre: m.entidad_nombre,
      })),
    [cajaEnDetalle?.movimientos],
  );

  if (!puedeVerCaja) {
    return (
      <AccessDenied
        title="Sin permisos para caja"
        message="Necesitas caja.ver o un permiso de reportes/configuracion para ver el historial y resumen de caja."
      />
    );
  }

  // 3.- Delegar a cada vista
  if (isListadoCajas) return <CajaListado />;
  if (isOperativa) return (
    <div className="min-h-[calc(100vh-52px)] bg-[#f3f4f6] px-4 py-4">
      <CajaOperativa movimientosCaja={movimientosCaja} puedeVerCaja={puedeVerCaja} />
    </div>
  );
  if (isDetalleCaja) return <CajaDetalle cajaId={cajaId!} cajaAbierta={cajaAbierta} movimientosCaja={movimientosCaja} puedeVerCaja={puedeVerCaja} />;
  if (isCierreCaja) return <CajaCierre cajaId={cajaId!} movimientosCaja={movimientosCaja} puedeVerCaja={puedeVerCaja} />;

  return null;
};

export default CajaPages;
