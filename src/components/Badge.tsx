import clsx from 'clsx';

const statusColors: Record<string, string> = {
    ATIVA: 'bg-emerald-100 text-emerald-800',
    CONCLUIDA: 'bg-blue-100 text-blue-800',
    CANCELADA: 'bg-stone-100 text-stone-600',
    NAO_INICIADO: 'bg-stone-100 text-stone-600',
    EM_ANDAMENTO: 'bg-amber-100 text-amber-800',
    CONCLUIDO: 'bg-emerald-100 text-emerald-800',
    CANCELADO: 'bg-gray-100 text-gray-600',
    ATUALIZADO: 'bg-emerald-100 text-emerald-800',
    PENDENTE: 'bg-amber-100 text-amber-800',
    ATRASADO: 'bg-red-100 text-red-800',
    ADMIN: 'bg-purple-100 text-purple-800',
    GESTOR: 'bg-blue-100 text-blue-800',
    OPERADOR: 'bg-teal-100 text-teal-800',
    VISUALIZADOR: 'bg-gray-100 text-gray-600',
    VERDE: 'bg-emerald-100 text-emerald-800',
    AMARELO: 'bg-amber-100 text-amber-800',
    VERMELHO: 'bg-red-100 text-red-800',
    BAIXO: 'bg-emerald-100 text-emerald-800',
    MEDIO: 'bg-amber-100 text-amber-800',
    ALTO: 'bg-orange-100 text-orange-800',
    CRITICO: 'bg-red-100 text-red-800',
};

const labels: Record<string, string> = {
    NAO_INICIADO: 'Não Iniciado',
    EM_ANDAMENTO: 'Em Andamento',
};

interface BadgeProps {
    status: string;
    className?: string;
}

export const Badge = ({ status, className }: BadgeProps) => (
    <span className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        statusColors[status] || 'bg-gray-100 text-gray-600',
        className
    )}>
        {labels[status] || status}
    </span>
);
