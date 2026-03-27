import { z } from 'zod';

// ── Meta Schemas ──────────────────────────────────────────

export const createMetaSchema = z.object({
    nome: z.string().min(3, 'Mínimo 3 caracteres').max(200).trim(),
    valorMeta: z.number().positive('Deve ser positivo').finite(),
    unidadeMeta: z.enum(['BRL', 'PERCENTUAL', 'UNIDADE', 'KM']).default('BRL'),
    ano: z.number().int().min(2020).max(2100),
    periodoInicio: z.string().min(1, 'Obrigatório'),
    periodoFim: z.string().min(1, 'Obrigatório'),
    indicadorMacro: z.string().max(200).trim().optional().nullable(),
    periodicidadeAtualizacao: z.enum(['SEMANAL', 'QUINZENAL', 'MENSAL', 'TRIMESTRAL', 'QUADRIMESTRAL', 'SEMESTRAL']),
    tipoCurva: z.enum(['LINEAR', 'PERSONALIZADA']),
    curvaPersonalizada: z.array(z.number().nonnegative()).length(12).optional().nullable(),
});

export const updateMetaSchema = createMetaSchema.partial().extend({
    status: z.enum(['ATIVA', 'CONCLUIDA', 'CANCELADA']).optional(),
});

// ── Projeto Schemas ───────────────────────────────────────

export const createProjetoSchema = z.object({
    metaId: z.string().uuid('ID de meta inválido').optional().nullable(),
    nome: z.string().min(3).max(200).trim(),
    contribuicaoEsperada: z.number().positive('Deve ser positivo').finite(),
    prazoInicio: z.string().optional().nullable(),
    prazoFim: z.string().optional().nullable(),
    responsavelPrincipal: z.string().uuid('ID de responsável inválido').optional().nullable(),
    responsaveis: z.array(z.string().uuid()).optional().nullable(),
});

export const updateProjetoSchema = createProjetoSchema.partial().extend({
    status: z.enum(['NAO_INICIADO', 'EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO']).optional(),
});

// ── Indicador Schemas ─────────────────────────────────────

export const createIndicadorSchema = z.object({
    projetoId: z.string().uuid('ID de projeto inválido').optional().nullable(),
    metaId: z.string().uuid('ID de meta inválido').optional().nullable(),
    nome: z.string().min(3).max(200).trim(),
    metaIndicador: z.number().positive('Deve ser positivo').finite(),
    unidade: z.string().min(1).max(50).trim(),
    peso: z.number().nonnegative('Peso não pode ser negativo').max(1, 'Peso máximo é 1.0'),
    frequenciaAtualizacao: z.enum(['MENSAL', 'QUINZENAL', 'SEMANAL', 'TRIMESTRAL', 'QUADRIMESTRAL', 'SEMESTRAL']),
    responsavel: z.string().uuid('ID de responsável inválido'),
});

export const updateIndicadorSchema = createIndicadorSchema.partial();

export const updateRealizadoSchema = z.object({
    realizado: z.number().nonnegative('Não pode ser negativo').finite(),
});

// ── Regex Helpers ─────────────────────────────────────────

const telefoneRegex = /^\(\d{2}\)\s?\d{4,5}-\d{4}$/;
const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;

// ── Usuário Schemas ───────────────────────────────────────

export const createUsuarioSchema = z.object({
    nome: z.string().min(3).max(200).trim(),
    email: z.string().email('Email inválido').max(200).trim().toLowerCase(),
    cpf: z.string().regex(cpfRegex, 'CPF inválido').optional().nullable(),
    telefone: z.string().regex(telefoneRegex, 'Telefone inválido').optional().nullable(),
    role: z.enum(['ADMIN', 'GESTOR', 'OPERADOR', 'VISUALIZADOR']),
    departamento: z.string().max(100).trim().optional().nullable(),
    cargo: z.string().max(100).trim().optional().nullable(),
});

export const updateUsuarioSchema = z.object({
    nome: z.string().min(3).max(200).trim().optional(),
    role: z.enum(['ADMIN', 'GESTOR', 'OPERADOR', 'VISUALIZADOR']).optional(),
    telefone: z.string().regex(telefoneRegex, 'Telefone inválido').optional().nullable(),
    departamento: z.string().max(100).trim().optional().nullable(),
    cargo: z.string().max(100).trim().optional().nullable(),
    ativo: z.number().int().min(0).max(1).optional(),
});

// ── Perfil Schemas ────────────────────────────────────────

export const updatePerfilSchema = z.object({
  nome: z.string().min(3).max(200).trim().optional(),
  email: z.string().email('Email inválido').max(200).trim().toLowerCase().optional(),
  telefone: z.string().regex(telefoneRegex, 'Telefone inválido').optional().nullable(),
});

export const updateAvatarSchema = z.object({
  avatar: z.string()
    .max(500_000, 'Imagem muito grande')
    .refine(
      (val) => val.startsWith('data:image/') || val.startsWith('http'),
      'Formato de imagem inválido'
    ),
});

// ── Auth Schemas ──────────────────────────────────────────

export const loginSchema = z.object({
    email: z.string().email('Email inválido').trim().toLowerCase(),
    password: z.string().min(1, 'Senha obrigatória'),
});

export const trocarSenhaSchema = z.object({
    senhaAtual: z.string().min(1, 'Senha atual obrigatória'),
    senhaNova: z.string().min(10, 'Mínimo 10 caracteres'),
});

export const refreshTokenSchema = z.object({
    refreshToken: z.string().min(1, 'Refresh token obrigatório'),
});

// ── Password Validation ──────────────────────────────────

export function validarSenha(senha: string): { valida: boolean; erros: string[] } {
    const erros: string[] = [];
    if (senha.length < 10) erros.push('Mínimo 10 caracteres');
    if (!/[A-Z]/.test(senha)) erros.push('Pelo menos 1 letra maiúscula');
    if (!/[a-z]/.test(senha)) erros.push('Pelo menos 1 letra minúscula');
    if (!/[0-9]/.test(senha)) erros.push('Pelo menos 1 número');
    if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(senha)) erros.push('Pelo menos 1 caractere especial');
    return { valida: erros.length === 0, erros };
}

// ── Generate Secure Temporary Password ────────────────────

export function gerarSenhaTemporaria(): string {
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const digits = '0123456789';
    const special = '!@#$%&*()_+-=';
    const all = upper + lower + digits + special;

    let senha = '';
    senha += upper[Math.floor(Math.random() * upper.length)];
    senha += lower[Math.floor(Math.random() * lower.length)];
    senha += digits[Math.floor(Math.random() * digits.length)];
    senha += special[Math.floor(Math.random() * special.length)];

    for (let i = 4; i < 12; i++) {
        senha += all[Math.floor(Math.random() * all.length)];
    }

    // Shuffle
    return senha.split('').sort(() => Math.random() - 0.5).join('');
}
