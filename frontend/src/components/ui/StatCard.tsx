import type { LucideIcon } from "lucide-react";

interface StatCardProps {
    label: string;
    value: string;
    description: string;
    // Top right on a default card, before the label on a compact one.
    icon?: LucideIcon;
    // "default": a card of its own, as in a row of figures at the top of a page.
    // "compact": a smaller card inside a section.
    size?: "default" | "compact";
    // "danger" shows the card in red, e.g. for overdue rent.
    tone?: "neutral" | "danger";
    // A smaller value on a default card, for a long one such as a date.
    smallValue?: boolean;
}

// A figure with a label and a short explanation.
export default function StatCard({
    label,
    value,
    description,
    icon: Icon,
    size = "default",
    tone = "neutral",
    smallValue = false,
}: StatCardProps) {
    const danger = tone === "danger";

    if (size === "compact") {
        return (
            <article className={`rounded-lg border p-4 ${danger ? "border-red-100 bg-red-50/50" : "border-[#e0e7e2] bg-[#fbfcfb]"}`}>
                <div className={`flex items-center gap-2 text-sm ${danger ? "text-red-700" : "text-gray-500"}`}>
                    {Icon && <Icon className="h-4 w-4" aria-hidden="true" />}
                    {label}
                </div>
                <p className={`mt-2 text-xl font-semibold ${danger ? "text-red-800" : "text-[#14302b]"}`}>{value}</p>
                <p className={`mt-1 text-xs ${danger ? "text-red-700" : "text-gray-500"}`}>{description}</p>
            </article>
        );
    }

    return (
        <article className={`rounded-xl border p-5 shadow-sm ${danger ? "border-red-100 bg-red-50/50" : "border-[#e1e8e3] bg-white"}`}>
            <div className="flex items-center justify-between gap-3">
                <p className={`text-sm font-medium ${danger ? "text-red-700" : "text-gray-500"}`}>{label}</p>
                {Icon && <Icon className={`h-5 w-5 ${danger ? "text-red-700" : "text-[#769286]"}`} aria-hidden="true" />}
            </div>
            <p className={`mt-3 font-semibold ${smallValue ? "text-lg" : "text-2xl"} ${danger ? "text-red-800" : "text-[#14302b]"}`}>{value}</p>
            <p className={`mt-1 text-sm ${danger ? "text-red-700" : "text-gray-500"}`}>{description}</p>
        </article>
    );
}
