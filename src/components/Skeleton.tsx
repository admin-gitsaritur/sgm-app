interface SkeletonProps {
    className?: string;
    rows?: number;
}

export const Skeleton = ({ className = '', rows = 1 }: SkeletonProps) => (
    <div className="animate-pulse space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className={`bg-gray-200 rounded-lg h-4 ${className}`} />
        ))}
    </div>
);

export const TableSkeleton = ({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) => (
    <div className="animate-pulse">
        {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex gap-4 py-4 px-6 border-b border-gray-100">
                {Array.from({ length: cols }).map((_, j) => (
                    <div key={j} className="h-4 bg-gray-200 rounded flex-1" />
                ))}
            </div>
        ))}
    </div>
);

export const CardSkeleton = () => (
    <div className="animate-pulse bg-white rounded-2xl border border-gray-200 p-6">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="h-8 bg-gray-200 rounded w-1/2 mb-2" />
        <div className="h-3 bg-gray-200 rounded w-2/3" />
    </div>
);
