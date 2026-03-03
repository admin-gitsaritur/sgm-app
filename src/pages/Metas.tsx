import { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../components/ui/Select';
import {
  DataTable, DataTableCellPrimary, DataTableStatusBadge, DataTableBadge,
  type Column,
} from '../components/ui/DataTable';
import { Tooltip, TooltipTrigger, TooltipContent } from '../components/ui/Tooltip';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Plus, Pencil, Trash2, Gauge, Calendar, DollarSign, Percent, Hash } from 'lucide-react';
import { format } from 'date-fns';

// ── Constantes ────────────────────────────────────────────

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const UNIDADE_LABELS: Record<string, string> = {
  BRL: 'R$', PERCENTUAL: '%', UNIDADE: 'un',
};

const PERIODICIDADE_LABELS: Record<string, string> = {
  SEMANAL: 'Semanal', QUINZENAL: 'Quinzenal', MENSAL: 'Mensal',
  TRIMESTRAL: 'Trimestral', QUADRIMESTRAL: 'Quadrimestral', SEMESTRAL: 'Semestral',
};

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
  ATIVA: 'success', CONCLUIDA: 'info' as any, CANCELADA: 'danger',
};

// ── Helpers ───────────────────────────────────────────────

const formatValue = (centavos: number, unidade?: string) => {
  const valor = centavos / 100;
  switch (unidade) {
    case 'PERCENTUAL': return `${valor.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}%`;
    case 'UNIDADE': return `${valor.toLocaleString('pt-BR')} un`;
    default: return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  }
};

// ── Component ─────────────────────────────────────────────

