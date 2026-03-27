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
import { IconBadge } from '../components/ui/IconBadge';
import { CurrencyInput } from '../components/ui/CurrencyInput';
import { CellText } from '../components/ui/CellText';
import { toast } from '../components/ui/toast';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Plus, BarChart2, DollarSign, Percent, Hash, UserCheck, RefreshCw } from 'lucide-react';

// ── Constantes ────────────────────────────────────────────

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
  ATUALIZADO: 'success', PENDENTE: 'warning', ATRASADO: 'danger',
};

const UNIDADE_LABELS: Record<string, string> = {
  BRL: 'R$', PERCENTUAL: '%', UNIDADE: 'un', KM: 'km',
};

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const MESES_FULL = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const PERIODICIDADE_PERIODOS: Record<string, string[]> = {
  MENSAL: MESES,
  TRIMESTRAL: ['1º Tri', '2º Tri', '3º Tri', '4º Tri'],
  QUADRIMESTRAL: ['1º Quad', '2º Quad', '3º Quad'],
  SEMESTRAL: ['1º Sem', '2º Sem'],
};

/** Labels completos com ano para o select de período de referência */
const getPeriodosComAno = (freq: string): string[] => {
  const ano = new Date().getFullYear();
  if (freq === 'MENSAL') return MESES_FULL.map(m => `${m}/${ano}`);
  if (freq === 'TRIMESTRAL') return ['1º Trimestre', '2º Trimestre', '3º Trimestre', '4º Trimestre'].map(t => `${t}/${ano}`);
  if (freq === 'QUADRIMESTRAL') return ['1º Quadrimestre', '2º Quadrimestre', '3º Quadrimestre'].map(t => `${t}/${ano}`);
  if (freq === 'SEMESTRAL') return ['1º Semestre', '2º Semestre'].map(t => `${t}/${ano}`);
  return MESES_FULL.map(m => `${m}/${ano}`);
};

// ── Helpers ───────────────────────────────────────────────

