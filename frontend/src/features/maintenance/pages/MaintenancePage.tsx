import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Plus, Wrench } from "lucide-react";
import { getAllMaintenanceRequests } from "../api/maintenanceApi";
import type { MaintenancePriority, MaintenanceResponse, MaintenanceStatus } from "../types";
import {
    isMaintenanceActive,
    MAINTENANCE_PRIORITIES,
    MAINTENANCE_STATUSES,
    maintenancePriorityLabel,
    maintenanceStatusLabel,
} from "../status";
import { MaintenancePriorityBadge, MaintenanceStatusBadge } from "../components/MaintenanceBadges";
import MaintenanceRowActions from "../components/MaintenanceRowActions";
import CreateMaintenanceForm, { type MaintenancePropertyOption } from "../components/CreateMaintenanceForm";
import { useMaintenanceActions } from "../useMaintenanceActions";
import { loadPropertyDirectory, type PropertyDirectory } from "../../properties/propertyDirectory";
import { useOrgQuery } from "../../../hooks/useOrgQuery";
import { useTableSort } from "../../../hooks/useTableSort";
import { formatDate } from "../../../lib/format";
import type { SortColumns } from "../../../lib/sort";
import PageHeader from "../../../components/ui/PageHeader";
import EmptyState from "../../../components/ui/EmptyState";
import FilterGroup from "../../../components/ui/FilterGroup";
import SortableHeader from "../../../components/ui/SortableHeader";

interface MaintenanceRow {
    request: MaintenanceResponse;
    propertyName: string;
    // null for a request about the whole property rather than one space.
    spaceName: string | null;
}

interface MaintenanceData {
    rows: MaintenanceRow[];
    // Kept so new or updated requests can be shown with names, and for the create form's property list.
    directory: PropertyDirectory;
}

type StatusFilter = MaintenanceStatus | "ALL";
type PriorityFilter = MaintenancePriority | "ALL";

const NO_ROWS: MaintenanceRow[] = [];

const priorityRank: Record<MaintenancePriority, number> = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

// What needs attention first: open and in-progress before closed, then by priority, then newest.
// The table's order until a column is clicked, and how ties are broken after.
function needsAttentionFirst(a: MaintenanceRow, b: MaintenanceRow): number {
    const activeDifference = Number(isMaintenanceActive(b.request.status)) - Number(isMaintenanceActive(a.request.status));
    if (activeDifference !== 0) return activeDifference;
    const priorityDifference = priorityRank[a.request.priority] - priorityRank[b.request.priority];
    if (priorityDifference !== 0) return priorityDifference;
    return b.request.reportedAt.localeCompare(a.request.reportedAt) || b.request.id - a.request.id;
}

type SortKey = "reported" | "resolved";

// Requests not yet resolved have no resolved date, so they go last when sorting by it.
const sortColumns: SortColumns<MaintenanceRow, SortKey> = {
    reported: { value: (row) => row.request.reportedAt, firstDirection: "desc" },
    resolved: { value: (row) => row.request.resolvedAt, firstDirection: "desc" },
};

function matchesStatus(row: MaintenanceRow, status: StatusFilter): boolean {
    return status === "ALL" || row.request.status === status;
}

function matchesPriority(row: MaintenanceRow, priority: PriorityFilter): boolean {
    return priority === "ALL" || row.request.priority === priority;
}

function toRow(request: MaintenanceResponse, { propertyById, spaceById }: PropertyDirectory): MaintenanceRow {
    return {
        request,
        propertyName: propertyById.get(request.propertyId)?.name ?? `Property #${request.propertyId}`,
        spaceName: request.spaceId === null ? null : (spaceById.get(request.spaceId)?.name ?? `Space #${request.spaceId}`),
    };
}

async function loadMaintenanceData(organizationId: number): Promise<MaintenanceData> {
    const [requests, directory] = await Promise.all([
        getAllMaintenanceRequests(organizationId),
        loadPropertyDirectory(organizationId),
    ]);

    return {
        rows: requests.map((request) => toRow(request, directory)),
        directory,
    };
}

