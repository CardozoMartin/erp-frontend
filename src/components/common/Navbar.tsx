import {
  Package,
  ShoppingCart,
  Wallet,
  ArrowLeftRight,
  Settings,
  ChevronDown,
  List,
  Tag,
  Warehouse,
  BadgePercent,
  Plus,
  Trash2,
  BarChart2,
  Lock,
  Clock,
  Loader,
  Star,
  Pencil,
  LogOut,
  ArrowRight,
  MarsStroke,
  UserRoundPen,
  LogOutIcon,
  FileText,
  PackageCheck,
  ReceiptText,
  Users,
  Truck,
  AlertTriangle,
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import Swal from 'sweetalert2';
import { logoutFn, seleccionarSucursalFn } from '../../modules/Auth/api/auth.api';
import type { AxiosError } from 'axios';
import { useConteoAlertasStock } from '../../modules/Productos/hooks/useAlertasStock';

// ─── Types ───────────────────────────────────────────────────────────────────

type SubItem = {
  label: string;
  icon: React.ReactNode;
  link: string;
  danger?: boolean;
  highlight?: boolean;
  requiredAny?: string[];
};

type NavItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
  link?: string;
  subItems?: SubItem[];
  requiredAny?: string[];
};

type UserAction = {
  label: string;
  icon: React.ReactNode;
  link?: string;
  danger?: boolean;
  dividerBefore?: boolean;
  requiredAny?: string[];
};

// ─── Data ─────────────────────────────────────────────────────────────────────

