import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Modal } from '../components/Modal';
import { Badge } from '../components/Badge';
import { EmptyState } from '../components/EmptyState';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { TableSkeleton } from '../components/Skeleton';
import { Plus, Edit2, Trash2, Briefcase, Filter } from 'lucide-react';

export const Projetos = () => {
    const [projetos, setProjetos] = useState<any[]>([]);
    const [metas, setMetas] = useState<any[]>([]);
    const [usuarios, setUsuarios] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProjeto, setEditingProjeto] = useState<any>(null);
    const [deleteTarget, setDeleteTarget] = useState<any>(null);
    const [filterMetaId, setFilterMetaId] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const [form, setForm] = useState({
        metaId: '', nome: '', contribuicaoEsperada: '', prazoInicio: '', prazoFim: '',
        responsavelPrincipal: '', responsaveis: [] as string[],
    });

    useEffect(() => { fetchData(); }, [filterMetaId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [projRes, metaRes, userRes] = await Promise.all([
                api(`/projetos${filterMetaId ? `?metaId=${filterMetaId}` : ''}`),
                api('/metas'),
                api('/usuarios'),
            ]);
            if (projRes.success) setProjetos(projRes.data);
            if (metaRes.success) setMetas(metaRes.data);
            if (userRes.success) setUsuarios(userRes.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const openCreate = () => {
        setEditingProjeto(null);
        setForm({ metaId: '', nome: '', contribuicaoEsperada: '', prazoInicio: '', prazoFim: '', responsavelPrincipal: '', responsaveis: [] });
        setError('');
        setIsModalOpen(true);
    };

    const openEdit = (p: any) => {
        setEditingProjeto(p);
        setForm({
            metaId: p.metaId, nome: p.nome,
            contribuicaoEsperada: (p.contribuicaoEsperadaCentavos / 100).toString(),
            prazoInicio: p.prazoInicio?.slice(0, 10), prazoFim: p.prazoFim?.slice(0, 10),
            responsavelPrincipal: p.responsavelPrincipal,
            responsaveis: Array.isArray(p.responsaveis) ? p.responsaveis : [],
        });
        setError('');
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        setSaving(true);
        setError('');
        try {
            const body = {
                ...form,
                contribuicaoEsperada: parseFloat(form.contribuicaoEsperada),
                responsaveis: form.responsaveis.length > 0 ? form.responsaveis : [form.responsavelPrincipal],
            };
            if (editingProjeto) {
                await api(`/projetos/${editingProjeto.id}`, { method: 'PUT', body: JSON.stringify(body) });
            } else {
                await api('/projetos', { method: 'POST', body: JSON.stringify(body) });
            }
            setIsModalOpen(false);
            fetchData();
        } catch (err: any) { setError(err.message); }
        finally { setSaving(false); }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await api(`/projetos/${deleteTarget.id}`, { method: 'DELETE' });
            setDeleteTarget(null);
            fetchData();
        } catch (err: any) { setError(err.message); }
    };

    const formatCurrency = (centavos: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(centavos / 100);
    const getUserName = (id: string) => usuarios.find((u: any) => u.id === id)?.nome || id;
    const getMetaNome = (id: string) => metas.find((m: any) => m.id === id)?.nome || id;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[#4E3205]">Projetos</h1>
                    <p className="text-gray-500 mt-1">Gerencie os projetos vinculados às metas (Camada 2)</p>
                </div>
                <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-[#F37137] text-white rounded-lg hover:bg-[#d95f27] transition-colors shadow-sm">
                    <Plus size={20} /> <span>Novo Projeto</span>
                </button>
            </div>

            {metas.length > 0 && (
                <div className="flex items-center gap-2">
                    <Filter size={16} className="text-gray-400" />
                    <select value={filterMetaId} onChange={e => setFilterMetaId(e.target.value)}
                        className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-[#F37137] focus:border-[#F37137]">
                        <option value="">Todas as metas</option>
                        {metas.map((m: any) => <option key={m.id} value={m.id}>{m.nome}</option>)}
                    </select>
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                {loading ? <TableSkeleton rows={5} cols={7} /> : projetos.length === 0 ? (
                    <EmptyState icon={<Briefcase className="w-8 h-8 text-gray-400" />} title="Nenhum projeto encontrado"
                        description="Crie um projeto vinculado a uma meta para começar."
                        action={<button onClick={openCreate} className="px-4 py-2 bg-[#F37137] text-white rounded-lg text-sm hover:bg-[#d95f27]">Criar Projeto</button>} />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead><tr className="bg-gray-50 border-b border-gray-200">
                                <th className="px-6 py-4 text-sm font-semibold text-[#4E3205]">Nome</th>
                                <th className="px-6 py-4 text-sm font-semibold text-[#4E3205]">Meta</th>
                                <th className="px-6 py-4 text-sm font-semibold text-[#4E3205]">Contribuição</th>
                                <th className="px-6 py-4 text-sm font-semibold text-[#4E3205]">Peso</th>
                                <th className="px-6 py-4 text-sm font-semibold text-[#4E3205]">Responsável</th>
                                <th className="px-6 py-4 text-sm font-semibold text-[#4E3205]">Status</th>
                                <th className="px-6 py-4 text-sm font-semibold text-[#4E3205] text-right">Ações</th>
                            </tr></thead>
                            <tbody className="divide-y divide-gray-100">
                                {projetos.map((p: any) => (
                                    <tr key={p.id} className="hover:bg-[#F37137]/5 transition-colors">
                                        <td className="px-6 py-4 font-medium text-[#4E3205]">{p.nome}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{p.metaNome || getMetaNome(p.metaId)}</td>
                                        <td className="px-6 py-4 text-sm font-medium">{formatCurrency(p.contribuicaoEsperadaCentavos)}</td>
                                        <td className="px-6 py-4 text-sm">{(p.pesoAutomatico * 100).toFixed(1)}%</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{getUserName(p.responsavelPrincipal)}</td>
                                        <td className="px-6 py-4"><Badge status={p.status} /></td>
                                        <td className="px-6 py-4 text-right space-x-1">
                                            <button onClick={() => openEdit(p)} className="p-2 text-gray-400 hover:text-[#F37137] rounded-lg hover:bg-white transition-colors"><Edit2 size={16} /></button>
                                            <button onClick={() => setDeleteTarget(p)} className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-white transition-colors"><Trash2 size={16} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingProjeto ? 'Editar Projeto' : 'Novo Projeto'} size="lg">
                <div className="space-y-4">
                    {error && <div className="bg-red-50 border-l-4 border-red-400 p-3 text-sm text-red-700 rounded">{error}</div>}
                    <div><label className="block text-sm font-medium text-[#4E3205] mb-1">Meta vinculada</label>
                        <select value={form.metaId} onChange={e => setForm({ ...form, metaId: e.target.value })} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-[#F37137] focus:border-[#F37137]">
                            <option value="">Selecione...</option>
                            {metas.map((m: any) => <option key={m.id} value={m.id}>{m.nome}</option>)}
                        </select>
                    </div>
                    <div><label className="block text-sm font-medium text-[#4E3205] mb-1">Nome do Projeto</label>
                        <input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-[#F37137] focus:border-[#F37137]" />
                    </div>
                    <div><label className="block text-sm font-medium text-[#4E3205] mb-1">Contribuição Esperada (R$)</label>
                        <input type="number" step="0.01" value={form.contribuicaoEsperada} onChange={e => setForm({ ...form, contribuicaoEsperada: e.target.value })} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-[#F37137] focus:border-[#F37137]" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-[#4E3205] mb-1">Prazo Início</label>
                            <input type="date" value={form.prazoInicio} onChange={e => setForm({ ...form, prazoInicio: e.target.value })} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-[#F37137] focus:border-[#F37137]" /></div>
                        <div><label className="block text-sm font-medium text-[#4E3205] mb-1">Prazo Fim</label>
                            <input type="date" value={form.prazoFim} onChange={e => setForm({ ...form, prazoFim: e.target.value })} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-[#F37137] focus:border-[#F37137]" /></div>
                    </div>
                    <div><label className="block text-sm font-medium text-[#4E3205] mb-1">Responsável Principal</label>
                        <select value={form.responsavelPrincipal} onChange={e => setForm({ ...form, responsavelPrincipal: e.target.value })} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-[#F37137] focus:border-[#F37137]">
                            <option value="">Selecione...</option>
                            {usuarios.map((u: any) => <option key={u.id} value={u.id}>{u.nome}</option>)}
                        </select>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                        <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancelar</button>
                        <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-[#F37137] rounded-lg hover:bg-[#d95f27] disabled:opacity-50">
                            {saving ? 'Salvando...' : 'Salvar'}
                        </button>
                    </div>
                </div>
            </Modal>

            <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
                title="Excluir Projeto" message={`Deseja realmente excluir o projeto "${deleteTarget?.nome}"? Esta ação não pode ser desfeita.`} confirmLabel="Excluir" />
        </div>
    );
};
