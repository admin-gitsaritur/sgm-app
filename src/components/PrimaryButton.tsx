import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion } from 'motion/react';

function cn(...inputs: (string | undefined | false | null)[]) {
    return twMerge(clsx(inputs));
}

interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
}

const variants = {
    primary: 'bg-[#F37137] text-white hover:bg-[#F37137]/90 shadow-sm',
    secondary: 'bg-[#F6D317] text-[#4E3205] hover:bg-[#F6D317]/90 shadow-sm',
    outline: 'border border-[#4E3205]/20 text-[#4E3205] hover:bg-[#4E3205]/5',
    ghost: 'text-[#4E3205] hover:bg-[#4E3205]/5',
    danger: 'bg-red-500 text-white hover:bg-red-600 shadow-sm',
};

const sizes = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-4 py-2 text-sm',
    lg: 'h-12 px-6 text-base',
};

export const PrimaryButton = React.forwardRef<HTMLButtonElement, PrimaryButtonProps>(
    ({ className, variant = 'primary', size = 'md', loading, children, ...props }, ref) => {
        return (
            <motion.button
                ref={ref}
                whileTap={{ scale: 0.98 }}
                className={cn(
                    'inline-flex items-center justify-center rounded-xl font-medium transition-colors cursor-pointer',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F37137]',
                    'disabled:pointer-events-none disabled:opacity-50',
                    variants[variant],
                    sizes[size],
                    className,
                )}
                disabled={loading || props.disabled}
                {...(props as any)}
            >
                {loading ? (
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : null}
                {children}
            </motion.button>
        );
    }
);
PrimaryButton.displayName = 'PrimaryButton';
