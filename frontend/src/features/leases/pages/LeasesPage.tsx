import { useMemo, useState } from "react";
import { Link } from "react-router";
import { FileText, Search } from "lucide-react";
import { loadLeaseRows, type LeaseRow } from "../leaseRows";
import {
    LEASE_DISPLAY_STATUSES,
    leaseStatusLabel,
    type LeaseDisplayStatus,
} from "../status";
import LeaseStatusBadge from "../components/LeaseStatusBadge";
import { useOrgQuery } from "../../../hooks/useOrgQuery";
import { useTableSort } from "../../../hooks/useTableSort";
import { formatDate, formatMoney } from "../../../lib/format";
import type { SortColumns, SortState } from "../../../lib/sort";
import PageHeader from "../../../components/ui/PageHeader";
import EmptyState from "../../../components/ui/EmptyState";
import SortableHeader from "../../../components/ui/SortableHeader";

type StatusFilter = LeaseDisplayStatus | "ALL";

const NO_ROWS: LeaseRow[] = [];

type SortKey = "term" | "rent";

const sortColumns: SortColumns<LeaseRow, SortKey> = {
    term: { value: (row) => row.lease.startDate, firstDirection: "desc" },
    rent: { value: (row) => row.lease.monthlyRentCents, firstDirection: "desc" },
};

// Newest first: upcoming leases, then the most recently started.
const initialSort: SortState<SortKey> = { key: "term", direction: "desc" };

function newestFirst(a: LeaseRow, b: LeaseRow): number {
    return b.lease.startDate.localeCompare(a.lease.startDate) || b.lease.id - a.lease.id;
}

export default function LeasesPage() {
    const { organizationId, data, loading, error } = useOrgQuery(loadLeaseRows);
    const rows = data ?? NO_ROWS;
    const loadError = organizationId === undefined
        ? "Select an organization to view its leases."
        : error;
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
    const [query, setQuery] = useState("");

    const countByStatus = useMemo(() => {
        const counts: Record<StatusFilter, number> = { ALL: rows.length, ACTIVE: 0, UPCOMING: 0, ENDED: 0, CANCELLED: 0 };
        for (const row of rows) counts[row.status] += 1;
        return counts;
    }, [rows]);

    const filteredRows = useMemo(() => {
        const normalizedQuery = query.trim().toLocaleLowerCase();
        return rows.filter((row) => {
            if (statusFilter !== "ALL" && row.status !== statusFilter) return false;
            if (!normalizedQuery) return true;
            return [row.tenantName, row.propertyName, row.spaceName]
                .join(" ")
                .toLocaleLowerCase()
                .includes(normalizedQuery);
        });
    }, [rows, statusFilter, query]);

    const { sortedRows, directionOf, toggle } = useTableSort(filteredRows, {
        columns: sortColumns,
        initial: initialSort,
        pageOrder: newestFirst,
    });

    const filters: StatusFilter[] = ["ALL", ...LEASE_DISPLAY_STATUSES];

    return (
        <main className="mx-auto w-full max-w-7xl space-y-6 p-5 md:p-8">
            <PageHeader
                eyebrow="RENTORA / LEASING"
                title="Leases"
                description="Every lease in your organization, past, present and upcoming."
            />

            {loadError && (
                <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                    {loadError}
                </div>
            )}

            <section className="overflow-hidden rounded-xl border border-[#e0e7e2] bg-white">
                <div className="flex flex-col gap-3 border-b border-[#edf1ee] p-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by status">
                        {filters.map((filter) => {
                            const selected = statusFilter === filter;
                            return (
                                <button
                                    key={filter}
                                    type="button"
                                    onClick={() => setStatusFilter(filter)}
                                    aria-pressed={selected}
                                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d4a94f] ${selected ? "border-[#14302b] bg-[#14302b] text-white" : "border-[#dce4de] bg-white text-[#42574e] hover:bg-[#f4f7f5]"}`}
                                >
                                    {filter === "ALL" ? "All" : leaseStatusLabel[filter]}
                                    <span className={`text-xs ${selected ? "text-white/70" : "text-gray-400"}`}>{countByStatus[filter]}</span>
                                </button>
                            );
                        })}
                    </div>
                    <div className="relative w-full lg:max-w-xs">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            aria-label="Search leases"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Search tenant, property, space..."
                            className="w-full rounded-lg border border-[#dce4de] bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#14302b] focus:ring-2 focus:ring-[#14302b]/10"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="p-10 text-center text-sm text-gray-500">Loading leases...</div>
                ) : rows.length === 0 && !loadError ? (
                    <EmptyState
                        icon={FileText}
                        title="No leases yet"
                        description="Leases are created from a property's Leases tab."
                        action={
                            <Link
                                to="/app/properties"
                                className="inline-flex items-center gap-2 rounded-lg bg-[#14302b] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#20453d]"
                            >
                                Go to properties
                            </Link>
                        }
                    />
                ) : filteredRows.length === 0 ? (
                    <div className="p-10 text-center text-sm text-gray-500">No leases match these filters.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[880px] text-left text-sm">
                            <thead className="bg-[#f8faf8] text-xs uppercase tracking-wide text-[#71847a]">
                                <tr>
                                    <th className="px-5 py-3 font-semibold">Tenant</th>
                                    <th className="px-5 py-3 font-semibold">Property</th>
                                    <SortableHeader
                                        label="Term"
                                        direction={directionOf("term")}
                                        onToggle={() => toggle("term")}
                                        className="px-5 py-3 font-semibold"
                                    />
                                    <SortableHeader
                                        label="Rent / month"
                                        direction={directionOf("rent")}
                                        onToggle={() => toggle("rent")}
                                        className="px-5 py-3 text-right font-semibold"
                                    />
                                    <th className="px-5 py-3 font-semibold">Status</th>
                                    <th className="px-5 py-3 text-right font-semibold"> </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#edf1ee]">
                                {sortedRows.map((row) => (
                                    <tr key={row.lease.id} className="transition hover:bg-[#fafcfb]">
                                        <td className="px-5 py-4">
                                            <Link
                                                to={`/app/leases/${row.lease.id}`}
                                                className="font-medium text-[#14302b] hover:underline"
                                            >
                                                {row.tenantName}
                                            </Link>
                                            <p className="mt-1 text-xs text-gray-400">Lease #{row.lease.id}</p>
                                        </td>
                                        <td className="px-5 py-4">
                                            <p className="text-[#42574e]">{row.propertyName}</p>
                                            <p className="mt-1 text-xs text-gray-500">{row.spaceName}</p>
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-4 text-[#42574e]">
                                            {formatDate(row.lease.startDate)}
                                            <span className="mx-1.5 text-gray-400" aria-hidden="true">→</span>
                                            <span className="sr-only">to</span>
                                            {formatDate(row.lease.endDate)}
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-4 text-right font-medium tabular-nums text-[#14302b]">
                                            {formatMoney(row.lease.monthlyRentCents)}
                                        </td>
                                        <td className="px-5 py-4">
                                            <LeaseStatusBadge status={row.status} />
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <Link
                                                to={`/app/leases/${row.lease.id}`}
                                                className="whitespace-nowrap font-medium text-[#426b5c] hover:text-[#14302b]"
                                            >
                                                View details <span aria-hidden="true">→</span>
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </main>
    );
}
