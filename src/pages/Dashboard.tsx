import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Target, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

export const Dashboard = () => {
  const [metas, setMetas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await api('/metas');
        if (response.success) {
          setMetas(response.data);
        }
      } catch (error) {
        console.error('Erro ao carregar metas', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getSemaforoColor = (razao: number) => {
    if (razao >= 0.95) return 'text-[#10B981]';
    if (razao >= 0.85) return 'text-[#F59E0B]';
    return 'text-[#EF4444]';
  };

  const getSemaforoBg = (razao: number) => {
    if (razao >= 0.95) return 'bg-[#10B981]';
    if (razao >= 0.85) return 'bg-[#F59E0B]';
    return 'bg-[#EF4444]';
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full">Carregando dashboard...</div>;
  }

  // Mock data for charts since we don't have full history yet
  const chartData = [
    { name: 'Jan', esperado: 833333, realizado: 800000, projecao: null },
    { name: 'Fev', esperado: 1666666, realizado: 1700000, projecao: null },
    { name: 'Mar', esperado: 2500000, realizado: 2400000, projecao: null },
    { name: 'Abr', esperado: 3333333, realizado: 3100000, projecao: null },
    { name: 'Mai', esperado: 4166666, realizado: 3900000, projecao: null },
    { name: 'Jun', esperado: 5000000, realizado: null, projecao: 4800000 },
    { name: 'Jul', esperado: 5833333, realizado: null, projecao: 5600000 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[#4E3205]">Dashboard Executivo</h1>
        <div className="flex space-x-3">
          <button className="px-4 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm font-medium text-[#4E3205] hover:bg-gray-50 transition-colors">
            Exportar Relatório
          </button>
        </div>
      </div>

      {metas.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-[#E5E7EB] text-center">
          <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-[#4E3205]">Nenhuma meta cadastrada</h3>
          <p className="text-gray-500 mt-2">Comece cadastrando uma meta estratégica para visualizar o dashboard.</p>
        </div>
      ) : (
        metas.map((meta) => {
          // Mock calculations for demonstration
          const realizado = meta.valorMeta * 0.74;
          const esperado = meta.valorMeta * 0.83;
          const razao = realizado / esperado;
          const percentual = (realizado / meta.valorMeta) * 100;

          return (
            <div key={meta.id} className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] overflow-hidden">
              <div className="p-6 border-b border-[#E5E7EB] flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-[#F37137]/10 flex items-center justify-center">
                    <Target className="w-6 h-6 text-[#F37137]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#4E3205] flex items-center">
                      {meta.nome}
                      <span className={\`ml-3 w-3 h-3 rounded-full \${getSemaforoBg(razao)}\`}></span>
                    </h2>
                    <p className="text-sm text-gray-500">Ano: {meta.ano} • Indicador: {meta.indicadorMacro}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Atingimento Global</p>
                  <p className={\`text-3xl font-bold \${getSemaforoColor(razao)}\`}>
                    {percentual.toFixed(1)}%
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-[#E5E7EB]">
                <div className="p-6 space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Valor Total da Meta</p>
                    <p className="text-xl font-semibold text-[#4E3205]">{formatCurrency(meta.valorMeta)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Realizado Acumulado</p>
                    <p className="text-xl font-semibold text-[#4E3205]">{formatCurrency(realizado)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Esperado até agora</p>
                    <p className="text-xl font-semibold text-gray-600">{formatCurrency(esperado)}</p>
                  </div>
                  <div className="pt-4 border-t border-[#E5E7EB]">
                    <p className="text-sm text-gray-500">Desvio</p>
                    <p className="text-lg font-semibold text-[#EF4444]">{formatCurrency(realizado - esperado)}</p>
                  </div>
                </div>

                <div className="p-6 col-span-3">
                  <h3 className="text-sm font-medium text-[#4E3205] mb-4">Evolução: Esperado vs Realizado vs Projeção</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorRealizado" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#F37137" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#F37137" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorProjecao" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#F6D317" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#F6D317" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#6B7280', fontSize: 12 }}
                          tickFormatter={(value) => \`R$ \${(value / 1000000).toFixed(1)}M\`}
                        />
                        <Tooltip 
                          formatter={(value: number) => formatCurrency(value)}
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend />
                        <Area type="monotone" dataKey="esperado" name="Esperado" stroke="#94A3B8" fill="none" strokeDasharray="5 5" />
                        <Area type="monotone" dataKey="realizado" name="Realizado" stroke="#F37137" fillOpacity={1} fill="url(#colorRealizado)" strokeWidth={2} />
                        <Area type="monotone" dataKey="projecao" name="Projeção" stroke="#F6D317" fillOpacity={1} fill="url(#colorProjecao)" strokeWidth={2} strokeDasharray="3 3" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};
