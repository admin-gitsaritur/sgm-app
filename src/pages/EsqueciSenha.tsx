import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';

export const EsqueciSenha = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const BASE = import.meta.env.PROD ? '' : '';
      const res = await fetch(`${BASE}/api/auth/esqueci-senha`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erro ao processar solicitação');
      } else {
        setEnviado(true);
      }
    } catch {
      setError('Erro de conexão com o servidor');
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
            Recuperação de Acesso.
          </h1>
          <p className="text-lg text-white/80 leading-relaxed font-light">
            Enviaremos instruções detalhadas e uma senha temporária em seu e-mail corporativo para você retomar o acesso.
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
            {enviado ? (
              <motion.div 
                key="sucesso"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-8 h-8 text-emerald-500" />
                </div>
                <h2 className="text-2xl font-bold text-[#4E3205] mb-3 tracking-tight">E-mail Enviado!</h2>
                <p className="text-[#4E3205]/70 mb-8 leading-relaxed">
                  Você receberá uma senha temporária em instantes nas suas mensagens.
                  Use-a para acessar a plataforma e cadastrar uma nova senha definitiva.
                </p>
                
                <Button 
                  type="button" 
                  size="lg" 
                  className="w-full rounded-xl shadow-md bg-[#F37137] hover:bg-[#F37137]/90 transition-colors !py-3.5"
                  onClick={() => navigate('/login')}
                >
                  Voltar ao Login
                </Button>
              </motion.div>
            ) : (
              <motion.div 
                key="form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                <div className="mb-8 sm:mb-10 text-center lg:text-left">
                  <h2 className="text-3xl sm:text-[34px] font-extrabold text-[#4E3205] tracking-tight mb-2.5">
                    Esqueci a senha
                  </h2>
                  <p className="text-[#4E3205]/70 text-base">
                    Informe seu e-mail corporativo para receber as instruções de recuperação.
                  </p>
                </div>

                {error && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50 border border-red-100 p-3.5 rounded-xl mb-6 flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-700 font-medium">{error}</p>
                  </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center ml-1">
                      <Label htmlFor="email" className="text-[#4E3205] uppercase tracking-wider text-[11px] font-bold">E-mail corporativo</Label>
                    </div>
                    <Input
                      id="email"
                      type="email"
                      required
                      placeholder="nome@saritur.com.br"
                      leftIcon={<Mail size={18} className="text-brown/40" />}
                      size="lg"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="border-gray-200 text-brown rounded-xl focus:ring-primary/20 shadow-sm"
                    />
                  </div>

                  <Button type="submit" isLoading={loading} size="lg" className="w-full !py-3.5 mt-2 rounded-xl shadow-md bg-[#F37137] hover:bg-[#F37137]/90 transition-colors" rightIcon={<Send size={18} />}>
                    Enviar Senha Temporária
                  </Button>

                  <div className="text-center md:pt-4 pt-6 flex flex-col items-center">
                    <button 
                      type="button"
                      onClick={() => navigate('/login')}
                      className="inline-flex items-center gap-2 text-[15px] font-medium text-[#4E3205]/60 hover:text-[#4E3205] transition-colors"
                    >
                      <ArrowLeft size={16} /> Voltar
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
