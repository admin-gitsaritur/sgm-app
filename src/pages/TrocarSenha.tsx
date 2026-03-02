import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Lock, AlertCircle, CheckCircle2 } from 'lucide-react';

export const TrocarSenha = () => {
    const [senhaAtual, setSenhaAtual] = useState('');
    const [senhaNova, setSenhaNova] = useState('');
    const [senhaConfirm, setSenhaConfirm] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { user } = useAuthStore();

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
        setError(''); setLoading(true);
        try {
            await api('/auth/trocar-senha', { method: 'POST', body: JSON.stringify({ senhaAtual, senhaNova }) });
            navigate('/dashboard');
        } catch (err: any) { setError(err.message); }
        finally { setLoading(false); }
    };

    return (
        <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 max-w-md w-full">
                <div className="text-center mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-3">
                        <Lock className="w-7 h-7 text-amber-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-[#4E3205]">Trocar Senha</h1>
                    <p className="text-gray-500 text-sm mt-1">Sua senha precisa ser atualizada por segurança.</p>
                </div>

                {error && (
                    <div className="bg-red-50 border-l-4 border-red-400 p-3 rounded mb-4 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-[#4E3205] mb-1">Senha Atual</label>
                        <input type="password" required value={senhaAtual} onChange={e => setSenhaAtual(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-[#F37137] focus:border-[#F37137]" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#4E3205] mb-1">Nova Senha</label>
                        <input type="password" required value={senhaNova} onChange={e => setSenhaNova(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-[#F37137] focus:border-[#F37137]" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#4E3205] mb-1">Confirmar Nova Senha</label>
                        <input type="password" required value={senhaConfirm} onChange={e => setSenhaConfirm(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-[#F37137] focus:border-[#F37137]" />
                    </div>

                    <div className="bg-gray-50 rounded-xl p-3 space-y-1.5">
                        {requisitos.map((r, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs">
                                <CheckCircle2 size={14} className={r.ok ? 'text-emerald-500' : 'text-gray-300'} />
                                <span className={r.ok ? 'text-emerald-700' : 'text-gray-500'}>{r.label}</span>
                            </div>
                        ))}
                    </div>

                    <button type="submit" disabled={!todosOk || loading}
                        className="w-full py-3 bg-[#F37137] text-white text-sm font-medium rounded-xl hover:bg-[#d95f27] disabled:opacity-50 transition-colors">
                        {loading ? 'Alterando...' : 'Alterar Senha'}
                    </button>
                </form>
            </div>
        </div>
    );
};
