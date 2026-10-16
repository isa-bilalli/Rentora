import type { ReactNode } from "react";

interface PageHeaderProps {
    title: string;
    description?: ReactNode;
    // Small label above the title, e.g. "RENTORA / DIRECTORY".
    eyebrow?: string;
    // Buttons or links: full width under the title on phones, on the right from the sm breakpoint.
    actions?: ReactNode;
}

export default function PageHeader({
    title,
    description,
    eyebrow,
    actions,
}: PageHeaderProps) {
    return (
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
                {eyebrow && (
                    <p className="text-sm font-medium text-[#7b8e84]">{eyebrow}</p>
                )}
                <h1 className={`${eyebrow ? "mt-1 " : ""}text-2xl font-semibold tracking-tight text-[#14302b] sm:text-3xl`}>
                    {title}
                </h1>
                {description && (
                    <p className="mt-2 max-w-2xl text-sm text-gray-500">{description}</p>
                )}
            </div>
            {actions && (
                <div className="flex flex-col gap-2 sm:flex-row">{actions}</div>
            )}
        </header>
    );
}
