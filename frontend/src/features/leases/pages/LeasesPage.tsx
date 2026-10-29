import { useState } from "react";
import { Link } from "react-router";
import { FileText, Search } from "lucide-react";
import { getLeasePage, getLeaseSummary } from "../api/leasesApi";
import {
    LEASE_DISPLAY_STATUSES,
    leaseStatusLabel,
    type LeaseDisplayStatus,
} from "../status";
import type { LeaseListItem, LeaseSortField } from "../types";
import LeaseStatusBadge from "../components/LeaseStatusBadge";
import { useDebouncedValue } from "../../../hooks/useDebouncedValue";
import { useOrgQuery } from "../../../hooks/useOrgQuery";
import { formatDate, formatMoney } from "../../../lib/format";
import { nextSort, type SortDirection, type SortState } from "../../../lib/sort";
import PageHeader from "../../../components/ui/PageHeader";
import EmptyState from "../../../components/ui/EmptyState";
import Pagination from "../../../components/ui/Pagination";
import SortableHeader from "../../../components/ui/SortableHeader";

type StatusFilter = LeaseDisplayStatus | "ALL";

const PAGE_SIZE = 25;
const NO_ROWS: LeaseListItem[] = [];

// Newest first: upcoming leases, then the most recently started. The server's order when no sort is sent.
const initialSort: SortState<LeaseSortField> = { key: "START_DATE", direction: "desc" };

// Latest or largest first on the first click.
const sortColumns: Record<LeaseSortField, { firstDirection: SortDirection }> = {
    START_DATE: { firstDirection: "desc" },
    RENT: { firstDirection: "desc" },
};

// The server filters, searches, sorts and pages the leases; this page shows one page at a time.
export default function LeasesPage() {
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
    const [query, setQuery] = useState("");
    const [page, setPage] = useState(0);
    const [sort, setSort] = useState(initialSort);
    // Searching waits for a pause in typing.
    const search = useDebouncedValue(query.trim(), 300);

    const summaryQuery = useOrgQuery(getLeaseSummary);
    const pageQuery = useOrgQuery(
        (organizationId) => getLeasePage(organizationId, {
            status: statusFilter === "ALL" ? undefined : statusFilter,
            search: search || undefined,
            page,
            size: PAGE_SIZE,
            sort,
        }),
        [statusFilter, search, page, sort.key, sort.direction],
    );

    const summary = summaryQuery.data;
    const pageData = pageQuery.data;
    const rows = pageData?.items ?? NO_ROWS;
    const loadError = pageQuery.organizationId === undefined
        ? "Select an organization to view its leases."
        : summaryQuery.error ?? pageQuery.error;
    const totalLeases = summary ? LEASE_DISPLAY_STATUSES.reduce((total, status) => total + summary[status], 0) : undefined;
    const countOf = (filter: StatusFilter) => (filter === "ALL" ? totalLeases : summary?.[filter]);

    // Any change to what's shown starts again at the first page.
    function chooseStatus(filter: StatusFilter) {
        setStatusFilter(filter);
        setPage(0);
    }

    function changeQuery(text: string) {
        setQuery(text);
        setPage(0);
    }

    function toggleSort(field: LeaseSortField) {
        setSort((current) => nextSort(current, field, sortColumns, initialSort) ?? initialSort);
        setPage(0);
    }

    const directionOf = (field: LeaseSortField) => (sort.key === field ? sort.direction : null);

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
                            const count = countOf(filter);
                            return (
                                <button
                                    key={filter}
                                    type="button"
                                    onClick={() => chooseStatus(filter)}
                                    aria-pressed={selected}
                                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d4a94f] ${selected ? "border-[#14302b] bg-[#14302b] text-white" : "border-[#dce4de] bg-white text-[#42574e] hover:bg-[#f4f7f5]"}`}
                                >
                                    {filter === "ALL" ? "All" : leaseStatusLabel[filter]}
                                    {count !== undefined && (
                                        <span className={`text-xs ${selected ? "text-white/70" : "text-gray-400"}`}>{count}</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                    <div className="relative w-full lg:max-w-xs">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            aria-label="Search leases"
                            value={query}
                            onChange={(event) => changeQuery(event.target.value)}
                            placeholder="Search tenant, property, space..."
                            className="w-full rounded-lg border border-[#dce4de] bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#14302b] focus:ring-2 focus:ring-[#14302b]/10"
                        />
                    </div>
                </div>

                {pageQuery.loading ? (
                    <div className="p-10 text-center text-sm text-gray-500">Loading leases...</div>
                ) : totalLeases === 0 && !loadError ? (
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
                ) : rows.length === 0 && page > 0 ? (
                    // E.g. after switching organization while on a later page.
                    <EmptyState
                        title="This page is empty"
                        action={
                            <button
                                type="button"
                                onClick={() => setPage(0)}
                                className="inline-flex items-center gap-2 rounded-lg bg-[#14302b] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#20453d]"
                            >
                                Go to the first page
                            </button>
                        }
                    />
                ) : rows.length === 0 ? (
                    !loadError && <div className="p-10 text-center text-sm text-gray-500">No leases match these filters.</div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[880px] text-left text-sm">
                                <thead className="bg-[#f8faf8] text-xs uppercase tracking-wide text-[#71847a]">
                                    <tr>
                                        <th className="px-5 py-3 font-semibold">Tenant</th>
                                        <th className="px-5 py-3 font-semibold">Property</th>
                                        <SortableHeader
                                            label="Term"
                                            direction={directionOf("START_DATE")}
                                            onToggle={() => toggleSort("START_DATE")}
                                            className="px-5 py-3 font-semibold"
                                        />
                                        <SortableHeader
                                            label="Rent / month"
                                            direction={directionOf("RENT")}
                                            onToggle={() => toggleSort("RENT")}
                                            className="px-5 py-3 text-right font-semibold"
                                        />
                                        <th className="px-5 py-3 font-semibold">Status</th>
                                        <th className="px-5 py-3 text-right font-semibold"> </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#edf1ee]">
                                    {rows.map((row) => (
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
                        {pageData && (
                            <Pagination
                                page={pageData.page}
                                size={pageData.size}
                                itemCount={rows.length}
                                totalItems={pageData.totalItems}
                                totalPages={pageData.totalPages}
                                onPageChange={setPage}
                                noun={{ one: "lease", other: "leases" }}
                            />
                        )}
                    </>
                )}
            </section>
        </main>
    );
}
