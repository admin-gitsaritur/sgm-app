import clsx from 'clsx';

interface SemaforoIndicatorProps {
    status: 'VERDE' | 'AMARELO' | 'VERMELHO';
    size?: 'sm' | 'md' | 'lg';
    pulse?: boolean;
}

const colors = {
    VERDE: 'bg-emerald-500',
    AMARELO: 'bg-amber-500',
    VERMELHO: 'bg-red-500',
};

const sizes = {
    sm: 'w-2.5 h-2.5',
    md: 'w-3.5 h-3.5',
    lg: 'w-5 h-5',
};

export const SemaforoIndicator = ({ status, size = 'md', pulse }: SemaforoIndicatorProps) => (
    <span className="relative inline-flex">
        <span className={clsx('rounded-full', colors[status], sizes[size])} />
        {(pulse || status === 'VERMELHO') && (
            <span className={clsx(
                'absolute inline-flex rounded-full opacity-75 animate-ping',
                colors[status], sizes[size]
            )} />
        )}
    </span>
);
