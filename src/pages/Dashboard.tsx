import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Button } from '../components/ui/Button';
import { CardSkeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import {
  Target, TrendingUp, AlertTriangle, DollarSign,
  BarChart2, ChevronRight, RefreshCw, Gauge
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, BarChart, Bar,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

// ─── Componentes locais do Dashboard ─────────────────────────────────

const KpiCard = ({ label, value, icon, trend }: {
  label: string; value: string; icon: React.ReactNode; trend?: number;
}) => (
  <div className="bg-white rounded-2xl p-5 shadow-[0_4px_24px_rgba(78,50,5,0.04)] border border-stone-100/50 transition-all duration-300 hover:shadow-[0_8px_32px_rgba(78,50,5,0.08)] group cursor-default">
    <div className="flex items-center gap-3 mb-3">
      <div className="p-2.5 rounded-xl bg-primary/10 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-2">
        {icon}
      </div>
      {trend !== undefined && trend !== 0 && (
        <span className={`ml-auto flex items-center text-xs font-semibold px-2 py-0.5 rounded-lg ${trend >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
          }`}>
          <TrendingUp size={12} className={`mr-0.5 ${trend < 0 ? 'rotate-180' : ''}`} />
          {trend >= 0 ? '+' : ''}{trend.toFixed(1)}%
        </span>
      )}
    </div>
    <p className="text-xs font-medium text-brown/50 uppercase tracking-wider mb-0.5">{label}</p>
    <p className="text-2xl font-bold text-brown tracking-tight">{value}</p>
  </div>
);

const SemaforoDot = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    VERDE: 'bg-emerald-500',
    AMARELO: 'bg-amber-400',
    VERMELHO: 'bg-rose-500',
  };
  return (
    <span className={`inline-block w-3 h-3 rounded-full ${colors[status] || 'bg-stone-300'} shadow-sm`} />
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    ATIVO: 'bg-primary/10 text-primary',
    EM_ANDAMENTO: 'bg-primary/10 text-primary',
    CONCLUIDO: 'bg-emerald-100 text-emerald-700',
    PAUSADO: 'bg-amber-100 text-amber-700',
    CANCELADO: 'bg-stone-100 text-stone-600',
  };
  const labels: Record<string, string> = {
    ATIVO: 'Ativo',
    EM_ANDAMENTO: 'Em andamento',
    CONCLUIDO: 'Concluído',
    PAUSADO: 'Pausado',
    CANCELADO: 'Cancelado',
  };
  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[status] || 'bg-stone-100 text-stone-600'}`}>
      {labels[status] || status}
    </span>
  );
};

const RiskBadge = ({ risk }: { risk: string }) => {
  const styles: Record<string, string> = {
    BAIXO: 'bg-emerald-50 text-emerald-700',
    MEDIO: 'bg-amber-50 text-amber-700',
    ALTO: 'bg-rose-50 text-rose-700',
    CRITICO: 'bg-rose-100 text-rose-800',
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium ${styles[risk] || 'bg-stone-50 text-stone-600'}`}>
      {risk}
    </span>
  );
};

// ─── Utilitários ─────────────────────────────────────────────────────

