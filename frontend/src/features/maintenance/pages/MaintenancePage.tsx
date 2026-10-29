import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Plus, Wrench } from "lucide-react";
import { getMaintenancePage, getMaintenanceSummary } from "../api/maintenanceApi";
import type {
    MaintenanceCount,
    MaintenanceListItem,
    MaintenancePriority,
    MaintenanceSortField,
    MaintenanceStatus,
} from "../types";
import {
    MAINTENANCE_PRIORITIES,
    MAINTENANCE_STATUSES,
    maintenancePriorityLabel,
    maintenanceStatusLabel,
} from "../status";
import { MaintenancePriorityBadge, MaintenanceStatusBadge } from "../components/MaintenanceBadges";
import MaintenanceRowActions from "../components/MaintenanceRowActions";
import CreateMaintenanceForm from "../components/CreateMaintenanceForm";
import { useMaintenanceActions } from "../useMaintenanceActions";
import { listPropertiesWithSpaces, loadPropertyDirectory } from "../../properties/propertyDirectory";
import { useOrgQuery } from "../../../hooks/useOrgQuery";
import { formatDate } from "../../../lib/format";
import { nextSort, type SortDirection, type SortState } from "../../../lib/sort";
import PageHeader from "../../../components/ui/PageHeader";
import EmptyState from "../../../components/ui/EmptyState";
import FilterGroup from "../../../components/ui/FilterGroup";
import Pagination from "../../../components/ui/Pagination";
import SortableHeader from "../../../components/ui/SortableHeader";

type StatusFilter = MaintenanceStatus | "ALL";
type PriorityFilter = MaintenancePriority | "ALL";

const PAGE_SIZE = 25;
const NO_ROWS: MaintenanceListItem[] = [];
const NO_COUNTS: MaintenanceCount[] = [];

// Latest first on the first click. With no column chosen the server shows what needs attention first.
const sortColumns: Record<MaintenanceSortField, { firstDirection: SortDirection }> = {
    REPORTED: { firstDirection: "desc" },
    RESOLVED: { firstDirection: "desc" },
};

function matches<T extends string>(filter: T | "ALL", value: T): boolean {
    return filter === "ALL" || filter === value;
}

