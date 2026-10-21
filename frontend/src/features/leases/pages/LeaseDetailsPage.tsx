import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
    ArrowLeft,
    ArrowRight,
    Building2,
    CalendarDays,
    CheckCircle2,
    Clock3,
    FileText,
    UserRound,
    Wallet,
    Wrench,
} from "lucide-react";

import { useOrganization } from "../../organizations/useOrganization";
import { getLease, endLease, cancelLease, renewLease } from "../api/leasesApi";
import LeaseStatusBadge from "../components/LeaseStatusBadge";
import RenewLeaseForm from "../components/RenewLeaseForm";
import { getLeaseDisplayStatus } from "../status";
import type { LeaseResponse, RenewLeaseRequest } from "../types";
import { getTenant } from "../../tenants/api/tenantApi";
import { getTenantDisplayName, type TenantResponse } from "../../tenants/types";
import { getProperty, getSpace } from "../../properties/api/propertyApi";
import type { PropertyResponse, SpaceResponse } from "../../properties/types";
import { spaceTypeLabels } from "../../properties/spaceLabels";
import { todayLocalDateString } from "../../../lib/dates";
import { formatDateTime, formatLongDate, formatMoney } from "../../../lib/format";
import { useRolePermissions } from "../../organizations/useRolePermissions";
import { useConfirm } from "../../../components/confirm/useConfirm";
import { leaseActionConfirmation } from "../leaseActionConfirmation";

type LeaseAction = "end" | "cancel" | null;

// A lease names only its space, and the space names its property.
async function getSpaceWithProperty(organizationId: number, spaceId: number) {
    const space = await getSpace(organizationId, spaceId);
    const property = await getProperty(organizationId, space.propertyId);
    return { space, property };
}

function DetailField({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <div className="border-b border-[#edf1ee] px-5 py-4 last:border-b-0">
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">
                {label}
            </dt>
            <dd className="mt-1 wrap-break-words text-sm font-medium text-[#243b35]">
                {value || "—"}
            </dd>
        </div>
    );
}

function getErrorMessage(error: unknown, fallback: string): string {
    return error instanceof Error ? error.message : fallback;
}