const formatCurrency = (centavos: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(centavos / 100);

const getPercent = (ind: any) =>
  ind.metaIndicadorCentavos > 0
    ? ((ind.realizadoCentavos / ind.metaIndicadorCentavos) * 100).toFixed(1)
    : '0.0';

// ── Component ─────────────────────────────────────────────

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
  const [filterProjetoId, setFilterProjetoId] = useState('__ALL__');
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [updateValue, setUpdateValue] = useState('');
  const [updatePeriodo, setUpdatePeriodo] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [form, setForm] = useState({
    projetoId: '', nome: '', metaIndicador: '', unidade: 'BRL',
    peso: '', frequenciaAtualizacao: 'MENSAL', responsavel: '',
    tipoCurva: 'LINEAR', curvaPersonalizada: Array(12).fill('') as string[],
  });

  useEffect(() => { fetchData(); }, [filterProjetoId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const filterParam = filterProjetoId && filterProjetoId !== '__ALL__'
        ? `?projetoId=${filterProjetoId}` : '';
      const [indRes, projRes, userRes] = await Promise.all([
        api(`/indicadores${filterParam}`),
        api('/projetos'),
        api('/usuarios'),
      ]);
      if (indRes.success) setIndicadores(indRes.data);
      if (projRes.success) setProjetos(projRes.data);
      if (userRes.success) setUsuarios(userRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  // ── Filtered + sorted data ──
  const filteredIndicadores = useMemo(() => {
    let list = indicadores;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((ind: any) =>
        ind.nome?.toLowerCase().includes(q) ||
        ind.projetoNome?.toLowerCase().includes(q) ||
        ind.statusAtualizacao?.toLowerCase().includes(q)
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
  }, [indicadores, search, sortField, sortOrder]);

  const handleSortChange = (field: string, order: 'asc' | 'desc') => {
    setSortField(field);
    setSortOrder(order);
  };

  // ── Helpers ──
  const getUserName = (id: string) => usuarios.find((u: any) => u.id === id)?.nome || id;

  // ── CRUD handlers ──
  const openCreate = () => {
    setEditingIndicador(null);
    setForm({ projetoId: '', nome: '', metaIndicador: '', unidade: 'BRL', peso: '', frequenciaAtualizacao: 'MENSAL', responsavel: '', tipoCurva: 'LINEAR', curvaPersonalizada: Array(12).fill('') });
    setIsModalOpen(true);
  };

  const openEdit = (ind: any) => {
    setEditingIndicador(ind);
    setForm({
      projetoId: ind.projetoId, nome: ind.nome,
      metaIndicador: (ind.metaIndicadorCentavos / 100).toString(),
      unidade: ind.unidade || 'BRL', peso: ind.peso.toString(),
      frequenciaAtualizacao: ind.frequenciaAtualizacao, responsavel: ind.responsavel,
      tipoCurva: ind.tipoCurva || 'LINEAR',
      curvaPersonalizada: ind.curvaPersonalizada || Array(PERIODICIDADE_PERIODOS[ind.frequenciaAtualizacao]?.length || 12).fill(''),
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const body = { ...form, metaIndicador: parseFloat(form.metaIndicador), peso: parseFloat(form.peso) };
      if (editingIndicador) {
        await api(`/indicadores/${editingIndicador.id}`, { method: 'PUT', body: JSON.stringify(body) });
        toast.success({ title: 'Indicador atualizado!' });
      } else {
        await api('/indicadores', { method: 'POST', body: JSON.stringify(body) });
        toast.success({ title: 'Indicador criado!' });
      }
      setIsModalOpen(false); fetchData();
    } catch (err: any) { toast.error({ title: err.message || 'Erro ao salvar' }); }
    finally { setSaving(false); }
  };

  const handleUpdate = async () => {
    if (!updateTarget) return;
    setSaving(true);
    try {
      await api(`/indicadores/${updateTarget.id}/atualizar`, {
        method: 'POST', body: JSON.stringify({ realizado: parseFloat(updateValue) }),
      });
      toast.success({ title: 'Realizado atualizado!' });
      setIsUpdateModalOpen(false); setUpdateTarget(null); fetchData();
    } catch (err: any) { toast.error({ title: err.message || 'Erro ao atualizar' }); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api(`/indicadores/${deleteTarget.id}`, { method: 'DELETE' });
      toast.success({ title: 'Indicador excluído!' });
      setDeleteTarget(null); fetchData();
    } catch (err: any) { toast.error({ title: err.message || 'Erro ao excluir' }); }
  };

  // ── DataTable Columns ──
  const columns: Column<any>[] = useMemo(() => [
    {
      key: 'nome',
      header: 'Indicador',
      cellVariant: 'none' as const,
      render: (_: unknown, row: any) => (
        <div className="flex items-center gap-3">
          <IconBadge icon={<BarChart2 className="w-4 h-4" />} theme="emerald" />
          <div>
            <DataTableCellPrimary>{row.nome}</DataTableCellPrimary>
            <CellText variant="muted" className="text-xs">{row.projetoNome || '—'}</CellText>
          </div>
        </div>
      ),
    },
    {
      key: 'metaIndicadorCentavos',
      header: 'Meta',
      hiddenOnMobile: true,
      align: 'right' as const,
      cellVariant: 'none' as const,
      render: (val: unknown) => (
        <CellText variant="muted">{formatCurrency(val as number)}</CellText>
      ),
    },
    {
      key: 'realizadoCentavos',
      header: 'Realizado',
      hiddenOnMobile: true,
      align: 'right' as const,
      cellVariant: 'none' as const,
      render: (val: unknown) => (
        <CellText className="font-semibold">{formatCurrency(val as number)}</CellText>
      ),
    },
    {
      key: 'percentual',
      header: '% Atingido',
      align: 'center' as const,
      cellVariant: 'none' as const,
      render: (_: unknown, row: any) => {
        const pct = parseFloat(getPercent(row));
        return (
          <div className="flex flex-col items-center gap-1 min-w-[80px]">
            <span className="text-xs font-bold text-brown">{pct}%</span>
            <ProgressBar value={pct} height="sm" />
          </div>
        );
      },
    },
    {
      key: 'peso',
      header: 'Peso',
      hiddenOnMobile: true,
      align: 'center' as const,
      cellVariant: 'none' as const,
      render: (val: unknown) => (
        <CellText variant="muted">
          {((val as number) * 100).toFixed(0)}%
        </CellText>
      ),
    },
    {
      key: 'responsavel',
      header: 'Responsável',
      hiddenOnMobile: true,
      cellVariant: 'none' as const,
      render: (val: unknown) => (
        <CellText variant="muted">{getUserName(val as string)}</CellText>
      ),
    },
    {
      key: 'statusAtualizacao',
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
      width: '120px',
      align: 'center' as const,
      cellVariant: 'none' as const,
      render: (_: unknown, row: any) => (
        <div className="inline-flex items-center gap-1">
          <ActionButton
            icon="refresh-cw"
            theme="emerald"
            title="Atualizar Realizado"
            onClick={(e) => {
              e.stopPropagation();
              setUpdateTarget(row);
              setUpdateValue((row.realizadoCentavos / 100).toString());
              // Calcular M-1: período anterior ao atual
              const freq = row.frequenciaAtualizacao || 'MENSAL';
              const periodos = PERIODICIDADE_PERIODOS[freq] || MESES;
              const now = new Date();
              const mesAtual = now.getMonth(); // 0-indexed
              let periodoIdx = 0;
              if (freq === 'MENSAL') {
                periodoIdx = Math.max(0, mesAtual - 1); // M-1
              } else if (freq === 'TRIMESTRAL') {
                periodoIdx = Math.max(0, Math.floor(mesAtual / 3) - 1);
              } else if (freq === 'QUADRIMESTRAL') {
                periodoIdx = Math.max(0, Math.floor(mesAtual / 4) - 1);
              } else if (freq === 'SEMESTRAL') {
                periodoIdx = Math.max(0, Math.floor(mesAtual / 6) - 1);
              }
              setUpdatePeriodo(periodoIdx.toString());
              setIsUpdateModalOpen(true);
            }}
          />
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
  ], [usuarios]);

  // ── Render ──
  return (
    <div className="space-y-6">
      <PageHeader
        title="Indicadores"
        subtitle="Acompanhe e atualize os indicadores de performance (Camada 3)"
      />

      {/* ── DataTable ── */}
      <DataTable
        data={filteredIndicadores}
        columns={columns}
        loading={loading}
        rowKey="id"
        sortField={sortField}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
        emptyMessage="Nenhum indicador encontrado"
        emptyIcon={
          <div className="flex flex-col items-center gap-4">
            <BarChart2 className="h-16 w-16 opacity-30 text-stone-400" />
          </div>
        }
        afterSearch={
          filteredIndicadores.length === 0 && !loading && !search.trim() ? (
            <div className="flex justify-center -mt-4">
              <Button onClick={openCreate} leftIcon={<Plus size={18} />}>Criar primeiro indicador</Button>
            </div>
          ) : undefined
        }
        searchPlaceholder="Buscar indicadores..."
        searchValue={search}
        onSearchChange={setSearch}
        actionButton={
          <div className="flex items-center gap-2">
            {projetos.length > 0 && (
              <Select value={filterProjetoId} onValueChange={setFilterProjetoId}>
                <SelectTrigger className="w-52 h-12">
                  <SelectValue placeholder="Filtrar por projeto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__ALL__">Todos os projetos</SelectItem>
                  {projetos.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button onClick={openCreate} leftIcon={<Plus size={18} />} size="lg">
              Novo Indicador
            </Button>
          </div>
        }
        labels={{
          showingPrefix: 'Mostrando',
          showingResults: 'indicadores',
        }}
      />

      {/* ── Form Modal (Criar / Editar) ── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleSave}
        title={editingIndicador ? 'Editar Indicador' : 'Novo Indicador'}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} isLoading={saving}>{editingIndicador ? 'Atualizar' : 'Criar Indicador'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label="Projeto">
            <Select value={form.projetoId} onValueChange={v => setForm({ ...form, projetoId: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o projeto..." />
              </SelectTrigger>
              <SelectContent>
                {projetos.map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Nome do Indicador">
            <Input
              value={form.nome}
              onChange={e => setForm({ ...form, nome: e.target.value })}
              placeholder="Ex: Receita Mensal, NPS, Ticket Médio"
              leftIcon={<BarChart2 size={16} />}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Meta do Indicador">
              <CurrencyInput
                value={form.metaIndicador}
                onChange={v => setForm({ ...form, metaIndicador: v })}
              />
            </FormField>
            <FormField label="Unidade">
              <Select value={form.unidade} onValueChange={v => setForm({ ...form, unidade: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BRL">R$ (Reais)</SelectItem>
                  <SelectItem value="PERCENTUAL">% (Percentual)</SelectItem>
                  <SelectItem value="UNIDADE">Un (Unidade)</SelectItem>
                  <SelectItem value="KM">KM (Quilômetros)</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Peso (0 a 1)">
              <Input
                type="number" step="0.01" min="0" max="1"
                value={form.peso}
                onChange={e => setForm({ ...form, peso: e.target.value })}
                placeholder="0.30"
                leftIcon={<Percent size={16} />}
              />
            </FormField>
            <FormField label="Frequência">
              <Select value={form.frequenciaAtualizacao} onValueChange={v => {
                const novos = PERIODICIDADE_PERIODOS[v] || MESES;
                setForm({ ...form, frequenciaAtualizacao: v, curvaPersonalizada: Array(novos.length).fill('') });
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MENSAL">Mensal</SelectItem>
                  <SelectItem value="TRIMESTRAL">Trimestral</SelectItem>
                  <SelectItem value="QUADRIMESTRAL">Quadrimestral</SelectItem>
                  <SelectItem value="SEMESTRAL">Semestral</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
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

          {form.tipoCurva === 'PERSONALIZADA' && (() => {
            const periodos = PERIODICIDADE_PERIODOS[form.frequenciaAtualizacao] || MESES;
            const somaCurva = form.curvaPersonalizada.reduce((s, v) => s + (parseFloat(v) || 0), 0);
            const metaVal = parseFloat(form.metaIndicador) || 0;
            const progresso = metaVal > 0 ? (somaCurva / metaVal) * 100 : 0;
            const periodoLabel = form.frequenciaAtualizacao === 'MENSAL' ? 'mês'
              : form.frequenciaAtualizacao === 'TRIMESTRAL' ? 'trimestre'
              : form.frequenciaAtualizacao === 'QUADRIMESTRAL' ? 'quadrimestre' : 'semestre';
            return (
              <div className="space-y-3 bg-stone-50 rounded-xl p-4 border border-stone-100">
                <ProgressBar
                  value={progresso}
                  color={Math.abs(progresso - 100) < 0.01 ? 'bg-emerald-500' : progresso > 100 ? 'bg-rose-500' : 'bg-amber-500'}
                  bgColor="bg-stone-200"
                  height="sm"
                  label={`Curva Personalizada (${UNIDADE_LABELS[form.unidade] || 'R$'} por ${periodoLabel})`}
                  valueLabel={`${somaCurva.toLocaleString('pt-BR')} (${progresso.toFixed(1)}%)`}
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
            );
          })()}

          <FormField label="Responsável">
            <Select value={form.responsavel} onValueChange={v => setForm({ ...form, responsavel: v })}>
              <SelectTrigger leftIcon={<UserCheck size={16} />}>
                <SelectValue placeholder="Selecione o responsável..." />
              </SelectTrigger>
              <SelectContent>
                {usuarios.map((u: any) => (
                  <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </div>
      </Modal>

      {/* ── Update Modal (Atualizar Realizado) ── */}
      <Modal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        onConfirm={handleUpdate}
        title="Atualizar Realizado"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsUpdateModalOpen(false)}>Cancelar</Button>
            <Button variant="success" onClick={handleUpdate} isLoading={saving}>Atualizar</Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-stone-500">
            Indicador: <strong className="text-brown">{updateTarget?.nome}</strong>
          </p>
          <FormField label="Período de Referência">
            <Select value={updatePeriodo} onValueChange={setUpdatePeriodo}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o período" />
              </SelectTrigger>
              <SelectContent>
                {getPeriodosComAno(updateTarget?.frequenciaAtualizacao || 'MENSAL').map((label: string, i: number) => (
                  <SelectItem key={i} value={i.toString()}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Valor realizado">
            <CurrencyInput
              value={updateValue}
              onChange={setUpdateValue}
            />
          </FormField>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Excluir Indicador"
        description={`Deseja excluir "${deleteTarget?.nome}"?`}
        confirmText="Excluir"
      />
    </div>
  );
};