// The server shows what needs attention first, filters, sorts and pages the requests; this page shows one
// page at a time. The create form still needs every property and its spaces, so it loads those too.
export default function MaintenancePage() {
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
    const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("ALL");
    const [page, setPage] = useState(0);
    const [sort, setSort] = useState<SortState<MaintenanceSortField> | null>(null);
    // Bumped to load the page and the counts again (after creating a request), or only the counts (after an action).
    const [reloadCount, setReloadCount] = useState(0);
    const [summaryReloadCount, setSummaryReloadCount] = useState(0);
    const [showCreateForm, setShowCreateForm] = useState(false);

    const summaryQuery = useOrgQuery(getMaintenanceSummary, [reloadCount, summaryReloadCount]);
    const pageQuery = useOrgQuery(
        (organizationId) => getMaintenancePage(organizationId, {
            status: statusFilter === "ALL" ? undefined : statusFilter,
            priority: priorityFilter === "ALL" ? undefined : priorityFilter,
            page,
            size: PAGE_SIZE,
            sort: sort ?? undefined,
        }),
        [statusFilter, priorityFilter, page, sort?.key, sort?.direction, reloadCount],
    );
    const directoryQuery = useOrgQuery(loadPropertyDirectory);

    const counts = summaryQuery.data ?? NO_COUNTS;
    const pageData = pageQuery.data;
    const rows = pageData?.items ?? NO_ROWS;
    const loadError = pageQuery.organizationId === undefined
        ? "Select an organization to view its maintenance requests."
        : summaryQuery.error ?? pageQuery.error ?? directoryQuery.error;
    const totalRequests = summaryQuery.data?.reduce((total, count) => total + count.requests, 0);

    // The create form asks for a property first, then one of that property's spaces.
    const propertyOptions = useMemo(
        () => (directoryQuery.data ? listPropertiesWithSpaces(directoryQuery.data) : []),
        [directoryQuery.data],
    );

    // Each group's counts respect the other group's selection, so a count always matches what clicking it shows.
    const statusCounts = useMemo(() => {
        const withPriority = counts.filter((count) => matches(priorityFilter, count.priority));
        return Object.fromEntries(
            (["ALL", ...MAINTENANCE_STATUSES] as StatusFilter[]).map((status) => [
                status,
                withPriority.filter((count) => matches(status, count.status)).reduce((total, count) => total + count.requests, 0),
            ]),
        ) as Record<StatusFilter, number>;
    }, [counts, priorityFilter]);

    const priorityCounts = useMemo(() => {
        const withStatus = counts.filter((count) => matches(statusFilter, count.status));
        return Object.fromEntries(
            (["ALL", ...MAINTENANCE_PRIORITIES] as PriorityFilter[]).map((priority) => [
                priority,
                withStatus.filter((count) => matches(priority, count.priority)).reduce((total, count) => total + count.requests, 0),
            ]),
        ) as Record<PriorityFilter, number>;
    }, [counts, statusFilter]);

    // A new request is loaded with the rest of the page. A changed one stays where it is (so rows don't jump
    // under the pointer) unless it no longer matches the status filter; either way the counts are loaded again.
    const maintenanceActions = useMaintenanceActions({
        onCreated: () => {
            setShowCreateForm(false);
            setPage(0);
            setReloadCount((count) => count + 1);
        },
        onUpdated: (updated) => {
            setSummaryReloadCount((count) => count + 1);
            if (matches(statusFilter, updated.status)) {
                pageQuery.setData((current) => ({
                    ...current,
                    items: current.items.map((item) => (item.request.id === updated.id ? { ...item, request: updated } : item)),
                }));
            } else if (rows.length === 1) {
                // Nothing left on this page: show the one before it, or load this one again for the rows that move up.
                if (page > 0) {
                    setPage(page - 1);
                } else {
                    setReloadCount((count) => count + 1);
                }
            } else {
                pageQuery.setData((current) => ({
                    ...current,
                    items: current.items.filter((item) => item.request.id !== updated.id),
                    totalItems: current.totalItems - 1,
                    totalPages: Math.ceil((current.totalItems - 1) / current.size),
                }));
            }
        },
    });
    const actionsDisabled = maintenanceActions.busyRequestId !== null || maintenanceActions.creating;

    // Any change to what's shown starts again at the first page.
    function chooseStatus(status: StatusFilter) {
        setStatusFilter(status);
        setPage(0);
    }

    function choosePriority(priority: PriorityFilter) {
        setPriorityFilter(priority);
        setPage(0);
    }

    function toggleSort(field: MaintenanceSortField) {
        setSort((current) => nextSort(current, field, sortColumns, null));
        setPage(0);
    }

    const directionOf = (field: MaintenanceSortField) => (sort?.key === field ? sort.direction : null);

    return (
        <main className="mx-auto w-full max-w-7xl space-y-6 p-5 md:p-8">
            <PageHeader
                eyebrow="RENTORA / OPERATIONS"
                title="Maintenance"
                description="Repair and upkeep requests across every property."
                actions={
                    <button
                        type="button"
                        onClick={() => {
                            maintenanceActions.clearActionError();
                            setShowCreateForm((current) => !current);
                        }}
                        disabled={propertyOptions.length === 0 || actionsDisabled}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#14302b] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#20453d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d4a94f] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <Plus className="h-4 w-4" />
                        {showCreateForm ? "Close form" : "New request"}
                    </button>
                }
            />

            {loadError && (
                <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                    {loadError}
                </div>
            )}

            {showCreateForm && (
                <CreateMaintenanceForm
                    properties={propertyOptions}
                    submitting={maintenanceActions.creating}
                    onSubmit={maintenanceActions.createRequest}
                    onCancel={() => setShowCreateForm(false)}
                />
            )}

            {maintenanceActions.actionError && (
                <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                    {maintenanceActions.actionError}
                </div>
            )}

            <section className="overflow-hidden rounded-xl border border-[#e0e7e2] bg-white">
                <div className="space-y-3 border-b border-[#edf1ee] p-4">
                    <FilterGroup
                        label="Status"
                        options={["ALL", ...MAINTENANCE_STATUSES] as StatusFilter[]}
                        optionLabel={(status) => (status === "ALL" ? "All" : maintenanceStatusLabel[status])}
                        counts={statusCounts}
                        selected={statusFilter}
                        onSelect={chooseStatus}
                    />
                    <FilterGroup
                        label="Priority"
                        options={["ALL", ...MAINTENANCE_PRIORITIES] as PriorityFilter[]}
                        optionLabel={(priority) => (priority === "ALL" ? "All" : maintenancePriorityLabel[priority])}
                        counts={priorityCounts}
                        selected={priorityFilter}
                        onSelect={choosePriority}
                    />
                </div>

                {pageQuery.loading ? (
                    <div className="p-10 text-center text-sm text-gray-500">Loading maintenance requests...</div>
                ) : totalRequests === 0 && !loadError ? (
                    <EmptyState
                        icon={Wrench}
                        title="No maintenance requests yet"
                        description="Requests are logged from a property's Maintenance tab."
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
                    !loadError && <div className="p-10 text-center text-sm text-gray-500">No requests match these filters.</div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1040px] text-left text-sm">
                                <thead className="bg-[#f8faf8] text-xs uppercase tracking-wide text-[#71847a]">
                                    <tr>
                                        <th className="px-5 py-3 font-semibold">Request</th>
                                        <th className="px-5 py-3 font-semibold">Location</th>
                                        <th className="px-5 py-3 font-semibold">Priority</th>
                                        <th className="px-5 py-3 font-semibold">Status</th>
                                        <SortableHeader
                                            label="Reported"
                                            direction={directionOf("REPORTED")}
                                            onToggle={() => toggleSort("REPORTED")}
                                            className="px-5 py-3 font-semibold"
                                        />
                                        <SortableHeader
                                            label="Resolved"
                                            direction={directionOf("RESOLVED")}
                                            onToggle={() => toggleSort("RESOLVED")}
                                            className="px-5 py-3 font-semibold"
                                        />
                                        <th className="px-5 py-3 font-semibold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#edf1ee]">
                                    {rows.map(({ request, propertyName, spaceName }) => (
                                        <tr key={request.id} className="transition hover:bg-[#fafcfb]">
                                            <td className="max-w-sm px-5 py-4">
                                                <p className="font-medium text-[#14302b]">{request.title}</p>
                                                {request.description && (
                                                    <p className="mt-1 truncate text-xs text-gray-500" title={request.description}>
                                                        {request.description}
                                                    </p>
                                                )}
                                                <p className="mt-1 text-xs text-gray-400">Request #{request.id}</p>
                                            </td>
                                            <td className="px-5 py-4">
                                                <Link
                                                    to={`/app/properties/${request.propertyId}`}
                                                    className="text-[#42574e] hover:text-[#14302b] hover:underline"
                                                >
                                                    {propertyName}
                                                </Link>
                                                <p className="mt-1 text-xs text-gray-500">{spaceName ?? "Whole property"}</p>
                                            </td>
                                            <td className="px-5 py-4">
                                                <MaintenancePriorityBadge priority={request.priority} />
                                            </td>
                                            <td className="px-5 py-4">
                                                <MaintenanceStatusBadge status={request.status} />
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-4 text-[#42574e]">
                                                {formatDate(request.reportedAt)}
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-4 text-[#42574e]">
                                                {request.status === "RESOLVED" ? formatDate(request.resolvedAt) : "—"}
                                            </td>
                                            <td className="px-5 py-4">
                                                <MaintenanceRowActions
                                                    request={request}
                                                    busyRequestId={maintenanceActions.busyRequestId}
                                                    disabled={actionsDisabled}
                                                    onAction={(action) => void maintenanceActions.runAction(request, action)}
                                                />
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
                                noun={{ one: "request", other: "requests" }}
                            />
                        )}
                    </>
                )}
            </section>
        </main>
    );
}