export default function MaintenancePage() {
    const { organizationId, data, loading, error, setData } = useOrgQuery(loadMaintenanceData);
    const rows = data?.rows ?? NO_ROWS;
    const loadError = organizationId === undefined
        ? "Select an organization to view its maintenance requests."
        : error;
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
    const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("ALL");
    const [showCreateForm, setShowCreateForm] = useState(false);

    // Rows are sorted when the table is drawn, so a new request or a status change lands in the right place.
    const maintenanceActions = useMaintenanceActions({
        onCreated: (created) => {
            setData((current) => ({
                ...current,
                rows: [...current.rows, toRow(created, current.directory)],
            }));
            setShowCreateForm(false);
        },
        onUpdated: (updated) =>
            setData((current) => ({
                ...current,
                rows: current.rows.map((row) => (row.request.id === updated.id ? { ...row, request: updated } : row)),
            })),
    });
    const actionsDisabled = maintenanceActions.busyRequestId !== null || maintenanceActions.creating;

    // The create form asks for a property first, then one of that property's spaces.
    const propertyOptions = useMemo<MaintenancePropertyOption[]>(() => {
        if (!data) return [];
        const spaces = [...data.directory.spaceById.values()];
        return [...data.directory.propertyById.values()]
            .map((property) => ({
                id: property.id,
                name: property.name,
                spaces: spaces.filter((space) => space.propertyId === property.id),
            }))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [data]);

    // Each group's counts respect the other group's selection, so a count always matches what clicking it shows.
    const statusCounts = useMemo(() => {
        const withPriority = rows.filter((row) => matchesPriority(row, priorityFilter));
        return Object.fromEntries(
            (["ALL", ...MAINTENANCE_STATUSES] as StatusFilter[]).map((status) => [status, withPriority.filter((row) => matchesStatus(row, status)).length]),
        ) as Record<StatusFilter, number>;
    }, [rows, priorityFilter]);

    const priorityCounts = useMemo(() => {
        const withStatus = rows.filter((row) => matchesStatus(row, statusFilter));
        return Object.fromEntries(
            (["ALL", ...MAINTENANCE_PRIORITIES] as PriorityFilter[]).map((priority) => [priority, withStatus.filter((row) => matchesPriority(row, priority)).length]),
        ) as Record<PriorityFilter, number>;
    }, [rows, statusFilter]);

    const visibleRows = rows.filter((row) => matchesStatus(row, statusFilter) && matchesPriority(row, priorityFilter));
    const { sortedRows, directionOf, toggle } = useTableSort(visibleRows, {
        columns: sortColumns,
        initial: null,
        pageOrder: needsAttentionFirst,
    });

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
                        onSelect={setStatusFilter}
                    />
                    <FilterGroup
                        label="Priority"
                        options={["ALL", ...MAINTENANCE_PRIORITIES] as PriorityFilter[]}
                        optionLabel={(priority) => (priority === "ALL" ? "All" : maintenancePriorityLabel[priority])}
                        counts={priorityCounts}
                        selected={priorityFilter}
                        onSelect={setPriorityFilter}
                    />
                </div>

                {loading ? (
                    <div className="p-10 text-center text-sm text-gray-500">Loading maintenance requests...</div>
                ) : rows.length === 0 && !loadError ? (
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
                ) : visibleRows.length === 0 ? (
                    <div className="p-10 text-center text-sm text-gray-500">No requests match these filters.</div>
                ) : (
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
                                        direction={directionOf("reported")}
                                        onToggle={() => toggle("reported")}
                                        className="px-5 py-3 font-semibold"
                                    />
                                    <SortableHeader
                                        label="Resolved"
                                        direction={directionOf("resolved")}
                                        onToggle={() => toggle("resolved")}
                                        className="px-5 py-3 font-semibold"
                                    />
                                    <th className="px-5 py-3 font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#edf1ee]">
                                {sortedRows.map(({ request, propertyName, spaceName }) => (
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
                )}
            </section>
        </main>
    );
}
