import { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../components/ui/select';
import {
  DataTable, DataTableCellPrimary, DataTableStatusBadge, DataTableBadge,
  type Column,
} from '../components/ui/data-table';
import { ActionButton } from '../components/ui/action-button';
import { ProgressBar } from '../components/ui/progress-bar';
import { PageHeader } from '../components/ui/PageHeader';
import { FormField } from '../components/ui/FormField';
import { CurrencyInput } from '../components/ui/CurrencyInput';
import { IconBadge } from '../components/ui/IconBadge';
import { CellText } from '../components/ui/CellText';
import { toast } from '../components/ui/toast';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Plus, Gauge, Calendar, DollarSign, Percent, Hash } from 'lucide-react';
import { format } from 'date-fns';

// ── Constantes ────────────────────────────────────────────

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const UNIDADE_LABELS: Record<string, string> = {
  BRL: 'R$', PERCENTUAL: '%', UNIDADE: 'un',
};

const PERIODICIDADE_LABELS: Record<string, string> = {
  MENSAL: 'Mensal',
  TRIMESTRAL: 'Trimestral', QUADRIMESTRAL: 'Quadrimestral', SEMESTRAL: 'Semestral',
};

/** Labels dos períodos para curva personalizada, conforme periodicidade */
const PERIODICIDADE_PERIODOS: Record<string, string[]> = {
  MENSAL: MESES,
  TRIMESTRAL: ['1º Tri', '2º Tri', '3º Tri', '4º Tri'],
  QUADRIMESTRAL: ['1º Quad', '2º Quad', '3º Quad'],
  SEMESTRAL: ['1º Sem', '2º Sem'],
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
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

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

  // ── Filtered + sorted data (busca local) ──
  const filteredMetas = useMemo(() => {
    let list = metas;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((m: any) =>
        m.nome?.toLowerCase().includes(q) ||
        m.ano?.toString().includes(q) ||
        m.status?.toLowerCase().includes(q)
      );
    }
    if (sortField) {
      list = [...list].sort((a: any, b: any) => {
        const va = a[sortField] ?? '';
        const vb = b[sortField] ?? '';
        const cmp = typeof va === 'number' ? va - vb : String(va).localeCompare(String(vb));
        return sortOrder === 'asc' ? cmp : -cmp;
      });
    }
    return list;
  }, [metas, search, sortField, sortOrder]);

  const handleSortChange = (field: string, order: 'asc' | 'desc') => {
    setSortField(field);
    setSortOrder(order);
  };

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
          <IconBadge icon={<Gauge className="w-4 h-4" />} theme="primary" />
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
        <CellText variant="muted">
          {row.periodoInicio ? format(new Date(row.periodoInicio), 'dd/MM/yy') : '—'} – {row.periodoFim ? format(new Date(row.periodoFim), 'dd/MM/yy') : '—'}
        </CellText>
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
          {PERIODICIDADE_LABELS[val as string] || String(val)}
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
          <ActionButton
            icon="pencil"
            theme="indigo"
            title="Editar"
            onClick={(e) => { e.stopPropagation(); openEdit(row); }}
          />
          <ActionButton
            icon="trash-2"
            theme="rose"
            title="Excluir"
            onClick={(e) => { e.stopPropagation(); setDeleteTarget(row); }}
          />
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
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
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
      toast.success({ title: 'Sucesso!', description: editingMeta ? 'Meta atualizada.' : 'Meta criada.' });
    } catch (err: any) { toast.error({ title: 'Erro ao salvar', description: err.message }); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api(`/metas/${deleteTarget.id}`, { method: 'DELETE' });
      setDeleteTarget(null);
      fetchMetas();
      toast.success({ title: 'Meta excluída', description: 'A meta foi removida com sucesso.' });
    } catch (err: any) { toast.error({ title: 'Erro ao excluir', description: err.message }); }
  };

  // ── Curva helpers ──
  const valorLabel = form.unidadeMeta === 'PERCENTUAL' ? 'Valor da Meta (%)' : form.unidadeMeta === 'UNIDADE' ? 'Valor da Meta (un)' : 'Valor da Meta (R$)';
  const valorIcon = form.unidadeMeta === 'PERCENTUAL' ? <Percent size={16} /> : form.unidadeMeta === 'UNIDADE' ? <Hash size={16} /> : <DollarSign size={16} />;
  const somaCurva = form.curvaPersonalizada.reduce((s, v) => s + (parseFloat(v) || 0), 0);
  const valorMeta = parseFloat(form.valorMeta) || 0;
  const progressoCurva = valorMeta > 0 ? (somaCurva / valorMeta) * 100 : 0;
  const periodos = PERIODICIDADE_PERIODOS[form.periodicidadeAtualizacao] || MESES;
  const periodoLabel = form.periodicidadeAtualizacao === 'MENSAL' ? 'mês'
    : form.periodicidadeAtualizacao === 'TRIMESTRAL' ? 'trimestre'
    : form.periodicidadeAtualizacao === 'QUADRIMESTRAL' ? 'quadrimestre' : 'semestre';

  const handlePeriodicidadeChange = (v: string) => {
    const novos = PERIODICIDADE_PERIODOS[v] || MESES;
    setForm({ ...form, periodicidadeAtualizacao: v, curvaPersonalizada: Array(novos.length).fill('') });
  };

  // ── Render ──

  return (
    <div className="space-y-2">

      {/* ── Header ── */}
      <PageHeader
        title="Gestão de Metas"
        subtitle="Gerencie as metas estratégicas corporativas (Camada 1)"
      />

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
        sortField={sortField}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
        emptyMessage="Nenhuma meta cadastrada"
        emptyIcon={<Gauge className="h-16 w-16 mb-4 opacity-30 text-stone-400" />}
        searchPlaceholder="Buscar metas..."
        searchValue={search}
        onSearchChange={setSearch}
        actionButton={
          <Button onClick={openCreate} leftIcon={<Plus size={18} />} size="lg">
            Nova Meta
          </Button>
        }
        labels={{
          showingPrefix: 'Mostrando',
          showingResults: 'metas',
        }}
      />

      {/* ── Form Modal ── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingMeta ? 'Editar Meta' : 'Nova Meta'}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} isLoading={saving}>{editingMeta ? 'Atualizar' : 'Criar Meta'}</Button>
          </>
        }
      >
        <div className="space-y-5">

          <FormField label="Nome da Meta">
            <Input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Receita Operacional 2025" leftIcon={<Gauge size={16} />} />
          </FormField>

          <div className="grid grid-cols-3 gap-4">
            <FormField label="Unidade">
              <Select value={form.unidadeMeta} onValueChange={v => setForm({ ...form, unidadeMeta: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="BRL">R$ (Reais)</SelectItem>
                  <SelectItem value="PERCENTUAL">% (Percentual)</SelectItem>
                  <SelectItem value="UNIDADE">Un (Unidade)</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <FormField label={valorLabel}>
              {form.unidadeMeta === 'BRL' ? (
                <CurrencyInput
                  value={form.valorMeta}
                  onChange={v => setForm({ ...form, valorMeta: v })}
                />
              ) : (
                <Input type="number" step={form.unidadeMeta === 'PERCENTUAL' ? '0.1' : '1'}
                  value={form.valorMeta} onChange={e => setForm({ ...form, valorMeta: e.target.value })}
                  placeholder={form.unidadeMeta === 'PERCENTUAL' ? '95.0' : '500'}
                  leftIcon={valorIcon} />
              )}
            </FormField>
            <FormField label="Ano">
              <Input type="number" value={form.ano} onChange={e => handleAnoChange(e.target.value)} leftIcon={<Calendar size={16} />} />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Período Início">
              <Input type="date" value={form.periodoInicio} onChange={e => setForm({ ...form, periodoInicio: e.target.value })} />
            </FormField>
            <FormField label="Período Fim">
              <Input type="date" value={form.periodoFim} onChange={e => setForm({ ...form, periodoFim: e.target.value })} />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Periodicidade de Alimentação">
              <Select value={form.periodicidadeAtualizacao} onValueChange={handlePeriodicidadeChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MENSAL">Mensal</SelectItem>
                  <SelectItem value="TRIMESTRAL">Trimestral</SelectItem>
                  <SelectItem value="QUADRIMESTRAL">Quadrimestral</SelectItem>
                  <SelectItem value="SEMESTRAL">Semestral</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Tipo de Curva">
              <Select value={form.tipoCurva} onValueChange={v => setForm({ ...form, tipoCurva: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="LINEAR">Linear</SelectItem>
                  <SelectItem value="PERSONALIZADA">Personalizada</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          </div>

          {form.tipoCurva === 'PERSONALIZADA' && (
           <div className="space-y-3 bg-stone-50 rounded-xl p-4 border border-stone-100">
              <ProgressBar
                value={progressoCurva}
                color={Math.abs(progressoCurva - 100) < 0.01 ? 'bg-emerald-500' : progressoCurva > 100 ? 'bg-rose-500' : 'bg-amber-500'}
                bgColor="bg-stone-200"
                height="sm"
                label={`Curva Personalizada (${UNIDADE_LABELS[form.unidadeMeta] || 'R$'} por ${periodoLabel})`}
                valueLabel={`${somaCurva.toLocaleString('pt-BR')} (${progressoCurva.toFixed(1)}%)`}
              />
              <div className="grid grid-cols-4 gap-2">
                {periodos.map((label, i) => (
                  <div key={i} className="space-y-1">
                    <CellText variant="label">{label}</CellText>
                    <Input type="number" step="0.01" size="sm" value={form.curvaPersonalizada[i] || ''}
                      onChange={e => { const c = [...form.curvaPersonalizada]; c[i] = e.target.value; setForm({ ...form, curvaPersonalizada: c }); }} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Excluir Meta" message={`Deseja excluir "${deleteTarget?.nome}"? Projetos vinculados impedirão a exclusão.`} confirmLabel="Excluir" />
    </div>
  );
};