const navItems: NavItem[] = [
  {
    id: 'punto-venta',
    label: 'Punto venta',
    icon: <ShoppingCart size={15} />,
    link: '/punto-venta',
    requiredAny: ['ventas.crear', 'caja.cobrar', 'caja.abrir'],
  },
  {
    id: 'gestion-pos',
    label: 'Gestion POS',
    icon: <ReceiptText size={15} />,
    subItems: [
      { label: 'Ventas', icon: <FileText size={15} />, link: '/ventas', requiredAny: ['ventas.ver', 'reportes.ver', 'reportes.ventas'] },
      { label: 'Ventas POS', icon: <ReceiptText size={15} />, link: '/ventas-pos', requiredAny: ['ventas.ver', 'reportes.ver', 'reportes.ventas'] },
      { label: 'Despachos', icon: <PackageCheck size={15} />, link: '/despachos', requiredAny: ['deposito.ver', 'deposito.despachar', 'deposito.recepcionar'] },
      { label: 'Cuenta corriente', icon: <Wallet size={15} />, link: '/cuenta-corriente', requiredAny: ['clientes.ver', 'ventas.ver'] },
      { label: 'Listas de precio', icon: <BadgePercent size={15} />, link: '/listas-precio', requiredAny: ['precios.ver', 'config.listas_precio'] },
      { label: 'Reportes POS', icon: <BarChart2 size={15} />, link: '/reportes-pos', requiredAny: ['reportes.ver', 'reportes.ventas', 'reportes.caja'] },
      { label: 'Reporte contable', icon: <BarChart2 size={15} />, link: '/reportes-contables', requiredAny: ['reportes.ver', 'reportes.ventas', 'reportes.caja'] },
    ],
  },
  {
    id: 'pedidos-envio',
    label: 'Pedidos envio',
    icon: <Truck size={15} />,
    link: '/pedidos-envio',
    requiredAny: ['ventas.ver', 'ventas.crear'],
  },
  {
    id: 'productos',
    label: 'Productos',
    icon: <Package size={15} />,
    subItems: [
      { label: 'Todos los productos', icon: <List size={15} />, link: '/productos', requiredAny: ['productos.ver'] },
      { label: 'Categorías', icon: <Tag size={15} />, link: '/productos/category', requiredAny: ['productos.ver', 'productos.crear', 'productos.editar'] },
      { label: 'Stock e inventario', icon: <Warehouse size={15} />, link: '/productos/stock', requiredAny: ['stock.ver', 'stock.editar', 'stock.ajuste', 'deposito.stock'] },
      {
        label: 'Precios y descuentos',
        icon: <BadgePercent size={15} />,
        link: '/productos/precios',
        requiredAny: ['precios.ver', 'precios.cambiar', 'config.listas_precio'],
      },
      {
        label: 'Nuevo producto',
        icon: <Plus size={15} />,
        link: '/productos/nuevo',
        highlight: true,
        requiredAny: ['productos.crear'],
      },
      {
        label: 'Marca de Productos',
        icon: <MarsStroke size={15} />,
        link: '/productos/marca',
        highlight: true,
        requiredAny: ['productos.ver', 'productos.crear', 'productos.editar'],
      },
      {
        label: 'Eliminar productos',
        icon: <Trash2 size={15} />,
        link: '/productos/eliminar',
        danger: true,
        requiredAny: ['productos.eliminar'],
      },
    ],
  },
  {
    id: 'sucursales',
    label: 'Sucursales',
    icon: <Warehouse size={15} />,
    link: '/sucursales',
    requiredAny: ['sucursales.ver', 'sucursales.crear', 'sucursales.editar'],
  },
  {
    id: 'empleados',
    label: 'Empleados',
    icon: <UserRoundPen size={15} />,
    subItems: [
      { label: 'Todos los empleados', icon: <List size={15} />, link: '/empleados', requiredAny: ['empleados.ver', 'empleados.gestionar', 'empleados.roles'] },
      { label: 'Nuevo empleado', icon: <Plus size={15} />, link: '/empleados/nuevo', highlight: true, requiredAny: ['empleados.crear', 'empleados.gestionar'] },
    ],
  },
  {
    id: 'clientes',
    label: 'Clientes',
    icon: <Users size={15} />,
    link: '/clientes',
    requiredAny: ['clientes.ver', 'clientes.cargar', 'clientes.editar'],
  },
  {
    id: 'caja',
    label: 'Caja',
    icon: <Wallet size={15} />,
    subItems: [
      { label: 'Resumen de caja', icon: <BarChart2 size={15} />, link: '/caja', requiredAny: ['caja.ver', 'reportes.caja', 'reportes.ver'] },
      { label: 'Movimientos', icon: <ArrowLeftRight size={15} />, link: '/caja/movimientos', requiredAny: ['caja.movimientos', 'caja.ver'] },
      { label: 'Cierre de caja', icon: <Lock size={15} />, link: '/caja/cierre', requiredAny: ['caja.cerrar'] },
      { label: 'Nuevo ingreso', icon: <Plus size={15} />, link: '/caja/ingreso', highlight: true, requiredAny: ['caja.movimientos.crear'] },
    ],
  },
  {
    id: 'transferencias',
    label: 'Transferencias',
    icon: <ArrowLeftRight size={15} />,
    subItems: [
      { label: 'Historial', icon: <Clock size={15} />, link: '/transferencias', requiredAny: ['deposito.ver', 'deposito.despachar', 'deposito.recepcionar', 'stock.ver'] },
      { label: 'Pendientes', icon: <Loader size={15} />, link: '/transferencias/pendientes', requiredAny: ['deposito.ver', 'deposito.despachar', 'deposito.recepcionar', 'stock.ver'] },
      {
        label: 'Nueva transferencia',
        icon: <Plus size={15} />,
        link: '/transferencias/nueva',
        highlight: true,
        requiredAny: ['deposito.despachar', 'deposito.recepcionar', 'stock.editar', 'stock.ajuste'],
      },
    ],
  },
];

const userActions: UserAction[] = [
  { label: 'Favoritos', icon: <Star size={14} /> },
  { label: 'Renombrar', icon: <Pencil size={14} /> },
  { label: 'Ajustes', icon: <Settings size={14} />, link: '/ajustes', requiredAny: ['admin.servicios', 'config.pos', 'mp.crear', 'config.email', 'reportes.ver'] },
  { label: 'Cerrar sesión', icon: <LogOut size={14} />, danger: true, dividerBefore: true },
];

