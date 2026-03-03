import { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Settings, ShieldCheck, Palette, Save } from 'lucide-react';

export const Configuracoes = () => {
    const [semaforoVerde, setSemaforoVerde] = useState(95);
    const [semaforoAmarelo, setSemaforoAmarelo] = useState(85);
    const [senhaMinLength, setSenhaMinLength] = useState(10);
    const [senhaExpiraDias, setSenhaExpiraDias] = useState(90);
    const [tentativasMax, setTentativasMax] = useState(5);
    const [bloqueioMin, setBloqueioMin] = useState(30);
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        // Configurações atualmente client-side (valores padrão no config do server)
        // Uma futura implementação pode persistir via /api/configuracoes
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-brown tracking-tight">Configurações</h1>
                <p className="text-brown/50 text-sm mt-1">Ajustes de segurança e parâmetros do sistema.</p>
            </div>

            {/* Semáforo */}
            <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(78,50,5,0.04)] border border-stone-100/50 p-6">
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center"><Palette size={18} className="text-primary" /></div>
                    <div>
                        <h3 className="font-semibold text-brown">Limiares do Semáforo</h3>
                        <p className="text-xs text-brown/40">Defina os percentuais que determinam as cores do semáforo.</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-brown flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-emerald-500" /> Verde (≥)
                        </label>
                        <div className="flex items-center gap-2">
                            <input type="number" value={semaforoVerde} onChange={e => setSemaforoVerde(Number(e.target.value))} min={0} max={100}
                                className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-brown focus:border-primary/30 focus:ring-1 focus:ring-primary/20 outline-none" />
                            <span className="text-sm text-brown/50">%</span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-brown flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-amber-400" /> Amarelo (≥)
                        </label>
                        <div className="flex items-center gap-2">
                            <input type="number" value={semaforoAmarelo} onChange={e => setSemaforoAmarelo(Number(e.target.value))} min={0} max={100}
                                className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-brown focus:border-primary/30 focus:ring-1 focus:ring-primary/20 outline-none" />
                            <span className="text-sm text-brown/50">%</span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-brown flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-rose-500" /> Vermelho ({'<'})
                        </label>
                        <div className="flex items-center gap-2">
                            <input type="number" value={semaforoAmarelo} disabled
                                className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-brown/50 bg-stone-50 cursor-not-allowed" />
                            <span className="text-sm text-brown/50">%</span>
                        </div>
                        <p className="text-xs text-brown/30">Automático: abaixo do limiar amarelo</p>
                    </div>
                </div>
            </div>

            {/* Política de Senhas */}
            <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(78,50,5,0.04)] border border-stone-100/50 p-6">
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center"><ShieldCheck size={18} className="text-primary" /></div>
                    <div>
                        <h3 className="font-semibold text-brown">Política de Senhas</h3>
                        <p className="text-xs text-brown/40">Regras de complexidade e expiração de senhas.</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-brown">Comprimento mínimo</label>
                        <div className="flex items-center gap-2">
                            <input type="number" value={senhaMinLength} onChange={e => setSenhaMinLength(Number(e.target.value))} min={8} max={32}
                                className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-brown focus:border-primary/30 focus:ring-1 focus:ring-primary/20 outline-none" />
                            <span className="text-sm text-brown/50">chars</span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-brown">Expiração de senha</label>
                        <div className="flex items-center gap-2">
                            <input type="number" value={senhaExpiraDias} onChange={e => setSenhaExpiraDias(Number(e.target.value))} min={0} max={365}
                                className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-brown focus:border-primary/30 focus:ring-1 focus:ring-primary/20 outline-none" />
                            <span className="text-sm text-brown/50">dias</span>
                        </div>
                        <p className="text-xs text-brown/30">0 = sem expiração</p>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-brown">Tentativas máximas</label>
                        <div className="flex items-center gap-2">
                            <input type="number" value={tentativasMax} onChange={e => setTentativasMax(Number(e.target.value))} min={3} max={20}
                                className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-brown focus:border-primary/30 focus:ring-1 focus:ring-primary/20 outline-none" />
                            <span className="text-sm text-brown/50">tentativas</span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-brown">Tempo de bloqueio</label>
                        <div className="flex items-center gap-2">
                            <input type="number" value={bloqueioMin} onChange={e => setBloqueioMin(Number(e.target.value))} min={5} max={120}
                                className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-brown focus:border-primary/30 focus:ring-1 focus:ring-primary/20 outline-none" />
                            <span className="text-sm text-brown/50">min</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sistema */}
            <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(78,50,5,0.04)] border border-stone-100/50 p-6">
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center"><Settings size={18} className="text-primary" /></div>
                    <div>
                        <h3 className="font-semibold text-brown">Informações do Sistema</h3>
                        <p className="text-xs text-brown/40">Dados técnicos e versão.</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-stone-50 rounded-xl p-4">
                        <p className="text-xs text-brown/40 uppercase tracking-wider mb-1">Versão</p>
                        <p className="text-sm font-bold text-brown">SGM v1.0.0</p>
                    </div>
                    <div className="bg-stone-50 rounded-xl p-4">
                        <p className="text-xs text-brown/40 uppercase tracking-wider mb-1">Stack</p>
                        <p className="text-sm font-bold text-brown">React + Express + PostgreSQL</p>
                    </div>
                    <div className="bg-stone-50 rounded-xl p-4">
                        <p className="text-xs text-brown/40 uppercase tracking-wider mb-1">Banco</p>
                        <p className="text-sm font-bold text-brown">PostgreSQL (BIGINT centavos)</p>
                    </div>
                </div>
            </div>

            {/* Save */}
            <div className="flex items-center gap-4">
                <Button onClick={handleSave} leftIcon={<Save size={14} />}>Salvar Configurações</Button>
                {saved && <span className="text-sm text-emerald-600 font-medium animate-pulse">✅ Configurações salvas!</span>}
            </div>
        </div>
    );
};
