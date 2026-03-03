import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Button } from './ui/Button';
import {
  LayoutDashboard, Target, Briefcase, BarChart2, Users, Shield,
  LogOut, Menu, X, Bell, Search
} from 'lucide-react';
import clsx from 'clsx';

const menuItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'GESTOR', 'OPERADOR', 'VISUALIZADOR'] },
  { path: '/metas', label: 'Metas', icon: Target, roles: ['ADMIN'] },
  { path: '/projetos', label: 'Projetos', icon: Briefcase, roles: ['ADMIN', 'GESTOR'] },
  { path: '/indicadores', label: 'Indicadores', icon: BarChart2, roles: ['ADMIN', 'GESTOR', 'OPERADOR'] },
  { path: '/usuarios', label: 'Usuários', icon: Users, roles: ['ADMIN'] },
  { path: '/auditoria', label: 'Auditoria', icon: Shield, roles: ['ADMIN'] },
];

export const Layout = () => {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  const filteredMenu = menuItems.filter(item => user && item.roles.includes(user.role));
  const initials = user?.nome?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || '?';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // ── Sidebar Content (shared between desktop and mobile) ──
  const NavContent = ({ collapsed = false }: { collapsed?: boolean }) => (
    <>
      {/* Logo */}
      <div className={clsx('h-16 flex items-center border-b border-stone-100', collapsed ? 'px-4 justify-center' : 'px-5')}>
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center flex-shrink-0 shadow-sm">
          <img src="/brands/iso_saritur_branco.svg" alt="SGM" className="w-5 h-5" />
        </div>
        {!collapsed && (
          <span className="ml-3 font-semibold text-brown text-lg tracking-tight">SGM</span>
        )}
      </div>

      {/* Navigation */}
      <nav className={clsx('flex-1 py-4 space-y-1 overflow-y-auto', collapsed ? 'px-2' : 'px-3')}>
        {filteredMenu.map(item => {
          const Icon = item.icon;
          const isActive = location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              title={collapsed ? item.label : undefined}
              className={clsx(
                'flex items-center rounded-xl transition-all duration-200 group',
                collapsed ? 'px-3 py-3 justify-center' : 'px-3 py-2.5 gap-3',
                isActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-brown/50 hover:bg-stone-50 hover:text-brown'
              )}
            >
              <Icon
                size={20}
                className={clsx(
                  'flex-shrink-0 transition-transform duration-200',
                  isActive ? 'scale-110' : 'group-hover:scale-105'
                )}
              />
              {!collapsed && (
                <>
                  <span className="text-sm">{item.label}</span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className={clsx('border-t border-stone-100', collapsed ? 'p-2' : 'p-3')}>
        <div className={clsx(
          'flex items-center rounded-xl transition-colors',
          collapsed ? 'justify-center p-2' : 'px-3 py-2.5 gap-3'
        )}>
          <div className="w-9 h-9 rounded-full bg-saritur-yellow flex items-center justify-center text-brown text-sm font-bold flex-shrink-0 shadow-sm">
            {initials}
          </div>
          {!collapsed && (
            <div className="overflow-hidden flex-1 min-w-0">
              <p className="text-sm font-medium text-brown truncate">{user?.nome}</p>
              <p className="text-xs text-brown/40 truncate">{user?.role}</p>
            </div>
          )}
        </div>
        <button
          onClick={handleLogout}
          className={clsx(
            'flex items-center text-sm text-brown/40 hover:text-primary hover:bg-stone-50 transition-colors w-full rounded-xl mt-1',
            collapsed ? 'justify-center p-2.5' : 'px-3 py-2 gap-2'
          )}
        >
          <LogOut size={16} />
          {!collapsed && <span>Sair do sistema</span>}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[#F9FAFB] selection:bg-primary/20 selection:text-brown">

      {/* ── Desktop Sidebar ── */}
      <aside
        className={clsx(
          'hidden lg:flex flex-col bg-white border-r border-stone-100 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] relative z-20',
          sidebarCollapsed ? 'w-[68px]' : 'w-60'
        )}
      >
        <NavContent collapsed={sidebarCollapsed} />
      </aside>

      {/* ── Mobile Sidebar Overlay ── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-white flex flex-col shadow-2xl">
            <div className="absolute top-4 right-3">
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 rounded-lg text-brown/40 hover:text-brown hover:bg-stone-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <NavContent />
          </aside>
        </div>
      )}

      {/* ── Main Content ── */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">

        {/* Header */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-stone-100 flex items-center justify-between px-4 md:px-6 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            {/* Toggle sidebar (desktop = collapse, mobile = open) */}
            <button
              onClick={() => {
                if (window.innerWidth >= 1024) {
                  setSidebarCollapsed(prev => !prev);
                } else {
                  setSidebarOpen(true);
                }
              }}
              className="p-2 rounded-xl text-brown/50 hover:bg-stone-100 hover:text-brown transition-colors"
            >
              <Menu size={20} />
            </button>

            {/* Search */}
            <div className="relative group hidden sm:block">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brown/30 transition-colors group-focus-within:text-primary" />
              <input
                type="text"
                placeholder="Buscar metas, projetos..."
                className="pl-9 pr-4 py-2 w-64 bg-stone-50/50 border border-transparent focus:border-primary/30 focus:bg-white rounded-xl text-sm text-brown placeholder-brown/30 outline-none transition-all duration-200 focus:shadow-[0_0_0_3px_rgba(243,113,55,0.1)]"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="relative p-2 rounded-xl text-brown/50 hover:bg-saritur-yellow/20 hover:text-brown transition-colors">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary border-2 border-white" />
            </button>
            <Button
              onClick={handleLogout}
              size="sm"
              variant="primary"
              leftIcon={<LogOut size={14} />}
              className="hidden sm:flex"
            >
              Sair
            </Button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};