// ─── Dropdown ─────────────────────────────────────────────────────────────────

interface DropdownProps {
  items: SubItem[];
  onClose: () => void;
}

const Dropdown = ({ items, onClose }: DropdownProps) => {
  const groups: SubItem[][] = [];
  let current: SubItem[] = [];

  items.forEach((item) => {
    if (item.highlight || item.danger) {
      if (current.length) groups.push(current);
      groups.push([item]);
      current = [];
    } else {
      current.push(item);
    }
  });
  if (current.length) groups.push(current);

  return (
    <div className="absolute left-0 top-[calc(100%+6px)] z-50 min-w-[210px] rounded-md border border-gray-500/20 bg-white py-1 shadow-sm">
      {groups.map((group, gi) => (
        <div key={gi}>
          {gi > 0 && <div className="my-1 h-px bg-gray-200/70" />}
          {group.map((item) => (
            <Link
              key={item.link}
              to={item.link}
              onClick={onClose}
              className={`
                flex w-full items-center justify-between gap-2 px-3 py-[7px] text-[13px] font-medium transition-colors
                ${
                  item.danger
                    ? 'text-red-600/80 hover:bg-red-600/10'
                    : 'text-gray-700/80 hover:bg-gray-500/10'
                }
              `}
            >
              <span className="flex items-center gap-[9px]">
                <span className={item.danger ? 'text-red-500' : 'text-gray-400'}>{item.icon}</span>
                {item.label}
              </span>
              {item.highlight && <ArrowRight size={13} className="text-gray-400" />}
            </Link>
          ))}
        </div>
      ))}
    </div>
  );
};

