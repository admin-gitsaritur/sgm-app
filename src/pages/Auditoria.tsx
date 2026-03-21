import { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { Badge } from '../components/Badge';
import { Shield } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { DataTable, type Column, DataTableCellPrimary } from '../components/ui/data-table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { CellText } from '../components/ui/CellText';
import { ActionButton } from '../components/ui/action-button';
import { Modal } from '../components/Modal';
import { DateRangeInline } from '../components/ui/date-range-inline';

export const Auditoria = () => {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLog, setSelectedLog] = useState<any | null>(null);
    const [page, setPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
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
                const itemsCount = res.meta?.total || (res.meta?.totalPages ? res.meta.totalPages * 30 : res.data.length);
                setTotalItems(itemsCount);
            }
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const formatDate = (d: string) => new Date(d).toLocaleString('pt-BR');

    const columns: Column<any>[] = useMemo(() => [
        {
            key: 'timestamp',
            header: 'Data/Hora',
            cellVariant: 'none',
            render: (val: unknown) => <CellText variant="muted" className="whitespace-nowrap">{formatDate(val as string)}</CellText>
        },
        {
            key: 'userName',
            header: 'Usuário',
            cellVariant: 'none',
            render: (val: unknown) => <DataTableCellPrimary>{(val as string) || 'Sistema'}</DataTableCellPrimary>
        },
        {
            key: 'acao',
            header: 'Ação',
            align: 'center',
            cellVariant: 'none',
            render: (val: unknown) => <Badge status={val as string} />
        },
        {
            key: 'entidade',
            header: 'Entidade',
            cellVariant: 'none',
            render: (val: unknown) => <CellText variant="muted">{val as string}</CellText>
        },
        {
            key: 'ip',
            header: 'IP',
            cellVariant: 'none',
            render: (val: unknown) => <span className="text-sm text-stone-400 font-mono">{(val as string) || '—'}</span>
        },
        {
            key: 'acoes',
            header: 'Detalhes',
            align: 'center',
            cellVariant: 'none',
            width: '100px',
            render: (_: unknown, row: any) => (
                <div className="inline-flex justify-center">
                    <ActionButton 
                        icon="eye" 
                        theme="indigo" 
                        title="Ver Detalhes" 
                        onClick={(e) => { e.stopPropagation(); setSelectedLog(row); }}
                    />
                </div>
            )
        }
    ], []);

    return (
        <div className="space-y-6">
            <PageHeader
                title="Auditoria"
                subtitle="Registro imutável de todas as ações do sistema"
            />

            <DataTable
                data={logs}
                columns={columns}
                rowKey="id"
                loading={loading}
                emptyMessage="Nenhum registro encontrado"
                emptyIcon={<Shield className="h-16 w-16 opacity-30 text-stone-400" />}
                pagination={{
                    page,
                    pageSize: 30,
                    total: totalItems,
                    onPageChange: setPage
                }}
                actionButton={
                    <div className="flex items-center gap-2">
                        <Select value={filters.entidade || 'ALL'} onValueChange={v => { setFilters({ ...filters, entidade: v === 'ALL' ? '' : v }); setPage(1); }}>
                            <SelectTrigger className="w-48 h-12">
                                <SelectValue placeholder="Todas as entidades" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Todas as entidades</SelectItem>
                                <SelectItem value="Meta">Meta</SelectItem>
                                <SelectItem value="Projeto">Projeto</SelectItem>
                                <SelectItem value="Indicador">Indicador</SelectItem>
                                <SelectItem value="User">Usuário</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={filters.acao || 'ALL'} onValueChange={v => { setFilters({ ...filters, acao: v === 'ALL' ? '' : v }); setPage(1); }}>
                            <SelectTrigger className="w-40 h-12">
                                <SelectValue placeholder="Todas as ações" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Todas as ações</SelectItem>
                                <SelectItem value="CREATE">Criação</SelectItem>
                                <SelectItem value="UPDATE">Atualização</SelectItem>
                                <SelectItem value="DELETE">Exclusão</SelectItem>
                                <SelectItem value="LOGIN">Login</SelectItem>
                            </SelectContent>
                        </Select>

                        <DateRangeInline
                            startDate={filters.dataInicio}
                            endDate={filters.dataFim}
                            onStartChange={v => { setFilters(f => ({ ...f, dataInicio: v })); setPage(1); }}
                            onEndChange={v => { setFilters(f => ({ ...f, dataFim: v })); setPage(1); }}
                        />
                    </div>
                }
                labels={{
                    showingPrefix: 'Mostrando',
                    showingResults: 'registros',
                }}
            />

            <Modal
                isOpen={!!selectedLog}
                onClose={() => setSelectedLog(null)}
                title="Detalhes da Ação"
                size="lg"
            >
                {selectedLog && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 pb-4 border-b border-stone-100">
                            <Badge status={selectedLog.acao} />
                            <span className="text-sm font-medium text-stone-700">{selectedLog.entidade}</span>
                            <span className="text-sm text-stone-500">• {formatDate(selectedLog.timestamp)}</span>
                        </div>
                        
                        {(selectedLog.dadosAnteriores || selectedLog.dadosNovos) ? (
                            <div className="grid grid-cols-2 gap-6 bg-stone-50/50 p-4 rounded-xl border border-stone-100">
                                {selectedLog.dadosAnteriores && (
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-semibold text-rose-600">Dados Anteriores</h4>
                                        <pre className="text-xs bg-white p-3 rounded-lg border border-red-100 text-stone-600 overflow-auto max-h-96 whitespace-pre-wrap">{JSON.stringify(selectedLog.dadosAnteriores, null, 2)}</pre>
                                    </div>
                                )}
                                {selectedLog.dadosNovos && (
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-semibold text-emerald-600">Dados Novos</h4>
                                        <pre className="text-xs bg-white p-3 rounded-lg border border-emerald-100 text-stone-600 overflow-auto max-h-96 whitespace-pre-wrap">{JSON.stringify(selectedLog.dadosNovos, null, 2)}</pre>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center text-sm text-stone-400 py-8 bg-stone-50/50 rounded-xl border border-stone-100">
                                Nenhuma alteração de dados registrada nesta ação.
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};
