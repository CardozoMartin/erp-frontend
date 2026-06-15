import { formatDateTime } from '../../utils/empleado.utils';

const ITEMS_MOCK = [
  { tipo: 'login', desc: 'Inició sesión',           detalle: 'Desde IP 192.168.1.45', ts: '2025-05-22T14:32:00', color: '#3B6D11' },
  { tipo: 'venta', desc: 'Registró venta #00892',   detalle: '$12.450 · 3 productos',  ts: '2025-05-22T11:15:00', color: '#185FA5' },
  { tipo: 'rol',   desc: 'Rol Cajero asignado',      detalle: 'Por Admin Torres',       ts: '2025-05-20T09:00:00', color: '#854F0B' },
  { tipo: 'login', desc: 'Inició sesión',           detalle: 'Desde IP 192.168.1.45', ts: '2025-05-20T08:55:00', color: '#3B6D11' },
  { tipo: 'edit',  desc: 'Datos actualizados',       detalle: 'Teléfono y dirección',   ts: '2025-05-18T16:00:00', color: '#534AB7' },
];

export function EmpleadoTabActividad() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {ITEMS_MOCK.map((item, i) => (
        <div key={i} style={{ display: 'flex', gap: 14, paddingBottom: 16, position: 'relative' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.color, marginTop: 4, flexShrink: 0 }} />
            {i < ITEMS_MOCK.length - 1 && <div style={{ width: 1, flex: 1, background: '#e2e8f0', marginTop: 4 }} />}
          </div>
          <div style={{ flex: 1, paddingBottom: 4 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#041627' }}>{item.desc}</div>
            <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{item.detalle}</div>
            <div style={{ fontSize: 11, color: '#bbb', marginTop: 3 }}>{formatDateTime(item.ts)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
