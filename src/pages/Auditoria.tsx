import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Badge } from '../components/Badge';
import { EmptyState } from '../components/EmptyState';
import { TableSkeleton } from '../components/Skeleton';
import { Shield, ChevronDown, ChevronUp, Filter } from 'lucide-react';

export const Auditoria = () => {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filters, setFilters] = useState({ entidade: '', acao: '', dataInicio: '', dataFim: '' });

    useEffect(() => { fetchData(); }, [page, filters]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: page.toString(), limit: '30' });
            if (filters.entidade) params.set('entidade', filters.entidade);
            if (filters.acao) params.set('acao', filters.acao);
            if (filters.dataInicio) params.set('dataInicio', filters.dataInicio);
            if (filters.dataFim) params.set('dataFim', filters.dataFim);
            const res = await api(`/auditoria?${params.toString()}`);
            if (res.success) {
                setLogs(res.data);
                setTotalPages(res.meta?.totalPages || 1);
            }
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const formatDate = (d: string) => new Date(d).toLocaleString('pt-BR');

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-[#4E3205]">Auditoria</h1>
                <p className="text-gray-500 mt-1">Registro imutável de todas as ações do sistema</p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
                <Filter size={16} className="text-gray-400" />
                <select value={filters.entidade} onChange={e => { setFilters({ ...filters, entidade: e.target.value }); setPage(1); }}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-2">
                    <option value="">Todas as entidades</option>
                    <option value="Meta">Meta</option><option value="Projeto">Projeto</option>
                    <option value="Indicador">Indicador</option><option value="User">Usuário</option>
                </select>
                <select value={filters.acao} onChange={e => { setFilters({ ...filters, acao: e.target.value }); setPage(1); }}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-2">
                    <option value="">Todas as ações</option>
                    <option value="CREATE">Criação</option><option value="UPDATE">Atualização</option>
                    <option value="DELETE">Exclusão</option><option value="LOGIN">Login</option>
                </select>
                <input type="date" value={filters.dataInicio} onChange={e => { setFilters({ ...filters, dataInicio: e.target.value }); setPage(1); }}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-2" />
                <input type="date" value={filters.dataFim} onChange={e => { setFilters({ ...filters, dataFim: e.target.value }); setPage(1); }}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-2" />
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                {loading ? <TableSkeleton rows={10} cols={5} /> : logs.length === 0 ? (
                    <EmptyState icon={<Shield className="w-8 h-8 text-gray-400" />} title="Nenhum registro encontrado" />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead><tr className="bg-gray-50 border-b border-gray-200">
                                <th className="px-6 py-4 text-sm font-semibold text-[#4E3205] w-8"></th>
                                <th className="px-6 py-4 text-sm font-semibold text-[#4E3205]">Data/Hora</th>
                                <th className="px-6 py-4 text-sm font-semibold text-[#4E3205]">Usuário</th>
                                <th className="px-6 py-4 text-sm font-semibold text-[#4E3205]">Ação</th>
                                <th className="px-6 py-4 text-sm font-semibold text-[#4E3205]">Entidade</th>
                                <th className="px-6 py-4 text-sm font-semibold text-[#4E3205]">IP</th>
                            </tr></thead>
                            <tbody className="divide-y divide-gray-100">
                                {logs.map((log: any) => (
                                    <>
                                        <tr key={log.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}>
                                            <td className="px-6 py-4">{(log.dadosAnteriores || log.dadosNovos) && (expandedId === log.id ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />)}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{formatDate(log.timestamp)}</td>
                                            <td className="px-6 py-4 text-sm font-medium text-[#4E3205]">{log.userName || 'Sistema'}</td>
                                            <td className="px-6 py-4"><Badge status={log.acao} /></td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{log.entidade}</td>
                                            <td className="px-6 py-4 text-sm text-gray-400 font-mono">{log.ip || '—'}</td>
                                        </tr>
                                        {expandedId === log.id && (log.dadosAnteriores || log.dadosNovos) && (
                                            <tr key={`${log.id}-details`}>
                                                <td colSpan={6} className="px-6 py-4 bg-gray-50">
                                                    <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                                                        {log.dadosAnteriores && (
                                                            <div>
                                                                <p className="text-red-600 font-semibold mb-1 font-sans text-sm">Dados Anteriores</p>
                                                                <pre className="bg-red-50 p-3 rounded-lg overflow-auto max-h-40 text-red-800">{JSON.stringify(log.dadosAnteriores, null, 2)}</pre>
                                                            </div>
                                                        )}
                                                        {log.dadosNovos && (
                                                            <div>
                                                                <p className="text-emerald-600 font-semibold mb-1 font-sans text-sm">Dados Novos</p>
                                                                <pre className="bg-emerald-50 p-3 rounded-lg overflow-auto max-h-40 text-emerald-800">{JSON.stringify(log.dadosNovos, null, 2)}</pre>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {totalPages > 1 && (
                <div className="flex justify-center gap-2">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                        className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50">Anterior</button>
                    <span className="px-3 py-1.5 text-sm text-gray-600">{page} / {totalPages}</span>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                        className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50">Próximo</button>
                </div>
            )}
        </div>
    );
};
