export const hasAnyPermission = (permisos: string[], ...required: string[]) =>
  required.some((permiso) => permisos.includes(permiso));

export const hasAllPermissions = (permisos: string[], ...required: string[]) =>
  required.every((permiso) => permisos.includes(permiso));

export const POS_PERMISSIONS = {
  ventasVer: 'ventas.ver',
  ventasCrear: 'ventas.crear',
  ventasCancelar: 'ventas.cancelar',
  ventasCancelarPagada: 'ventas.cancelar.pagada',
  cotizacion: 'ventas.cotizacion',
  cotizacionConvertir: 'ventas.cotizacion.convertir',
  cajaVer: 'caja.ver',
  cajaAbrir: 'caja.abrir',
  cajaCerrar: 'caja.cerrar',
  cajaCobrar: 'caja.cobrar',
  cajaMovimientos: 'caja.movimientos',
  cajaMovimientosCrear: 'caja.movimientos.crear',
  reportesVer: 'reportes.ver',
  reportesVentas: 'reportes.ventas',
  reportesCaja: 'reportes.caja',
  configPos: 'config.pos',
  preciosVer: 'precios.ver',
  configListasPrecio: 'config.listas_precio',
  depositoVer: 'deposito.ver',
  depositoDespachar: 'deposito.despachar',
  depositoRecepcionar: 'deposito.recepcionar',
  stockAjuste: 'stock.ajuste',
} as const;
