import {
  ArrowRight,
  Clock,
  Database,
  ImageIcon,
  Receipt,
  Mail,
  QrCode,
  Settings,
  ShieldCheck,
  Store,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import AccessDenied from '../../../components/common/AccessDenied';
import { useAuthStore } from '../../../store/auth.store';

type AjusteItem = {
  title: string;
  description: string;
  link: string;
  icon: ReactNode;
  requiredAny: string[];
  badge: string;
};

const ajustes: AjusteItem[] = [
  {
    title: 'Configuracion POS',
    description: 'Parametros operativos del punto de venta, tickets, stock y comprobantes.',
    link: '/configuracion-pos',
    icon: <Settings size={21} />,
    requiredAny: ['admin.servicios', 'config.pos'],
    badge: 'Sistema',
  },
  {
    title: 'Mercado Pago',
    description: 'Credenciales, tienda, POS QR y prueba de conexion por sucursal.',
    link: '/configuracion-mercadopago',
    icon: <QrCode size={21} />,
    requiredAny: ['admin.servicios', 'mp.crear', 'config.pos'],
    badge: 'Cobros',
  },
  {
    title: 'Cloudinary',
    description: 'Configuracion de imagenes para productos y recursos multimedia.',
    link: '/configuracion-cloudinary',
    icon: <ImageIcon size={21} />,
    requiredAny: ['admin.servicios', 'config.pos'],
    badge: 'Imagenes',
  },
  {
    title: 'Email',
    description: 'Servidor de envio, remitente, pruebas y habilitacion de correos.',
    link: '/configuracion-email',
    icon: <Mail size={21} />,
    requiredAny: ['admin.servicios', 'config.email'],
    badge: 'Comunicacion',
  },
  {
    title: 'Auditoria',
    description: 'Registro de acciones, cambios criticos y movimientos del sistema.',
    link: '/auditoria',
    icon: <Clock size={21} />,
    requiredAny: ['reportes.ver'],
    badge: 'Control',
  },
  {
    title: 'Backup Google Drive',
    description: 'Respaldo automatico diario de la base de datos en tu Google Drive personal. Gratis y sin limite de uso.',
    link: '/configuracion-backup',
    icon: <Database size={21} />,
    requiredAny: ['admin.servicios', 'mp.crear', 'config.pos'],
    badge: 'Seguridad',
  },
  {
    title: 'Facturacion ARCA',
    description: 'Certificado y punto de venta para emitir facturas electronicas con CAE ante ARCA (ex AFIP).',
    link: '/configuracion-arca',
    icon: <Receipt size={21} />,
    requiredAny: ['admin.servicios', 'config.pos'],
    badge: 'Fiscal',
  },
];

const AjustesPage = () => {
  const permisos = useAuthStore((state) => state.permisos);
  const sucursalActiva = useAuthStore((state) => state.sucursalActiva);
  const permisosSet = new Set(permisos);
  const visibles = ajustes.filter((item) =>
    item.requiredAny.some((permiso) => permisosSet.has(permiso)),
  );

  if (!visibles.length) {
    return (
      <AccessDenied
        title="Sin permisos para ajustes"
        message="Tu usuario no tiene habilitada ninguna configuracion administrativa."
      />
    );
  }

  return (
    <div className="min-h-[calc(100vh-52px)] bg-[#f3f4f6] px-4 py-4">
      <div className="mx-auto max-w-[1180px]">
        <div className="rounded-lg border border-[#c4c6cd] bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#c4c6cd] px-4 py-4">
            <div>
              <div className="flex items-center gap-2 text-[17px] font-bold text-[#041627]">
                <ShieldCheck size={19} className="text-[#075E54]" />
                Ajustes
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[13px] text-[#44474c]">
                <Store size={14} />
                {sucursalActiva?.nombre ?? 'Sin sucursal seleccionada'}
                <span className="text-[#70757d]">Panel de configuraciones administrativas</span>
              </div>
            </div>
            <span className="rounded border border-[#cfe2de] bg-[#f3fbf9] px-3 py-1 text-[12px] font-semibold text-[#075E54]">
              {visibles.length} secciones disponibles
            </span>
          </div>

          <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
            {visibles.map((item) => (
              <Link
                key={item.link}
                to={item.link}
                className="group flex min-h-[150px] flex-col justify-between rounded-md border border-[#c4c6cd] bg-[#fbf9fa] p-4 transition-colors hover:border-[#075E54] hover:bg-white"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-md border border-[#cfe2de] bg-[#f3fbf9] text-[#075E54]">
                      {item.icon}
                    </span>
                    <span className="rounded border border-[#d9dce2] bg-white px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[#60646c]">
                      {item.badge}
                    </span>
                  </div>
                  <h2 className="mt-4 text-[15px] font-bold text-[#041627]">{item.title}</h2>
                  <p className="mt-1 text-[13px] leading-5 text-[#44474c]">{item.description}</p>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-[#d9dce2] pt-3 text-[13px] font-semibold text-[#075E54]">
                  Abrir seccion
                  <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AjustesPage;
