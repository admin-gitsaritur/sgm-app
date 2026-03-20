import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Toaster } from './ui/toast';
import { UserAvatar } from './ui/UserAvatar';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator,
} from './ui/dropdown-menu';
import {
  Target, Gauge, Briefcase, BarChart2, Users, Shield,
  LogOut, Menu, X, Bell, UserCheck, FileText, Settings, User, ChevronDown, GitBranch
} from 'lucide-react';
import clsx from 'clsx';

const menuItems = [
  { path: '/dashboard', label: 'Dashboard', icon: Gauge, roles: ['ADMIN', 'GESTOR', 'OPERADOR', 'VISUALIZADOR'] },
  { path: '/metas', label: 'Metas', icon: Target, roles: ['ADMIN'] },
  { path: '/projetos', label: 'Projetos', icon: Briefcase, roles: ['ADMIN', 'GESTOR'] },
  { path: '/indicadores', label: 'Indicadores', icon: BarChart2, roles: ['ADMIN', 'GESTOR', 'OPERADOR'] },
  { path: '/mapeamento', label: 'Mapeamento', icon: GitBranch, roles: ['ADMIN', 'GESTOR'] },
  { path: '/responsaveis', label: 'Responsáveis', icon: UserCheck, roles: ['ADMIN', 'GESTOR'] },
  { path: '/relatorios', label: 'Relatórios', icon: FileText, roles: ['ADMIN', 'GESTOR'] },
  { path: '/usuarios', label: 'Usuários', icon: Users, roles: ['ADMIN'] },
  { path: '/auditoria', label: 'Auditoria', icon: Shield, roles: ['ADMIN'] },
  { path: '/configuracoes', label: 'Configurações', icon: Settings, roles: ['ADMIN'] },
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
  const nameParts = user?.nome?.split(' ') || [];
  const displayName = nameParts.length > 1 ? `${nameParts[0]} ${nameParts[nameParts.length - 1]}` : nameParts[0] || 'Usuário';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // ── Sidebar Content (shared between desktop and mobile) ──
  const NavContent = ({ collapsed = false }: { collapsed?: boolean }) => (
    <>
      {/* Logo */}
      <div className={clsx('h-16 flex items-center justify-center border-b border-stone-100', collapsed ? 'px-4' : 'px-5')}>
        <Link to="/dashboard" className="transition-opacity hover:opacity-80">
          {collapsed ? (
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center flex-shrink-0 shadow-sm">
              <img src="/brands/iso_saritur_branco.svg" alt="SGM" className="w-5 h-5" />
            </div>
          ) : (
            <img src="/brands/logo_saritur_branco.svg" alt="Saritur" className="h-7" />
          )}
        </Link>
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

      {/* Sidebar footer — logo/versão somente */}
      <div className={clsx('border-t border-stone-100 p-3', collapsed && 'p-2')}>
        <div className={clsx('text-center', collapsed ? 'text-[9px]' : 'text-xs')}>
          <span className="text-brown/20 font-medium">v1.0</span>
        </div>
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

          </div>

          <div className="flex items-center gap-2">
            <button className="relative p-2 rounded-xl text-brown/50 hover:bg-primary/10 hover:text-primary transition-colors">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary border-2 border-white" />
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-stone-50 transition-colors outline-none">
                  <UserAvatar name={user?.nome || ''} imageUrl={user?.avatar} size="sm" />
                  <span className="text-sm font-medium text-brown hidden sm:inline">{displayName}</span>
                  <ChevronDown size={14} className="text-brown/40" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2.5">
                  <p className="text-sm font-bold text-brown">{user?.nome}</p>
                  <p className="text-xs text-stone-400">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/perfil')}>
                  <User size={16} />
                  Editar Perfil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/configuracoes')}>
                  <Settings size={16} />
                  Configurações
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={handleLogout}>
                  <LogOut size={16} />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col min-h-full p-4 md:p-8">
            <div className="max-w-7xl mx-auto w-full flex-1">
              <Outlet />
            </div>

            {/* Footer */}
            <footer className="max-w-7xl mx-auto w-full mt-8 pt-5 pb-4 border-t border-stone-200/80">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-stone-400">
                <span>© {new Date().getFullYear()} Saritur. Todos os direitos reservados.</span>
                <span className="font-semibold text-stone-400">Saritur<span className="text-primary font-bold">SGM</span></span>
              </div>
            </footer>
          </div>
        </div>
      </main>
      <Toaster />
    </div>
  );
};
