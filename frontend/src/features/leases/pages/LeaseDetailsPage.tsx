import { useEffect, useState, type FormEvent } from "react";
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

import { useOrganization } from "../../organizations/OrganizationProvider";
import { getLeases, endLease, cancelLease, renewLease } from "../api/leasesApi";
import type { LeaseResponse, RenewLeaseRequest } from "../types";
import { getTenants } from "../../tenants/api/tenantApi";
import { getTenantDisplayName, type TenantResponse } from "../../tenants/types";
import { getPropertySummaries, getSpaces } from "../../properties/api/propertyApi";

type PropertySummary = Awaited<ReturnType<typeof getPropertySummaries>>[number];
type SpaceResponse = Awaited<ReturnType<typeof getSpaces>>[number];
type LeaseAction = "end" | "cancel" | null;

function toLocalDateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function addDays(value: string, days: number): string {
    const date = new Date(`${value}T12:00:00`);
    date.setDate(date.getDate() + days);
    return toLocalDateString(date);
}

function addOneYear(value: string): string {
    const date = new Date(`${value}T12:00:00`);
    date.setFullYear(date.getFullYear() + 1);
    return toLocalDateString(date);
}

function formatDate(value: string | null | undefined): string {
    if (!value) return "—";

    const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
        ? new Date(`${value}T12:00:00`)
        : new Date(value);

    if (Number.isNaN(date.getTime())) return "—";

    return new Intl.DateTimeFormat(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
    }).format(date);
}

function formatDateTime(value: string | null | undefined): string {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "—";

    return new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(date);
}

function formatMoney(cents: number): string {
    return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: "EUR",
    }).format(cents / 100);
}

function moneyInputFromCents(cents: number): string {
    return (cents / 100).toFixed(2);
}

function parseMoneyToCents(value: string): number | null {
    if (!value.trim()) return null;

    const amount = Number(value);

    if (!Number.isFinite(amount) || amount < 0) return null;

    const cents = Math.round(amount * 100);

    if (
        !Number.isSafeInteger(cents) ||
        Math.abs(amount * 100 - cents) > 1e-7
    ) {
        return null;
    }

    return cents;
}

function getDisplayStatus(lease: LeaseResponse): string {
    const today = toLocalDateString(new Date());

    if (lease.status === "ACTIVE" && lease.startDate > today) {
        return "UPCOMING";
    }

    return lease.status;
}

