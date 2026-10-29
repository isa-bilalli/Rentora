import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import type { SortDirection } from "../../lib/sort";

interface SortableHeaderProps {
    label: string;
    // This column's direction while it sorts the table, otherwise null.
    direction: SortDirection | null;
    onToggle: () => void;
    // The page's own heading padding and alignment.
    className?: string;
}

// A column heading that sorts the table when clicked. aria-sort tells screen readers which way.
export default function SortableHeader({ label, direction, onToggle, className = "" }: SortableHeaderProps) {
    const Icon = direction === "asc" ? ArrowUp : direction === "desc" ? ArrowDown : ArrowUpDown;

    return (
        <th
            aria-sort={direction === "asc" ? "ascending" : direction === "desc" ? "descending" : "none"}
            className={className}
        >
            <button
                type="button"
                onClick={onToggle}
                className={`inline-flex items-center gap-1 whitespace-nowrap rounded uppercase transition hover:text-[#14302b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d4a94f] ${direction ? "text-[#14302b]" : ""}`}
            >
                {label}
                <Icon aria-hidden="true" className={`h-3.5 w-3.5 ${direction ? "" : "opacity-40"}`} />
            </button>
        </th>
    );
}
