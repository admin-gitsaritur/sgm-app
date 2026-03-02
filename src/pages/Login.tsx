import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Target, AlertCircle, Eye, EyeOff } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (res.success) {
        login(res.data.user, res.data.token, res.data.refreshToken, res.data.deveTrocarSenha);
        if (res.data.deveTrocarSenha) {
          navigate('/trocar-senha');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#FAFAFA]">
      {/* Left panel — brand */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#4E3205] via-[#6B4507] to-[#4E3205] items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0aDR2MWgtNHYtMXptMC00aDR2MWgtNHYtMXptMC00aDR2MWgtNHYtMXoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
        <div className="text-center z-10 px-8">
          <div className="w-20 h-20 rounded-2xl bg-[#F37137] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-[#F37137]/30">
            <Target className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-3">SGM</h1>
          <p className="text-xl text-amber-200 mb-2">Sistema de Gestão de Metas</p>
          <p className="text-white/60">Saritur Transportes</p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 text-center">
            <div className="w-14 h-14 rounded-xl bg-[#F37137] flex items-center justify-center mx-auto mb-3">
              <Target className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-[#4E3205]">SGM</h1>
            <p className="text-gray-500">Sistema de Gestão de Metas</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-[#4E3205] mb-1">Bem-vindo de volta</h2>
            <p className="text-gray-500 mb-6 text-sm">Entre com suas credenciais para acessar o sistema</p>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-3 rounded mb-4 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#4E3205] mb-1.5">Email</label>
                <input id="email" type="email" autoComplete="email" required
                  placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#F37137] focus:border-[#F37137] transition-colors" />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-[#4E3205] mb-1.5">Senha</label>
                <div className="relative">
                  <input id="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required
                    placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-12 text-sm focus:ring-2 focus:ring-[#F37137] focus:border-[#F37137] transition-colors" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-3 bg-[#F37137] text-white font-medium rounded-xl hover:bg-[#d95f27] disabled:opacity-50 transition-all active:scale-[0.99] shadow-lg shadow-[#F37137]/20">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Entrando...
                  </span>
                ) : 'Entrar'}
              </button>
            </form>
          </div>
          <p className="text-center text-xs text-gray-400 mt-6">Saritur Transportes © {new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  );
};
