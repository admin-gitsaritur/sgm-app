import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Button } from '../components/ui/button';
import { CardSkeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { Users, AlertTriangle, Trophy, TrendingUp, Clock, DollarSign, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

const formatCurrency = (centavos: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(centavos / 100);

const ScoreBadge = ({ score }: { score: number }) => {
    const color = score >= 80 ? 'bg-emerald-50 text-emerald-700' : score >= 60 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700';
    return <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-sm font-bold ${color}`}>{score.toFixed(1)}</span>;
};

export const Responsaveis = () => {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await api('/responsaveis');
            if (res.success) setData(res.data);
        } catch (err: any) { setError(err.message); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    if (loading) return (
        <div className="space-y-6">
            <h1 className="text-2xl font-semibold text-brown tracking-tight">Performance de Responsáveis</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[1, 2, 3, 4].map(i => <CardSkeleton key={i} />)}</div>
        </div>
    );

    if (error) return (
        <div className="space-y-6">
            <h1 className="text-2xl font-semibold text-brown tracking-tight">Performance de Responsáveis</h1>
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 text-center">
                <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
                <p className="text-rose-700 font-medium mb-4">{error}</p>
                <Button onClick={fetchData} variant="destructive" size="sm" leftIcon={<RefreshCw size={14} />}>Tentar novamente</Button>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-brown tracking-tight">Performance de Responsáveis</h1>
                    <p className="text-brown/50 text-sm mt-1">Ranking por score de confiabilidade.</p>
                </div>
                <Button variant="secondary" size="sm" onClick={fetchData} leftIcon={<RefreshCw size={14} />}>Atualizar</Button>
            </div>

            {data.length === 0 ? (
                <EmptyState icon={<Users className="w-8 h-8 text-stone-400" />} title="Nenhum responsável com indicadores" description="Atribua indicadores aos responsáveis para ver a performance." />
            ) : (
                <div className="space-y-4">
                    {data.map((item: any, idx: number) => {
                        const isExpanded = expandedId === item.user.id;
                        const radarData = [
                            { metric: 'Pontualidade', value: item.radar.pontualidade },
                            { metric: 'Atingimento', value: item.radar.atingimento },
                            { metric: 'Cobertura', value: item.radar.cobertura },
                            { metric: 'Contribuição', value: item.radar.contribuicao },
                            { metric: 'Consistência', value: item.radar.consistencia },
                        ];

                        return (
                            <div key={item.user.id} className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(78,50,5,0.04)] border border-stone-100/50 overflow-hidden">
                                {/* Card Header */}
                                <button
                                    onClick={() => setExpandedId(isExpanded ? null : item.user.id)}
                                    className="w-full p-5 flex items-center gap-4 hover:bg-stone-50/50 transition-colors text-left"
                                >
                                    {/* Ranking */}
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${idx === 0 ? 'bg-saritur-yellow/30 text-brown' : idx === 1 ? 'bg-stone-200 text-brown' : idx === 2 ? 'bg-primary/10 text-primary' : 'bg-stone-100 text-brown/50'
                                        }`}>
                                        {idx === 0 ? <Trophy size={18} /> : `#${idx + 1}`}
                                    </div>

                                    {/* User Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-brown truncate">{item.user.nome}</p>
                                        <p className="text-xs text-brown/40">{item.user.departamento} • {item.user.cargo}</p>
                                    </div>

                                    {/* KPIs */}
                                    <div className="hidden md:flex items-center gap-6">
                                        <div className="text-center">
                                            <p className="text-xs text-brown/40 uppercase tracking-wider">No Prazo</p>
                                            <p className="text-sm font-bold text-brown">{item.percentualNoPrazo.toFixed(0)}%</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs text-brown/40 uppercase tracking-wider">Atingimento</p>
                                            <p className="text-sm font-bold text-brown">{item.mediaAtingimento.toFixed(0)}%</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs text-brown/40 uppercase tracking-wider">Atrasados</p>
                                            <p className={`text-sm font-bold ${item.indicadoresAtrasados > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{item.indicadoresAtrasados}</p>
                                        </div>
                                    </div>

                                    <ScoreBadge score={item.score} />
                                    {isExpanded ? <ChevronUp size={16} className="text-brown/30" /> : <ChevronDown size={16} className="text-brown/30" />}
                                </button>

                                {/* Expanded Detail */}
                                {isExpanded && (
                                    <div className="border-t border-stone-100 p-5">
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            {/* Radar Chart */}
                                            <div>
                                                <h4 className="text-sm font-semibold text-brown mb-3">Perfil de Performance</h4>
                                                <div className="h-64">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <RadarChart data={radarData}>
                                                            <PolarGrid stroke="#E5E7EB" />
                                                            <PolarAngleAxis dataKey="metric" tick={{ fill: '#6B7280', fontSize: 11 }} />
                                                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                                                            <Radar name="Performance" dataKey="value" stroke="#F37137" fill="#F37137" fillOpacity={0.2} strokeWidth={2} />
                                                            <Tooltip />
                                                        </RadarChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </div>

                                            {/* KPI Cards */}
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="bg-stone-50 rounded-xl p-4">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Clock size={14} className="text-primary" />
                                                        <span className="text-xs text-brown/50 uppercase">Pontualidade</span>
                                                    </div>
                                                    <p className="text-xl font-bold text-brown">{item.percentualNoPrazo.toFixed(1)}%</p>
                                                </div>
                                                <div className="bg-stone-50 rounded-xl p-4">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <TrendingUp size={14} className="text-primary" />
                                                        <span className="text-xs text-brown/50 uppercase">Atingimento</span>
                                                    </div>
                                                    <p className="text-xl font-bold text-brown">{item.mediaAtingimento.toFixed(1)}%</p>
                                                </div>
                                                <div className="bg-stone-50 rounded-xl p-4">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Users size={14} className="text-primary" />
                                                        <span className="text-xs text-brown/50 uppercase">Indicadores</span>
                                                    </div>
                                                    <p className="text-xl font-bold text-brown">{item.totalIndicadores}</p>
                                                </div>
                                                <div className="bg-stone-50 rounded-xl p-4">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <DollarSign size={14} className="text-primary" />
                                                        <span className="text-xs text-brown/50 uppercase">Contribuição</span>
                                                    </div>
                                                    <p className="text-xl font-bold text-brown">{formatCurrency(item.contribuicaoFinanceiraCentavos)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
