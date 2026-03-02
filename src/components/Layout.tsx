import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { LayoutDashboard, Target, Briefcase, BarChart2, Users, Shield, LogOut, Menu, X, Settings, FileText } from 'lucide-react';
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change (mobile)
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  const filteredMenu = menuItems.filter(item => user && item.roles.includes(user.role));

  const SidebarContent = () => (
    <>
      <div className="p-6 flex items-center justify-between border-b border-white/10">
        <h1 className="text-2xl font-bold text-[#F37137]">SGM</h1>
        <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 text-white/70 hover:text-white">
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {filteredMenu.map(item => {
          const Icon = item.icon;
          const isActive = location.pathname.startsWith(item.path);
          return (
            <Link key={item.path} to={item.path}
              className={clsx(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all',
                isActive ? 'bg-[#F37137] text-white shadow-lg shadow-[#F37137]/30' : 'text-white/70 hover:bg-white/10 hover:text-white'
              )}>
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-[#F37137] flex items-center justify-center text-white font-bold">
            {user?.nome?.charAt(0)}
          </div>
          <div className="overflow-hidden flex-1">
            <p className="text-sm font-medium text-white truncate">{user?.nome}</p>
            <p className="text-xs text-white/50 truncate">{user?.role}</p>
          </div>
        </div>
        <button onClick={logout}
          className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors w-full px-2 py-2 rounded-lg hover:bg-white/10">
          <LogOut size={16} /> <span>Sair do sistema</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-[#FAFAFA]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-[#4E3205] text-white flex-col flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-[#4E3205] text-white flex flex-col shadow-2xl">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto flex flex-col">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
          <button onClick={() => setSidebarOpen(true)} className="p-2 text-[#4E3205] hover:bg-gray-100 rounded-lg">
            <Menu size={24} />
          </button>
          <h1 className="text-lg font-bold text-[#F37137]">SGM</h1>
          <div className="w-10" />
        </div>

        <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
