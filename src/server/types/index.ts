// ── Entity Types ──────────────────────────────────────────

export interface Meta {
    id: string;
    nome: string;
    valorMetaCentavos: number;
    ano: number;
    periodoInicio: string;
    periodoFim: string;
    indicadorMacro: string;
    periodicidadeAtualizacao: 'MENSAL' | 'QUINZENAL' | 'SEMANAL';
    tipoCurva: 'LINEAR' | 'PERSONALIZADA';
    curvaPersonalizada: string | null; // JSON array of centavos
    status: 'ATIVA' | 'CONCLUIDA' | 'CANCELADA';
    criadoPor: string;
    criadoEm: string;
    atualizadoEm: string;
    deletedAt: string | null;
}

export interface Projeto {
    id: string;
    metaId: string;
    nome: string;
    contribuicaoEsperadaCentavos: number;
    pesoAutomatico: number;
    prazoInicio: string;
    prazoFim: string;
    responsavelPrincipal: string;
    responsaveis: string; // JSON array of user IDs
    status: 'NAO_INICIADO' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'CANCELADO';
    criadoPor: string;
    criadoEm: string;
    atualizadoEm: string;
    deletedAt: string | null;
}

export interface Indicador {
    id: string;
    projetoId: string;
    nome: string;
    metaIndicadorCentavos: number;
    realizadoCentavos: number;
    unidade: string;
    peso: number;
    frequenciaAtualizacao: 'MENSAL' | 'QUINZENAL' | 'SEMANAL';
    responsavel: string;
    dataUltimaAtualizacao: string | null;
    statusAtualizacao: 'ATUALIZADO' | 'PENDENTE' | 'ATRASADO';
    criadoEm: string;
    atualizadoEm: string;
    deletedAt: string | null;
}

export interface User {
    id: string;
    cpf: string | null;
    nome: string;
    email: string;
    telefone: string | null;
    senhaHash: string;
    role: 'ADMIN' | 'GESTOR' | 'OPERADOR' | 'VISUALIZADOR';
    ativo: number;
    ultimoLogin: string | null;
    tentativasLoginFalhas: number;
    bloqueadoAte: string | null;
    criadoPor: string | null;
    criadoEm: string;
    avatar: string | null;
    departamento: string | null;
    cargo: string | null;
    deveTrocarSenha: number;
    historicoSenhas: string; // JSON array of hashes
    senhaAlteradaEm: string | null;
    deletedAt: string | null;
    googleId: string | null;
    loginProvider: 'local' | 'google';
}

export interface AuditLog {
    id: string;
    timestamp: string;
    userId: string;
    acao: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGIN_GOOGLE' | 'LOGOUT' | 'RESET_SENHA' | 'TROCAR_SENHA' | 'UPDATE_AVATAR';
    entidade: 'Meta' | 'Projeto' | 'Indicador' | 'User' | 'Config';
    entidadeId: string;
    dadosAnteriores: string | null;
    dadosNovos: string | null;
    ip: string | null;
    userAgent: string | null;
}

export interface HistoricoIndicador {
    id: string;
    indicadorId: string;
    data: string;
    valorCentavos: number;
    atualizadoPor: string;
}

// ── API Response Types ────────────────────────────────────

export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    details?: Record<string, string[]>;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    meta?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

// ── Dashboard Types ───────────────────────────────────────

export interface DashboardMeta {
    meta: Meta;
    projetos: DashboardProjeto[];
    realizadoAcumuladoCentavos: number;
    esperadoAcumuladoCentavos: number;
    percentualAtingimento: number;
    razaoSemaforo: number;
    semaforo: 'VERDE' | 'AMARELO' | 'VERMELHO';
    projecaoLinearCentavos: number;
    projecaoTendenciaCentavos: number;
    gapProjetadoCentavos: number;
    desvioCentavos: number;
    risco: 'BAIXO' | 'MEDIO' | 'ALTO' | 'CRITICO';
    evolucaoMensal: EvolucaoMensal[];
}

export interface DashboardProjeto {
    projeto: Projeto;
    percentualExecucao: number;
    contribuicaoRealEstimadaCentavos: number;
    indicadores: DashboardIndicador[];
    indicadoresAtrasados: number;
}

export interface DashboardIndicador {
    indicador: Indicador;
    percentualAtingido: number;
}

export interface EvolucaoMensal {
    mes: string;
    esperadoCentavos: number;
    realizadoCentavos: number | null;
    projecaoCentavos: number | null;
}

// ── Utility: convert centavos to display value ────────────

export function centavosToReais(centavos: number): number {
    return centavos / 100;
}

export function reaisToCentavos(reais: number): number {
    return Math.round(reais * 100);
}
