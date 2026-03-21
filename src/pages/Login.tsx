import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Mail, Lock, ArrowRight, AlertCircle, ArrowLeft } from 'lucide-react';
import { useGoogleLogin, googleLogout } from '@react-oauth/google';
import { motion, AnimatePresence } from 'framer-motion';

type LoginMethod = 'choose' | 'email' | 'unregistered_error';

export const Login = () => {
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('choose');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleEmailLogin = async (e: React.FormEvent) => {
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

  const googleLogin = useGoogleLogin({
    flow: 'implicit',
    onSuccess: async (tokenResponse) => {
      setError('');
      setLoading(true);
      try {
        const res = await api('/auth/google', {
          method: 'POST',
          body: JSON.stringify({ accessToken: tokenResponse.access_token }),
        });

        if (res.success) {
          login(res.data.user, res.data.token, res.data.refreshToken, res.data.deveTrocarSenha);
          navigate('/dashboard');
        }
      } catch (err: any) {
        if (err.message && err.message.includes('não cadastrado')) {
          setLoginMethod('unregistered_error');
        } else {
          setError(err.message || 'Erro ao autenticar com Google');
        }
      } finally {
        setLoading(false);
      }
    },
    onError: () => {
      setError('Ocorreu um problema ao comunicar com os servidores do Google.');
    },
  });

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
            <span className="font-bold text-[#4E3205] text-lg tracking-tight">SGM</span>
          </div>

          <div className="w-full max-w-md mt-10 lg:mt-0">
            <AnimatePresence mode="wait">
              {/* ESTADO: ERRO DE NÃO CADASTRADO */}
              {loginMethod === 'unregistered_error' && (
                <motion.div 
                  key="error"
                  initial={{ opacity: 0, x: -20, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, x: 20, filter: 'blur(4px)' }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="text-center"
                >
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-[#4E3205] mb-3 tracking-tight">Acesso Bloqueado</h2>
                  <p className="text-[#4E3205]/70 mb-8 leading-relaxed">
                    Seu e-mail do Google fornecido não possui conta vinculada na base de dados SGM. 
                    Por favor, entre em contato com a administração do sistema para solicitar um acesso com este e-mail.
                  </p>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="lg" 
                    className="w-full border-gray-300 text-brown shadow-sm"
                    onClick={() => {
                      setLoginMethod('choose');
                      setError('');
                    }}
                  >
                    Voltar para o Início
                  </Button>
                </motion.div>
              )}

              {/* State: Google Button First */}
              {loginMethod === 'choose' && (
                <motion.div 
                  key="choose"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                >
                  <div className="mb-8 sm:mb-10 text-center lg:text-left">
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-[#4E3205] mb-2 tracking-tight">Bem-vindo</h2>
                    <p className="text-sm sm:text-base text-[#4E3205]/60">Escolha como deseja entrar na plataforma.</p>
                  </div>

                  {error && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50 border border-red-100 p-3.5 rounded-xl mb-6 flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-red-700 font-medium">{error}</p>
                    </motion.div>
                  )}

                  <div className="space-y-6">
                    <button
                      type="button"
                      onClick={() => googleLogin()}
                      disabled={loading}
                      className="group w-full flex items-center justify-center gap-3 min-h-[56px] bg-white border border-gray-100 rounded-[32px] shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_30px_rgba(243,113,55,0.12)] hover:border-primary/30 transition-all duration-300 cursor-pointer disabled:opacity-60"
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      <span className="text-[17px] font-bold text-[#334155] group-hover:text-primary transition-colors duration-300">Entrar com Google</span>
                    </button>

                    <div className="flex items-center gap-4 my-8">
                      <div className="h-[1px] bg-gray-200 flex-1" />
                      <span className="text-[12px] font-medium tracking-widest text-[#A08E77] uppercase">
                        OU ENTRE COM E-MAIL
                      </span>
                      <div className="h-[1px] bg-gray-200 flex-1" />
                    </div>

                    <div className="text-center pb-2">
                      <button 
                        type="button"
                        onClick={() => setLoginMethod('email')}
                        className="text-[16px] font-medium text-[#8B7355] hover:text-primary transition-colors focus:outline-none"
                      >
                        Prefiro usar e-mail e senha
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* State: Form de E-mail/Senha */}
              {loginMethod === 'email' && (
                <motion.div 
                  key="email"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                >
                  <div className="mb-8 sm:mb-10 text-center lg:text-left">
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-[#4E3205] mb-2 tracking-tight">Bem-vindo</h2>
                    <p className="text-sm sm:text-base text-[#4E3205]/60">Login com E-mail corporativo.</p>
                  </div>

                  {error && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50 border border-red-100 p-3.5 rounded-xl mb-6 flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-red-700 font-medium">{error}</p>
                    </motion.div>
                  )}

                  <form onSubmit={handleEmailLogin} className="space-y-5 sm:space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="ml-1 text-[#4E3205] uppercase tracking-wider text-[11px] font-bold">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        autoComplete="email"
                        required
                        placeholder="nome@saritur.com.br"
                        leftIcon={<Mail size={18} className="text-brown/40" />}
                        size="lg"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="border-gray-200 text-brown rounded-xl focus:ring-primary/20 shadow-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center ml-1">
                        <Label htmlFor="password" className="text-[#4E3205] uppercase tracking-wider text-[11px] font-bold">Senha</Label>
                      </div>
                      <Input
                        id="password"
                        type="password"
                        autoComplete="current-password"
                        required
                        placeholder="••••••••"
                        leftIcon={<Lock size={18} className="text-brown/40" />}
                        size="lg"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="border-gray-200 text-brown rounded-xl focus:ring-primary/20 shadow-sm"
                      />
                    </div>

                    <Button type="submit" isLoading={loading} size="lg" className="w-full !py-3.5 mt-2 rounded-xl shadow-md bg-[#F37137] hover:bg-[#F37137]/90 transition-colors" rightIcon={<ArrowRight size={18} />}>
                      Entrar na conta
                    </Button>

                    <div className="text-center md:pt-4 pt-6 flex flex-col gap-6 items-center">
                      <button 
                        type="button" 
                        onClick={() => navigate('/esqueci-senha')} 
                        tabIndex={-1} 
                        className="text-[14px] font-medium text-[#8B7355] hover:text-primary transition-colors focus:outline-none"
                      >
                        Esqueci minha senha
                      </button>

                      <button 
                        type="button"
                        onClick={() => {
                           setLoginMethod('choose');
                           setError('');
                        }}
                        className="inline-flex items-center gap-2 text-[15px] font-medium text-[#4E3205]/60 hover:text-[#4E3205] transition-colors"
                      >
                        <ArrowLeft size={16} /> Voltar aos métodos
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>


            <div className="mt-12 text-center text-xs font-medium tracking-wide text-[#4E3205]/40">
              <p>Saritur © {new Date().getFullYear()}</p>
            </div>
          </div>
        </div>
      </div>
  );
};
