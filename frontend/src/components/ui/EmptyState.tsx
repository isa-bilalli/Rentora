import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
    title: string;
    description?: ReactNode;
    icon?: LucideIcon;
    // Usually a button that creates the first item.
    action?: ReactNode;
    // Container padding and border; the default suits a placement inside an existing card.
    className?: string;
}

export default function EmptyState({
    title,
    description,
    icon: Icon,
    action,
    className = "p-10",
}: EmptyStateProps) {
    return (
        <div className={`text-center ${className}`}>
            {Icon && (
                <Icon className="mx-auto h-8 w-8 text-[#8aa096]" aria-hidden="true" />
            )}
            <h3 className={`${Icon ? "mt-3 " : ""}font-semibold text-[#14302b]`}>
                {title}
            </h3>
            {description && (
                <p className="mt-1 text-sm text-gray-500">{description}</p>
            )}
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}
