import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { FormModal, AlertModal } from '../components/ui/SariturModal';
import { Button } from '../components/ui/button';
import { Badge } from '../components/Badge';
import { EmptyState } from '../components/EmptyState';
import { TableSkeleton } from '../components/Skeleton';
import { Users as UsersIcon, Plus } from 'lucide-react';
import { maskCpf, maskTelefone, formatCpf } from '../lib/masks';
import { toast } from '../components/ui/toast';

import { PageHeader } from '../components/ui/PageHeader';
import { Input } from '../components/ui/input';
import { SearchInput } from '../components/ui/search-input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../components/ui/select';
import { DataTable, type Column, DataTableCellPrimary, DataTableStatusBadge } from '../components/ui/data-table';
import { UserAvatar } from '../components/ui/UserAvatar';
import { ActionGroup, ActionButton } from '../components/ui/action-button';
import { FormField } from '../components/ui/FormField';
import { Card, SimpleInfoCard } from '../components/ui/card';

export const Usuarios = () => {
    const [usuarios, setUsuarios] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);
    const [deleteTarget, setDeleteTarget] = useState<any>(null);
    const [senhaModal, setSenhaModal] = useState<{ user: any; senha: string } | null>(null);
    const [busca, setBusca] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({ nome: '', email: '', role: 'OPERADOR', departamento: '', cargo: '', cpf: '', telefone: '' });

    useEffect(() => { fetchData(); }, [busca, filterRole]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (busca) params.set('busca', busca);
            if (filterRole && filterRole !== 'ALL') params.set('role', filterRole);
            const res = await api(`/usuarios?${params.toString()}`);
            if (res.success) setUsuarios(res.data);
        } catch (err: any) { 
            toast.error({ title: 'Erro ao carregar', description: err.message || 'Erro ao carregar usuários' });
        } finally { 
            setLoading(false); 
        }
    };

    const openCreate = () => {
        setEditingUser(null);
        setForm({ nome: '', email: '', role: 'OPERADOR', departamento: '', cargo: '', cpf: '', telefone: '' });
        setIsModalOpen(true);
    };

    const openEdit = (u: any) => {
        setEditingUser(u);
        setForm({ nome: u.nome, email: u.email, role: u.role, departamento: u.departamento || '', cargo: u.cargo || '', cpf: u.cpf || '', telefone: u.telefone || '' });
        setIsModalOpen(true);
    };

    // Valida se CPF está completo (###.###.###-##)
    const sanitizeCpf = (cpf: string): string | null => {
        if (!cpf) return null;
        const digits = cpf.replace(/\D/g, '');
        if (digits.length !== 11) return null;
        return maskCpf(cpf);
    };

    // Valida se telefone está completo ((##) #####-#### ou (##) ####-####)
    const sanitizeTelefone = (tel: string): string | null => {
        if (!tel) return null;
        const digits = tel.replace(/\D/g, '');
        if (digits.length < 10) return null;
        return maskTelefone(tel);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            if (editingUser) {
                const { email, cpf, telefone, ...body } = form;
                const bodyToSend = { ...body, telefone: sanitizeTelefone(telefone) };
                await api(`/usuarios/${editingUser.id}`, { method: 'PUT', body: JSON.stringify(bodyToSend) });
                toast.success({ title: 'Usuário atualizado', description: 'As alterações foram salvas com sucesso.' });
                setIsModalOpen(false);
            } else {
                const bodyToSend = { 
                    ...form, 
                    cpf: sanitizeCpf(form.cpf), 
                    telefone: sanitizeTelefone(form.telefone) 
                };
                const res = await api('/usuarios', { method: 'POST', body: JSON.stringify(bodyToSend) });
                toast.success({ title: 'Usuário criado', description: `${form.nome} foi adicionado ao sistema.` });
                setIsModalOpen(false);
                if (res.data?.senhaTemporaria) {
                    setSenhaModal({ user: form, senha: res.data.senhaTemporaria });
                }
            }
            fetchData();
        } catch (err: any) { 
            toast.error({ title: 'Erro ao salvar', description: err.message || 'Não foi possível salvar o usuário.' });
        } finally { 
            setSaving(false); 
        }
    };

    const handleResetSenha = async (userId: string, userName: string) => {
        try {
            const res = await api(`/usuarios/${userId}/reset-senha`, { method: 'POST' });
            if (res.data?.senhaTemporaria) {
                setSenhaModal({ user: { nome: userName }, senha: res.data.senhaTemporaria });
                toast.success({ title: 'Senha resetada', description: `Nova senha gerada para ${userName}.` });
            }
        } catch (err: any) { 
            toast.error({ title: 'Erro ao resetar', description: err.message || 'Não foi possível resetar a senha.' });
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try { 
            await api(`/usuarios/${deleteTarget.id}`, { method: 'DELETE' }); 
            toast.success({ title: 'Usuário desativado', description: `${deleteTarget?.nome} foi desativado do sistema.` });
            setDeleteTarget(null); 
            fetchData(); 
        }
        catch (err: any) { 
            toast.error({ title: 'Erro ao desativar', description: err.message || 'Não foi possível desativar o usuário.' });
        }
    };

    // ── Columns ──
    const columns: Column<any>[] = [
        {
            key: 'nome',
            header: 'Nome',
            cellVariant: 'none',
            render: (_: unknown, row: any) => (
                <div className="flex items-center gap-3">
                    <UserAvatar name={row.nome} size="sm" className="bg-primary text-white" />
                    <DataTableCellPrimary>{row.nome}</DataTableCellPrimary>
                </div>
            )
        },
        {
            key: 'email',
            header: 'Email',
            hiddenOnMobile: true,
        },
        {
            key: 'role',
            header: 'Role',
            cellVariant: 'none',
            align: 'center',
            render: (val: unknown) => <Badge status={val as string} />
        },
        {
            key: 'cpf',
            header: 'CPF',
            hiddenOnMobile: true,
            render: (val: unknown) => formatCpf((val as string) || '') || '—'
        },
        {
            key: 'telefone',
            header: 'Telefone',
            hiddenOnMobile: true,
            render: (val: unknown) => maskTelefone((val as string) || '') || '—'
        },
        {
            key: 'departamento',
            header: 'Departamento',
            hiddenOnMobile: true,
            render: (val: unknown) => (val as string) || '—'
        },
        {
            key: 'ativo',
            header: 'Status',
            align: 'center',
            cellVariant: 'none',
            render: (val: unknown) => <Badge status={val ? 'ATIVA' : 'CANCELADA'} />
        },
        {
            key: 'acoes',
            header: 'Ações',
            align: 'center',
            cellVariant: 'none',
            width: '120px',
            render: (_: unknown, row: any) => (
                <div className="inline-flex items-center gap-1 justify-end">
                    <ActionButton icon="key-round" theme="orange" title="Resetar Senha" onClick={() => handleResetSenha(row.id, row.nome)} />
                    <ActionButton icon="edit-2" theme="indigo" title="Editar" onClick={() => openEdit(row)} />
                    <ActionButton icon="trash-2" theme="rose" title="Deletar" onClick={() => setDeleteTarget(row)} />
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <PageHeader 
                title="Usuários" 
                subtitle="Gerencie os usuários e permissões do sistema" 
            />

            <DataTable
                data={usuarios}
                columns={columns}
                rowKey="id"
                loading={loading}
                emptyMessage="Nenhum usuário encontrado"
                emptyIcon={<UsersIcon className="h-16 w-16 mb-4 opacity-30 text-stone-400" />}
                afterSearch={
                    usuarios.length === 0 && !loading && !busca.trim() ? (
                        <div className="flex justify-center -mt-4">
                            <Button onClick={openCreate} leftIcon={<Plus size={18} />}>Criar primeiro usuário</Button>
                        </div>
                    ) : undefined
                }
                searchPlaceholder="Buscar por nome ou email..."
                searchValue={busca}
                onSearchChange={setBusca}
                actionButton={
                    <div className="flex items-center gap-2">
                        <Select value={filterRole || 'ALL'} onValueChange={(val) => setFilterRole(val === 'ALL' ? '' : val)}>
                            <SelectTrigger className="w-48 h-12">
                                <SelectValue placeholder="Todas as roles" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Todas as roles</SelectItem>
                                <SelectItem value="ADMIN">Admin</SelectItem>
                                <SelectItem value="GESTOR">Gestor</SelectItem>
                                <SelectItem value="OPERADOR">Operador</SelectItem>
                                <SelectItem value="VISUALIZADOR">Visualizador</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button onClick={openCreate} leftIcon={<Plus size={18} />} size="lg">
                            Novo Usuário
                        </Button>
                    </div>
                }
                labels={{
                    showingPrefix: 'Mostrando',
                    showingResults: 'usuários',
                }}
            />

            <FormModal 
                open={isModalOpen} 
                onOpenChange={setIsModalOpen} 
                title={editingUser ? 'Editar Usuário' : 'Novo Usuário'}
                maxWidth="lg"
                onConfirm={handleSave}
                footer={
                    <>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button variant="primary" onClick={handleSave} isLoading={saving}>Salvar</Button>
                    </>
                }
            >
                <div className="space-y-5 pt-2">
                    <FormField label="Nome" required>
                        <Input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} placeholder="Nome completo" />
                    </FormField>
                    
                    {!editingUser && (
                        <FormField label="E-mail" required hint="O e-mail será usado para o login e não pode ser alterado depois.">
                            <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@saritur.com.br" />
                        </FormField>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="CPF">
                            <Input 
                                value={maskCpf(form.cpf)} 
                                onChange={e => setForm({ ...form, cpf: e.target.value })} 
                                placeholder="000.000.000-00" 
                                disabled={!!editingUser}
                            />
                        </FormField>
                        <FormField label="Telefone">
                            <Input 
                                value={maskTelefone(form.telefone)} 
                                onChange={e => setForm({ ...form, telefone: e.target.value })} 
                                placeholder="(00) 00000-0000" 
                            />
                        </FormField>
                    </div>
                    
                    <FormField label="Role no Sistema" required>
                        <Select value={form.role} onValueChange={(val) => setForm({ ...form, role: val })}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ADMIN">Admin</SelectItem>
                                <SelectItem value="GESTOR">Gestor</SelectItem>
                                <SelectItem value="OPERADOR">Operador</SelectItem>
                                <SelectItem value="VISUALIZADOR">Visualizador</SelectItem>
                            </SelectContent>
                        </Select>
                    </FormField>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="Departamento">
                            <Input value={form.departamento} onChange={e => setForm({ ...form, departamento: e.target.value })} placeholder="Ex: TI, RH..." />
                        </FormField>
                        <FormField label="Cargo">
                            <Input value={form.cargo} onChange={e => setForm({ ...form, cargo: e.target.value })} placeholder="Ex: Analista..." />
                        </FormField>
                    </div>
                </div>
            </FormModal>

            <FormModal 
                open={!!senhaModal} 
                onOpenChange={(op) => { if(!op) setSenhaModal(null); }} 
                title="Credenciais de Acesso" 
                maxWidth="sm"
                footer={<Button variant="primary" onClick={() => setSenhaModal(null)} className="w-full">Entendi</Button>}
            >
                <div className="space-y-6 pt-2">
                    <SimpleInfoCard 
                        title="Senha Gerada" 
                        value={senhaModal?.senha} 
                        variant="yellow" 
                        align="center"
                        subtext="⚠️ Copie a senha agora, não será exibida novamente."
                    />

                    <SimpleInfoCard 
                        title="E-mail Enviado" 
                        value="Sucesso" 
                        variant="green" 
                        align="center"
                        subtext={`Enviado para ${senhaModal?.user?.email || senhaModal?.user?.nome}`}
                    />
                </div>
            </FormModal>

            <AlertModal
                open={!!deleteTarget}
                onOpenChange={(op) => { if (!op) setDeleteTarget(null); }}
                title="Desativar Usuário"
                message={`Deseja desativar o usuário "${deleteTarget?.nome}"?`}
                confirmText="Desativar"
                cancelText="Cancelar"
                type="danger"
                onConfirm={handleDelete}
            />
        </div>
    );
};
