import { useState } from "react";
import { Link } from "react-router";
import { Plus } from "lucide-react";

import { useConfirm } from "../../../../components/confirm/useConfirm";
import { useOrgQuery } from "../../../../hooks/useOrgQuery";
import { useTableSort } from "../../../../hooks/useTableSort";
import { todayLocalDateString } from "../../../../lib/dates";
import { formatDate, formatMoney } from "../../../../lib/format";
import type { SortColumns, SortState } from "../../../../lib/sort";
import { cancelLease, createLease, endLease, getLeases, renewLease } from "../../../leases/api/leasesApi";
import CreateLeaseForm from "../../../leases/components/CreateLeaseForm";
import { leaseActionConfirmation } from "../../../leases/leaseActionConfirmation";
import LeaseStatusBadge from "../../../leases/components/LeaseStatusBadge";
import RenewLeaseForm from "../../../leases/components/RenewLeaseForm";
import { getLeaseDisplayStatus } from "../../../leases/status";
import type { CreateLeaseRequest, LeaseResponse, RenewLeaseRequest } from "../../../leases/types";
import { useRolePermissions } from "../../../organizations/useRolePermissions";
import { getTenants } from "../../../tenants/api/tenantApi";
import { getTenantDisplayName, type TenantResponse } from "../../../tenants/types";
import type { SpaceResponse } from "../../types";
import TableHeader from "./TableHeader";

interface PropertyLeasesTabProps {
    propertyId: number;
    spaces: SpaceResponse[];
    // Reloads the page's spaces, whose statuses change with leases. Throws if that fails.
    onSpacesChanged: () => Promise<void>;
}

function newestFirst(a: LeaseResponse, b: LeaseResponse): number {
    return b.startDate.localeCompare(a.startDate) || b.id - a.id;
}

type SortKey = "period" | "rent" | "deposit";

const sortColumns: SortColumns<LeaseResponse, SortKey> = {
    period: { value: (lease) => lease.startDate, firstDirection: "desc" },
    rent: { value: (lease) => lease.monthlyRentCents, firstDirection: "desc" },
    deposit: { value: (lease) => lease.securityDepositCents, firstDirection: "desc" },
};

const initialSort: SortState<SortKey> = { key: "period", direction: "desc" };

