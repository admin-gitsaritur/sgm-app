import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { StatCard } from '../components/StatCard';
import { SemaforoIndicator } from '../components/SemaforoIndicator';
import { Badge } from '../components/Badge';
import { CardSkeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { Target, TrendingUp, AlertTriangle, DollarSign, BarChart2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from 'recharts';

export const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api('/dashboard');
        if (res.success) setDashboardData(res.data);
      } catch (err: any) { setError(err.message); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const formatCurrency = (centavos: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(centavos / 100);
  const formatCurrencyShort = (centavos: number) => {
    const v = centavos / 100;
    if (v >= 1000000) return `R$ ${(v / 1000000).toFixed(1)}M`;
    if (v >= 1000) return `R$ ${(v / 1000).toFixed(0)}K`;
    return formatCurrency(centavos);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-[#4E3205]">Dashboard Executivo</h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <CardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-[#4E3205]">Dashboard Executivo</h1>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-700">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-3 px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600">Tentar novamente</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[#4E3205]">Dashboard Executivo</h1>
      </div>

      {dashboardData.length === 0 ? (
        <EmptyState icon={<Target className="w-8 h-8 text-gray-400" />} title="Nenhuma meta ativa"
          description="Cadastre uma meta estratégica para visualizar o dashboard." />
      ) : (
        dashboardData.map((item: any) => (
          <div key={item.meta.id} className="space-y-4">
            {/* Header */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#F37137]/10 flex items-center justify-center">
                    <Target className="w-6 h-6 text-[#F37137]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#4E3205] flex items-center gap-3">
                      {item.meta.nome}
                      <SemaforoIndicator status={item.semaforo} size="md" />
                    </h2>
                    <p className="text-sm text-gray-500">Ano: {item.meta.ano} • {item.meta.indicadorMacro} • Risco: <Badge status={item.risco} /></p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Atingimento Global</p>
                  <p className={`text-3xl font-bold ${item.semaforo === 'VERDE' ? 'text-emerald-600' : item.semaforo === 'AMARELO' ? 'text-amber-600' : 'text-red-600'}`}>
                    {item.percentualAtingimento.toFixed(1)}%
                  </p>
                </div>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6">
                <StatCard label="Valor da Meta" value={formatCurrencyShort(item.meta.valorMetaCentavos)} icon={<Target className="w-5 h-5 text-[#F37137]" />} />
                <StatCard label="Realizado" value={formatCurrencyShort(item.realizadoAcumuladoCentavos)} icon={<DollarSign className="w-5 h-5 text-[#F37137]" />} />
                <StatCard label="Projeção Linear" value={formatCurrencyShort(item.projecaoLinearCentavos)} icon={<TrendingUp className="w-5 h-5 text-[#F37137]" />} />
                <StatCard label="Desvio" value={formatCurrency(item.desvioCentavos)}
                  icon={<BarChart2 className="w-5 h-5 text-[#F37137]" />}
                  trend={item.esperadoAcumuladoCentavos > 0 ? (item.desvioCentavos / item.esperadoAcumuladoCentavos * 100) : 0} />
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Evolution Chart */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-[#4E3205] mb-4">Evolução: Esperado vs Realizado vs Projeção</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={item.evolucaoMensal} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id={`grad-real-${item.meta.id}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#F37137" stopOpacity={0.3} /><stop offset="95%" stopColor="#F37137" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11 }}
                        tickFormatter={(v) => formatCurrencyShort(v)} />
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
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                  <h3 className="text-sm font-semibold text-[#4E3205] mb-4">Contribuição por Projeto</h3>
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
                        <Bar dataKey="esperada" name="Esperada" fill="#E5E7EB" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="contribuicao" name="Realizada" fill="#F37137" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>

            {/* Projects Table */}
            {item.projetos.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-[#4E3205]">Projetos Vinculados</h3>
                </div>
                <table className="w-full text-left">
                  <thead><tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500">Projeto</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500">Execução</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500">Contribuição Real</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500">Indicadores Atrasados</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500">Status</th>
                  </tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {item.projetos.map((p: any) => (
                      <tr key={p.projeto.id} className="hover:bg-gray-50">
                        <td className="px-6 py-3 text-sm font-medium text-[#4E3205]">{p.projeto.nome}</td>
                        <td className="px-6 py-3 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div className="bg-[#F37137] h-2 rounded-full" style={{ width: `${Math.min(p.percentualExecucao, 100)}%` }} />
                            </div>
                            <span className="text-xs text-gray-600">{p.percentualExecucao.toFixed(1)}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-3 text-sm">{formatCurrency(p.contribuicaoRealEstimadaCentavos)}</td>
                        <td className="px-6 py-3 text-sm">
                          {p.indicadoresAtrasados > 0 ? (
                            <span className="text-red-600 font-medium">{p.indicadoresAtrasados}</span>
                          ) : (
                            <span className="text-emerald-600">0</span>
                          )}
                        </td>
                        <td className="px-6 py-3"><Badge status={p.projeto.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};
