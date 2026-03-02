import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Modal } from '../components/Modal';
import { Badge } from '../components/Badge';
import { EmptyState } from '../components/EmptyState';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { TableSkeleton } from '../components/Skeleton';
import { Plus, Edit2, Trash2, BarChart2, RefreshCw, Filter } from 'lucide-react';

export const Indicadores = () => {
    const [indicadores, setIndicadores] = useState<any[]>([]);
    const [projetos, setProjetos] = useState<any[]>([]);
    const [usuarios, setUsuarios] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [editingIndicador, setEditingIndicador] = useState<any>(null);
    const [updateTarget, setUpdateTarget] = useState<any>(null);
    const [deleteTarget, setDeleteTarget] = useState<any>(null);
    const [filterProjetoId, setFilterProjetoId] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [updateValue, setUpdateValue] = useState('');

    const [form, setForm] = useState({
        projetoId: '', nome: '', metaIndicador: '', unidade: '', peso: '', frequenciaAtualizacao: 'MENSAL', responsavel: '',
    });

    useEffect(() => { fetchData(); }, [filterProjetoId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [indRes, projRes, userRes] = await Promise.all([
                api(`/indicadores${filterProjetoId ? `?projetoId=${filterProjetoId}` : ''}`),
                api('/projetos'),
                api('/usuarios'),
            ]);
            if (indRes.success) setIndicadores(indRes.data);
            if (projRes.success) setProjetos(projRes.data);
            if (userRes.success) setUsuarios(userRes.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const openCreate = () => {
        setEditingIndicador(null);
        setForm({ projetoId: '', nome: '', metaIndicador: '', unidade: '', peso: '', frequenciaAtualizacao: 'MENSAL', responsavel: '' });
        setError('');
        setIsModalOpen(true);
    };

    const openEdit = (ind: any) => {
        setEditingIndicador(ind);
        setForm({
            projetoId: ind.projetoId, nome: ind.nome,
            metaIndicador: (ind.metaIndicadorCentavos / 100).toString(),
            unidade: ind.unidade, peso: ind.peso.toString(),
            frequenciaAtualizacao: ind.frequenciaAtualizacao, responsavel: ind.responsavel,
        });
        setError('');
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        setSaving(true); setError('');
        try {
            const body = { ...form, metaIndicador: parseFloat(form.metaIndicador), peso: parseFloat(form.peso) };
            if (editingIndicador) {
                await api(`/indicadores/${editingIndicador.id}`, { method: 'PUT', body: JSON.stringify(body) });
            } else {
                await api('/indicadores', { method: 'POST', body: JSON.stringify(body) });
            }
            setIsModalOpen(false); fetchData();
        } catch (err: any) { setError(err.message); }
        finally { setSaving(false); }
    };

    const handleUpdate = async () => {
        if (!updateTarget) return;
        setSaving(true);
        try {
            await api(`/indicadores/${updateTarget.id}/atualizar`, { method: 'POST', body: JSON.stringify({ realizado: parseFloat(updateValue) }) });
            setIsUpdateModalOpen(false); setUpdateTarget(null); fetchData();
        } catch (err: any) { setError(err.message); }
        finally { setSaving(false); }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try { await api(`/indicadores/${deleteTarget.id}`, { method: 'DELETE' }); setDeleteTarget(null); fetchData(); }
        catch (err: any) { setError(err.message); }
    };

    const formatCurrency = (centavos: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(centavos / 100);
    const getUserName = (id: string) => usuarios.find((u: any) => u.id === id)?.nome || id;
    const getPercent = (ind: any) => ind.metaIndicadorCentavos > 0 ? ((ind.realizadoCentavos / ind.metaIndicadorCentavos) * 100).toFixed(1) : '0.0';

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[#4E3205]">Indicadores</h1>
                    <p className="text-gray-500 mt-1">Acompanhe e atualize os indicadores de performance (Camada 3)</p>
                </div>
                <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-[#F37137] text-white rounded-lg hover:bg-[#d95f27] transition-colors shadow-sm">
                    <Plus size={20} /> <span>Novo Indicador</span>
                </button>
            </div>

            {projetos.length > 0 && (
                <div className="flex items-center gap-2">
                    <Filter size={16} className="text-gray-400" />
                    <select value={filterProjetoId} onChange={e => setFilterProjetoId(e.target.value)}
                        className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-[#F37137] focus:border-[#F37137]">
                        <option value="">Todos os projetos</option>
                        {projetos.map((p: any) => <option key={p.id} value={p.id}>{p.nome}</option>)}
                    </select>
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                {loading ? <TableSkeleton rows={5} cols={8} /> : indicadores.length === 0 ? (
                    <EmptyState icon={<BarChart2 className="w-8 h-8 text-gray-400" />} title="Nenhum indicador encontrado"
                        description="Crie indicadores vinculados a projetos para acompanhar a performance."
                        action={<button onClick={openCreate} className="px-4 py-2 bg-[#F37137] text-white rounded-lg text-sm">Criar Indicador</button>} />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead><tr className="bg-gray-50 border-b border-gray-200">
                                <th className="px-6 py-4 text-sm font-semibold text-[#4E3205]">Nome</th>
                                <th className="px-6 py-4 text-sm font-semibold text-[#4E3205]">Projeto</th>
                                <th className="px-6 py-4 text-sm font-semibold text-[#4E3205]">Meta</th>
                                <th className="px-6 py-4 text-sm font-semibold text-[#4E3205]">Realizado</th>
                                <th className="px-6 py-4 text-sm font-semibold text-[#4E3205]">% Atingido</th>
                                <th className="px-6 py-4 text-sm font-semibold text-[#4E3205]">Peso</th>
                                <th className="px-6 py-4 text-sm font-semibold text-[#4E3205]">Status</th>
                                <th className="px-6 py-4 text-sm font-semibold text-[#4E3205] text-right">Ações</th>
                            </tr></thead>
                            <tbody className="divide-y divide-gray-100">
                                {indicadores.map((ind: any) => (
                                    <tr key={ind.id} className="hover:bg-[#F37137]/5 transition-colors">
                                        <td className="px-6 py-4 font-medium text-[#4E3205]">{ind.nome}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{ind.projetoNome || ''}</td>
                                        <td className="px-6 py-4 text-sm">{formatCurrency(ind.metaIndicadorCentavos)}</td>
                                        <td className="px-6 py-4 text-sm">{formatCurrency(ind.realizadoCentavos)}</td>
                                        <td className="px-6 py-4 text-sm font-medium">{getPercent(ind)}%</td>
                                        <td className="px-6 py-4 text-sm">{(ind.peso * 100).toFixed(0)}%</td>
                                        <td className="px-6 py-4"><Badge status={ind.statusAtualizacao} /></td>
                                        <td className="px-6 py-4 text-right space-x-1">
                                            <button onClick={() => { setUpdateTarget(ind); setUpdateValue((ind.realizadoCentavos / 100).toString()); setIsUpdateModalOpen(true); }}
                                                className="p-2 text-gray-400 hover:text-emerald-500 rounded-lg hover:bg-white transition-colors" title="Atualizar Realizado"><RefreshCw size={16} /></button>
                                            <button onClick={() => openEdit(ind)} className="p-2 text-gray-400 hover:text-[#F37137] rounded-lg hover:bg-white transition-colors"><Edit2 size={16} /></button>
                                            <button onClick={() => setDeleteTarget(ind)} className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-white transition-colors"><Trash2 size={16} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingIndicador ? 'Editar Indicador' : 'Novo Indicador'} size="lg">
                <div className="space-y-4">
                    {error && <div className="bg-red-50 border-l-4 border-red-400 p-3 text-sm text-red-700 rounded">{error}</div>}
                    <div><label className="block text-sm font-medium text-[#4E3205] mb-1">Projeto</label>
                        <select value={form.projetoId} onChange={e => setForm({ ...form, projetoId: e.target.value })} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm">
                            <option value="">Selecione...</option>
                            {projetos.map((p: any) => <option key={p.id} value={p.id}>{p.nome}</option>)}
                        </select></div>
                    <div><label className="block text-sm font-medium text-[#4E3205] mb-1">Nome</label>
                        <input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-[#4E3205] mb-1">Meta do Indicador (R$)</label>
                            <input type="number" step="0.01" value={form.metaIndicador} onChange={e => setForm({ ...form, metaIndicador: e.target.value })} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" /></div>
                        <div><label className="block text-sm font-medium text-[#4E3205] mb-1">Unidade</label>
                            <input value={form.unidade} onChange={e => setForm({ ...form, unidade: e.target.value })} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" placeholder="R$, %, unidades..." /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-[#4E3205] mb-1">Peso (0 a 1)</label>
                            <input type="number" step="0.01" min="0" max="1" value={form.peso} onChange={e => setForm({ ...form, peso: e.target.value })} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" /></div>
                        <div><label className="block text-sm font-medium text-[#4E3205] mb-1">Frequência</label>
                            <select value={form.frequenciaAtualizacao} onChange={e => setForm({ ...form, frequenciaAtualizacao: e.target.value })} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm">
                                <option value="MENSAL">Mensal</option><option value="QUINZENAL">Quinzenal</option><option value="SEMANAL">Semanal</option>
                            </select></div>
                    </div>
                    <div><label className="block text-sm font-medium text-[#4E3205] mb-1">Responsável</label>
                        <select value={form.responsavel} onChange={e => setForm({ ...form, responsavel: e.target.value })} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm">
                            <option value="">Selecione...</option>
                            {usuarios.map((u: any) => <option key={u.id} value={u.id}>{u.nome}</option>)}
                        </select></div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                        <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancelar</button>
                        <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-[#F37137] rounded-lg hover:bg-[#d95f27] disabled:opacity-50">{saving ? 'Salvando...' : 'Salvar'}</button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isUpdateModalOpen} onClose={() => setIsUpdateModalOpen(false)} title="Atualizar Realizado" size="sm">
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">Indicador: <strong>{updateTarget?.nome}</strong></p>
                    <div><label className="block text-sm font-medium text-[#4E3205] mb-1">Novo valor realizado (R$)</label>
                        <input type="number" step="0.01" value={updateValue} onChange={e => setUpdateValue(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-[#F37137]" /></div>
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button onClick={() => setIsUpdateModalOpen(false)} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancelar</button>
                        <button onClick={handleUpdate} disabled={saving} className="px-4 py-2 text-sm text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50">{saving ? 'Atualizando...' : 'Atualizar'}</button>
                    </div>
                </div>
            </Modal>

            <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
                title="Excluir Indicador" message={`Deseja excluir "${deleteTarget?.nome}"?`} confirmLabel="Excluir" />
        </div>
    );
};