// One property's leases: create, renew, end and cancel. The tab loads the leases, and the tenants
// the create form offers, when it opens.
export default function PropertyLeasesTab({ propertyId, spaces, onSpacesChanged }: PropertyLeasesTabProps) {
    // Ending and cancelling are for managers and owners (docs/ROLES.md).
    const { canManage } = useRolePermissions();
    const confirm = useConfirm();

    const leasesQuery = useOrgQuery(
        (organizationId) => getLeases(organizationId, { propertyId }),
        [propertyId],
    );
    const tenantsQuery = useOrgQuery(getTenants);
    const organizationId = leasesQuery.organizationId;
    const setLeases = leasesQuery.setData;

    const [showCreateLease, setShowCreateLease] = useState(false);
    const [creatingLease, setCreatingLease] = useState(false);

    const [renewingLeaseId, setRenewingLeaseId] =
        useState<number | null>(null);

    const [renewingLeaseSubmitting, setRenewingLeaseSubmitting] =
        useState(false);

    const [leaseActionBusyId, setLeaseActionBusyId] =
        useState<number | null>(null);

    const [leaseActionError, setLeaseActionError] =
        useState<string | null>(null);

    const leases = leasesQuery.data ?? [];
    const { sortedRows: sortedLeases, directionOf, toggle } = useTableSort(leases, {
        columns: sortColumns,
        initial: initialSort,
        pageOrder: newestFirst,
    });
    const spacesById = new Map(spaces.map((space) => [space.id, space]));
    const tenantsById = new Map((tenantsQuery.data ?? []).map((tenant) => [tenant.id, tenant]));
    // A lease that hasn't started yet shows as Upcoming, as on the other lease pages.
    const today = todayLocalDateString();
    const renewingLease =
        leases.find((lease) => lease.id === renewingLeaseId) ?? null;

    async function refreshSpaces(): Promise<void> {
        try {
            await onSpacesChanged();
        } catch {
            setLeaseActionError(
                "The lease action succeeded, but space statuses could not be refreshed. Reload the page to see the latest statuses.",
            );
        }
    }

    function replaceLease(updatedLease: LeaseResponse) {
        setLeases((currentLeases) =>
            currentLeases.map((item) =>
                item.id === updatedLease.id ? updatedLease : item,
            ),
        );
    }

    async function handleCreateLease(
        request: CreateLeaseRequest,
    ): Promise<void> {
        if (organizationId === undefined) {
            throw new Error("An active organization is required.");
        }

        setCreatingLease(true);
        setLeaseActionError(null);

        try {
            const createdLease = await createLease(organizationId, request);
            setLeases((currentLeases) => [createdLease, ...currentLeases]);
            setShowCreateLease(false);
            await refreshSpaces();
        } finally {
            setCreatingLease(false);
        }
    }

    async function handleEndLease(
        lease: LeaseResponse,
    ): Promise<void> {
        const confirmed = await confirm(leaseActionConfirmation(lease.id, "end"));

        if (!confirmed || organizationId === undefined) {
            return;
        }

        setLeaseActionBusyId(lease.id);
        setLeaseActionError(null);

        try {
            replaceLease(await endLease(organizationId, lease.id));
            await refreshSpaces();
        } catch (requestError) {
            setLeaseActionError(
                requestError instanceof Error
                    ? requestError.message
                    : "Failed to end lease.",
            );
        } finally {
            setLeaseActionBusyId(null);
        }
    }

    async function handleCancelLease(
        lease: LeaseResponse,
    ): Promise<void> {
        const confirmed = await confirm(leaseActionConfirmation(lease.id, "cancel"));

        if (!confirmed || organizationId === undefined) {
            return;
        }

        setLeaseActionBusyId(lease.id);
        setLeaseActionError(null);

        try {
            replaceLease(await cancelLease(organizationId, lease.id));
            await refreshSpaces();
        } catch (requestError) {
            setLeaseActionError(
                requestError instanceof Error
                    ? requestError.message
                    : "Failed to cancel lease.",
            );
        } finally {
            setLeaseActionBusyId(null);
        }
    }

    async function handleRenewLease(
        request: RenewLeaseRequest,
    ): Promise<void> {
        if (organizationId === undefined || renewingLeaseId === null) {
            throw new Error(
                "Select an active lease to renew.",
            );
        }

        setRenewingLeaseSubmitting(true);
        setLeaseActionError(null);

        try {
            const renewedLease = await renewLease(organizationId, renewingLeaseId, request);
            setLeases((currentLeases) => [renewedLease, ...currentLeases]);
            setRenewingLeaseId(null);
            await refreshSpaces();
        } finally {
            setRenewingLeaseSubmitting(false);
        }
    }

    return (
        <div className="space-y-5">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                    <h2 className="text-lg font-semibold text-[#14302b]">
                        Leases
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Lease agreements associated with this property's spaces.
                    </p>
                </div>

                {!showCreateLease && renewingLeaseId === null && (
                    <button
                        type="button"
                        disabled={
                            tenantsQuery.loading ||
                            Boolean(tenantsQuery.error) ||
                            creatingLease ||
                            leaseActionBusyId !== null
                        }
                        onClick={() => {
                            setLeaseActionError(null);
                            setShowCreateLease(true);
                        }}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#14302b] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#20453d] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <Plus className="h-4 w-4" />
                        {tenantsQuery.loading ? "Loading tenants..." : "Create lease"}
                    </button>
                )}
            </div>

            {tenantsQuery.error && (
                <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    Unable to load tenants: {tenantsQuery.error}
                </div>
            )}

            {leaseActionError && (
                <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {leaseActionError}
                </div>
            )}

            {showCreateLease && (
                <CreateLeaseForm
                    tenants={tenantsQuery.data ?? []}
                    spaces={spaces}
                    submitting={creatingLease}
                    onSubmit={handleCreateLease}
                    onCancel={() => setShowCreateLease(false)}
                />
            )}

            {renewingLease && (
                <RenewLeaseForm
                    key={renewingLease.id}
                    lease={renewingLease}
                    submitting={renewingLeaseSubmitting}
                    onSubmit={handleRenewLease}
                    onCancel={() => setRenewingLeaseId(null)}
                />
            )}

            {leasesQuery.error && (
                <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    Unable to load leases: {leasesQuery.error}
                </div>
            )}

            {leasesQuery.loading ? (
                <p className="py-8 text-center text-sm text-gray-500">
                    Loading leases...
                </p>
            ) : leasesQuery.error ? null : leases.length === 0 ? (
                <div className="rounded-lg border border-dashed border-[#d5dfd8] px-6 py-12 text-center">
                    <h3 className="font-semibold text-[#14302b]">
                        No leases yet
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                        No leases have been recorded for this property's spaces.
                    </p>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-lg border border-[#e1e8e3]">
                    <table className="w-full min-w-287.5 text-left">
                        <thead className="bg-[#f8faf8]">
                            <tr>
                                <TableHeader>Space</TableHeader>
                                <TableHeader>Tenant</TableHeader>
                                <TableHeader sort={{ direction: directionOf("period"), onToggle: () => toggle("period") }}>Lease period</TableHeader>
                                <TableHeader sort={{ direction: directionOf("rent"), onToggle: () => toggle("rent") }}>Monthly rent</TableHeader>
                                <TableHeader sort={{ direction: directionOf("deposit"), onToggle: () => toggle("deposit") }}>Deposit</TableHeader>
                                <TableHeader>Status</TableHeader>
                                <TableHeader>Actions</TableHeader>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#edf0ee]">
                            {sortedLeases.map((lease) => (
                                <tr key={lease.id} className="hover:bg-[#f8faf8]">
                                    <td className="px-4 py-4">
                                        <p className="text-sm font-medium text-[#14302b]">
                                            {spacesById.get(lease.spaceId)?.name ?? `Space #${lease.spaceId}`}
                                        </p>
                                        <p className="mt-1 text-xs text-gray-500">
                                            Lease #{lease.id}
                                        </p>
                                    </td>
                                    <td className="px-4 py-4 text-sm">
                                        <TenantName tenant={tenantsById.get(lease.tenantId)} tenantId={lease.tenantId} />
                                    </td>
                                    <td className="px-4 py-4 text-sm text-gray-600">
                                        <div>{formatDate(lease.startDate)}</div>
                                        <div className="mt-1 text-gray-400">
                                            to {formatDate(lease.endDate)}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-sm font-medium text-[#243b35]">
                                        {formatMoney(lease.monthlyRentCents)}
                                    </td>
                                    <td className="px-4 py-4 text-sm text-gray-600">
                                        {formatMoney(lease.securityDepositCents)}
                                    </td>
                                    <td className="px-4 py-4">
                                        <LeaseStatusBadge status={getLeaseDisplayStatus(lease, today)} />
                                    </td>
                                    <td className="px-4 py-4">
                                        {lease.status === "ACTIVE" ? (
                                            <div className="flex flex-wrap gap-2">
                                                <button
                                                    type="button"
                                                    disabled={
                                                        leaseActionBusyId !== null ||
                                                        renewingLeaseSubmitting ||
                                                        creatingLease
                                                    }
                                                    onClick={() => {
                                                        setLeaseActionError(null);
                                                        setShowCreateLease(false);
                                                        setRenewingLeaseId(lease.id);
                                                    }}
                                                    className="rounded-lg border border-[#d5dfd8] bg-white px-3 py-2 text-xs font-medium text-[#14302b] hover:bg-[#f8faf8] disabled:opacity-50"
                                                >
                                                    Renew
                                                </button>

                                                {canManage && (
                                                    <>
                                                        <button
                                                            type="button"
                                                            disabled={
                                                                leaseActionBusyId !== null ||
                                                                renewingLeaseSubmitting ||
                                                                creatingLease
                                                            }
                                                            onClick={() => void handleEndLease(lease)}
                                                            className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 hover:bg-amber-100 disabled:opacity-50"
                                                        >
                                                            {leaseActionBusyId === lease.id ? "Saving..." : "End"}
                                                        </button>

                                                        <button
                                                            type="button"
                                                            disabled={
                                                                leaseActionBusyId !== null ||
                                                                renewingLeaseSubmitting ||
                                                                creatingLease
                                                            }
                                                            onClick={() => void handleCancelLease(lease)}
                                                            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                                                        >
                                                            {leaseActionBusyId === lease.id ? "Saving..." : "Cancel"}
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-sm text-gray-400">
                                                —
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// The tenant's name, linked to their page. Until the tenants have loaded, or if one is missing, the ID stands in.
function TenantName({ tenant, tenantId }: { tenant: TenantResponse | undefined; tenantId: number }) {
    if (!tenant) {
        return <span className="text-gray-600">Tenant #{tenantId}</span>;
    }

    return (
        <Link
            to={`/app/tenants/${tenant.id}`}
            className="font-medium text-[#14302b] hover:underline"
        >
            {getTenantDisplayName(tenant)}
        </Link>
    );
}
