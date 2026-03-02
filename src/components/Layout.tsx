import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { LayoutDashboard, Target, Briefcase, BarChart2, Users, Shield, LogOut } from 'lucide-react';
import clsx from 'clsx';

export const Layout = () => {
  const { user, logout } = useAuthStore();
  const location = useLocation();

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'GESTOR', 'OPERADOR', 'VISUALIZADOR'] },
    { path: '/metas', label: 'Metas', icon: Target, roles: ['ADMIN'] },
    { path: '/projetos', label: 'Projetos', icon: Briefcase, roles: ['ADMIN', 'GESTOR'] },
    { path: '/indicadores', label: 'Indicadores', icon: BarChart2, roles: ['ADMIN', 'GESTOR', 'OPERADOR'] },
    { path: '/usuarios', label: 'Usuários', icon: Users, roles: ['ADMIN'] },
    { path: '/auditoria', label: 'Auditoria', icon: Shield, roles: ['ADMIN'] },
  ];

  const filteredMenu = menuItems.filter(item => user && item.roles.includes(user.role));

  return (
    <div className="flex h-screen bg-[#FAFAFA]">
      {/* Sidebar */}
      <aside className="w-64 bg-[#4E3205] text-white flex flex-col">
        <div className="p-6 flex items-center justify-center border-b border-white/10">
          <h1 className="text-2xl font-bold text-[#F37137]">SGM</h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {filteredMenu.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={clsx(
                  'flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors',
                  isActive 
                    ? 'bg-[#F37137] text-white' 
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                )}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-[#F37137] flex items-center justify-center font-bold">
              {user?.nome.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{user?.nome}</p>
              <p className="text-xs text-white/50 truncate">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center space-x-2 text-sm text-white/70 hover:text-white transition-colors w-full px-2 py-2"
          >
            <LogOut size={16} />
            <span>Sair do sistema</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
