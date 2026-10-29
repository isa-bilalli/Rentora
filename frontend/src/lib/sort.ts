// Sorting tables by a clicked column. The value of a row in a column is a number (amounts, in cents), a
// "YYYY-MM-DD" date or ISO timestamp (which sort correctly as text), or null when the row has none.

export type SortDirection = "asc" | "desc";

export interface SortState<Key extends string> {
    key: Key;
    direction: SortDirection;
}

export type SortValue = number | string | null;

export interface SortColumn<Row> {
    value: (row: Row) => SortValue;
    // The direction of the first click: "desc" for largest or latest first.
    firstDirection: SortDirection;
}

export type SortColumns<Row, Key extends string> = Record<Key, SortColumn<Row>>;

// Rows without a value go last whichever way the column is sorted.
export function compareValues(a: SortValue, b: SortValue, direction: SortDirection): number {
    if (a === null || b === null) {
        return a === b ? 0 : a === null ? 1 : -1;
    }
    const ascending = a < b ? -1 : a > b ? 1 : 0;
    return direction === "asc" ? ascending : -ascending;
}

// A copy of the rows in the sort's order. Ties, and every row when no column is chosen, follow the
// page's own order.
export function sortRows<Row, Key extends string>(
    rows: readonly Row[],
    columns: SortColumns<Row, Key>,
    sort: SortState<Key> | null,
    pageOrder: (a: Row, b: Row) => number,
): Row[] {
    if (!sort) {
        return [...rows].sort(pageOrder);
    }
    const { value } = columns[sort.key];
    return [...rows].sort((a, b) => compareValues(value(a), value(b), sort.direction) || pageOrder(a, b));
}

// A click on a column: its first direction, then the other, then back to how the page started.
export function nextSort<Key extends string>(
    current: SortState<Key> | null,
    key: Key,
    columns: Record<Key, Pick<SortColumn<never>, "firstDirection">>,
    initial: SortState<Key> | null,
): SortState<Key> | null {
    const { firstDirection } = columns[key];
    if (current?.key !== key) {
        return { key, direction: firstDirection };
    }
    if (current.direction === firstDirection) {
        return { key, direction: firstDirection === "asc" ? "desc" : "asc" };
    }
    // Starting over on the same column would look like nothing happened, so flip back instead.
    return initial?.key === key ? { key, direction: firstDirection } : initial;
}
