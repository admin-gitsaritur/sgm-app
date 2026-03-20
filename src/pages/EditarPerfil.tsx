import React, { useState, useRef, useEffect } from "react"
import { useAuthStore } from "../store/authStore"
import { PageHeader } from "../components/ui/PageHeader"
import { PageTransition } from "../components/PageTransition"
import { FormField } from "../components/ui/FormField"
import { Input } from "../components/ui/input"
import { Button } from "../components/ui/button"
import { UserAvatar } from "../components/ui/UserAvatar"
import { api } from "../services/api"
import { toast } from "sonner"
import { Camera, Trash2, KeyRound } from "lucide-react"
import { CropImageModal } from "../components/CropImageModal"
import { FormModal, AlertModal } from "../components/ui/SariturModal"
import { maskCpf, maskTelefone, formatCpf } from "../lib/masks"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../components/ui/tooltip"
import { PageLoader } from "../components/ui/spinner"
import { Card, CardContent, CardTitle, CardDescription, ContentCard } from "../components/ui/card"
export function EditarPerfil() {
    const { user, updateUser } = useAuthStore()

    // Status
    const [loading, setLoading] = useState(false)
    const [submittingAvatar, setSubmittingAvatar] = useState(false)
    const [fetching, setFetching] = useState(true)

    // Formulário Base
    const [formData, setFormData] = useState({
        nome: "",
        email: "",
        telefone: "",
        cpf: "",
    })

    // Senha Mode
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
    const [pwdData, setPwdData] = useState({
        senhaAtual: "",
        senhaNova: "",
        confirmarSenha: "",
    })
    const [pwdLoading, setPwdLoading] = useState(false)

    // Avatar
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [cropModalOpen, setCropModalOpen] = useState(false)
    const [selectedImageStr, setSelectedImageStr] = useState("")

    // Delete Avatar
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

    useEffect(() => {
        loadProfile()
    }, [])

    async function loadProfile() {
        try {
            const data = await api("/auth/me", { method: "GET" })
            if (data.success) {
                const u = data.data
                updateUser(u)
                setFormData({
                    nome: u.nome || "",
                    email: u.email || "",
                    telefone: maskTelefone(u.telefone || ""),
                    cpf: formatCpf(u.cpf || ""),
                })
            }
        } catch (error) {
            toast.error("Erro ao carregar dados do perfil")
        } finally {
            setFetching(false)
        }
    }

    // -- Update Profile Form
    async function handleSaveProfile(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        try {
            const rawPhone = formData.telefone.replace(/\D/g, "")
            const data = await api("/auth/perfil", {
                method: "PUT",
                body: JSON.stringify({
                    nome: formData.nome,
                    email: formData.email,
                    telefone: rawPhone.length > 0 ? formData.telefone : null,
                })
            })
            if (data.success) {
                toast.success("Perfil atualizado com sucesso")
                updateUser(data.data)
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Erro ao atualizar perfil")
        } finally {
            setLoading(false)
        }
    }

    // -- Avatar Handlers
    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0]
            if (file.size > 5 * 1024 * 1024) {
                toast.error("Imagem muito grande (máximo 5MB)")
                return
            }
            const reader = new FileReader()
            reader.onload = () => {
                setSelectedImageStr(reader.result?.toString() || "")
                setCropModalOpen(true)
            }
            reader.readAsDataURL(file)
            e.target.value = "" // reset input
        }
    }

    async function handleCropComplete(base64: string) {
        setCropModalOpen(false)
        setSubmittingAvatar(true)
        try {
            const data = await api("/auth/perfil/avatar", { method: "PUT", body: JSON.stringify({ avatar: base64 }) })
            if (data.success) {
                toast.success("Foto de perfil atualizada")
                updateUser({ avatar: base64 })
            }
        } catch (error) {
            toast.error("Erro ao atualizar foto de perfil")
        } finally {
            setSubmittingAvatar(false)
        }
    }

    async function handleDeleteAvatar() {
        setSubmittingAvatar(true)
        setIsDeleteModalOpen(false)
        try {
            const data = await api("/auth/perfil/avatar", { method: "DELETE" })
            if (data.success) {
                toast.success("Foto de perfil removida")
                updateUser({ avatar: data.data.avatar }) // backend will return null (or google url)
            }
        } catch (error) {
            toast.error("Erro ao remover foto de perfil")
        } finally {
            setSubmittingAvatar(false)
        }
    }

    // -- Password
    async function handlePasswordChange(e: React.FormEvent) {
        e.preventDefault()
        if (pwdData.senhaNova !== pwdData.confirmarSenha) {
            toast.error("A nova senha e a confirmação não conferem")
            return
        }

        setPwdLoading(true)
        try {
            const data = await api("/auth/trocar-senha", {
                method: "POST",
                body: JSON.stringify({
                    senhaAtual: pwdData.senhaAtual,
                    senhaNova: pwdData.senhaNova,
                })
            })
            if (data.success) {
                toast.success("Senha alterada com sucesso")
                setIsPasswordModalOpen(false)
                setPwdData({ senhaAtual: "", senhaNova: "", confirmarSenha: "" })
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Erro ao alterar a senha")
        } finally {
            setPwdLoading(false)
        }
    }

    if (fetching || !user) {
        return <PageLoader showBranding={false} />
    }

    return (
        <PageTransition>
            <div className="w-full max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
                <PageHeader
                    title="Editar Perfil"
                    subtitle="Gerencie suas informações pessoais e credenciais de acesso."
                />

                <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-8 items-start">
                    {/* Left Panel - Avatar & Actions */}
                    <div className="flex flex-col gap-6">
                        <Card>
                            <CardContent className="flex flex-col items-center text-center">
                                <div className="relative mb-6 group">
                                    <UserAvatar name={user.nome} imageUrl={user.avatar} size="xl" className="shadow-md" />
                                    
                                    <TooltipProvider delayDuration={200}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <button
                                                    onClick={() => fileInputRef.current?.click()}
                                                    disabled={submittingAvatar}
                                                    className="absolute bottom-1 right-1 bg-white/70 backdrop-blur-md text-saritur-darkgray p-2 rounded-full shadow-md hover:bg-white/90 hover:shadow-lg transition-all focus:outline-none group"
                                                >
                                                    <Camera size={20} className="text-saritur-gray group-hover:text-saritur-red transition-colors" />
                                                </button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Alterar foto</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleFileChange}
                                    />
                                </div>

                                <CardTitle className="text-base">{user.nome}</CardTitle>
                                <CardDescription className="mb-4">{user.role}</CardDescription>

                                {user.avatar && (
                                    <Button
                                        variant="destructive" 
                                        size="sm"
                                        className="w-full gap-2"
                                        onClick={() => setIsDeleteModalOpen(true)}
                                        disabled={submittingAvatar}
                                    >
                                        <Trash2 size={16} />
                                        Remover foto
                                    </Button>
                                )}

                                 {user.loginProvider === "google" && !user.avatar && (
                                    <CardDescription className="mt-2 text-xs">Sua foto está sincronizada com o Google.</CardDescription>
                                )}
                            </CardContent>
                        </Card>

                        {user.loginProvider !== "google" && (
                            <Card>
                                <CardContent>
                                    <CardTitle className="text-base mb-2">Segurança</CardTitle>
                                    <CardDescription className="mb-4">Atualize sua senha de acesso periodicamente para manter sua conta segura.</CardDescription>
                                    <Button 
                                        variant="secondary"
                                        className="w-full gap-2"
                                        onClick={() => setIsPasswordModalOpen(true)}
                                    >
                                        <KeyRound size={16} />
                                        Alterar Senha
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                         {user.loginProvider === "google" && (
                             <Card>
                                 <CardContent>
                                    <CardTitle className="text-base mb-2">Login Social</CardTitle>
                                    <CardDescription>Você está autenticado usando sua conta do Google. A alteração de senha deve ser feita diretamente no Google.</CardDescription>
                                 </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Right Panel - Form */}
                    <ContentCard title="Informações Pessoais">
                        <form onSubmit={handleSaveProfile} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                                <FormField label="Nome Completo" required>
                                    <Input
                                        value={formData.nome}
                                        onChange={(e) => setFormData(p => ({ ...p, nome: e.target.value }))}
                                        placeholder="Seu nome completo"
                                        required
                                    />
                                </FormField>

                                <FormField label="Email" required>
                                    <Input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                                        placeholder="seu.email@saritur.com.br"
                                        required
                                        disabled={user.loginProvider === "google"} // usually better to not allow email change for social logins
                                    />
                                </FormField>

                                <FormField label="Telefone">
                                    <Input
                                        value={formData.telefone}
                                        onChange={(e) => setFormData(p => ({ ...p, telefone: maskTelefone(e.target.value) }))}
                                        placeholder="(31) 90000-0000"
                                    />
                                </FormField>

                                <FormField label="CPF" hint="O CPF não pode ser alterado.">
                                    <Input
                                        value={formData.cpf}
                                        disabled
                                        className="bg-saritur-lightgray"
                                    />
                                </FormField>
                            </div>

                            <div className="pt-4 border-t border-saritur-divider flex justify-end">
                                <Button variant="primary" type="submit" isLoading={loading}>
                                    Salvar Alterações
                                </Button>
                            </div>
                        </form>
                    </ContentCard>
                </div>
            </div>

            {/* Modals */}
            <CropImageModal
                isOpen={cropModalOpen}
                onOpenChange={setCropModalOpen}
                imageUrl={selectedImageStr}
                onCropComplete={handleCropComplete}
            />

            <AlertModal
                open={isDeleteModalOpen}
                onOpenChange={setIsDeleteModalOpen}
                title="Remover foto de perfil"
                message={`Tem certeza que deseja remover sua foto de perfil? ${user.loginProvider === "google" ? "Sua foto original do Google será restaurada no próximo login." : "Sua foto será substituída por suas iniciais."}`}
                confirmText="Remover"
                cancelText="Cancelar"
                type="danger"
                onConfirm={handleDeleteAvatar}
            />

            <FormModal
                open={isPasswordModalOpen}
                onOpenChange={setIsPasswordModalOpen}
                title="Alterar Senha"
                description="Escolha uma senha forte contendo letras, números e símbolos."
                footer={
                    <>
                        <Button variant="secondary" type="button" onClick={() => setIsPasswordModalOpen(false)}>
                            Cancelar
                        </Button>
                        <Button variant="primary" type="submit" form="password-form" isLoading={pwdLoading}>
                            Confirmar
                        </Button>
                    </>
                }
            >
                <form id="password-form" onSubmit={handlePasswordChange} className="space-y-4">
                    <FormField label="Senha Atual" required>
                        <Input
                            type="password"
                            value={pwdData.senhaAtual}
                            onChange={(e) => setPwdData(p => ({ ...p, senhaAtual: e.target.value }))}
                            required
                        />
                    </FormField>
                    
                    <FormField label="Nova Senha" required hint="Mínimo de 8 caracteres.">
                        <Input
                            type="password"
                            value={pwdData.senhaNova}
                            onChange={(e) => setPwdData(p => ({ ...p, senhaNova: e.target.value }))}
                            required
                        />
                    </FormField>

                    <FormField label="Confirmar Nova Senha" required>
                        <Input
                            type="password"
                            value={pwdData.confirmarSenha}
                            onChange={(e) => setPwdData(p => ({ ...p, confirmarSenha: e.target.value }))}
                            required
                        />
                    </FormField>
                </form>
            </FormModal>
        </PageTransition>
    )
}