function LeaseStatusBadge({ status }: { status: string }) {
    const classes =
        status === "ACTIVE"
            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
            : status === "UPCOMING"
              ? "border-blue-200 bg-blue-50 text-blue-800"
              : status === "ENDED"
                ? "border-gray-200 bg-gray-100 text-gray-700"
                : "border-red-200 bg-red-50 text-red-800";

    const label =
        status === "UPCOMING"
            ? "Upcoming"
            : status.charAt(0) + status.slice(1).toLowerCase();

    return (
        <span
            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${classes}`}
        >
            {label}
        </span>
    );
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
    const organizationId = activeOrganization?.id ?? 0;

    const { leaseId: leaseIdParam } = useParams();
    const navigate = useNavigate();
    const leaseId = Number(leaseIdParam);

    const [lease, setLease] = useState<LeaseResponse | null>(null);
    const [tenant, setTenant] = useState<TenantResponse | null>(null);
    const [property, setProperty] = useState<PropertySummary | null>(null);
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
    const [renewStartDate, setRenewStartDate] = useState("");
    const [renewEndDate, setRenewEndDate] = useState("");
    const [renewMonthlyRent, setRenewMonthlyRent] = useState("");
    const [renewSecurityDeposit, setRenewSecurityDeposit] = useState("");
    const [renewSubmitting, setRenewSubmitting] = useState(false);
    const [renewError, setRenewError] = useState<string | null>(null);

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

                const [allLeases, allTenants] = await Promise.all([
                    getLeases(organizationId),
                    getTenants(organizationId),
                ]);

                if (cancelled) return;

                const selectedLease = allLeases.find(
                    (item) => item.id === leaseId,
                );

                if (!selectedLease) {
                    throw new Error(
                        "Lease not found in the selected organization.",
                    );
                }

                setLease(selectedLease);

                setTenant(
                    allTenants.find(
                        (item) => item.id === selectedLease.tenantId,
                    ) ?? null,
                );

                // Spaces are retrieved through their parent property.
                // Search the organization's properties to resolve the space.
                try {
                    const properties =
                        await getPropertySummaries(organizationId);

                    const spaceGroups = await Promise.all(
                        properties.map(async (candidateProperty) => {
                            try {
                                const propertySpaces = await getSpaces(
                                    organizationId,
                                    candidateProperty.id,
                                );

                                return {
                                    candidateProperty,
                                    propertySpaces,
                                };
                            } catch {
                                return {
                                    candidateProperty,
                                    propertySpaces: [] as SpaceResponse[],
                                };
                            }
                        }),
                    );

                    if (cancelled) return;

                    const match = spaceGroups.find(
                        ({ propertySpaces }) =>
                            propertySpaces.some(
                                (candidateSpace) =>
                                    candidateSpace.id ===
                                    selectedLease.spaceId,
                            ),
                    );

                    const matchingSpace = match?.propertySpaces.find(
                        (candidateSpace) =>
                            candidateSpace.id === selectedLease.spaceId,
                    );

                    if (match && matchingSpace) {
                        setProperty(match.candidateProperty);
                        setSpace(matchingSpace);
                    } else {
                        setRelatedDataError(
                            "The lease loaded, but its space could not be matched to a property. The space ID is still shown below.",
                        );
                    }
                } catch (error) {
                    if (!cancelled) {
                        setRelatedDataError(
                            getErrorMessage(
                                error,
                                "The lease loaded, but property and space details could not be retrieved.",
                            ),
                        );
                    }
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
        if (!lease) return;

        const suggestedStart = addDays(lease.endDate, 1);

        setRenewStartDate(suggestedStart);
        setRenewEndDate(addOneYear(suggestedStart));
        setRenewMonthlyRent(moneyInputFromCents(lease.monthlyRentCents));
        setRenewSecurityDeposit(
            moneyInputFromCents(lease.securityDepositCents),
        );

        setRenewError(null);
        setLeaseActionError(null);
        setLeaseActionMessage(null);
        setShowRenewForm(true);
    }

    async function handleRenewSubmit(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();
        setRenewError(null);

        if (!lease || organizationId <= 0) {
            setRenewError(
                "Lease details are not available. Reload this page and try again.",
            );
            return;
        }

        if (!renewStartDate || renewStartDate <= lease.endDate) {
            setRenewError(
                "The renewal start date must be after the current lease's end date.",
            );
            return;
        }

        if (!renewEndDate || renewEndDate <= renewStartDate) {
            setRenewError(
                "The renewal end date must be later than its start date.",
            );
            return;
        }

        const rentCents = parseMoneyToCents(renewMonthlyRent);
        const depositCents = parseMoneyToCents(renewSecurityDeposit);

        if (rentCents === null) {
            setRenewError(
                "Enter a valid monthly rent with up to two decimal places.",
            );
            return;
        }

        if (depositCents === null) {
            setRenewError(
                "Enter a valid security deposit with up to two decimal places.",
            );
            return;
        }

        const request: RenewLeaseRequest = {
            startDate: renewStartDate,
            endDate: renewEndDate,
            monthlyRentCents: rentCents,
            securityDepositCents: depositCents,
        };

        setRenewSubmitting(true);

        try {
            const newLease = await renewLease(
                organizationId,
                lease.id,
                request,
            );

            navigate(`/app/leases/${newLease.id}`, { replace: true });
        } catch (error) {
            setRenewError(
                getErrorMessage(error, "Failed to renew this lease."),
            );
        } finally {
            setRenewSubmitting(false);
        }
    }

    async function handleLeaseAction(
        action: Exclude<LeaseAction, null>,
    ) {
        if (!lease || organizationId <= 0) return;

        const confirmed = window.confirm(
            action === "end"
                ? `End lease #${lease.id}? This will mark the lease as ended.`
                : `Cancel lease #${lease.id}? This action cannot be undone from this screen.`,
        );

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

    const displayStatus = getDisplayStatus(lease);
    const rentHasStarted =
        lease.startDate <= toLocalDateString(new Date());

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
                <section className="rounded-xl border border-[#d5dfd8] bg-[#f8faf8] p-5">
                    <div className="mb-5 flex items-start justify-between gap-4">
                        <div>
                            <h2 className="font-semibold text-[#14302b]">
                                Renew lease
                            </h2>

                            <p className="mt-1 text-sm text-gray-500">
                                This creates a new lease for the same tenant
                                and space. Its start date must be after{" "}
                                {formatDate(lease.endDate)}.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => setShowRenewForm(false)}
                            disabled={renewSubmitting}
                            className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-white disabled:opacity-50"
                        >
                            Close
                        </button>
                    </div>

                    <form
                        onSubmit={handleRenewSubmit}
                        className="space-y-5"
                    >
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label
                                    htmlFor="renew-start-date"
                                    className="mb-1.5 block text-sm font-medium text-[#243b35]"
                                >
                                    New start date
                                </label>

                                <input
                                    id="renew-start-date"
                                    type="date"
                                    required
                                    min={addDays(lease.endDate, 1)}
                                    value={renewStartDate}
                                    onChange={(event) => {
                                        setRenewStartDate(
                                            event.target.value,
                                        );

                                        if (
                                            renewEndDate <=
                                            event.target.value
                                        ) {
                                            setRenewEndDate(
                                                addOneYear(
                                                    event.target.value,
                                                ),
                                            );
                                        }
                                    }}
                                    disabled={renewSubmitting}
                                    className="w-full rounded-lg border border-[#dce4de] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#14302b] focus:ring-2 focus:ring-[#14302b]/10 disabled:bg-gray-100"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="renew-end-date"
                                    className="mb-1.5 block text-sm font-medium text-[#243b35]"
                                >
                                    New end date
                                </label>

                                <input
                                    id="renew-end-date"
                                    type="date"
                                    required
                                    min={
                                        renewStartDate
                                            ? addDays(renewStartDate, 1)
                                            : undefined
                                    }
                                    value={renewEndDate}
                                    onChange={(event) =>
                                        setRenewEndDate(event.target.value)
                                    }
                                    disabled={renewSubmitting}
                                    className="w-full rounded-lg border border-[#dce4de] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#14302b] focus:ring-2 focus:ring-[#14302b]/10 disabled:bg-gray-100"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="renew-monthly-rent"
                                    className="mb-1.5 block text-sm font-medium text-[#243b35]"
                                >
                                    Monthly rent (€)
                                </label>

                                <input
                                    id="renew-monthly-rent"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    required
                                    value={renewMonthlyRent}
                                    onChange={(event) =>
                                        setRenewMonthlyRent(
                                            event.target.value,
                                        )
                                    }
                                    disabled={renewSubmitting}
                                    className="w-full rounded-lg border border-[#dce4de] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#14302b] focus:ring-2 focus:ring-[#14302b]/10 disabled:bg-gray-100"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="renew-security-deposit"
                                    className="mb-1.5 block text-sm font-medium text-[#243b35]"
                                >
                                    Security deposit (€)
                                </label>

                                <input
                                    id="renew-security-deposit"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    required
                                    value={renewSecurityDeposit}
                                    onChange={(event) =>
                                        setRenewSecurityDeposit(
                                            event.target.value,
                                        )
                                    }
                                    disabled={renewSubmitting}
                                    className="w-full rounded-lg border border-[#dce4de] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#14302b] focus:ring-2 focus:ring-[#14302b]/10 disabled:bg-gray-100"
                                />
                            </div>
                        </div>

                        {renewError && (
                            <p role="alert" className="text-sm text-red-700">
                                {renewError}
                            </p>
                        )}

                        <div className="flex flex-wrap justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setShowRenewForm(false)}
                                disabled={renewSubmitting}
                                className="rounded-lg border border-[#d5dfd8] bg-white px-4 py-2.5 text-sm font-medium text-[#243b35] hover:bg-gray-50 disabled:opacity-50"
                            >
                                Keep current lease
                            </button>

                            <button
                                type="submit"
                                disabled={
                                    renewSubmitting ||
                                    leaseActionBusy !== null
                                }
                                className="inline-flex items-center gap-2 rounded-lg bg-[#14302b] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#20453d] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {renewSubmitting
                                    ? "Creating renewal..."
                                    : "Create renewal"}

                                {!renewSubmitting && (
                                    <ArrowRight className="h-4 w-4" />
                                )}
                            </button>
                        </div>
                    </form>
                </section>
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
                        {formatDate(lease.startDate)}
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
                        {formatDate(lease.endDate)}
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
                            value={
                                space?.type
                                    ? space.type
                                          .toLowerCase()
                                          .replaceAll("_", " ")
                                          .replace(/^\w/, (letter) =>
                                              letter.toUpperCase(),
                                          )
                                    : "—"
                            }
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