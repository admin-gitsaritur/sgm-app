import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
        navigate(res.data.deveTrocarSenha ? '/trocar-senha' : '/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col lg:flex-row selection:bg-primary/20 selection:text-brown">

      {/* Lado Esquerdo — Branding (desktop only) */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-primary to-primary/80 relative overflow-hidden items-center justify-center p-12">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-saritur-yellow/20 rounded-full blur-3xl" />

        <div className="relative z-10 text-white max-w-lg">
          <img
            src="/brands/iso_saritur_branco.svg"
            alt="Saritur"
            className="w-48 h-auto mb-6"
          />
          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            Sistema de gestão de metas.
          </h1>
          <p className="text-lg text-white/80 leading-relaxed font-light">
            Acesse o SGM para acompanhar metas estratégicas, indicadores de performance e resultados.
          </p>
        </div>
      </div>

      {/* Lado Direito — Formulário */}
      <div className="w-full lg:w-1/2 flex flex-1 items-center justify-center bg-stone-50 px-5 py-10 sm:p-12 relative">

        {/* Logo mobile */}
        <div className="absolute top-6 left-5 sm:left-8 lg:hidden flex items-center gap-2.5">
          <img
            src="/brands/iso_saritur_laranja.svg"
            alt="Saritur"
            className="w-9 h-9 rounded-lg"
          />
          <span className="font-bold text-brown text-lg tracking-tight">SGM</span>
        </div>

        <div className="w-full max-w-md mt-10 lg:mt-0">
          <div className="mb-8 sm:mb-10 text-center lg:text-left">
            <h2 className="text-2xl sm:text-3xl font-bold text-brown mb-1.5 tracking-tight">Bem-vindo!</h2>
            <p className="text-sm sm:text-base text-brown/60">Insira suas credenciais para acessar o painel.</p>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-3 rounded mb-4 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5 sm:space-y-6">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="ml-1 text-primary uppercase tracking-wider text-xs font-bold">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                required
                placeholder="nome@saritur.com.br"
                leftIcon={<Mail />}
                size="lg"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            {/* Senha */}
            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <Label htmlFor="password" className="text-primary uppercase tracking-wider text-xs font-bold">Senha</Label>
                <button type="button" className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors">
                  Esqueceu a senha?
                </button>
              </div>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
                leftIcon={<Lock />}
                size="lg"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            {/* Submit */}
            <Button type="submit" isLoading={loading} size="lg" className="w-full !py-3 sm:!py-3.5" rightIcon={<ArrowRight size={18} />}>
              Entrar na conta
            </Button>
          </form>

          <div className="mt-8 sm:mt-10 text-center text-sm text-brown/50">
            <p>Saritur © {new Date().getFullYear()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
