import { useState } from "react";
import { Link } from "react-router";
import { Building2, Mail, Plus, Search, Users } from "lucide-react";
import { createTenant, getTenantPage, getTenantSummary } from "../api/tenantApi";
import TenantForm from "../components/TenantForm";
import { formatDate } from "../../../lib/format";
import { nextSort, type SortDirection, type SortState } from "../../../lib/sort";
import { useDebouncedValue } from "../../../hooks/useDebouncedValue";
import { useOrgQuery } from "../../../hooks/useOrgQuery";
import PageHeader from "../../../components/ui/PageHeader";
import EmptyState from "../../../components/ui/EmptyState";
import Pagination from "../../../components/ui/Pagination";
import SortableHeader from "../../../components/ui/SortableHeader";
import StatusBadge from "../../../components/ui/StatusBadge";
import {
    getTenantDisplayName,
    type CreateTenantRequest,
    type TenantResponse,
    type TenantSortField,
} from "../types";

const PAGE_SIZE = 25;
const NO_TENANTS: TenantResponse[] = [];

// Newest added first, the server's order when no sort is sent.
const initialSort: SortState<TenantSortField> = { key: "ADDED", direction: "desc" };

// Latest first on the first click.
const sortColumns: Record<TenantSortField, { firstDirection: SortDirection }> = {
    ADDED: { firstDirection: "desc" },
};