export default function LeaseDetailsPage() {
    const { activeOrganization } = useOrganization();
    // Ending and cancelling are for managers and owners (docs/ROLES.md).
    const { canManage } = useRolePermissions();
    const confirm = useConfirm();
    const organizationId = activeOrganization?.id ?? 0;

    const { leaseId: leaseIdParam } = useParams();
    const navigate = useNavigate();
    const leaseId = Number(leaseIdParam);

    const [lease, setLease] = useState<LeaseResponse | null>(null);
    const [tenant, setTenant] = useState<TenantResponse | null>(null);
    const [property, setProperty] = useState<PropertyResponse | null>(null);
    const [space, setSpace] = useState<SpaceResponse | null>(null);

    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [relatedDataError, setRelatedDataError] = useState<string | null>(
        null,
    );

    const [leaseActionBusy, setLeaseActionBusy] =
        useState<LeaseAction>(null);
    const [leaseActionError, setLeaseActionError] = useState<string | null>(
        null,
    );
    const [leaseActionMessage, setLeaseActionMessage] = useState<
        string | null
    >(null);

    const [showRenewForm, setShowRenewForm] = useState(false);
    const [renewSubmitting, setRenewSubmitting] = useState(false);

    useEffect(() => {
        let cancelled = false;

        async function loadDetails() {
            setLoading(true);
            setLoadError(null);
            setRelatedDataError(null);
            setLease(null);
            setTenant(null);
            setProperty(null);
            setSpace(null);

            try {
                if (!Number.isFinite(leaseId) || leaseId <= 0) {
                    throw new Error("The lease ID in this URL is invalid.");
                }

                if (
                    !Number.isFinite(organizationId) ||
                    organizationId <= 0
                ) {
                    throw new Error(
                        "Select an organization to view this lease.",
                    );
                }

                // A lease that doesn't exist or belongs to another organization comes back as an error.
                const selectedLease = await getLease(organizationId, leaseId);

                if (cancelled) return;

                setLease(selectedLease);

                // The tenant and the space with its property load together.
                const [tenantResult, spaceResult] = await Promise.allSettled([
                    getTenant(organizationId, selectedLease.tenantId),
                    getSpaceWithProperty(organizationId, selectedLease.spaceId),
                ]);

                if (cancelled) return;

                // Without its tenant the page still works and shows the tenant's ID instead.
                if (tenantResult.status === "fulfilled") {
                    setTenant(tenantResult.value);
                }

                if (spaceResult.status === "fulfilled") {
                    setSpace(spaceResult.value.space);
                    setProperty(spaceResult.value.property);
                } else {
                    setRelatedDataError(
                        `The lease loaded, but its space and property could not be loaded (${getErrorMessage(spaceResult.reason, "unknown error")}). The space ID is still shown below.`,
                    );
                }
            } catch (error) {
                if (!cancelled) {
                    setLoadError(
                        getErrorMessage(
                            error,
                            "Unable to load lease details.",
                        ),
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        void loadDetails();

        return () => {
            cancelled = true;
        };
    }, [leaseId, organizationId]);

    function openRenewForm() {
        setLeaseActionError(null);
        setLeaseActionMessage(null);
        setShowRenewForm(true);
    }

    // A failed renewal throws back to RenewLeaseForm, which shows the error.
    async function handleRenew(request: RenewLeaseRequest) {
        if (!lease) return;

        setRenewSubmitting(true);

        try {
            const newLease = await renewLease(organizationId, lease.id, request);

            // The page stays mounted for the new lease, so the form is closed here.
            setShowRenewForm(false);
            navigate(`/app/leases/${newLease.id}`, { replace: true });
        } finally {
            setRenewSubmitting(false);
        }
    }

    async function handleLeaseAction(
        action: Exclude<LeaseAction, null>,
    ) {
        if (!lease || organizationId <= 0) return;

        const confirmed = await confirm(leaseActionConfirmation(lease.id, action));

        if (!confirmed) return;

        setLeaseActionBusy(action);
        setLeaseActionError(null);
        setLeaseActionMessage(null);
        setShowRenewForm(false);

        try {
            const updated =
                action === "end"
                    ? await endLease(organizationId, lease.id)
                    : await cancelLease(organizationId, lease.id);

            setLease(updated);

            setLeaseActionMessage(
                `Lease #${updated.id} was ${
                    action === "end" ? "ended" : "cancelled"
                } successfully.`,
            );
        } catch (error) {
            setLeaseActionError(
                getErrorMessage(
                    error,
                    `Failed to ${action} this lease.`,
                ),
            );
        } finally {
            setLeaseActionBusy(null);
        }
    }

    if (loading) {
        return (
            <main className="mx-auto w-full max-w-6xl p-5 md:p-8">
                <p className="text-sm text-gray-500">
                    Loading lease details...
                </p>
            </main>
        );
    }

    if (loadError || !lease) {
        return (
            <main className="mx-auto w-full max-w-6xl space-y-4 p-5 md:p-8">
                <Link
                    to="/app/leases"
                    className="inline-flex items-center gap-2 text-sm font-medium text-[#426b5c] hover:text-[#14302b]"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to leases
                </Link>

                <div
                    role="alert"
                    className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
                >
                    {loadError ?? "Lease not found."}
                </div>
            </main>
        );
    }

    const today = todayLocalDateString();
    const displayStatus = getLeaseDisplayStatus(lease, today);
    const rentHasStarted = lease.startDate <= today;

    return (
        <main className="mx-auto w-full max-w-6xl space-y-6 p-5 md:p-8">
            <Link
                to="/app/leases"
                className="inline-flex items-center gap-2 text-sm font-medium text-[#426b5c] hover:text-[#14302b]"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to leases
            </Link>

            <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                <div>
                    <p className="text-sm font-medium uppercase tracking-wide text-[#7b8e84]">
                        Lease record #{lease.id}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#edf3ef] text-[#426b5c]">
                            <FileText className="h-6 w-6" />
                        </div>

                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight text-[#14302b] sm:text-3xl">
                                Lease Details
                            </h1>

                            <p className="mt-1 text-sm text-gray-500">
                                {tenant
                                    ? getTenantDisplayName(tenant)
                                    : `Tenant #${lease.tenantId}`}

                                <span className="mx-2 text-gray-300">
                                    ·
                                </span>

                                {space?.name ?? `Space #${lease.spaceId}`}
                            </p>
                        </div>

                        <LeaseStatusBadge status={displayStatus} />
                    </div>
                </div>

                {lease.status === "ACTIVE" && (
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={openRenewForm}
                            disabled={
                                leaseActionBusy !== null || renewSubmitting
                            }
                            className="inline-flex items-center gap-2 rounded-lg border border-[#d5dfd8] bg-white px-4 py-2.5 text-sm font-medium text-[#243b35] hover:bg-[#f8faf8] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <CalendarDays className="h-4 w-4" />
                            Renew lease
                        </button>

                        {canManage && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => void handleLeaseAction("end")}
                                    disabled={
                                        leaseActionBusy !== null || renewSubmitting
                                    }
                                    className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-800 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {leaseActionBusy === "end"
                                        ? "Ending..."
                                        : "End lease"}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => void handleLeaseAction("cancel")}
                                    disabled={
                                        leaseActionBusy !== null || renewSubmitting
                                    }
                                    className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {leaseActionBusy === "cancel"
                                        ? "Cancelling..."
                                        : "Cancel lease"}
                                </button>
                            </>
                        )}
                    </div>
                )}
            </header>

            {leaseActionError && (
                <div
                    role="alert"
                    className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
                >
                    {leaseActionError}
                </div>
            )}

            {leaseActionMessage && (
                <div
                    role="status"
                    className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
                >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    {leaseActionMessage}
                </div>
            )}

            {relatedDataError && (
                <div
                    role="status"
                    className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
                >
                    {relatedDataError}
                </div>
            )}

            {showRenewForm && (
                <RenewLeaseForm
                    key={lease.id}
                    lease={lease}
                    submitting={renewSubmitting}
                    onSubmit={handleRenew}
                    onCancel={() => setShowRenewForm(false)}
                />
            )}

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <article className="rounded-xl border border-[#e0e7e2] bg-white p-5">
                    <div className="flex items-center justify-between gap-3">
                        <p className="text-sm text-gray-500">Monthly rent</p>
                        <Wallet className="h-5 w-5 text-[#769286]" />
                    </div>

                    <p className="mt-3 text-2xl font-semibold tracking-tight text-[#14302b]">
                        {formatMoney(lease.monthlyRentCents)}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                        Agreed recurring rent
                    </p>
                </article>

                <article className="rounded-xl border border-[#e0e7e2] bg-white p-5">
                    <div className="flex items-center justify-between gap-3">
                        <p className="text-sm text-gray-500">
                            Security deposit
                        </p>
                        <CheckCircle2 className="h-5 w-5 text-[#769286]" />
                    </div>

                    <p className="mt-3 text-2xl font-semibold tracking-tight text-[#14302b]">
                        {formatMoney(lease.securityDepositCents)}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                        Deposit specified in lease
                    </p>
                </article>

                <article className="rounded-xl border border-[#e0e7e2] bg-white p-5">
                    <div className="flex items-center justify-between gap-3">
                        <p className="text-sm text-gray-500">Lease start</p>
                        <CalendarDays className="h-5 w-5 text-[#769286]" />
                    </div>

                    <p className="mt-3 text-lg font-semibold text-[#14302b]">
                        {formatLongDate(lease.startDate)}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                        {rentHasStarted
                            ? "Term has started"
                            : "Term has not started yet"}
                    </p>
                </article>

                <article className="rounded-xl border border-[#e0e7e2] bg-white p-5">
                    <div className="flex items-center justify-between gap-3">
                        <p className="text-sm text-gray-500">Lease end</p>
                        <Clock3 className="h-5 w-5 text-[#769286]" />
                    </div>

                    <p className="mt-3 text-lg font-semibold text-[#14302b]">
                        {formatLongDate(lease.endDate)}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                        End date recorded on the lease
                    </p>
                </article>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
                <article className="overflow-hidden rounded-xl border border-[#e0e7e2] bg-white">
                    <div className="flex items-center gap-3 border-b border-[#edf1ee] px-5 py-4">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#edf3ef] text-[#426b5c]">
                            {tenant?.type === "COMPANY" ? (
                                <Building2 className="h-5 w-5" />
                            ) : (
                                <UserRound className="h-5 w-5" />
                            )}
                        </div>

                        <div>
                            <h2 className="font-semibold text-[#14302b]">
                                Tenant
                            </h2>
                            <p className="text-sm text-gray-500">
                                The party named on this lease
                            </p>
                        </div>
                    </div>

                    <dl>
                        <DetailField
                            label="Tenant name"
                            value={
                                tenant
                                    ? getTenantDisplayName(tenant)
                                    : `Tenant #${lease.tenantId}`
                            }
                        />

                        <DetailField
                            label="Tenant type"
                            value={
                                tenant
                                    ? tenant.type === "COMPANY"
                                        ? "Company"
                                        : "Individual"
                                    : "Not available"
                            }
                        />

                        <DetailField
                            label="Email"
                            value={tenant?.email || "Not provided"}
                        />

                        <DetailField
                            label="Phone"
                            value={tenant?.phone || "Not provided"}
                        />
                    </dl>

                    <div className="border-t border-[#edf1ee] px-5 py-4">
                        <Link
                            to={`/app/tenants/${lease.tenantId}`}
                            className="inline-flex items-center gap-2 text-sm font-semibold text-[#426b5c] hover:text-[#14302b]"
                        >
                            View tenant details
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                </article>

                <article className="overflow-hidden rounded-xl border border-[#e0e7e2] bg-white">
                    <div className="flex items-center gap-3 border-b border-[#edf1ee] px-5 py-4">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#edf3ef] text-[#426b5c]">
                            <Building2 className="h-5 w-5" />
                        </div>

                        <div>
                            <h2 className="font-semibold text-[#14302b]">
                                Property and space
                            </h2>
                            <p className="text-sm text-gray-500">
                                The rentable space covered by this lease
                            </p>
                        </div>
                    </div>

                    <dl>
                        <DetailField
                            label="Property"
                            value={property?.name ?? "Property not resolved"}
                        />

                        <DetailField
                            label="Address"
                            value={
                                property
                                    ? [
                                          property.addressLine,
                                          property.city,
                                          property.postalCode,
                                          property.country,
                                      ]
                                          .filter(Boolean)
                                          .join(", ")
                                    : "—"
                            }
                        />

                        <DetailField
                            label="Space"
                            value={space?.name ?? `Space #${lease.spaceId}`}
                        />

                        <DetailField
                            label="Space type"
                            value={space ? spaceTypeLabels[space.type] : "—"}
                        />

                        {space?.floor !== null &&
                            space?.floor !== undefined && (
                                <DetailField
                                    label="Floor"
                                    value={String(space.floor)}
                                />
                            )}

                        {space?.area !== null &&
                            space?.area !== undefined && (
                                <DetailField
                                    label="Area"
                                    value={`${space.area} m²`}
                                />
                            )}
                    </dl>

                    {property ? (
                        <div className="border-t border-[#edf1ee] px-5 py-4">
                            <Link
                                to={`/app/properties/${property.id}`}
                                className="inline-flex items-center gap-2 text-sm font-semibold text-[#426b5c] hover:text-[#14302b]"
                            >
                                View property
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    ) : (
                        <div className="border-t border-[#edf1ee] px-5 py-4 text-xs text-gray-500">
                            Space ID: {lease.spaceId}
                        </div>
                    )}
                </article>
            </section>

            <section className="overflow-hidden rounded-xl border border-[#e0e7e2] bg-white">
                <div className="border-b border-[#edf1ee] px-5 py-4">
                    <h2 className="font-semibold text-[#14302b]">
                        Lease record
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Record identifiers and audit timestamps.
                    </p>
                </div>

                <dl className="grid gap-x-8 sm:grid-cols-2">
                    <DetailField
                        label="Lease ID"
                        value={String(lease.id)}
                    />

                    <DetailField
                        label="Organization ID"
                        value={String(lease.organizationId)}
                    />

                    <DetailField
                        label="Created"
                        value={formatDateTime(lease.createdAt)}
                    />

                    <DetailField
                        label="Last updated"
                        value={formatDateTime(lease.updatedAt)}
                    />
                </dl>
            </section>

            {lease.status !== "ACTIVE" && (
                <div className="flex items-start gap-3 rounded-xl border border-[#e0e7e2] bg-[#f8faf8] p-4 text-sm text-[#42574e]">
                    <Wrench className="mt-0.5 h-4 w-4 shrink-0" />

                    <p>
                        This lease is {lease.status.toLowerCase()}. Renew,
                        End, and Cancel actions are available only while its
                        status is Active.
                    </p>
                </div>
            )}
        </main>
    );
}