export const Metas = () => {
  const [metas, setMetas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMeta, setEditingMeta] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const anoAtual = new Date().getFullYear();

  const [form, setForm] = useState({
    nome: '', valorMeta: '', unidadeMeta: 'BRL',
    ano: anoAtual.toString(),
    periodoInicio: `${anoAtual}-01-01`,
    periodoFim: `${anoAtual}-12-31`,
    periodicidadeAtualizacao: 'MENSAL',
    tipoCurva: 'LINEAR', curvaPersonalizada: Array(12).fill(''),
  });

  useEffect(() => { fetchMetas(); }, []);

  const handleAnoChange = (novoAno: string) => {
    const a = parseInt(novoAno);
    setForm(prev => ({
      ...prev, ano: novoAno,
      periodoInicio: a >= 2020 && a <= 2100 ? `${a}-01-01` : prev.periodoInicio,
      periodoFim: a >= 2020 && a <= 2100 ? `${a}-12-31` : prev.periodoFim,
    }));
  };

  const fetchMetas = async () => {
    setLoading(true);
    try {
      const res = await api('/metas');
      if (res.success) setMetas(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  // ── Filtered data (busca local) ──
  const filteredMetas = useMemo(() => {
    if (!search.trim()) return metas;
    const q = search.toLowerCase();
    return metas.filter((m: any) =>
      m.nome?.toLowerCase().includes(q) ||
      m.ano?.toString().includes(q) ||
      m.status?.toLowerCase().includes(q)
    );
  }, [metas, search]);

  // ── DataTable Columns ──
  // O DataTable do saritur-cx usa um design system padronizado:
  //
  // DESIGN VISUAL:
  // • Card com border-radius 24px, borda stone-200, sombra suave
  // • Header sticky com text-[11px] uppercase tracking-wider stone-400
  // • Linhas com hover:bg-stone-50 e group transition
  // • CellPrimary: text-sm font-semibold text-brown, hover→text-primary
  // • CellSecondary: text-sm text-stone-600
  // • StatusBadge: rounded-xl com dot colorido + border + text-[11px] font-semibold
  // • Badge: rounded-xl text-xs font-bold com cores semânticas
  // • Rodapé: bg-stone-50/30 com contagem "Mostrando X resultados"
  // • Busca integrada: SearchInput com ícone lupa, border→primary no focus
  // • Paginação: botões 36x36 rounded-lg, ativo = bg-brown text-white shadow-md
  //
  const columns: Column<any>[] = useMemo(() => [
    {
      key: 'nome',
      header: 'Meta',
      cellVariant: 'none' as const,
      render: (_: unknown, row: any) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Gauge className="w-4 h-4 text-primary" />
          </div>
          <DataTableCellPrimary>
            {row.nome}
          </DataTableCellPrimary>
        </div>
      ),
    },
    {
      key: 'valorMetaCentavos',
      header: 'Valor',
      align: 'center' as const,
      render: (val: unknown, row: any) => formatValue(val as number, row.unidadeMeta),
    },
    {
      key: 'ano',
      header: 'Ano',
      align: 'center' as const,
    },
    {
      key: 'periodoInicio',
      header: 'Período',
      align: 'center' as const,
      hiddenOnMobile: true,
      cellVariant: 'none' as const,
      render: (_: unknown, row: any) => (
        <span className="text-sm text-stone-500">
          {row.periodoInicio ? format(new Date(row.periodoInicio), 'dd/MM/yy') : '—'} – {row.periodoFim ? format(new Date(row.periodoFim), 'dd/MM/yy') : '—'}
        </span>
      ),
    },
    {
      key: 'periodicidadeAtualizacao',
      header: 'Periodicidade',
      align: 'center' as const,
      hiddenOnMobile: true,
      cellVariant: 'none' as const,
      render: (val: unknown) => (
        <DataTableBadge color="gray">
          {PERIODICIDADE_LABELS[val as string] || val}
        </DataTableBadge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center' as const,
      cellVariant: 'none' as const,
      render: (val: unknown) => {
        const s = val as string;
        return (
          <DataTableStatusBadge
            status={s}
            variant={STATUS_VARIANT[s] || 'default'}
          />
        );
      },
    },
    {
      key: 'acoes',
      header: 'Ações',
      width: '100px',
      align: 'center' as const,
      cellVariant: 'none' as const,
      render: (_: unknown, row: any) => (
        <div className="inline-flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="h-8 w-8 rounded-lg text-stone-300 hover:text-primary hover:bg-primary/10 transition-colors inline-flex items-center justify-center"
                onClick={(e) => { e.stopPropagation(); openEdit(row); }}
              >
                <Pencil className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Editar</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="h-8 w-8 rounded-lg text-stone-300 hover:text-rose-600 hover:bg-rose-50 transition-colors inline-flex items-center justify-center"
                onClick={(e) => { e.stopPropagation(); setDeleteTarget(row); }}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Excluir</TooltipContent>
          </Tooltip>
        </div>
      ),
    },
  ], []);

  // ── CRUD handlers ──

  const openCreate = () => {
    setEditingMeta(null);
    setForm({
      nome: '', valorMeta: '', unidadeMeta: 'BRL',
      ano: anoAtual.toString(),
      periodoInicio: `${anoAtual}-01-01`,
      periodoFim: `${anoAtual}-12-31`,
      periodicidadeAtualizacao: 'MENSAL',
      tipoCurva: 'LINEAR', curvaPersonalizada: Array(12).fill(''),
    });
    setError('');
    setIsModalOpen(true);
  };

  const openEdit = (m: any) => {
    setEditingMeta(m);
    const curva = m.curvaPersonalizada
      ? m.curvaPersonalizada.map((v: number) => (v / 100).toString())
      : Array(12).fill('');
    setForm({
      nome: m.nome,
      valorMeta: (m.valorMetaCentavos / 100).toString(),
      unidadeMeta: m.unidadeMeta || 'BRL',
      ano: m.ano.toString(),
      periodoInicio: m.periodoInicio?.slice(0, 10),
      periodoFim: m.periodoFim?.slice(0, 10),
      periodicidadeAtualizacao: m.periodicidadeAtualizacao,
      tipoCurva: m.tipoCurva,
      curvaPersonalizada: curva,
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      const body: any = {
        nome: form.nome,
        valorMeta: parseFloat(form.valorMeta),
        unidadeMeta: form.unidadeMeta,
        ano: parseInt(form.ano),
        periodoInicio: form.periodoInicio,
        periodoFim: form.periodoFim,
        periodicidadeAtualizacao: form.periodicidadeAtualizacao,
        tipoCurva: form.tipoCurva,
        curvaPersonalizada: form.tipoCurva === 'PERSONALIZADA'
          ? form.curvaPersonalizada.map(v => parseFloat(v) || 0)
          : null,
      };
      if (editingMeta) {
        await api(`/metas/${editingMeta.id}`, { method: 'PUT', body: JSON.stringify(body) });
      } else {
        await api('/metas', { method: 'POST', body: JSON.stringify(body) });
      }
      setIsModalOpen(false);
      fetchMetas();
    } catch (err: any) { setError(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api(`/metas/${deleteTarget.id}`, { method: 'DELETE' });
      setDeleteTarget(null);
      fetchMetas();
    } catch (err: any) { alert(err.message); }
  };

  // ── Curva helpers ──
  const valorLabel = form.unidadeMeta === 'PERCENTUAL' ? 'Valor da Meta (%)' : form.unidadeMeta === 'UNIDADE' ? 'Valor da Meta (un)' : 'Valor da Meta (R$)';
  const valorIcon = form.unidadeMeta === 'PERCENTUAL' ? <Percent size={16} /> : form.unidadeMeta === 'UNIDADE' ? <Hash size={16} /> : <DollarSign size={16} />;
  const somaCurva = form.curvaPersonalizada.reduce((s, v) => s + (parseFloat(v) || 0), 0);
  const valorMeta = parseFloat(form.valorMeta) || 0;
  const progressoCurva = valorMeta > 0 ? (somaCurva / valorMeta) * 100 : 0;

  // ── Render ──

  return (
    <div className="space-y-2">

      {/* ── Header ── */}
      <div className="mb-2">
        <h1 className="text-2xl font-semibold text-brown tracking-tight">Gestão de Metas</h1>
        <p className="text-brown/50 text-sm mt-1">Gerencie as metas estratégicas corporativas (Camada 1)</p>
      </div>

      {/* ── DataTable ──
       * Componente padrão saritur-cx:
       * Design: card rounded-[24px] com borda stone-200, shadow sutil
       * Header: sticky, text-[11px] uppercase stone-400, setas de ordenação em hover
       * Busca: SearchInput integrado no topo com ícone lupa → primary on focus
       * Rodapé: bg-stone-50/30 com "Mostrando X resultados"
       * Empty: ícone SearchX 64px + mensagem centralizada
       * Loading: Loader2 spinner centralizado
       */}
      <DataTable
        data={filteredMetas}
        columns={columns}
        loading={loading}
        rowKey="id"
        emptyMessage="Nenhuma meta cadastrada"
        emptyIcon={<Gauge className="h-16 w-16 mb-4 opacity-30 text-stone-400" />}
        searchPlaceholder="Buscar metas..."
        searchValue={search}
        onSearchChange={setSearch}
        actionButton={
          <Button onClick={openCreate} leftIcon={<Plus size={18} />}>
            Nova Meta
          </Button>
        }
        labels={{
          showingPrefix: 'Mostrando',
          showingResults: 'metas',
        }}
      />

      {/* ── Form Modal ── */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingMeta ? 'Editar Meta' : 'Nova Meta'} size="lg">
        <div className="space-y-5">
          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-sm text-rose-700">{error}</div>
          )}

          <div className="space-y-1.5">
            <Label>Nome da Meta</Label>
            <Input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Receita Operacional 2025" leftIcon={<Gauge size={16} />} />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Unidade</Label>
              <Select value={form.unidadeMeta} onValueChange={v => setForm({ ...form, unidadeMeta: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="BRL">R$ (Reais)</SelectItem>
                  <SelectItem value="PERCENTUAL">% (Percentual)</SelectItem>
                  <SelectItem value="UNIDADE">Un (Unidade)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{valorLabel}</Label>
              <Input type="number" step={form.unidadeMeta === 'PERCENTUAL' ? '0.1' : form.unidadeMeta === 'UNIDADE' ? '1' : '0.01'}
                value={form.valorMeta} onChange={e => setForm({ ...form, valorMeta: e.target.value })}
                placeholder={form.unidadeMeta === 'PERCENTUAL' ? '95.0' : form.unidadeMeta === 'UNIDADE' ? '500' : '10000000.00'}
                leftIcon={valorIcon} />
            </div>
            <div className="space-y-1.5">
              <Label>Ano</Label>
              <Input type="number" value={form.ano} onChange={e => handleAnoChange(e.target.value)} leftIcon={<Calendar size={16} />} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Período Início</Label>
              <Input type="date" value={form.periodoInicio} onChange={e => setForm({ ...form, periodoInicio: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Período Fim</Label>
              <Input type="date" value={form.periodoFim} onChange={e => setForm({ ...form, periodoFim: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Periodicidade de Alimentação</Label>
              <Select value={form.periodicidadeAtualizacao} onValueChange={v => setForm({ ...form, periodicidadeAtualizacao: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="SEMANAL">Semanal</SelectItem>
                  <SelectItem value="QUINZENAL">Quinzenal</SelectItem>
                  <SelectItem value="MENSAL">Mensal</SelectItem>
                  <SelectItem value="TRIMESTRAL">Trimestral</SelectItem>
                  <SelectItem value="QUADRIMESTRAL">Quadrimestral</SelectItem>
                  <SelectItem value="SEMESTRAL">Semestral</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Tipo de Curva</Label>
              <Select value={form.tipoCurva} onValueChange={v => setForm({ ...form, tipoCurva: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="LINEAR">Linear</SelectItem>
                  <SelectItem value="PERSONALIZADA">Personalizada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {form.tipoCurva === 'PERSONALIZADA' && (
            <div className="space-y-3 bg-stone-50 rounded-xl p-4 border border-stone-100">
              <div className="flex items-center justify-between">
                <Label>Curva Personalizada ({UNIDADE_LABELS[form.unidadeMeta] || 'R$'} por mês)</Label>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${Math.abs(progressoCurva - 100) < 0.01 ? 'bg-emerald-50 text-emerald-700' : progressoCurva > 100 ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                  {somaCurva.toLocaleString('pt-BR')} ({progressoCurva.toFixed(1)}%)
                </span>
              </div>
              <div className="w-full bg-stone-200 rounded-full h-1.5">
                <div className={`h-1.5 rounded-full transition-all duration-300 ${Math.abs(progressoCurva - 100) < 0.01 ? 'bg-emerald-500' : progressoCurva > 100 ? 'bg-rose-500' : 'bg-amber-500'
                  }`} style={{ width: `${Math.min(progressoCurva, 100)}%` }} />
              </div>
              <div className="grid grid-cols-4 gap-2">
                {MESES.map((mes, i) => (
                  <div key={i} className="space-y-1">
                    <span className="text-[11px] font-medium text-brown/40 uppercase">{mes}</span>
                    <Input type="number" step="0.01" size="sm" value={form.curvaPersonalizada[i]}
                      onChange={e => { const c = [...form.curvaPersonalizada]; c[i] = e.target.value; setForm({ ...form, curvaPersonalizada: c }); }} />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-stone-100">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} isLoading={saving}>{editingMeta ? 'Atualizar' : 'Criar Meta'}</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Excluir Meta" message={`Deseja excluir "${deleteTarget?.nome}"? Projetos vinculados impedirão a exclusão.`} confirmLabel="Excluir" />
    </div>
  );
};