// The server searches, sorts and pages the tenants; this page shows one page at a time.
export default function TenantsPage() {
    const [query, setQuery] = useState("");
    const [page, setPage] = useState(0);
    const [sort, setSort] = useState(initialSort);
    // Bumped to load the page and the counts again, e.g. after adding a tenant.
    const [reloadCount, setReloadCount] = useState(0);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [creating, setCreating] = useState(false);
    // Searching waits for a pause in typing.
    const search = useDebouncedValue(query.trim(), 300);

    const summaryQuery = useOrgQuery(getTenantSummary, [reloadCount]);
    const pageQuery = useOrgQuery(
        (organizationId) => getTenantPage(organizationId, { search: search || undefined, page, size: PAGE_SIZE, sort }),
        [search, page, sort.key, sort.direction, reloadCount],
    );

    const organizationId = pageQuery.organizationId;
    const summary = summaryQuery.data;
    const pageData = pageQuery.data;
    const tenants = pageData?.items ?? NO_TENANTS;
    const loadError = organizationId === undefined
        ? "Select an organization to view its tenants."
        : summaryQuery.error ?? pageQuery.error;
    const totalTenants = summary ? summary.INDIVIDUAL + summary.COMPANY : undefined;

    // Any change to what's shown starts again at the first page.
    function changeQuery(text: string) {
        setQuery(text);
        setPage(0);
    }

    function toggleSort(field: TenantSortField) {
        setSort((current) => nextSort(current, field, sortColumns, initialSort) ?? initialSort);
        setPage(0);
    }

    const directionOf = (field: TenantSortField) => (sort.key === field ? sort.direction : null);

    // The new tenant is the newest, so clearing the search and going back to the first page shows it on top.
    async function handleCreate(request: CreateTenantRequest) {
        if (organizationId === undefined) return;
        setCreating(true);
        try {
            await createTenant(organizationId, request);
            setShowCreateForm(false);
            setQuery("");
            setSort(initialSort);
            setPage(0);
            setReloadCount((count) => count + 1);
        } finally {
            setCreating(false);
        }
    }

    return (
        <main className="mx-auto w-full max-w-7xl space-y-6 p-5 md:p-8">
            <PageHeader
                eyebrow="RENTORA / DIRECTORY"
                title="Tenants"
                description="Manage the people and companies renting your spaces."
                actions={
                    <button
                        type="button"
                        onClick={() => setShowCreateForm((current) => !current)}
                        disabled={organizationId === undefined || creating}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#14302b] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#20453d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d4a94f]"
                    >
                        <Plus className="h-4 w-4" />
                        {showCreateForm ? "Close form" : "Add tenant"}
                    </button>
                }
            />

            {showCreateForm && organizationId !== undefined && (
                <TenantForm
                    submitting={creating}
                    onSubmit={handleCreate}
                    onCancel={() => setShowCreateForm(false)}
                />
            )}

            {loadError && (
                <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                    {loadError}
                </div>
            )}

            <section className="grid gap-4 sm:grid-cols-3" aria-label="Tenant summary">
                <div className="rounded-xl border border-[#e0e7e2] bg-white p-5">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Total tenants</span>
                        <Users className="h-5 w-5 text-[#638176]" />
                    </div>
                    <p className="mt-3 text-2xl font-semibold text-[#14302b]">{totalTenants ?? "—"}</p>
                </div>
                <div className="rounded-xl border border-[#e0e7e2] bg-white p-5">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Individuals</span>
                        <Users className="h-5 w-5 text-[#638176]" />
                    </div>
                    <p className="mt-3 text-2xl font-semibold text-[#14302b]">{summary?.INDIVIDUAL ?? "—"}</p>
                </div>
                <div className="rounded-xl border border-[#e0e7e2] bg-white p-5">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Companies</span>
                        <Building2 className="h-5 w-5 text-[#638176]" />
                    </div>
                    <p className="mt-3 text-2xl font-semibold text-[#14302b]">{summary?.COMPANY ?? "—"}</p>
                </div>
            </section>

            <section className="overflow-hidden rounded-xl border border-[#e0e7e2] bg-white">
                <div className="flex flex-col gap-3 border-b border-[#edf1ee] p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="font-semibold text-[#14302b]">Tenant directory</h2>
                        {pageData && (
                            <p className="mt-1 text-sm text-gray-500">
                                {pageData.totalItems} {pageData.totalItems === 1 ? "result" : "results"}
                            </p>
                        )}
                    </div>
                    <div className="relative w-full sm:max-w-xs">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            aria-label="Search tenants"
                            value={query}
                            onChange={(event) => changeQuery(event.target.value)}
                            placeholder="Search name, email, phone..."
                            className="w-full rounded-lg border border-[#dce4de] bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#14302b] focus:ring-2 focus:ring-[#14302b]/10"
                        />
                    </div>
                </div>

                {pageQuery.loading ? (
                    <div className="p-10 text-center text-sm text-gray-500">Loading tenants...</div>
                ) : totalTenants === 0 && !loadError ? (
                    <EmptyState
                        icon={Users}
                        title="No tenants yet"
                        description="Create your first tenant to use them in a lease."
                        action={
                            <button
                                type="button"
                                onClick={() => setShowCreateForm(true)}
                                className="inline-flex items-center gap-2 rounded-lg bg-[#14302b] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#20453d]"
                            >
                                <Plus className="h-4 w-4" /> Add tenant
                            </button>
                        }
                    />
                ) : tenants.length === 0 && page > 0 ? (
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
                ) : tenants.length === 0 ? (
                    !loadError && <div className="p-10 text-center text-sm text-gray-500">No tenants match that search.</div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[700px] text-left text-sm">
                                <thead className="bg-[#f8faf8] text-xs uppercase tracking-wide text-[#71847a]">
                                    <tr>
                                        <th className="px-5 py-3 font-semibold">Tenant</th>
                                        <th className="px-5 py-3 font-semibold">Type</th>
                                        <th className="px-5 py-3 font-semibold">Contact</th>
                                        <SortableHeader
                                            label="Added"
                                            direction={directionOf("ADDED")}
                                            onToggle={() => toggleSort("ADDED")}
                                            className="px-5 py-3 font-semibold"
                                        />
                                        <th className="px-5 py-3 text-right font-semibold"> </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#edf1ee]">
                                    {tenants.map((tenant) => (
                                        <tr key={tenant.id} className="transition hover:bg-[#fafcfb]">
                                            <td className="px-5 py-4">
                                                <Link
                                                    to={`/app/tenants/${tenant.id}`}
                                                    className="font-medium text-[#14302b] hover:underline"
                                                >
                                                    {getTenantDisplayName(tenant)}
                                                </Link>
                                                <p className="mt-1 text-xs text-gray-400">Tenant #{tenant.id}</p>
                                            </td>
                                            <td className="px-5 py-4">
                                                <StatusBadge tone="brand">
                                                    {tenant.type === "INDIVIDUAL" ? "Individual" : "Company"}
                                                </StatusBadge>
                                            </td>
                                            <td className="px-5 py-4">
                                                {tenant.email ? (
                                                    <div className="flex items-center gap-2 text-[#42574e]">
                                                        <Mail className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                                                        <span>{tenant.email}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400">No email provided</span>
                                                )}
                                                {tenant.phone && <p className="mt-1 pl-[22px] text-xs text-gray-500">{tenant.phone}</p>}
                                            </td>
                                            <td className="px-5 py-4 text-gray-500">{formatDate(tenant.createdAt)}</td>
                                            <td className="px-5 py-4 text-right">
                                                <Link
                                                    to={`/app/tenants/${tenant.id}`}
                                                    className="font-medium text-[#426b5c] hover:text-[#14302b]"
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
                                itemCount={tenants.length}
                                totalItems={pageData.totalItems}
                                totalPages={pageData.totalPages}
                                onPageChange={setPage}
                                noun={{ one: "tenant", other: "tenants" }}
                            />
                        )}
                    </>
                )}
            </section>
        </main>
    );
}
