import type { ReactNode } from "react";

// A column heading in the property page's tables.
export default function TableHeader({ children }: { children: ReactNode }) {
    return (
        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
            {children}
        </th>
    );
}
