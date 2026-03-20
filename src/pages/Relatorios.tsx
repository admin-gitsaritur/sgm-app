import { useState } from 'react';
import { api } from '../services/api';
import { Button } from '../components/ui/button';
import { useAuthStore } from '../store/authStore';
import { FileText, Download, AlertTriangle, RefreshCw, Calendar, TrendingUp, Target, Users } from 'lucide-react';

const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const formatCurrency = (centavos: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(centavos / 100);

const SemaforoDot = ({ status }: { status: string }) => {
    const colors: Record<string, string> = { VERDE: 'bg-emerald-500', AMARELO: 'bg-amber-400', VERMELHO: 'bg-rose-500' };
    return <span className={`inline-block w-2.5 h-2.5 rounded-full ${colors[status] || 'bg-stone-300'}`} />;
};

export const Relatorios = () => {
    const { token } = useAuthStore();
    const [mes, setMes] = useState(new Date().getMonth() + 1);
    const [ano, setAno] = useState(new Date().getFullYear());
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [error, setError] = useState('');

    const gerarPreview = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await api(`/relatorios/preview?mes=${mes}&ano=${ano}`);
            if (res.success) setReport(res.data);
        } catch (err: any) { setError(err.message); }
        finally { setLoading(false); }
    };

    const exportarPdf = async () => {
        setExporting(true);
        try {
            const res = await fetch(`/api/relatorios/exportar?mes=${mes}&ano=${ano}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `relatorio-sgm-${meses[mes - 1]}-${ano}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err: any) { setError(err.message); }
        finally { setExporting(false); }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-brown tracking-tight">Relatórios</h1>
                <p className="text-brown/50 text-sm mt-1">Gere o relatório mensal do ritual de governança.</p>
            </div>

            {/* Seleção de período */}
            <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(78,50,5,0.04)] border border-stone-100/50 p-6">
                <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-brown/40" />
                        <select value={mes} onChange={e => setMes(Number(e.target.value))} className="border border-stone-200 rounded-xl px-3 py-2 text-sm text-brown bg-white focus:border-primary/30 focus:ring-1 focus:ring-primary/20 outline-none">
                            {meses.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                        </select>
                        <select value={ano} onChange={e => setAno(Number(e.target.value))} className="border border-stone-200 rounded-xl px-3 py-2 text-sm text-brown bg-white focus:border-primary/30 focus:ring-1 focus:ring-primary/20 outline-none">
                            {[2024, 2025, 2026, 2027].map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                    </div>
                    <Button onClick={gerarPreview} isLoading={loading} leftIcon={<RefreshCw size={14} />}>Gerar Preview</Button>
                    {report && (
                        <Button onClick={exportarPdf} variant="secondary" isLoading={exporting} leftIcon={<Download size={14} />}>Exportar PDF</Button>
                    )}
                </div>
            </div>

            {error && (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                    <p className="text-rose-700 text-sm">{error}</p>
                </div>
            )}

            {/* Preview */}
            {report && (
                <div className="space-y-6">
                    {/* Summary cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(78,50,5,0.04)] border border-stone-100/50 p-5">
                            <div className="flex items-center gap-2 mb-2"><Target size={16} className="text-primary" /><span className="text-xs text-brown/50 uppercase">Metas Ativas</span></div>
                            <p className="text-2xl font-bold text-brown">{report.metas.length}</p>
                        </div>
                        <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(78,50,5,0.04)] border border-stone-100/50 p-5">
                            <div className="flex items-center gap-2 mb-2"><FileText size={16} className="text-primary" /><span className="text-xs text-brown/50 uppercase">Projetos</span></div>
                            <p className="text-2xl font-bold text-brown">{report.totalProjetos}</p>
                        </div>
                        <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(78,50,5,0.04)] border border-stone-100/50 p-5">
                            <div className="flex items-center gap-2 mb-2"><TrendingUp size={16} className="text-primary" /><span className="text-xs text-brown/50 uppercase">Abaixo 85%</span></div>
                            <p className={`text-2xl font-bold ${report.projetosAbaixo.length > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{report.projetosAbaixo.length}</p>
                        </div>
                        <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(78,50,5,0.04)] border border-stone-100/50 p-5">
                            <div className="flex items-center gap-2 mb-2"><Users size={16} className="text-primary" /><span className="text-xs text-brown/50 uppercase">Ind. Atrasados</span></div>
                            <p className={`text-2xl font-bold ${report.indicadoresAtrasados.length > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{report.indicadoresAtrasados.length}</p>
                        </div>
                    </div>

                    {/* 1. Status Consolidado */}
                    <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(78,50,5,0.04)] border border-stone-100/50 p-6">
                        <h3 className="text-sm font-semibold text-brown mb-4">1. Status Consolidado das Metas</h3>
                        <div className="space-y-3">
                            {report.metas.map((meta: any, i: number) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-stone-50/50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <SemaforoDot status={meta.semaforo} />
                                        <span className="font-medium text-brown text-sm">{meta.nome}</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm">
                                        <span className="text-brown/60">{meta.percentualAtingimento.toFixed(1)}%</span>
                                        <span className="text-brown font-medium">{formatCurrency(meta.realizadoCentavos)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 2. Projetos abaixo */}
                    <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(78,50,5,0.04)] border border-stone-100/50 p-6">
                        <h3 className="text-sm font-semibold text-brown mb-4">2. Projetos Abaixo de 85%</h3>
                        {report.projetosAbaixo.length === 0
                            ? <p className="text-sm text-brown/50">Nenhum projeto abaixo de 85%. ✅</p>
                            : <div className="space-y-2">
                                {report.projetosAbaixo.map((p: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between p-3 bg-rose-50/50 rounded-xl">
                                        <span className="text-sm font-medium text-brown">{p.nome} <span className="text-brown/40">({p.metaNome})</span></span>
                                        <span className="text-sm font-bold text-rose-600">{p.percentualExecucao.toFixed(1)}%</span>
                                    </div>
                                ))}
                            </div>
                        }
                    </div>

                    {/* 3. Indicadores atrasados */}
                    <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(78,50,5,0.04)] border border-stone-100/50 p-6">
                        <h3 className="text-sm font-semibold text-brown mb-4">3. Indicadores Atrasados</h3>
                        {report.indicadoresAtrasados.length === 0
                            ? <p className="text-sm text-brown/50">Todos os indicadores atualizados no prazo. ✅</p>
                            : <div className="space-y-2">
                                {report.indicadoresAtrasados.map((ind: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between p-3 bg-amber-50/50 rounded-xl">
                                        <span className="text-sm font-medium text-brown">{ind.nome} <span className="text-brown/40">({ind.projetoNome})</span></span>
                                        <span className="text-xs text-brown/50">{ind.responsavelNome}</span>
                                    </div>
                                ))}
                            </div>
                        }
                    </div>

                    {/* 5. Piores performances */}
                    {report.pioresPerformances.length > 0 && (
                        <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(78,50,5,0.04)] border border-stone-100/50 p-6">
                            <h3 className="text-sm font-semibold text-brown mb-4">4. Top 5 — Menor Score de Confiabilidade</h3>
                            <div className="space-y-2">
                                {report.pioresPerformances.map((r: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between p-3 bg-stone-50/50 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-bold text-brown/40 w-5 text-center">{i + 1}</span>
                                            <span className="text-sm font-medium text-brown">{r.nome}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm">
                                            <span className="text-brown/50">Atrasados: {r.atrasados}</span>
                                            <span className={`font-bold ${r.score >= 60 ? 'text-amber-600' : 'text-rose-600'}`}>{r.score.toFixed(1)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
