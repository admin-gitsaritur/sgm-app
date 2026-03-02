import { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import clsx from 'clsx';

interface StatCardProps {
    label: string;
    value: string | number;
    icon?: ReactNode;
    trend?: number; // percentage change
    trendLabel?: string;
    className?: string;
}

export const StatCard = ({ label, value, icon, trend, trendLabel, className }: StatCardProps) => (
    <div className={clsx('bg-white rounded-2xl border border-gray-200 p-5 shadow-sm', className)}>
        <div className="flex items-start justify-between mb-3">
            <p className="text-sm text-gray-500 font-medium">{label}</p>
            {icon && <div className="w-10 h-10 rounded-xl bg-[#F37137]/10 flex items-center justify-center">{icon}</div>}
        </div>
        <p className="text-2xl font-bold text-[#4E3205] mb-1">{value}</p>
        {trend !== undefined && (
            <div className="flex items-center gap-1">
                {trend > 0 ? (
                    <TrendingUp size={14} className="text-emerald-500" />
                ) : trend < 0 ? (
                    <TrendingDown size={14} className="text-red-500" />
                ) : (
                    <Minus size={14} className="text-gray-400" />
                )}
                <span className={clsx('text-xs font-medium', {
                    'text-emerald-600': trend > 0,
                    'text-red-600': trend < 0,
                    'text-gray-500': trend === 0,
                })}>
                    {trend > 0 ? '+' : ''}{trend.toFixed(1)}% {trendLabel || ''}
                </span>
            </div>
        )}
    </div>
);
