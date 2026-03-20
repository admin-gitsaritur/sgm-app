import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { FormModal, AlertModal } from '../components/ui/SariturModal';
import { Button } from '../components/ui/button';
import { Badge } from '../components/Badge';
import { EmptyState } from '../components/EmptyState';
import { TableSkeleton } from '../components/Skeleton';
import { Plus, Edit2, Trash2, Users as UsersIcon, Search, KeyRound, Mail } from 'lucide-react';
import { maskCpf, maskTelefone, formatCpf } from '../lib/masks';

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
    const [error, setError] = useState('');

    const [form, setForm] = useState({ nome: '', email: '', role: 'OPERADOR', departamento: '', cargo: '', cpf: '', telefone: '' });

    useEffect(() => { fetchData(); }, [busca, filterRole]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (busca) params.set('busca', busca);
            if (filterRole) params.set('role', filterRole);
            const res = await api(`/usuarios?${params.toString()}`);
            if (res.success) setUsuarios(res.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const openCreate = () => {
        setEditingUser(null);
        setForm({ nome: '', email: '', role: 'OPERADOR', departamento: '', cargo: '', cpf: '', telefone: '' });
        setError('');
        setIsModalOpen(true);
    };

    const openEdit = (u: any) => {
        setEditingUser(u);
        setForm({ nome: u.nome, email: u.email, role: u.role, departamento: u.departamento || '', cargo: u.cargo || '', cpf: u.cpf || '', telefone: u.telefone || '' });
        setError('');
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        setSaving(true); setError('');
        try {
            if (editingUser) {
                const { email, cpf, telefone, ...body } = form;
                const bodyToSend = { ...body, telefone: telefone ? telefone.replace(/\D/g, '') : null };
                await api(`/usuarios/${editingUser.id}`, { method: 'PUT', body: JSON.stringify(bodyToSend) });
                setIsModalOpen(false);
            } else {
                const bodyToSend = { 
                    ...form, 
                    cpf: form.cpf ? form.cpf.replace(/\D/g, '') : null, 
                    telefone: form.telefone ? form.telefone.replace(/\D/g, '') : null 
                };
                const res = await api('/usuarios', { method: 'POST', body: JSON.stringify(bodyToSend) });
                setIsModalOpen(false);
                if (res.data?.senhaTemporaria) {
                    setSenhaModal({ user: form, senha: res.data.senhaTemporaria });
                }
            }
            fetchData();
        } catch (err: any) { setError(err.message); }
        finally { setSaving(false); }
    };

    const handleResetSenha = async (userId: string, userName: string) => {
        try {
            const res = await api(`/usuarios/${userId}/reset-senha`, { method: 'POST' });
            if (res.data?.senhaTemporaria) {
                setSenhaModal({ user: { nome: userName }, senha: res.data.senhaTemporaria });
            }
        } catch (err: any) { setError(err.message); }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try { await api(`/usuarios/${deleteTarget.id}`, { method: 'DELETE' }); setDeleteTarget(null); fetchData(); }
        catch (err: any) { alert(err.message); }
    };

    const formatDate = (d: string | null) => d ? new Date(d).toLocaleString('pt-BR') : '—';

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[#4E3205]">Usuários</h1>
                    <p className="text-gray-500 mt-1">Gerencie os usuários e permissões do sistema</p>
                </div>
                <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-[#F37137] text-white rounded-lg hover:bg-[#d95f27] transition-colors shadow-sm">
                    <Plus size={20} /> <span>Novo Usuário</span>
                </button>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input placeholder="Buscar por nome ou email..." value={busca} onChange={e => setBusca(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-[#F37137] focus:border-[#F37137]" />
                </div>
                <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-2">
                    <option value="">Todas as roles</option>
                    <option value="ADMIN">Admin</option><option value="GESTOR">Gestor</option>
                    <option value="OPERADOR">Operador</option><option value="VISUALIZADOR">Visualizador</option>
                </select>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                {loading ? <TableSkeleton rows={5} cols={7} /> : usuarios.length === 0 ? (
                    <EmptyState icon={<UsersIcon className="w-8 h-8 text-gray-400" />} title="Nenhum usuário encontrado" />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead><tr className="bg-gray-50 border-b border-gray-200">
                                <th className="px-6 py-4 text-sm font-semibold text-[#4E3205]">Nome</th>
                                <th className="px-6 py-4 text-sm font-semibold text-[#4E3205]">Email</th>
                                <th className="px-6 py-4 text-sm font-semibold text-[#4E3205]">Role</th>
                                <th className="px-6 py-4 text-sm font-semibold text-[#4E3205]">CPF</th>
                                <th className="px-6 py-4 text-sm font-semibold text-[#4E3205]">Telefone</th>
                                <th className="px-6 py-4 text-sm font-semibold text-[#4E3205]">Departamento</th>
                                <th className="px-6 py-4 text-sm font-semibold text-[#4E3205]">Status</th>
                                <th className="px-6 py-4 text-sm font-semibold text-[#4E3205]">Último Login</th>
                                <th className="px-6 py-4 text-sm font-semibold text-[#4E3205] text-right">Ações</th>
                            </tr></thead>
                            <tbody className="divide-y divide-gray-100">
                                {usuarios.map((u: any) => (
                                    <tr key={u.id} className="hover:bg-[#F37137]/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-[#F37137] flex items-center justify-center text-white text-sm font-bold">{u.nome?.charAt(0)}</div>
                                                <span className="font-medium text-[#4E3205]">{u.nome}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{u.email}</td>
                                        <td className="px-6 py-4"><Badge status={u.role} /></td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{formatCpf(u.cpf || '') || '—'}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{maskTelefone(u.telefone || '') || '—'}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{u.departamento || '—'}</td>
                                        <td className="px-6 py-4"><Badge status={u.ativo ? 'ATIVA' : 'CANCELADA'} /></td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{formatDate(u.ultimoLogin)}</td>
                                        <td className="px-6 py-4 text-right space-x-1">
                                            <button onClick={() => handleResetSenha(u.id, u.nome)} className="p-2 text-gray-400 hover:text-amber-500 rounded-lg hover:bg-white transition-colors" title="Resetar Senha">
                                                <KeyRound size={16} /></button>
                                            <button onClick={() => openEdit(u)} className="p-2 text-gray-400 hover:text-[#F37137] rounded-lg hover:bg-white transition-colors"><Edit2 size={16} /></button>
                                            <button onClick={() => setDeleteTarget(u)} className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-white transition-colors"><Trash2 size={16} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <FormModal 
                open={isModalOpen} 
                onOpenChange={setIsModalOpen} 
                title={editingUser ? 'Editar Usuário' : 'Novo Usuário'}
                maxWidth="lg"
                onConfirm={handleSave}
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button variant="primary" onClick={handleSave} isLoading={saving}>Salvar</Button>
                    </>
                }
            >
                <div className="space-y-4">
                    {error && <div className="bg-red-50 border-l-4 border-red-400 p-3 text-sm text-red-700 rounded">{error}</div>}
                    <div><label className="block text-sm font-medium text-[#4E3205] mb-1">Nome</label>
                        <input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" /></div>
                    {!editingUser && (
                        <div><label className="block text-sm font-medium text-[#4E3205] mb-1">Email</label>
                            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" /></div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-[#4E3205] mb-1">CPF</label>
                            <input 
                                value={maskCpf(form.cpf)} 
                                onChange={e => setForm({ ...form, cpf: e.target.value })} 
                                placeholder="000.000.000-00" 
                                disabled={!!editingUser}
                                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm disabled:bg-gray-50 disabled:text-gray-500" /></div>
                        <div><label className="block text-sm font-medium text-[#4E3205] mb-1">Telefone</label>
                            <input 
                                value={maskTelefone(form.telefone)} 
                                onChange={e => setForm({ ...form, telefone: e.target.value })} 
                                placeholder="(00) 00000-0000" 
                                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" /></div>
                    </div>
                    <div><label className="block text-sm font-medium text-[#4E3205] mb-1">Role</label>
                        <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm">
                            <option value="ADMIN">Admin</option><option value="GESTOR">Gestor</option>
                            <option value="OPERADOR">Operador</option><option value="VISUALIZADOR">Visualizador</option>
                        </select></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-[#4E3205] mb-1">Departamento</label>
                            <input value={form.departamento} onChange={e => setForm({ ...form, departamento: e.target.value })} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" /></div>
                        <div><label className="block text-sm font-medium text-[#4E3205] mb-1">Cargo</label>
                            <input value={form.cargo} onChange={e => setForm({ ...form, cargo: e.target.value })} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" /></div>
                    </div>
                </div>
            </FormModal>

            <FormModal 
                open={!!senhaModal} 
                onOpenChange={(op) => { if(!op) setSenhaModal(null); }} 
                title="Senha Temporária" 
                maxWidth="sm"
                footer={<Button variant="primary" onClick={() => setSenhaModal(null)}>Entendi</Button>}
            >
                <div className="text-center space-y-4">
                    <p className="text-sm text-gray-600">Senha gerada para <strong>{senhaModal?.user?.nome}</strong>:</p>
                    <div className="bg-gray-100 rounded-xl p-4 font-mono text-lg text-[#4E3205] select-all">{senhaModal?.senha}</div>
                    <p className="text-xs text-amber-600">⚠️ Copie esta senha agora. Ela não será exibida novamente.</p>
                    
                    <div className="flex items-center gap-2 mt-3 p-3 bg-emerald-50 rounded-xl text-left">
                        <Mail className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <p className="text-xs text-emerald-700 m-0">
                            Um email com esses dados de acesso também foi enviado para <strong>{senhaModal?.user?.email || senhaModal?.user?.nome}</strong>.
                        </p>
                    </div>
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