// ─── Navbar ───────────────────────────────────────────────────────────────────

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const queryClient = useQueryClient();
  const { cerrarSesion, empleado, sucursales, sucursalActiva, cambiarSucursalActiva, permisos, rutas } =
    useAuthStore();
  const permisosSet = useMemo(() => new Set(permisos), [permisos]);
  const rutasSet = useMemo(() => new Set(rutas.map((ruta) => ruta.path)), [rutas]);
  const canSee = (requiredAny?: string[]) =>
    !requiredAny?.length || requiredAny.some((permiso) => permisosSet.has(permiso));
  const canAccessLink = (link?: string, requiredAny?: string[]) =>
    !link || (rutas.length ? rutasSet.has(link) : canSee(requiredAny));
  const visibleNavItems = useMemo(
    () =>
      navItems
        .map((item) => {
          if (item.subItems) {
            const subItems = item.subItems.filter((subItem) =>
              canAccessLink(subItem.link, subItem.requiredAny),
            );
            return { ...item, subItems };
          }
          return item;
        })
        .filter((item) =>
          item.subItems ? item.subItems.length > 0 : canAccessLink(item.link, item.requiredAny),
        ),
    [permisosSet, rutas, rutasSet],
  );
  const visibleUserActions = useMemo(
    () => userActions.filter((action) => canAccessLink(action.link, action.requiredAny)),
    [permisosSet, rutas, rutasSet],
  );

  const { data: conteoAlertas = 0 } = useConteoAlertasStock();

  const seleccionarSucursalMutation = useMutation({
    mutationFn: seleccionarSucursalFn,
    onSuccess: (data) => {
      cambiarSucursalActiva(data.token, data.sucursal, {
        permisos: data.permisos,
        rutas: data.rutas,
        rutaInicio: data.rutaInicio,
      });
      queryClient.invalidateQueries();
    },
    onError: (error: AxiosError<{ message?: string; mensaje?: string }>) => {
      const mensaje =
        error.response?.data?.message ||
        error.response?.data?.mensaje ||
        'No se pudo cambiar la sucursal activa.';

      Swal.fire({
        title: 'Sucursal no disponible',
        text: mensaje,
        icon: 'warning',
        confirmButtonText: 'Entendido',
      });
    },
  });

  const activeId = visibleNavItems.find((item) => {
    if (item.link) return location.pathname === item.link;
    return item.subItems?.some((s) => location.pathname.startsWith(s.link));
  })?.id;

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const toggleMenu = (id: string) => {
    setUserMenuOpen(false);
    setOpenMenu((prev) => (prev === id ? null : id));
  };

  const toggleUserMenu = () => {
    setOpenMenu(null);
    setUserMenuOpen((v) => !v);
  };

  const handleSucursalChange = (sucursalId: string) => {
    if (!sucursalId || sucursalId === sucursalActiva?.id) return;
    seleccionarSucursalMutation.mutate(sucursalId);
  };

  useEffect(() => {
    if (sucursalActiva?.id || !sucursales.length || seleccionarSucursalMutation.isPending) {
      return;
    }
    seleccionarSucursalMutation.mutate(sucursales[0].id);
  }, [seleccionarSucursalMutation, sucursalActiva?.id, sucursales]);

  //Handler para cerrar session
  const handleLogout = () => {
    Swal.fire({
      title: '¿Cerrar sesión?',
      text: '¿Estás seguro de que deseas cerrar sesión?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, cerrar sesión',
      cancelButtonText: 'Cancelar',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await logoutFn();
        } catch {
          // Si el token ya expiro igual cerramos la sesion local.
        }
        cerrarSesion();
        Swal.fire('Sesión cerrada', 'Has cerrado sesión exitosamente.', 'success');
      }
    });
  };

  const handleUserAction = (action: UserAction) => {
    setUserMenuOpen(false);
    if (action.danger) {
      handleLogout();
      return;
    }
    if (action.link) {
      navigate(action.link);
    }
  };

  return (
    <nav
      ref={navRef}
      className="flex h-[52px] w-full select-none items-center justify-between border-b border-gray-500/20 bg-white px-5 font-medium"
    >
      {/* ── Izquierda ── */}
      <div className="flex items-center gap-4">
        {/* Logo */}
        <div className="flex shrink-0 items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gray-900" />
          <span className="text-sm font-semibold tracking-tight text-gray-800">Sistema ERP</span>
        </div>

        <div className="h-4 w-px bg-gray-300" />

        {/* Links */}
        <ul className="flex items-center gap-px">
          {visibleNavItems.map((item) => {
            const isActive = activeId === item.id;
            const isOpen = openMenu === item.id;
            const hasSubmenu = !!item.subItems;

            return (
              <li key={item.id} className="relative">
                {hasSubmenu ? (
                  <button
                    type="button"
                    onClick={() => toggleMenu(item.id)}
                    className={`
                      flex cursor-pointer items-center gap-[5px] rounded-md px-[10px] py-[6px] text-[13px] transition-colors duration-150
                      ${
                        isActive || isOpen
                          ? 'bg-gray-500/10 text-gray-900'
                          : 'text-gray-500 hover:bg-gray-500/10 hover:text-gray-800'
                      }
                    `}
                  >
                    <span className={isActive || isOpen ? 'text-gray-700' : 'text-gray-400'}>
                      {item.icon}
                    </span>
                    {item.label}
                    <ChevronDown
                      size={12}
                      className={`text-gray-400 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                ) : (
                  <Link
                    to={item.link!}
                    className={`
                      flex cursor-pointer items-center gap-[5px] rounded-md px-[10px] py-[6px] text-[13px] transition-colors duration-150
                      ${
                        isActive
                          ? 'bg-gray-500/10 text-gray-900'
                          : 'text-gray-500 hover:bg-gray-500/10 hover:text-gray-800'
                      }
                    `}
                  >
                    <span className={isActive ? 'text-gray-700' : 'text-gray-400'}>
                      {item.icon}
                    </span>
                    {item.label}
                  </Link>
                )}

                {hasSubmenu && isOpen && (
                  <Dropdown items={item.subItems!} onClose={() => setOpenMenu(null)} />
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {/* ── Derecha ── */}
      <div className="flex items-center gap-2">
        {/* Badge alertas de stock mínimo */}
        {conteoAlertas > 0 && (
          <Link
            to="/productos/stock"
            title={`${conteoAlertas} producto${conteoAlertas !== 1 ? 's' : ''} con stock bajo el mínimo`}
            className="relative flex h-8 items-center gap-1.5 rounded-md border border-amber-300 bg-amber-50 px-2.5 text-[12px] font-medium text-amber-700 transition-colors hover:bg-amber-100"
          >
            <AlertTriangle size={14} className="text-amber-500" />
            <span>Stock mínimo</span>
            <span className="flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
              {conteoAlertas > 99 ? '99+' : conteoAlertas}
            </span>
          </Link>
        )}

        <div className="flex h-8 items-center gap-2 rounded-md border border-gray-300 bg-white px-2 text-[12px] text-gray-500">
          <Warehouse size={14} className="text-[#075E54]" />
          <span className="font-semibold text-gray-600">Sucursal:</span>
          {sucursales.length > 0 ? (
            <select
              value={sucursalActiva?.id ?? ''}
              onChange={(event) => handleSucursalChange(event.target.value)}
              disabled={seleccionarSucursalMutation.isPending}
              className="h-6 max-w-[220px] bg-transparent text-[13px] font-bold text-[#041627] outline-none"
              title="Sucursal activa"
            >
              {sucursales.map((sucursal) => (
                <option key={sucursal.id} value={sucursal.id}>
                  {sucursal.nombre}
                </option>
              ))}
            </select>
          ) : (
            <span className="font-bold text-red-600">
              Sin sucursal asignada
            </span>
          )}
        </div>

        <button
          type="button"
          className="flex cursor-pointer items-center gap-[5px] rounded-md px-[10px] py-[6px] text-[13px] text-white transition-colors hover:bg-red-700 hover:text-gray-800 border-red-600 border bg-red-500 "
          onClick={()=> handleLogout() }
        >
          <LogOutIcon size={15} />
          Cerrar sesión
        </button>

        <div className="h-4 w-px bg-gray-300" />

        {/* Usuario */}
        <div className="relative">
          <button
            type="button"
            onClick={toggleUserMenu}
            className={`
              flex cursor-pointer items-center gap-2 rounded-md px-2 py-[5px] text-[13px] text-gray-800 transition-colors
              ${userMenuOpen ? 'bg-gray-500/10' : 'hover:bg-gray-500/10'}
            `}
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-300/60 bg-gray-200 text-[10px] font-semibold text-gray-600">
              MD
            </div>
            <span>{empleado?.nombreCompleto?.split(' ')[0] ?? 'Usuario'}</span>
            <ChevronDown
              size={12}
              className={`text-gray-400 transition-transform duration-150 ${userMenuOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 top-[calc(100%+6px)] z-50 min-w-[190px] overflow-hidden rounded-md border border-gray-500/20 bg-white py-1 shadow-sm">
              {visibleUserActions.map((action) => (
                <div key={action.label}>
                  {action.dividerBefore && <div className="my-1 h-px bg-gray-200/70" />}
                  <button
                    type="button"
                    onClick={() => handleUserAction(action)}
                    className={`
                      flex w-full cursor-pointer items-center justify-between gap-3 px-3 py-2 text-[13px] font-medium transition-colors
                      ${
                        action.danger
                          ? 'text-red-600/80 hover:bg-red-600/10'
                          : 'text-gray-700/80 hover:bg-gray-500/10'
                      }
                    `}
                  >
                    {action.label}
                    <span className={action.danger ? 'text-red-500' : 'text-gray-400'}>
                      {action.icon}
                    </span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
