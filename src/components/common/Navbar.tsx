import { Package, ShoppingCart, Wallet } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import '../../index.css'
// ─── Types ───────────────────────────────────────────────────────────────────

type NavItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
  link: string;
};

type UserMenuAction = {
  label: string;
  icon: React.ReactNode;
  danger?: boolean;
};

// ─── Data ────────────────────────────────────────────────────────────────────

const navItems: NavItem[] = [
  { id: 'Punto Venta', label: 'Punto Venta', icon: <ShoppingCart />, link: '/punto-venta' },
  { id: 'Productos', label: 'Productos', icon: <Package />, link: '/productos' },
  { id: 'Caja', label: 'Caja', icon: <Wallet />, link: '/caja' },
  { id: 'transfers', label: 'Transferencias', icon: '', link: '/transferencias' },
];

const userMenuActions: UserMenuAction[] = [
  { label: 'Favoritos', icon: '' },
  { label: 'Renombrar', icon: '' },
  { label: 'Ajustes', icon: '' },
  { label: 'Eliminar cuenta', icon: '', danger: true },
];

// ─── Navbar ──────────────────────────────────────────────────────────────────

export default function Navbar() {
  const [activeId, setActiveId] = useState<string>('analytics');
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="w-full bg-white border-b border-gray-500/20 px-5 flex items-center justify-between h-[52px] font-medium select-none text_color">
      {/* ── Izquierda: logo + links ── */}
      <div className="flex items-center gap-5">
        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-6 h-6 bg-gray-900 rounded-md flex items-center justify-center"></div>
          <span className="text-sm font-semibold text-gray-800 tracking-tight">Sistema ERP</span>
        </div>

        {/* Divisor */}
        <div className="w-px h-4 bg-gray-300" />

        {/* Links */}
        <ul className="flex items-center gap-px">
          {navItems.map((item) => {
            const isActive = activeId === item.id;
            return (
              <li key={item.id}>
                <Link
                  to={item.link}
                  onClick={() => setActiveId(item.id)}
                  className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors duration-150 cursor-pointer
                    ${
                      isActive
                        ? 'bg-gray-500/10 text-gray-900'
                        : 'text-gray-500 hover:bg-[#DCF8C6] hover:text-[#ECE5DD] '
                    }
                  `}
                >
                  <span className={isActive ? 'text-gray-800' : 'text-gray-400'}>{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* ── Derecha: ajustes + usuario ── */}
      <div className="flex items-center gap-2">
        {/* Ajustes */}
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-gray-500 hover:bg-gray-500/10 hover:text-gray-800 transition-colors duration-150 cursor-pointer">
          Ajustes
        </button>

        <div className="w-px h-4 bg-gray-300" />

        {/* Usuario con dropdown */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-gray-700 hover:bg-gray-500/10 transition-colors duration-150 cursor-pointer"
          >
            {/* Avatar */}
            <div className="w-6 h-6 rounded-full bg-gray-200 border border-gray-300/60 flex items-center justify-center text-[10px] font-semibold text-gray-600">
              MD
            </div>
            <span className="text-sm text-gray-800">Martín</span>
            <span className="text-gray-400">{/* <IconChevron open={menuOpen} /> */}</span>
          </button>

          {/* Dropdown */}
          {menuOpen && (
            <div className="absolute right-0 top-[calc(100%+6px)] w-52 bg-white border border-gray-500/20 rounded-md shadow-sm z-50 overflow-hidden py-1">
              {userMenuActions.map((action, i) => {
                const isDanger = action.danger;
                const isBeforeDanger = !isDanger && userMenuActions[i + 1]?.danger;

                return (
                  <div key={action.label}>
                    {isBeforeDanger && <div className="w-full h-px bg-gray-200/70 my-1" />}
                    <button
                      className={`
                        w-full flex items-center justify-between gap-3 px-3 py-2 text-sm transition-colors duration-100 cursor-pointer
                        ${
                          isDanger
                            ? 'text-red-600/80 hover:bg-red-600/10'
                            : 'text-gray-700/80 hover:bg-gray-500/10'
                        }
                      `}
                    >
                      {action.label}
                      <span className={isDanger ? 'text-red-500' : 'text-gray-400'}>
                        {action.icon}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
