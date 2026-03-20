import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Lock, ShieldCheck, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

export const TrocarSenha = () => {
    const [senhaAtual, setSenhaAtual] = useState('');
    const [senhaNova, setSenhaNova] = useState('');
    const [senhaConfirm, setSenhaConfirm] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { user, clearDeveTrocarSenha } = useAuthStore();

    const requisitos = [
        { label: 'Mínimo 10 caracteres', ok: senhaNova.length >= 10 },
        { label: '1 letra maiúscula', ok: /[A-Z]/.test(senhaNova) },
        { label: '1 letra minúscula', ok: /[a-z]/.test(senhaNova) },
        { label: '1 número', ok: /[0-9]/.test(senhaNova) },
        { label: '1 caractere especial', ok: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(senhaNova) },
        { label: 'Confirmação confere', ok: senhaNova === senhaConfirm && senhaNova.length > 0 },
    ];

    const todosOk = requisitos.every(r => r.ok);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!todosOk) return;
        setError('');
        setLoading(true);
        try {
            await api('/auth/trocar-senha', { method: 'POST', body: JSON.stringify({ senhaAtual, senhaNova }) });
            clearDeveTrocarSenha();
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.message);
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
                        Atualize sua senha.
                    </h1>
                    <p className="text-lg text-white/80 leading-relaxed font-light">
                        Por segurança, sua senha precisa ser atualizada antes de acessar o sistema.
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
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 mx-auto lg:mx-0">
                            <ShieldCheck className="w-6 h-6 text-primary" />
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-brown mb-1.5 tracking-tight">Trocar Senha</h2>
                        <p className="text-sm sm:text-base text-brown/60">Sua senha precisa ser atualizada por segurança.</p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-400 p-3 rounded mb-4 flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
                        {/* Senha Atual */}
                        <div className="space-y-2">
                            <Label htmlFor="senhaAtual" className="ml-1 text-primary uppercase tracking-wider text-xs font-bold">Senha Atual</Label>
                            <Input
                                id="senhaAtual"
                                type="password"
                                autoComplete="current-password"
                                required
                                placeholder="••••••••"
                                leftIcon={<Lock />}
                                size="lg"
                                value={senhaAtual}
                                onChange={e => setSenhaAtual(e.target.value)}
                            />
                        </div>

                        {/* Nova Senha */}
                        <div className="space-y-2">
                            <Label htmlFor="senhaNova" className="ml-1 text-primary uppercase tracking-wider text-xs font-bold">Nova Senha</Label>
                            <Input
                                id="senhaNova"
                                type="password"
                                autoComplete="new-password"
                                required
                                placeholder="••••••••"
                                leftIcon={<Lock />}
                                size="lg"
                                value={senhaNova}
                                onChange={e => setSenhaNova(e.target.value)}
                            />
                        </div>

                        {/* Confirmar */}
                        <div className="space-y-2">
                            <Label htmlFor="senhaConfirm" className="ml-1 text-primary uppercase tracking-wider text-xs font-bold">Confirmar Nova Senha</Label>
                            <Input
                                id="senhaConfirm"
                                type="password"
                                autoComplete="new-password"
                                required
                                placeholder="••••••••"
                                leftIcon={<Lock />}
                                size="lg"
                                value={senhaConfirm}
                                onChange={e => setSenhaConfirm(e.target.value)}
                            />
                        </div>

                        {/* Requisitos */}
                        <div className="bg-stone-100 rounded-xl p-4 space-y-2">
                            {requisitos.map((r, i) => (
                                <div key={i} className="flex items-center gap-2 text-xs">
                                    <CheckCircle2
                                        size={14}
                                        className={`transition-colors ${r.ok ? 'text-emerald-500' : 'text-stone-300'}`}
                                    />
                                    <span className={`transition-colors ${r.ok ? 'text-emerald-700 font-medium' : 'text-stone-500'}`}>
                                        {r.label}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Submit */}
                        <Button
                            type="submit"
                            disabled={!todosOk}
                            isLoading={loading}
                            size="lg"
                            className="w-full !py-3 sm:!py-3.5"
                            rightIcon={<ArrowRight size={18} />}
                        >
                            Alterar Senha
                        </Button>

                        {/* Voltar */}
                        <Button
                            type="button"
                            variant="ghost"
                            size="lg"
                            className="w-full"
                            onClick={() => navigate('/login')}
                        >
                            Voltar
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
