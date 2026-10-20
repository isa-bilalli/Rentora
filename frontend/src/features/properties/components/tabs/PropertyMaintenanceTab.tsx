import { useState } from "react";
import { Plus } from "lucide-react";

import { useOrgQuery } from "../../../../hooks/useOrgQuery";
import { formatDate } from "../../../../lib/format";
import { getMaintenanceByProperty } from "../../../maintenance/api/maintenanceApi";
import CreateMaintenanceForm from "../../../maintenance/components/CreateMaintenanceForm";
import { MaintenancePriorityBadge, MaintenanceStatusBadge } from "../../../maintenance/components/MaintenanceBadges";
import MaintenanceRowActions from "../../../maintenance/components/MaintenanceRowActions";
import { useMaintenanceActions, type MaintenanceAction } from "../../../maintenance/useMaintenanceActions";
import type { MaintenanceResponse } from "../../../maintenance/types";
import type { SpaceResponse } from "../../types";
import TableHeader from "./TableHeader";

interface PropertyMaintenanceTabProps {
    propertyId: number;
    spaces: SpaceResponse[];
    // Reloads the page's spaces, whose statuses can change with maintenance. Throws if that fails.
    onSpacesChanged: () => Promise<void>;
}

// One property's maintenance requests. The tab loads them itself when it opens.
export default function PropertyMaintenanceTab({ propertyId, spaces, onSpacesChanged }: PropertyMaintenanceTabProps) {
    const { data, loading, error, setData } = useOrgQuery(
        (organizationId) => getMaintenanceByProperty(organizationId, propertyId),
        [propertyId],
    );
    const [showCreate, setShowCreate] = useState(false);
    const [refreshError, setRefreshError] = useState<string | null>(null);

    async function refreshSpaces(): Promise<void> {
        try {
            await onSpacesChanged();
        } catch {
            setRefreshError(
                "The maintenance action succeeded, but space statuses could not be refreshed. Reload the page to see the latest statuses.",
            );
        }
    }

    const actions = useMaintenanceActions({
        onCreated: (createdRequest) => {
            setData((current) => [createdRequest, ...current]);
            setShowCreate(false);
            void refreshSpaces();
        },
        onUpdated: (updatedRequest) => {
            setData((current) => current.map((item) => (item.id === updatedRequest.id ? updatedRequest : item)));
            void refreshSpaces();
        },
    });

    function runAction(request: MaintenanceResponse, action: MaintenanceAction) {
        setRefreshError(null);
        void actions.runAction(request, action);
    }

    const busy = actions.creating || actions.busyRequestId !== null;
    const actionError = actions.actionError ?? refreshError;
    const spacesById = new Map(spaces.map((space) => [space.id, space]));
    const requests = [...(data ?? [])].sort((a, b) => b.reportedAt.localeCompare(a.reportedAt));

    return (
        <div className="space-y-5">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                    <h2 className="text-lg font-semibold text-[#14302b]">
                        Maintenance
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Track issues and repairs for this property's spaces.
                    </p>
                </div>

                {!showCreate && (
                    <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                            actions.clearActionError();
                            setRefreshError(null);
                            setShowCreate(true);
                        }}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#14302b] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#20453d] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <Plus className="h-4 w-4" />
                        New request
                    </button>
                )}
            </div>

            {error && (
                <div
                    role="alert"
                    className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                    Unable to load maintenance requests: {error}
                </div>
            )}

            {actionError && (
                <div
                    role="alert"
                    className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                    {actionError}
                </div>
            )}

            {showCreate && (
                <CreateMaintenanceForm
                    propertyId={propertyId}
                    spaces={spaces}
                    submitting={actions.creating}
                    onSubmit={actions.createRequest}
                    onCancel={() => setShowCreate(false)}
                />
            )}

            {loading ? (
                <div
                    role="status"
                    className="rounded-xl border border-[#e1e8e3] bg-white p-8 text-sm text-gray-500"
                >
                    Loading maintenance requests...
                </div>
            ) : error ? null : requests.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#d5dfd8] bg-white px-6 py-12 text-center">
                    <h3 className="font-semibold text-[#14302b]">
                        No maintenance requests
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Requests for repairs and maintenance on this property's spaces will appear here.
                    </p>
                    {!showCreate && spaces.length > 0 && (
                        <button
                            type="button"
                            onClick={() => setShowCreate(true)}
                            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#14302b] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#20453d]"
                        >
                            <Plus className="h-4 w-4" />
                            Create first request
                        </button>
                    )}
                </div>
            ) : (
                <div className="overflow-x-auto rounded-lg border border-[#e1e8e3]">
                    <table className="w-full min-w-262.5 text-left">
                        <thead className="bg-[#f8faf8]">
                            <tr>
                                <TableHeader>Space</TableHeader>
                                <TableHeader>Request</TableHeader>
                                <TableHeader>Priority</TableHeader>
                                <TableHeader>Status</TableHeader>
                                <TableHeader>Reported</TableHeader>
                                <TableHeader>Resolved</TableHeader>
                                <TableHeader>Actions</TableHeader>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#edf0ee]">
                            {requests.map((request) => {
                                const space = request.spaceId === null ? undefined : spacesById.get(request.spaceId);

                                return (
                                    <tr key={request.id} className="hover:bg-[#f8faf8]">
                                        <td className="px-4 py-4 text-sm font-medium text-[#14302b]">
                                            {request.spaceId === null ? "Whole property" : (space?.name ?? `Space #${request.spaceId}`)}
                                        </td>
                                        <td className="max-w-85 px-4 py-4">
                                            <p className="text-sm font-medium text-[#243b35]">
                                                {request.title}
                                            </p>
                                            {request.description && (
                                                <p className="mt-1 whitespace-pre-wrap text-sm text-gray-500">
                                                    {request.description}
                                                </p>
                                            )}
                                            <p className="mt-1 text-xs text-gray-400">
                                                Request #{request.id}
                                            </p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <MaintenancePriorityBadge priority={request.priority} />
                                        </td>
                                        <td className="px-4 py-4">
                                            <MaintenanceStatusBadge status={request.status} />
                                        </td>
                                        <td className="px-4 py-4 text-sm text-gray-600">
                                            {formatDate(request.reportedAt)}
                                        </td>
                                        <td className="px-4 py-4 text-sm text-gray-600">
                                            {request.resolvedAt ? formatDate(request.resolvedAt) : "—"}
                                        </td>
                                        <td className="px-4 py-4">
                                            <MaintenanceRowActions
                                                request={request}
                                                busyRequestId={actions.busyRequestId}
                                                disabled={busy}
                                                onAction={(action) => runAction(request, action)}
                                            />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
