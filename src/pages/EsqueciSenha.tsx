import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Send, CheckCircle } from 'lucide-react';
import { Spinner } from '../components/ui/spinner';

export const EsqueciSenha = () => {
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
        <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
            {/* Background blobs */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-amber-400/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="w-full max-w-md relative z-10">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-brown font-bold text-2xl tracking-tight">
                        Saritur<span className="text-primary">SGM</span>
                    </h1>
                    <p className="text-brown/50 text-sm mt-1">Sistema de Gestão de Metas</p>
                </div>

                <div className="bg-white rounded-2xl shadow-[0_8px_32px_rgba(78,50,5,0.06)] border border-stone-100/50 p-8">
                    {enviado ? (
                        /* Success state */
                        <div className="text-center py-4">
                            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-8 h-8 text-emerald-500" />
                            </div>
                            <h2 className="text-xl font-bold text-brown mb-2">Email Enviado!</h2>
                            <p className="text-brown/50 text-sm mb-6">
                                Se o email estiver cadastrado, você receberá uma senha temporária.
                                Use-a para fazer login e crie uma nova senha.
                            </p>
                            <Link
                                to="/login"
                                className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary/90 transition-all"
                            >
                                <ArrowLeft size={16} />
                                Voltar ao Login
                            </Link>
                        </div>
                    ) : (
                        /* Form state */
                        <>
                            <div className="mb-6">
                                <h2 className="text-xl font-bold text-brown mb-1">Esqueci minha senha</h2>
                                <p className="text-brown/50 text-sm">
                                    Informe seu email cadastrado e enviaremos uma senha temporária.
                                </p>
                            </div>

                            {error && (
                                <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-4 py-3 mb-4">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-brown mb-1.5">Email corporativo</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brown/30" />
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="seu.email@saritur.com.br"
                                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 text-sm text-brown placeholder:text-stone-300 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || !email}
                                    className="w-full bg-primary text-white font-semibold py-3 rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <Spinner size="sm" className="text-white" />
                                    ) : (
                                        <>
                                            <Send size={16} />
                                            Enviar Senha Temporária
                                        </>
                                    )}
                                </button>
                            </form>

                            <div className="mt-6 text-center">
                                <Link to="/login" className="text-primary text-sm font-medium hover:underline inline-flex items-center gap-1">
                                    <ArrowLeft size={14} />
                                    Voltar ao login
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
