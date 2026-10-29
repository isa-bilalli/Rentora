import { useMemo, useState } from "react";

import { nextSort, sortRows, type SortColumns, type SortDirection, type SortState } from "../lib/sort";

interface TableSortOptions<Row, Key extends string> {
    // Defined once outside the component, so the rows aren't re-sorted on every render.
    columns: SortColumns<Row, Key>;
    // The order before any click, and for ties: a column's sort, or null for pageOrder alone.
    initial: SortState<Key> | null;
    pageOrder: (a: Row, b: Row) => number;
}

// Click-to-sort for a table whose rows are all loaded. Pair it with SortableHeader.
export function useTableSort<Row, Key extends string>(
    rows: readonly Row[],
    { columns, initial, pageOrder }: TableSortOptions<Row, Key>,
) {
    const [sort, setSort] = useState<SortState<Key> | null>(initial);

    const sortedRows = useMemo(
        () => sortRows(rows, columns, sort, pageOrder),
        [rows, columns, sort, pageOrder],
    );

    return {
        sortedRows,
        // For a column's header: its direction while it sorts the table, otherwise null.
        directionOf: (key: Key): SortDirection | null => (sort?.key === key ? sort.direction : null),
        toggle: (key: Key) => setSort((current) => nextSort(current, key, columns, initial)),
    };
}
