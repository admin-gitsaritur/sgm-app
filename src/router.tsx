import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PageLoader } from './components/ui/Spinner';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Metas } from './pages/Metas';
import { Projetos } from './pages/Projetos';
import { Indicadores } from './pages/Indicadores';
import { Usuarios } from './pages/Usuarios';
import { Auditoria } from './pages/Auditoria';
import { Responsaveis } from './pages/Responsaveis';
import { Relatorios } from './pages/Relatorios';
import { Configuracoes } from './pages/Configuracoes';
import { Login } from './pages/Login';
import { TrocarSenha } from './pages/TrocarSenha';
import { EsqueciSenha } from './pages/EsqueciSenha';

const ProtectedRoute = ({ children, roles }: { children: React.ReactNode; roles?: string[] }) => {
  const { isAuthenticated, user, deveTrocarSenha } = useAuthStore();

  if (!isAuthenticated) return <Navigate to="/login" />;
  if (deveTrocarSenha) return <Navigate to="/trocar-senha" />;
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/dashboard" />;

  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/trocar-senha" element={<TrocarSenha />} />
        <Route path="/esqueci-senha" element={<EsqueciSenha />} />

        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="metas" element={<ProtectedRoute roles={['ADMIN']}><Metas /></ProtectedRoute>} />
          <Route path="projetos" element={<ProtectedRoute roles={['ADMIN', 'GESTOR']}><Projetos /></ProtectedRoute>} />
          <Route path="indicadores" element={<ProtectedRoute roles={['ADMIN', 'GESTOR', 'OPERADOR']}><Indicadores /></ProtectedRoute>} />
          <Route path="responsaveis" element={<ProtectedRoute roles={['ADMIN', 'GESTOR']}><Responsaveis /></ProtectedRoute>} />
          <Route path="relatorios" element={<ProtectedRoute roles={['ADMIN', 'GESTOR']}><Relatorios /></ProtectedRoute>} />
          <Route path="usuarios" element={<ProtectedRoute roles={['ADMIN']}><Usuarios /></ProtectedRoute>} />
          <Route path="auditoria" element={<ProtectedRoute roles={['ADMIN']}><Auditoria /></ProtectedRoute>} />
          <Route path="configuracoes" element={<ProtectedRoute roles={['ADMIN']}><Configuracoes /></ProtectedRoute>} />
        </Route>
      </Routes>
    </Suspense>
  );
};

export const AppRouter = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ErrorBoundary>
  );
};
