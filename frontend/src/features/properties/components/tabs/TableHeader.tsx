import type { ReactNode } from "react";

import SortableHeader from "../../../../components/ui/SortableHeader";
import type { SortDirection } from "../../../../lib/sort";

const className = "px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500";

type TableHeaderProps =
    | { children: ReactNode; sort?: undefined }
    // A sortable column: its direction from useTableSort's directionOf, and its toggle.
    | { children: string; sort: { direction: SortDirection | null; onToggle: () => void } };

// A column heading in the property page's tables.
export default function TableHeader({ children, sort }: TableHeaderProps) {
    if (sort) {
        return <SortableHeader label={children} direction={sort.direction} onToggle={sort.onToggle} className={className} />;
    }
    return <th className={className}>{children}</th>;
}
