import { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../components/ui/select';
import {
  DataTable, DataTableCellPrimary, DataTableBadge,
  type Column,
} from '../components/ui/data-table';
import { ActionButton } from '../components/ui/action-button';
import { PageHeader } from '../components/ui/PageHeader';
import { FormField } from '../components/ui/FormField';
import { IconBadge } from '../components/ui/IconBadge';
import { CellText } from '../components/ui/CellText';
import { toast } from '../components/ui/toast';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Plus, Briefcase, Percent } from 'lucide-react';

// ── Helpers ───────────────────────────────────────────────


// ── Component ─────────────────────────────────────────────

export const Projetos = () => {
  const [projetos, setProjetos] = useState<any[]>([]);
  const [metas, setMetas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProjeto, setEditingProjeto] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [filterMetaId, setFilterMetaId] = useState('__ALL__');
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [form, setForm] = useState({
    metaId: '', nome: '', contribuicaoEsperada: '',
  });

  useEffect(() => { fetchData(); }, [filterMetaId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const metaParam = filterMetaId && filterMetaId !== '__ALL__' ? `?metaId=${filterMetaId}` : '';
      const [projRes, metaRes] = await Promise.all([
        api(`/projetos${metaParam}`),
        api('/metas'),
      ]);
      if (projRes.success) setProjetos(projRes.data);
      if (metaRes.success) setMetas(metaRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  // ── Filtered + sorted data ──
  const filteredProjetos = useMemo(() => {
    let list = projetos;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p: any) =>
        p.nome?.toLowerCase().includes(q) ||
        p.status?.toLowerCase().includes(q)
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
  }, [projetos, search, sortField, sortOrder]);

  const handleSortChange = (field: string, order: 'asc' | 'desc') => {
    setSortField(field);
    setSortOrder(order);
  };

  // ── Helpers ──
  const getMetaNome = (id: string) => metas.find((m: any) => m.id === id)?.nome || id;

  // ── DataTable Columns ──
  const columns: Column<any>[] = useMemo(() => [
    {
      key: 'nome',
      header: 'Projeto',
      cellVariant: 'none' as const,
      render: (_: unknown, row: any) => (
        <div className="flex items-center gap-3">
          <IconBadge icon={<Briefcase className="w-4 h-4" />} theme="violet" />
          <DataTableCellPrimary>
            {row.nome}
          </DataTableCellPrimary>
        </div>
      ),
    },
    {
      key: 'metaId',
      header: 'Meta',
      hiddenOnMobile: true,
      render: (_: unknown, row: any) => (
        <CellText variant="muted">{row.metaNome || getMetaNome(row.metaId)}</CellText>
      ),
      cellVariant: 'none' as const,
    },
    {
      key: 'contribuicaoEsperadaCentavos',
      header: 'Peso',
      align: 'center' as const,
      cellVariant: 'none' as const,
      render: (val: unknown) => (
        <CellText variant="muted">
          {((val as number) / 100).toFixed(1)}%
        </CellText>
      ),
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
  ], [metas]);

  // ── CRUD handlers ──

  const openCreate = () => {
    setEditingProjeto(null);
    setForm({ metaId: '', nome: '', contribuicaoEsperada: '' });
    setIsModalOpen(true);
  };

  const openEdit = (p: any) => {
    setEditingProjeto(p);
    setForm({
      metaId: p.metaId, nome: p.nome,
      contribuicaoEsperada: (p.contribuicaoEsperadaCentavos / 100).toString(),
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const body = {
        metaId: form.metaId,
        nome: form.nome,
        contribuicaoEsperada: parseFloat(form.contribuicaoEsperada),
      };
      if (editingProjeto) {
        await api(`/projetos/${editingProjeto.id}`, { method: 'PUT', body: JSON.stringify(body) });
      } else {
        await api('/projetos', { method: 'POST', body: JSON.stringify(body) });
      }
      setIsModalOpen(false);
      fetchData();
      toast.success({ title: 'Sucesso!', description: editingProjeto ? 'Projeto atualizado.' : 'Projeto criado.' });
    } catch (err: any) { toast.error({ title: 'Erro ao salvar', description: err.message }); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api(`/projetos/${deleteTarget.id}`, { method: 'DELETE' });
      setDeleteTarget(null);
      fetchData();
      toast.success({ title: 'Projeto excluído', description: 'O projeto foi removido com sucesso.' });
    } catch (err: any) { toast.error({ title: 'Erro ao excluir', description: err.message }); }
  };

  // ── Render ──

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <PageHeader
        title="Projetos"
        subtitle="Gerencie os projetos vinculados às metas (Camada 2)"
      />

      {/* ── DataTable ── */}
      <DataTable
        data={filteredProjetos}
        columns={columns}
        loading={loading}
        rowKey="id"
        sortField={sortField}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
        emptyMessage="Nenhum projeto encontrado"
        emptyIcon={
          <div className="flex flex-col items-center gap-4">
            <Briefcase className="h-16 w-16 opacity-30 text-stone-400" />
          </div>
        }
        afterSearch={
          filteredProjetos.length === 0 && !loading && !search.trim() ? (
            <div className="flex justify-center -mt-4">
              <Button onClick={openCreate} leftIcon={<Plus size={18} />}>Criar primeiro projeto</Button>
            </div>
          ) : undefined
        }
        searchPlaceholder="Buscar projetos..."
        searchValue={search}
        onSearchChange={setSearch}
        actionButton={
          <div className="flex items-center gap-2">
            {metas.length > 0 && (
              <Select value={filterMetaId} onValueChange={setFilterMetaId}>
                <SelectTrigger className="w-48 h-12">
                  <SelectValue placeholder="Filtrar por meta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__ALL__">Todas as metas</SelectItem>
                  {metas.map((m: any) => (
                    <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button onClick={openCreate} leftIcon={<Plus size={18} />} size="lg">
              Novo Projeto
            </Button>
          </div>
        }
        labels={{
          showingPrefix: 'Mostrando',
          showingResults: 'projetos',
        }}
      />

      {/* ── Form Modal ── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleSave}
        title={editingProjeto ? 'Editar Projeto' : 'Novo Projeto'}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} isLoading={saving}>{editingProjeto ? 'Atualizar' : 'Criar Projeto'}</Button>
          </>
        }
      >
        <div className="space-y-5">

          <FormField label="Meta vinculada">
            <Select value={form.metaId} onValueChange={v => setForm({ ...form, metaId: v })}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                {metas.map((m: any) => (
                  <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Nome do Projeto">
            <Input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Expansão Líder Metropolitano" leftIcon={<Briefcase size={16} />} />
          </FormField>

          <FormField label="Peso na Meta (%)">
            <Input type="number" step="0.1" value={form.contribuicaoEsperada} onChange={e => setForm({ ...form, contribuicaoEsperada: e.target.value })} placeholder="30.0" leftIcon={<Percent size={16} />} />
          </FormField>

        </div>
      </Modal>

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Excluir Projeto" description={`Deseja excluir "${deleteTarget?.nome}"? Esta ação não pode ser desfeita.`} confirmText="Excluir" />
    </div>
  );
};
