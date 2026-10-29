import { describe, expect, it } from "vitest";

import { compareValues, nextSort, sortRows, type SortColumns } from "./sort";

interface Row {
    id: number;
    amountCents: number;
    date: string;
    closedAt: string | null;
}

const rows: Row[] = [
    { id: 1, amountCents: 50_00, date: "2026-03-01", closedAt: "2026-03-10T09:00:00Z" },
    { id: 2, amountCents: 1_200_00, date: "2026-01-15", closedAt: null },
    { id: 3, amountCents: 50_00, date: "2026-02-20", closedAt: "2026-02-21T17:30:00Z" },
];

type Key = "amount" | "date" | "closed";

const columns: SortColumns<Row, Key> = {
    amount: { value: (row) => row.amountCents, firstDirection: "desc" },
    date: { value: (row) => row.date, firstDirection: "desc" },
    closed: { value: (row) => row.closedAt, firstDirection: "desc" },
};

// The page's own order in these tests: highest ID first.
const byIdDescending = (a: Row, b: Row) => b.id - a.id;

const ids = (sorted: Row[]) => sorted.map((row) => row.id);

describe("sortRows", () => {
    it("sorts amounts as numbers, largest or smallest first", () => {
        expect(ids(sortRows(rows, columns, { key: "amount", direction: "desc" }, byIdDescending))).toEqual([2, 3, 1]);
        expect(ids(sortRows(rows, columns, { key: "amount", direction: "asc" }, byIdDescending))).toEqual([3, 1, 2]);
    });

    it("sorts dates latest or earliest first", () => {
        expect(ids(sortRows(rows, columns, { key: "date", direction: "desc" }, byIdDescending))).toEqual([1, 3, 2]);
        expect(ids(sortRows(rows, columns, { key: "date", direction: "asc" }, byIdDescending))).toEqual([2, 3, 1]);
    });

    it("puts rows without a value last in both directions", () => {
        expect(ids(sortRows(rows, columns, { key: "closed", direction: "desc" }, byIdDescending))).toEqual([1, 3, 2]);
        expect(ids(sortRows(rows, columns, { key: "closed", direction: "asc" }, byIdDescending))).toEqual([3, 1, 2]);
    });

    it("breaks ties with the page's own order, and uses it when no column is chosen", () => {
        // Rows 1 and 3 are both 50.00, so the higher ID comes first either way.
        expect(ids(sortRows(rows, columns, { key: "amount", direction: "asc" }, byIdDescending)).slice(0, 2)).toEqual([3, 1]);
        expect(ids(sortRows(rows, columns, null, byIdDescending))).toEqual([3, 2, 1]);
    });

    it("leaves the rows it was given alone", () => {
        sortRows(rows, columns, { key: "amount", direction: "desc" }, byIdDescending);
        expect(ids(rows)).toEqual([1, 2, 3]);
    });
});

describe("compareValues", () => {
    it("treats two missing values as equal", () => {
        expect(compareValues(null, null, "asc")).toBe(0);
    });
});

describe("nextSort", () => {
    it("starts a column in its first direction, then reverses it", () => {
        const first = nextSort<Key>(null, "amount", columns, null);
        expect(first).toEqual({ key: "amount", direction: "desc" });
        expect(nextSort(first, "amount", columns, null)).toEqual({ key: "amount", direction: "asc" });
    });

    it("goes back to how the page started on the third click", () => {
        expect(nextSort<Key>({ key: "amount", direction: "asc" }, "amount", columns, null)).toBeNull();
        expect(nextSort<Key>({ key: "amount", direction: "asc" }, "amount", columns, { key: "date", direction: "desc" }))
            .toEqual({ key: "date", direction: "desc" });
    });

    it("just flips the column the page started with", () => {
        const initial = { key: "date", direction: "desc" } as const;
        expect(nextSort<Key>(initial, "date", columns, initial)).toEqual({ key: "date", direction: "asc" });
        expect(nextSort<Key>({ key: "date", direction: "asc" }, "date", columns, initial)).toEqual(initial);
    });

    it("switches to another column in that column's first direction", () => {
        expect(nextSort<Key>({ key: "date", direction: "asc" }, "amount", columns, null)).toEqual({ key: "amount", direction: "desc" });
    });
});
