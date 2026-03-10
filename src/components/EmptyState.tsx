import { ReactNode } from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
    icon?: ReactNode;
    title: string;
    description?: string;
    action?: ReactNode;
}

export const EmptyState = ({ icon, title, description, action }: EmptyStateProps) => (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center mb-4">
            {icon || <Inbox className="w-8 h-8 text-stone-400" />}
        </div>
        <h3 className="text-lg font-semibold text-brown mb-1">{title}</h3>
        {description && <p className="text-stone-500 text-sm max-w-md mb-4">{description}</p>}
        {action}
    </div>
);
