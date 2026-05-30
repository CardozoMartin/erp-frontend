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
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

// ─── Types ───────────────────────────────────────────────────────────────────

type SubItem = {
  label: string;
  icon: React.ReactNode;
  link: string;
  danger?: boolean;
  highlight?: boolean;
};

type NavItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
  link?: string;
  subItems?: SubItem[];
};

type UserAction = {
  label: string;
  icon: React.ReactNode;
  danger?: boolean;
  dividerBefore?: boolean;
};

// ─── Data ─────────────────────────────────────────────────────────────────────

const navItems: NavItem[] = [
  {
    id: 'punto-venta',
    label: 'Punto venta',
    icon: <ShoppingCart size={15} />,
    link: '/punto-venta',
  },
  {
    id: 'productos',
    label: 'Productos',
    icon: <Package size={15} />,
    subItems: [
      { label: 'Todos los productos', icon: <List size={15} />, link: '/productos' },
      { label: 'Categorías', icon: <Tag size={15} />, link: '/productos/category' },
      { label: 'Stock e inventario', icon: <Warehouse size={15} />, link: '/productos/stock' },
      {
        label: 'Precios y descuentos',
        icon: <BadgePercent size={15} />,
        link: '/productos/precios',
      },
      {
        label: 'Nuevo producto',
        icon: <Plus size={15} />,
        link: '/productos/nuevo',
        highlight: true,
      },
      {
        label: 'Marca de Productos',
        icon: <MarsStroke size={15} />,
        link: '/productos/marca',
        highlight: true,
      },
      {
        label: 'Eliminar productos',
        icon: <Trash2 size={15} />,
        link: '/productos/eliminar',
        danger: true,
      },
    ],
  },
  {
    id: 'sucursales',
    label: 'Sucursales',
    icon: <Warehouse size={15} />,
    link: '/sucursales',
  },
  {
    id: 'empleados',
    label: 'Empleados',
    icon: <UserRoundPen size={15} />,
    subItems: [
      { label: 'Todos los empleados', icon: <List size={15} />, link: '/empleados' },
      { label: 'Nuevo empleado', icon: <Plus size={15} />, link: '/empleados/nuevo', highlight: true },
    ],
  },
  {
    id: 'caja',
    label: 'Caja',
    icon: <Wallet size={15} />,
    subItems: [
      { label: 'Resumen de caja', icon: <BarChart2 size={15} />, link: '/caja' },
      { label: 'Movimientos', icon: <ArrowLeftRight size={15} />, link: '/caja/movimientos' },
      { label: 'Cierre de caja', icon: <Lock size={15} />, link: '/caja/cierre' },
      { label: 'Nuevo ingreso', icon: <Plus size={15} />, link: '/caja/ingreso', highlight: true },
    ],
  },
  {
    id: 'transferencias',
    label: 'Transferencias',
    icon: <ArrowLeftRight size={15} />,
    subItems: [
      { label: 'Historial', icon: <Clock size={15} />, link: '/transferencias' },
      { label: 'Pendientes', icon: <Loader size={15} />, link: '/transferencias/pendientes' },
      {
        label: 'Nueva transferencia',
        icon: <Plus size={15} />,
        link: '/transferencias/nueva',
        highlight: true,
      },
    ],
  },
];

const userActions: UserAction[] = [
  { label: 'Favoritos', icon: <Star size={14} /> },
  { label: 'Renombrar', icon: <Pencil size={14} /> },
  { label: 'Ajustes', icon: <Settings size={14} /> },
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
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  const activeId = navItems.find((item) => {
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
          {navItems.map((item) => {
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
        <button
          type="button"
          className="flex cursor-pointer items-center gap-[5px] rounded-md px-[10px] py-[6px] text-[13px] text-gray-500 transition-colors hover:bg-gray-500/10 hover:text-gray-800"
        >
          <Settings size={15} className="text-gray-400" />
          Ajustes
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
            <span>Martín</span>
            <ChevronDown
              size={12}
              className={`text-gray-400 transition-transform duration-150 ${userMenuOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 top-[calc(100%+6px)] z-50 min-w-[190px] overflow-hidden rounded-md border border-gray-500/20 bg-white py-1 shadow-sm">
              {userActions.map((action) => (
                <div key={action.label}>
                  {action.dividerBefore && <div className="my-1 h-px bg-gray-200/70" />}
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen(false)}
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
