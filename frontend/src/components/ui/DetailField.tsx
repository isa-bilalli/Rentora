import type { LucideIcon } from "lucide-react";

interface DetailFieldProps {
    label: string;
    // Shown as "—" when empty.
    value: string;
    // "row": a bordered row with a small uppercase label, as in a details card.
    // "plain": the label above the value, for a grid of fields.
    variant?: "row" | "plain";
    // Shown before a row's label.
    icon?: LucideIcon;
    className?: string;
}

// One labelled value in a <dl>. Each row has a bottom border; a list that ends where something else draws a
// border hides the last one with "[&>:last-child]:border-b-0" on the <dl>.
export default function DetailField({ label, value, variant = "row", icon: Icon, className = "" }: DetailFieldProps) {
    if (variant === "plain") {
        return (
            <div className={className}>
                <dt className="text-sm text-gray-500">{label}</dt>
                <dd className="mt-1 text-sm font-medium text-[#243b35]">{value || "—"}</dd>
            </div>
        );
    }

    return (
        <div className={`border-b border-[#edf1ee] px-5 py-4 ${className}`}>
            <dt className={`${Icon ? "flex items-center gap-2 " : ""}text-xs font-medium uppercase tracking-wide text-gray-400`}>
                {Icon && <Icon className="h-3.5 w-3.5" aria-hidden="true" />}
                {label}
            </dt>
            <dd className="mt-1 text-sm font-medium text-[#243b35]">{value || "—"}</dd>
        </div>
    );
}