const formatCurrency = (centavos: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(centavos / 100);

const formatCurrencyShort = (centavos: number) => {
  const v = centavos / 100;
  if (v >= 1000000) return `R$ ${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `R$ ${(v / 1000).toFixed(0)}K`;
  return formatCurrency(centavos);
};

const semaforoColor = (s: string) =>
  s === 'VERDE' ? 'text-emerald-600' : s === 'AMARELO' ? 'text-amber-600' : 'text-rose-600';

// ─── Dashboard Principal ─────────────────────────────────────────────

export const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api('/dashboard');
      if (res.success) setDashboardData(res.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // ── Loading state ──
  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-brown tracking-tight">Visão Geral</h1>
          <p className="text-brown/50 text-sm mt-1">Acompanhe os indicadores em tempo real.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <CardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  // ── Error state ──
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-brown tracking-tight">Visão Geral</h1>
          <p className="text-brown/50 text-sm mt-1">Acompanhe os indicadores em tempo real.</p>
        </div>
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 text-center">
          <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
          <p className="text-rose-700 font-medium mb-1">Erro ao carregar dados</p>
          <p className="text-rose-600/70 text-sm mb-4">{error}</p>
          <Button onClick={fetchData} variant="destructive" size="sm" leftIcon={<RefreshCw size={14} />}>
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  // ── Empty state ──
  if (dashboardData.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-brown tracking-tight">Visão Geral</h1>
          <p className="text-brown/50 text-sm mt-1">Acompanhe os indicadores em tempo real.</p>
        </div>
        <EmptyState
          icon={<Target className="w-8 h-8 text-stone-400" />}
          title="Nenhuma meta ativa"
          description="Cadastre uma meta estratégica para visualizar o dashboard."
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-brown tracking-tight">Visão Geral</h1>
          <p className="text-brown/50 text-sm mt-1">Acompanhe os indicadores em tempo real.</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={fetchData}
          leftIcon={<RefreshCw size={14} />}
        >
          Atualizar
        </Button>
      </div>

      {dashboardData.map((item: any) => (
        <div key={item.meta.id} className="space-y-6">

          {/* ── Meta Header Card ── */}
          <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(78,50,5,0.04)] border border-stone-100/50 overflow-hidden">
            <div className="p-6 flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Gauge className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-brown flex items-center gap-2">
                    {item.meta.nome}
                    <SemaforoDot status={item.semaforo} />
                  </h2>
                  <p className="text-sm text-brown/50 flex items-center gap-2 flex-wrap">
                    Ano: {item.meta.ano} • {item.meta.indicadorMacro} • Risco: <RiskBadge risk={item.risco} />
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium text-brown/50 uppercase tracking-wider">Atingimento Global</p>
                <p className={`text-3xl font-bold tracking-tight ${semaforoColor(item.semaforo)}`}>
                  {item.percentualAtingimento.toFixed(1)}%
                </p>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 px-6 pb-6">
              <KpiCard
                label="Valor da Meta"
                value={formatCurrencyShort(item.meta.valorMetaCentavos)}
                icon={<Target className="w-5 h-5 text-primary" />}
              />
              <KpiCard
                label="Realizado"
                value={formatCurrencyShort(item.realizadoAcumuladoCentavos)}
                icon={<DollarSign className="w-5 h-5 text-primary" />}
              />
              <KpiCard
                label="Projeção Linear"
                value={formatCurrencyShort(item.projecaoLinearCentavos)}
                icon={<TrendingUp className="w-5 h-5 text-primary" />}
              />
              <KpiCard
                label="Desvio"
                value={formatCurrency(item.desvioCentavos)}
                icon={<BarChart2 className="w-5 h-5 text-primary" />}
                trend={item.esperadoAcumuladoCentavos > 0
                  ? (item.desvioCentavos / item.esperadoAcumuladoCentavos * 100)
                  : 0
                }
              />
            </div>
          </div>

          {/* ── Charts ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Evolution Chart */}
            <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(78,50,5,0.04)] border border-stone-100/50 p-6">
              <h3 className="text-sm font-semibold text-brown mb-4">Evolução: Esperado vs Realizado vs Projeção</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={item.evolucaoMensal} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id={`grad-real-${item.meta.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F37137" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#F37137" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11 }} tickFormatter={v => formatCurrencyShort(v)} />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    <Legend />
                    <Area type="monotone" dataKey="esperadoCentavos" name="Esperado" stroke="#94A3B8" fill="none" strokeDasharray="5 5" />
                    <Area type="monotone" dataKey="realizadoCentavos" name="Realizado" stroke="#F37137" fill={`url(#grad-real-${item.meta.id})`} strokeWidth={2} connectNulls={false} />
                    <Area type="monotone" dataKey="projecaoCentavos" name="Projeção" stroke="#F6D317" fill="none" strokeWidth={2} strokeDasharray="3 3" connectNulls={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Project Contributions */}
            {item.projetos.length > 0 && (
              <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(78,50,5,0.04)] border border-stone-100/50 p-6">
                <h3 className="text-sm font-semibold text-brown mb-4">Contribuição por Projeto</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={item.projetos.map((p: any) => ({
                      nome: p.projeto.nome.length > 15 ? p.projeto.nome.slice(0, 15) + '…' : p.projeto.nome,
                      contribuicao: p.contribuicaoRealEstimadaCentavos,
                      esperada: p.projeto.contribuicaoEsperadaCentavos,
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="nome" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 10 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11 }} tickFormatter={v => formatCurrencyShort(v)} />
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                      <Legend />
                      <Bar dataKey="esperada" name="Esperada" fill="#E5E7EB" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="contribuicao" name="Realizada" fill="#F37137" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          {/* ── Gauge + Heatmap + Radar ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Gauge / Velocímetro */}
            <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(78,50,5,0.04)] border border-stone-100/50 p-6 flex flex-col items-center">
              <h3 className="text-sm font-semibold text-brown mb-4 self-start">Atingimento Global</h3>
              <svg viewBox="0 0 200 130" className="w-48 h-auto">
                {/* Background arc */}
                <path d="M 20 120 A 80 80 0 0 1 180 120" fill="none" stroke="#E5E7EB" strokeWidth="14" strokeLinecap="round" />
                {/* Value arc */}
                {(() => {
                  const pct = Math.min(item.percentualAtingimento, 100) / 100;
                  const angle = Math.PI * (1 - pct);
                  const x = 100 - 80 * Math.cos(angle);
                  const y = 120 - 80 * Math.sin(angle);
                  const largeArc = pct > 0.5 ? 1 : 0;
                  const color = item.semaforo === 'VERDE' ? '#10B981' : item.semaforo === 'AMARELO' ? '#F59E0B' : '#EF4444';
                  return (
                    <path
                      d={`M 20 120 A 80 80 0 ${largeArc} 1 ${x} ${y}`}
                      fill="none" stroke={color} strokeWidth="14" strokeLinecap="round"
                      style={{ transition: 'stroke-dashoffset 1s ease' }}
                    />
                  );
                })()}
                {/* Text */}
                <text x="100" y="100" textAnchor="middle" className="fill-brown text-2xl font-bold" style={{ fontSize: '28px', fontWeight: 700 }}>
                  {item.percentualAtingimento.toFixed(1)}%
                </text>
                <text x="100" y="118" textAnchor="middle" className="fill-brown/40" style={{ fontSize: '10px' }}>
                  de {formatCurrencyShort(item.meta.valorMetaCentavos)}
                </text>
              </svg>
            </div>

            {/* Heatmap de Indicadores */}
            <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(78,50,5,0.04)] border border-stone-100/50 p-6">
              <h3 className="text-sm font-semibold text-brown mb-4">Heatmap — Indicadores</h3>
              <div className="grid grid-cols-4 gap-1.5">
                {item.projetos.flatMap((p: any) =>
                  p.indicadores.map((ind: any) => {
                    const pct = ind.percentualAtingido * 100;
                    const color = pct >= 95 ? 'bg-emerald-400' : pct >= 85 ? 'bg-emerald-300' : pct >= 70 ? 'bg-amber-300' : pct >= 50 ? 'bg-amber-400' : 'bg-rose-400';
                    return (
                      <div
                        key={ind.indicador.id}
                        className={`${color} rounded-md h-8 cursor-default transition-transform hover:scale-110`}
                        title={`${ind.indicador.nome}: ${pct.toFixed(1)}%`}
                      />
                    );
                  })
                )}
                {item.projetos.flatMap((p: any) => p.indicadores).length === 0 && (
                  <p className="col-span-4 text-xs text-brown/40 text-center py-4">Sem indicadores</p>
                )}
              </div>
              <div className="flex items-center gap-3 mt-4 justify-center">
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-emerald-400" /><span className="text-[10px] text-brown/40">≥95%</span></div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-emerald-300" /><span className="text-[10px] text-brown/40">85-95%</span></div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-amber-300" /><span className="text-[10px] text-brown/40">70-85%</span></div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-rose-400" /><span className="text-[10px] text-brown/40">&lt;70%</span></div>
              </div>
            </div>

            {/* Radar de Responsáveis */}
            <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(78,50,5,0.04)] border border-stone-100/50 p-6">
              <h3 className="text-sm font-semibold text-brown mb-4">Performance — Responsáveis</h3>
              {(() => {
                // Aggregate data per responsible
                const respMap: Record<string, { nome: string; execucao: number[]; atrasados: number }> = {};
                item.projetos.forEach((p: any) => {
                  p.indicadores.forEach((ind: any) => {
                    const id = ind.indicador.responsavel;
                    if (!respMap[id]) respMap[id] = { nome: id.slice(0, 8), execucao: [], atrasados: 0 };
                    respMap[id].execucao.push(ind.percentualAtingido * 100);
                    if (ind.indicador.statusAtualizacao === 'ATRASADO') respMap[id].atrasados++;
                  });
                });
                const radarData = Object.values(respMap).slice(0, 6).map(r => ({
                  nome: r.nome,
                  atingimento: Math.round(r.execucao.reduce((a, b) => a + b, 0) / r.execucao.length),
                  pontualidade: Math.round(Math.max(0, 100 - r.atrasados * 25)),
                }));
                if (radarData.length === 0) return <p className="text-xs text-brown/40 text-center py-8">Sem dados de responsáveis</p>;
                return (
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="#E5E7EB" />
                        <PolarAngleAxis dataKey="nome" tick={{ fill: '#6B7280', fontSize: 10 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 8 }} />
                        <Radar name="Atingimento" dataKey="atingimento" stroke="#F37137" fill="#F37137" fillOpacity={0.2} strokeWidth={2} />
                        <Radar name="Pontualidade" dataKey="pontualidade" stroke="#F6D317" fill="#F6D317" fillOpacity={0.1} strokeWidth={2} />
                        <Tooltip />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                );
              })()}
            </div>
          </div>
          {/* ── Projects Table ── */}
          {item.projetos.length > 0 && (
            <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(78,50,5,0.04)] border border-stone-100/50 overflow-hidden">
              <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-brown">Projetos Vinculados</h3>
                <button className="text-primary text-xs font-medium hover:underline flex items-center gap-0.5">
                  Ver todos <ChevronRight size={14} />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-stone-50/50 border-b border-stone-100">
                      <th className="px-6 py-3 text-xs font-semibold text-brown/50 uppercase tracking-wider">Projeto</th>
                      <th className="px-6 py-3 text-xs font-semibold text-brown/50 uppercase tracking-wider">Execução</th>
                      <th className="px-6 py-3 text-xs font-semibold text-brown/50 uppercase tracking-wider">Contribuição Real</th>
                      <th className="px-6 py-3 text-xs font-semibold text-brown/50 uppercase tracking-wider">Ind. Atrasados</th>
                      <th className="px-6 py-3 text-xs font-semibold text-brown/50 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50">
                    {item.projetos.map((p: any) => (
                      <tr key={p.projeto.id} className="hover:bg-stone-50/50 transition-colors">
                        <td className="px-6 py-3.5 text-sm font-medium text-brown">{p.projeto.nome}</td>
                        <td className="px-6 py-3.5 text-sm">
                          <div className="flex items-center gap-2.5">
                            <div className="w-24 bg-stone-100 rounded-full h-2">
                              <div
                                className="bg-primary h-2 rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(p.percentualExecucao, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-brown/60">{p.percentualExecucao.toFixed(1)}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-sm text-brown">{formatCurrency(p.contribuicaoRealEstimadaCentavos)}</td>
                        <td className="px-6 py-3.5 text-sm">
                          {p.indicadoresAtrasados > 0 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-rose-50 text-rose-600 text-xs font-bold">
                              {p.indicadoresAtrasados}
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 text-xs font-bold">0</span>
                          )}
                        </td>
                        <td className="px-6 py-3.5"><StatusBadge status={p.projeto.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
