import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Modal } from '../components/Modal';
import { Badge } from '../components/Badge';
import { EmptyState } from '../components/EmptyState';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { TableSkeleton } from '../components/Skeleton';
import { Plus, Edit2, Trash2, Target } from 'lucide-react';
import { format } from 'date-fns';

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export const Metas = () => {
  const [metas, setMetas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMeta, setEditingMeta] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    nome: '', valorMeta: '', ano: new Date().getFullYear().toString(), periodoInicio: '', periodoFim: '',
    indicadorMacro: '', periodicidadeAtualizacao: 'MENSAL', tipoCurva: 'LINEAR',
    curvaPersonalizada: Array(12).fill(''),
  });

  useEffect(() => { fetchMetas(); }, []);

  const fetchMetas = async () => {
    setLoading(true);
    try {
      const res = await api('/metas');
      if (res.success) setMetas(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const openCreate = () => {
    setEditingMeta(null);
    setForm({
      nome: '', valorMeta: '', ano: new Date().getFullYear().toString(), periodoInicio: '', periodoFim: '',
      indicadorMacro: '', periodicidadeAtualizacao: 'MENSAL', tipoCurva: 'LINEAR', curvaPersonalizada: Array(12).fill('')
    });
    setError('');
    setIsModalOpen(true);
  };

  const openEdit = (m: any) => {
    setEditingMeta(m);
    const curva = m.curvaPersonalizada ? m.curvaPersonalizada.map((v: number) => (v / 100).toString()) : Array(12).fill('');
    setForm({
      nome: m.nome, valorMeta: (m.valorMetaCentavos / 100).toString(), ano: m.ano.toString(),
      periodoInicio: m.periodoInicio?.slice(0, 10), periodoFim: m.periodoFim?.slice(0, 10),
      indicadorMacro: m.indicadorMacro, periodicidadeAtualizacao: m.periodicidadeAtualizacao,
      tipoCurva: m.tipoCurva, curvaPersonalizada: curva,
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      const body: any = {
        ...form, valorMeta: parseFloat(form.valorMeta), ano: parseInt(form.ano),
        curvaPersonalizada: form.tipoCurva === 'PERSONALIZADA' ? form.curvaPersonalizada.map(v => parseFloat(v) || 0) : null,
      };
      if (editingMeta) {
        await api(`/metas/${editingMeta.id}`, { method: 'PUT', body: JSON.stringify(body) });
      } else {
        await api('/metas', { method: 'POST', body: JSON.stringify(body) });
      }
      setIsModalOpen(false); fetchMetas();
    } catch (err: any) { setError(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try { await api(`/metas/${deleteTarget.id}`, { method: 'DELETE' }); setDeleteTarget(null); fetchMetas(); }
    catch (err: any) { alert(err.message); }
  };

  const formatCurrency = (centavos: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(centavos / 100);
  const somaCurva = form.curvaPersonalizada.reduce((s, v) => s + (parseFloat(v) || 0), 0);
  const valorMeta = parseFloat(form.valorMeta) || 0;
  const progressoCurva = valorMeta > 0 ? (somaCurva / valorMeta) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#4E3205]">Gestão de Metas</h1>
          <p className="text-gray-500 mt-1">Gerencie as metas estratégicas corporativas (Camada 1)</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-[#F37137] text-white rounded-lg hover:bg-[#d95f27] transition-colors shadow-sm">
          <Plus size={20} /> <span>Nova Meta</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? <TableSkeleton rows={3} cols={7} /> : metas.length === 0 ? (
          <EmptyState icon={<Target className="w-8 h-8 text-gray-400" />} title="Nenhuma meta cadastrada"
            description="Comece cadastrando uma meta estratégica para visualizar o dashboard."
            action={<button onClick={openCreate} className="px-4 py-2 bg-[#F37137] text-white rounded-lg text-sm">Criar Meta</button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead><tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-sm font-semibold text-[#4E3205]">Nome da Meta</th>
                <th className="px-6 py-4 text-sm font-semibold text-[#4E3205]">Valor (R$)</th>
                <th className="px-6 py-4 text-sm font-semibold text-[#4E3205]">Ano</th>
                <th className="px-6 py-4 text-sm font-semibold text-[#4E3205]">Período</th>
                <th className="px-6 py-4 text-sm font-semibold text-[#4E3205]">Indicador Macro</th>
                <th className="px-6 py-4 text-sm font-semibold text-[#4E3205]">Status</th>
                <th className="px-6 py-4 text-sm font-semibold text-[#4E3205] text-right">Ações</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {metas.map((meta: any) => (
                  <tr key={meta.id} className="hover:bg-[#F37137]/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#F37137]/10 flex items-center justify-center">
                          <Target className="w-4 h-4 text-[#F37137]" />
                        </div>
                        <span className="font-medium text-[#4E3205]">{meta.nome}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-[#4E3205]">{formatCurrency(meta.valorMetaCentavos)}</td>
                    <td className="px-6 py-4 text-gray-600">{meta.ano}</td>
                    <td className="px-6 py-4 text-gray-600 text-sm">
                      {meta.periodoInicio && format(new Date(meta.periodoInicio), 'dd/MM/yyyy')} - {meta.periodoFim && format(new Date(meta.periodoFim), 'dd/MM/yyyy')}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{meta.indicadorMacro}</td>
                    <td className="px-6 py-4"><Badge status={meta.status} /></td>
                    <td className="px-6 py-4 text-right space-x-1">
                      <button onClick={() => openEdit(meta)} className="p-2 text-gray-400 hover:text-[#F37137] transition-colors rounded-lg hover:bg-white"><Edit2 size={16} /></button>
                      <button onClick={() => setDeleteTarget(meta)} className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-white"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingMeta ? 'Editar Meta' : 'Nova Meta'} size="lg">
        <div className="space-y-4">
          {error && <div className="bg-red-50 border-l-4 border-red-400 p-3 text-sm text-red-700 rounded">{error}</div>}
          <div><label className="block text-sm font-medium text-[#4E3205] mb-1">Nome da Meta</label>
            <input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-[#F37137] focus:border-[#F37137]" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-[#4E3205] mb-1">Valor da Meta (R$)</label>
              <input type="number" step="0.01" value={form.valorMeta} onChange={e => setForm({ ...form, valorMeta: e.target.value })} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" /></div>
            <div><label className="block text-sm font-medium text-[#4E3205] mb-1">Ano</label>
              <input type="number" value={form.ano} onChange={e => setForm({ ...form, ano: e.target.value })} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-[#4E3205] mb-1">Período Início</label>
              <input type="date" value={form.periodoInicio} onChange={e => setForm({ ...form, periodoInicio: e.target.value })} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" /></div>
            <div><label className="block text-sm font-medium text-[#4E3205] mb-1">Período Fim</label>
              <input type="date" value={form.periodoFim} onChange={e => setForm({ ...form, periodoFim: e.target.value })} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" /></div>
          </div>
          <div><label className="block text-sm font-medium text-[#4E3205] mb-1">Indicador Macro</label>
            <input value={form.indicadorMacro} onChange={e => setForm({ ...form, indicadorMacro: e.target.value })} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-[#4E3205] mb-1">Periodicidade</label>
              <select value={form.periodicidadeAtualizacao} onChange={e => setForm({ ...form, periodicidadeAtualizacao: e.target.value })} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm">
                <option value="MENSAL">Mensal</option><option value="QUINZENAL">Quinzenal</option><option value="SEMANAL">Semanal</option>
              </select></div>
            <div><label className="block text-sm font-medium text-[#4E3205] mb-1">Tipo de Curva</label>
              <select value={form.tipoCurva} onChange={e => setForm({ ...form, tipoCurva: e.target.value })} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm">
                <option value="LINEAR">Linear</option><option value="PERSONALIZADA">Personalizada</option>
              </select></div>
          </div>
          {form.tipoCurva === 'PERSONALIZADA' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-[#4E3205]">Curva Personalizada (R$ por mês)</label>
                <span className={`text-xs font-medium ${Math.abs(progressoCurva - 100) < 0.01 ? 'text-emerald-600' : 'text-amber-600'}`}>
                  Soma: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(somaCurva)} ({progressoCurva.toFixed(1)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className={`h-2 rounded-full transition-all ${Math.abs(progressoCurva - 100) < 0.01 ? 'bg-emerald-500' : progressoCurva > 100 ? 'bg-red-500' : 'bg-amber-500'}`}
                  style={{ width: `${Math.min(progressoCurva, 100)}%` }} />
              </div>
              <div className="grid grid-cols-4 gap-2">
                {MESES.map((mes, i) => (
                  <div key={i}>
                    <label className="text-xs text-gray-500">{mes}</label>
                    <input type="number" step="0.01" value={form.curvaPersonalizada[i]}
                      onChange={e => { const c = [...form.curvaPersonalizada]; c[i] = e.target.value; setForm({ ...form, curvaPersonalizada: c }); }}
                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs" />
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancelar</button>
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm text-white bg-[#F37137] rounded-lg hover:bg-[#d95f27] disabled:opacity-50">{saving ? 'Salvando...' : 'Salvar'}</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Excluir Meta" message={`Deseja excluir "${deleteTarget?.nome}"? Projetos vinculados impedirão a exclusão.`} confirmLabel="Excluir" />
    </div>
  );
};
