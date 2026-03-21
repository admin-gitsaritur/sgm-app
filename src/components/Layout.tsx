import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Toaster } from './ui/toast';
import { UserAvatar } from './ui/UserAvatar';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator,
} from './ui/dropdown-menu';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipContentWithArrow } from './ui/tooltip';
import {
  Target, Gauge, Briefcase, BarChart2, Users, Shield,
  LogOut, Menu, X, Bell, UserCheck, FileText, Settings, User, ChevronDown, GitBranch, Heart
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
          const link = (
            <Link
              key={item.path}
              to={item.path}
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

          if (!collapsed) return link;

          return (
            <Tooltip key={item.path}>
              <TooltipTrigger asChild>
                {link}
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={12} className="!px-3 !py-1.5">
                {item.label}
              </TooltipContent>
            </Tooltip>
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
          <div className="flex flex-col min-h-full pt-4 px-4 md:pt-8 md:px-8 pb-0">
            <div className="max-w-7xl mx-auto w-full flex-1">
              <Outlet />
            </div>

            {/* Footer */}
            <footer className="max-w-7xl mx-auto w-full mt-auto pt-8 pb-3 border-t border-[#eeedea]">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-stone-400">
                <span>© {new Date().getFullYear()} Saritur. Todos os direitos reservados.</span>
                <span>
                  Desenvolvido para{' '}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="font-semibold text-primary cursor-default transition-colors duration-300 ease-out hover:text-saritur-yellow">
                        Saritur
                      </span>
                    </TooltipTrigger>
                    <TooltipContentWithArrow
                      side="top"
                      sideOffset={8}
                      className="!px-3 !py-1.5 !text-xs"
                    >
                      <a
                        href="https://rockhub.co/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 group/rock"
                      >
                        <span className="text-xs text-stone-500">Made with</span>
                        <Heart className="h-3 w-3 text-red-500 fill-red-500 animate-heartbeat" />
                        <span className="text-xs text-stone-500">by</span>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 563.96 141.18" className="h-[10px] w-auto text-[#FF40FE] group-hover/rock:text-[#DCF01A] transition-colors duration-300" fill="currentColor" aria-label="Rock">
                          <path d="M302.08,34.54c-6.45-10.64-15.4-19.11-26.62-25.17C264.25,3.32,251.44.25,237.39.25s-26.88,3.07-38.16,9.13c-11.29,6.06-20.24,14.53-26.62,25.17-6.38,10.65-9.62,22.77-9.62,36.05s3.24,25.4,9.62,36.04c3.2,5.32,7.03,10.11,11.47,14.31,4.45,4.21,9.51,7.83,15.15,10.86,11.27,6.06,24.11,9.13,38.16,9.13s26.86-3.06,38.07-9.13c11.21-6.06,20.17-14.53,26.62-25.17,6.45-10.64,9.72-22.77,9.72-36.04s-3.28-25.4-9.72-36.05h0ZM267.4,101.51c-2.51,2.54-5.37,4.73-8.54,6.54-6.36,3.62-13.59,5.46-21.45,5.46s-15.12-1.83-21.45-5.46c-6.35-3.62-11.41-8.75-15.04-15.22-3.62-6.48-5.46-13.97-5.46-22.23s1.83-15.75,5.46-22.23,8.68-11.6,15.04-15.22c6.35-3.62,13.56-5.46,21.45-5.46s15.09,1.85,21.45,5.46c6.35,3.61,11.4,8.73,15.03,15.22s5.46,13.97,5.46,22.23-1.83,15.75-5.46,22.23c-1.81,3.23-3.98,6.15-6.49,8.68h.01Z" />
                          <path d="M435.47,97.3l20.65,19.07-.23.27c-6.46,7.88-14.58,13.96-24.11,18.09-9.54,4.12-20.33,6.21-32.04,6.21-13.79,0-26.43-3.04-37.57-9.03-5.58-2.99-10.59-6.61-15-10.79-4.42-4.19-8.24-8.96-11.42-14.28-6.38-10.64-9.62-22.83-9.62-36.23s3.23-25.61,9.62-36.24c6.38-10.65,15.27-19.08,26.44-25.08,11.14-6,23.85-9.03,37.77-9.03,11.72,0,22.47,2.09,31.94,6.21,9.48,4.13,17.56,10.14,24.01,17.89l.24.27-20.65,19.07-.25-.29c-9.04-10.43-20.38-15.72-33.73-15.72-8.27,0-15.75,1.85-22.23,5.46-6.47,3.61-11.59,8.73-15.22,15.22-3.62,6.48-5.46,13.97-5.46,22.23s1.85,15.75,5.46,22.23c3.62,6.47,8.75,11.59,15.22,15.22,6.48,3.62,13.97,5.46,22.23,5.46,13.35,0,24.69-5.35,33.72-15.9l.26-.3-.02.02Z" />
                          <polygon points="494.15 71.02 561.3 138.17 519.98 138.17 452.84 71.03 521.67 2.19 562.98 2.19 494.15 71.02" />
                          <path d="M122.58,93.85c7.55-4.42,13.8-10.79,18.1-18.43,4.1-7.3,6.27-15.62,6.27-24.05s-2.06-16.31-5.95-23.47c-8.63-15.87-25.2-25.71-43.23-25.71H.98l43.3,72.67H13.29l15.26,25.61h.07v.11l22.44,37.66h9.62v-37.78h32.08l22.51,37.78h33.77l-26.45-44.39h-.01ZM106.93,68.47c-4.34,4.12-10.02,6.38-15.99,6.38h-30.24V28.45h30.24c12.79,0,23.2,10.4,23.2,23.2,0,6.4-2.56,12.38-7.2,16.8h0Z" />
                        </svg>
                      </a>
                    </TooltipContentWithArrow>
                  </Tooltip>
                </span>
              </div>
            </footer>
          </div>
        </div>
      </main>
      <Toaster />
    </div>
  );
};
