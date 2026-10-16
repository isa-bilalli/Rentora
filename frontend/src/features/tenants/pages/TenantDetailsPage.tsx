import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import {
    ArrowLeft,
    ArrowRight,
    Building2,
    CalendarDays,
    CreditCard,
    FileText,
    Mail,
    Pencil,
    Phone,
    UserRound,
    Wallet,
} from "lucide-react";

import { getTenant, updateTenant } from "../api/tenantApi";
import { useOrganization } from "../../organizations/useOrganization";
import TenantForm from "../components/TenantForm";

import { getLeases } from "../../leases/api/leasesApi";
import type { LeaseResponse } from "../../leases/types";

import { getPayments } from "../../payments/api/paymentApi";
import type { PaymentResponse, PaymentStatus } from "../../payments/types";
import { formatDateTime, formatLongDate, formatMoney } from "../../../lib/format";

import {
    getTenantDisplayName,
    type TenantResponse,
    type UpdateTenantRequest,
} from "../types";

function getLocalDateString(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function getLeaseDisplayStatus(
    lease: LeaseResponse,
    today: string,
): string {
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
            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${classes}`}
        >
            {label}
        </span>
    );
}

function getPaymentDisplayStatus(
    payment: PaymentResponse,
    today: string,
): PaymentStatus | "OVERDUE" {
    if (payment.status === "PENDING" && payment.dueDate < today) {
        return "OVERDUE";
    }

    return payment.status;
}

function PaymentStatusBadge({ status }: { status: string }) {
    const classes =
        status === "PAID"
            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
            : status === "OVERDUE"
              ? "border-red-200 bg-red-50 text-red-800"
              : status === "PENDING"
                ? "border-amber-200 bg-amber-50 text-amber-800"
                : "border-gray-200 bg-gray-100 text-gray-700";

    const label =
        status === "OVERDUE"
            ? "Overdue"
            : status.charAt(0) + status.slice(1).toLowerCase();

    return (
        <span
            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${classes}`}
        >
            {label}
        </span>
    );
}

function formatPaymentMethod(value: string | null): string {
    if (!value) return "—";

    return value
        .toLowerCase()
        .split("_")
        .map(
            (part) =>
                part.charAt(0).toUpperCase() + part.slice(1),
        )
        .join(" ");
}

export default function TenantDetailsPage() {
    const { activeOrganization } = useOrganization();
    const organizationId = activeOrganization?.id ?? 0;

    const { tenantId: tenantIdParam } = useParams();
    const tenantId = Number(tenantIdParam);

    const [tenant, setTenant] = useState<TenantResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    const [leases, setLeases] = useState<LeaseResponse[]>([]);
    const [leasesLoading, setLeasesLoading] = useState(true);
    const [leasesError, setLeasesError] = useState<string | null>(null);

    const [payments, setPayments] = useState<PaymentResponse[]>([]);
    const [paymentsLoading, setPaymentsLoading] = useState(true);
    const [paymentsError, setPaymentsError] = useState<string | null>(null);

    // Load the tenant's information.
    useEffect(() => {
        let cancelled = false;

        async function loadTenant() {
            setLoading(true);
            setLoadError(null);
            setTenant(null);

            try {
                if (!Number.isFinite(tenantId) || tenantId <= 0) {
                    throw new Error(
                        "The tenant ID in this URL is invalid.",
                    );
                }

                if (
                    !Number.isFinite(organizationId) ||
                    organizationId <= 0
                ) {
                    throw new Error(
                        "Select an organization to view this tenant.",
                    );
                }

                const result = await getTenant(
                    organizationId,
                    tenantId,
                );

                if (!cancelled) {
                    setTenant(result);
                }
            } catch (error) {
                if (!cancelled) {
                    setLoadError(
                        error instanceof Error
                            ? error.message
                            : "Unable to load tenant details.",
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        void loadTenant();

        return () => {
            cancelled = true;
        };
    }, [organizationId, tenantId]);

    // Load the tenant's leases, then find payments belonging to those leases.
    useEffect(() => {
        let cancelled = false;

        async function loadLeaseHistoryAndPayments() {
            setLeasesLoading(true);
            setLeasesError(null);
            setLeases([]);

            setPaymentsLoading(true);
            setPaymentsError(null);
            setPayments([]);

            try {
                if (!Number.isFinite(tenantId) || tenantId <= 0) {
                    throw new Error(
                        "The tenant ID in this URL is invalid.",
                    );
                }

                if (
                    !Number.isFinite(organizationId) ||
                    organizationId <= 0
                ) {
                    throw new Error(
                        "Select an organization to view lease and payment history.",
                    );
                }

                const organizationLeases =
                    await getLeases(organizationId);

                const tenantLeases = organizationLeases
                    .filter((lease) => lease.tenantId === tenantId)
                    .sort((a, b) =>
                        b.startDate.localeCompare(a.startDate),
                    );

                if (!cancelled) {
                    setLeases(tenantLeases);
                }

                const tenantLeaseIds = new Set(
                    tenantLeases.map((lease) => lease.id),
                );

                // The payments endpoint returns organization-wide payments.
                // Filter them to the leases belonging to this tenant.
                try {
                    const organizationPayments =
                        await getPayments(organizationId);

                    const tenantPayments = organizationPayments
                        .filter((payment) =>
                            tenantLeaseIds.has(payment.leaseId),
                        )
                        .sort((a, b) => {
                            const dateOrder =
                                b.dueDate.localeCompare(a.dueDate);

                            if (dateOrder !== 0) {
                                return dateOrder;
                            }

                            return (b.paidAt ?? "").localeCompare(
                                a.paidAt ?? "",
                            );
                        });

                    if (!cancelled) {
                        setPayments(tenantPayments);
                    }
                } catch (paymentError) {
                    if (!cancelled) {
                        setPaymentsError(
                            paymentError instanceof Error
                                ? paymentError.message
                                : "Unable to load payment history.",
                        );
                    }
                }
            } catch (error) {
                if (!cancelled) {
                    const message =
                        error instanceof Error
                            ? error.message
                            : "Unable to load lease history.";

                    setLeasesError(message);
                    setPaymentsError(
                        "Payment history could not be associated with this tenant because the lease list failed to load.",
                    );
                }
            } finally {
                if (!cancelled) {
                    setLeasesLoading(false);
                    setPaymentsLoading(false);
                }
            }
        }

        void loadLeaseHistoryAndPayments();

        return () => {
            cancelled = true;
        };
    }, [organizationId, tenantId]);

    async function handleUpdate(request: UpdateTenantRequest) {
        if (!tenant) return;

        setSaving(true);

        try {
            const updated = await updateTenant(
                organizationId,
                tenant.id,
                request,
            );

            setTenant(updated);
            setEditing(false);
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <main className="mx-auto w-full max-w-5xl p-5 md:p-8">
                <p className="text-sm text-gray-500">
                    Loading tenant details...
                </p>
            </main>
        );
    }

    if (loadError || !tenant) {
        return (
            <main className="mx-auto w-full max-w-5xl space-y-4 p-5 md:p-8">
                <Link
                    to="/app/tenants"
                    className="inline-flex items-center gap-2 text-sm font-medium text-[#426b5c] hover:text-[#14302b]"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to tenants
                </Link>

                <div
                    role="alert"
                    className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
                >
                    {loadError ?? "Tenant not found."}
                </div>
            </main>
        );
    }

    const today = getLocalDateString();

    const paidPayments = payments.filter(
        (payment) => payment.status === "PAID",
    );

    const pendingPayments = payments.filter(
        (payment) => payment.status === "PENDING",
    );

    const overduePayments = pendingPayments.filter(
        (payment) => payment.dueDate < today,
    );

    const collectedCents = paidPayments.reduce(
        (total, payment) => total + payment.amountCents,
        0,
    );

    const outstandingCents = pendingPayments.reduce(
        (total, payment) => total + payment.amountCents,
        0,
    );

    const overdueCents = overduePayments.reduce(
        (total, payment) => total + payment.amountCents,
        0,
    );

    return (
        <main className="mx-auto w-full max-w-5xl space-y-6 p-5 md:p-8">
            <Link
                to="/app/tenants"
                className="inline-flex items-center gap-2 text-sm font-medium text-[#426b5c] hover:text-[#14302b]"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to tenants
            </Link>

            <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div>
                    <p className="text-sm font-medium text-[#7b8e84]">
                        TENANT #{tenant.id}
                    </p>

                    <div className="mt-2 flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#edf3ef] text-[#426b5c]">
                            {tenant.type === "COMPANY" ? (
                                <Building2 className="h-6 w-6" />
                            ) : (
                                <UserRound className="h-6 w-6" />
                            )}
                        </div>

                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight text-[#14302b] sm:text-3xl">
                                {getTenantDisplayName(tenant)}
                            </h1>

                            <p className="mt-1 text-sm text-gray-500">
                                {tenant.type === "INDIVIDUAL"
                                    ? "Individual tenant"
                                    : "Company tenant"}
                            </p>
                        </div>
                    </div>
                </div>

                {!editing && (
                    <button
                        type="button"
                        onClick={() => setEditing(true)}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#d5dfd8] bg-white px-4 py-2.5 text-sm font-medium text-[#243b35] hover:bg-[#f8faf8]"
                    >
                        <Pencil className="h-4 w-4" />
                        Edit tenant
                    </button>
                )}
            </header>

            {editing ? (
                <TenantForm
                    key={`${tenant.id}-${tenant.updatedAt}`}
                    initialTenant={tenant}
                    submitting={saving}
                    onSubmit={handleUpdate}
                    onCancel={() => setEditing(false)}
                />
            ) : (
                <section className="overflow-hidden rounded-xl border border-[#e0e7e2] bg-white">
                    <div className="border-b border-[#edf1ee] px-5 py-4">
                        <h2 className="font-semibold text-[#14302b]">
                            Contact information
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">
                            Tenant identity and contact details.
                        </p>
                    </div>

                    <dl className="grid gap-x-8 sm:grid-cols-2">
                        {tenant.type === "INDIVIDUAL" ? (
                            <>
                                <div className="border-b border-[#edf1ee] px-5 py-4">
                                    <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">
                                        First name
                                    </dt>
                                    <dd className="mt-1 text-sm font-medium text-[#243b35]">
                                        {tenant.firstName || "—"}
                                    </dd>
                                </div>

                                <div className="border-b border-[#edf1ee] px-5 py-4">
                                    <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">
                                        Last name
                                    </dt>
                                    <dd className="mt-1 text-sm font-medium text-[#243b35]">
                                        {tenant.lastName || "—"}
                                    </dd>
                                </div>
                            </>
                        ) : (
                            <div className="border-b border-[#edf1ee] px-5 py-4 sm:col-span-2">
                                <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">
                                    Company name
                                </dt>
                                <dd className="mt-1 text-sm font-medium text-[#243b35]">
                                    {tenant.companyName || "—"}
                                </dd>
                            </div>
                        )}

                        <div className="border-b border-[#edf1ee] px-5 py-4">
                            <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-400">
                                <Mail className="h-3.5 w-3.5" />
                                Email
                            </dt>
                            <dd className="mt-1 wrap-break-words text-sm font-medium text-[#243b35]">
                                {tenant.email || "Not provided"}
                            </dd>
                        </div>

                        <div className="border-b border-[#edf1ee] px-5 py-4">
                            <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-400">
                                <Phone className="h-3.5 w-3.5" />
                                Phone
                            </dt>
                            <dd className="mt-1 text-sm font-medium text-[#243b35]">
                                {tenant.phone || "Not provided"}
                            </dd>
                        </div>
                    </dl>

                    <div className="grid gap-x-8 sm:grid-cols-2">
                        <div className="px-5 py-4">
                            <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-400">
                                <CalendarDays className="h-3.5 w-3.5" />
                                Created
                            </p>
                            <p className="mt-1 text-sm text-[#42574e]">
                                {formatLongDate(tenant.createdAt)}
                            </p>
                        </div>

                        <div className="px-5 py-4">
                            <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-400">
                                <CalendarDays className="h-3.5 w-3.5" />
                                Last updated
                            </p>
                            <p className="mt-1 text-sm text-[#42574e]">
                                {formatLongDate(tenant.updatedAt)}
                            </p>
                        </div>
                    </div>
                </section>
            )}

            {/* Lease history */}
            <section className="overflow-hidden rounded-xl border border-[#e0e7e2] bg-white">
                <div className="flex flex-col gap-3 border-b border-[#edf1ee] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="flex items-center gap-2 font-semibold text-[#14302b]">
                            <FileText className="h-4 w-4" />
                            Lease history
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">
                            Current, upcoming, and previous leases associated with this tenant.
                        </p>
                    </div>

                    <span className="w-fit rounded-full bg-[#edf3ef] px-3 py-1 text-sm font-medium text-[#426b5c]">
                        {leases.length}{" "}
                        {leases.length === 1 ? "lease" : "leases"}
                    </span>
                </div>

                {leasesLoading ? (
                    <div className="px-5 py-8 text-sm text-gray-500">
                        Loading lease history...
                    </div>
                ) : leasesError ? (
                    <div
                        role="alert"
                        className="m-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
                    >
                        {leasesError}
                    </div>
                ) : leases.length === 0 ? (
                    <div className="px-5 py-10 text-center">
                        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#edf3ef] text-[#426b5c]">
                            <FileText className="h-5 w-5" />
                        </div>
                        <h3 className="mt-3 text-sm font-semibold text-[#243b35]">
                            No leases yet
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Leases created for this tenant will appear here.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-190 text-left text-sm">
                            <thead className="bg-[#f8faf8] text-xs uppercase tracking-wide text-gray-500">
                                <tr>
                                    <th className="px-5 py-3 font-medium">Lease</th>
                                    <th className="px-5 py-3 font-medium">Term</th>
                                    <th className="px-5 py-3 font-medium">Monthly rent</th>
                                    <th className="px-5 py-3 font-medium">Deposit</th>
                                    <th className="px-5 py-3 font-medium">Status</th>
                                    <th className="px-5 py-3 text-right font-medium">Details</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-[#edf1ee]">
                                {leases.map((lease) => {
                                    const displayStatus =
                                        getLeaseDisplayStatus(lease, today);

                                    return (
                                        <tr
                                            key={lease.id}
                                            className="align-middle hover:bg-[#fbfcfb]"
                                        >
                                            <td className="px-5 py-4">
                                                <p className="font-semibold text-[#243b35]">
                                                    Lease #{lease.id}
                                                </p>
                                                <p className="mt-1 text-xs text-gray-500">
                                                    Space #{lease.spaceId}
                                                </p>
                                            </td>

                                            <td className="px-5 py-4 text-[#42574e]">
                                                <span>{formatLongDate(lease.startDate)}</span>
                                                <span className="mx-1.5 text-gray-400">
                                                    →
                                                </span>
                                                <span>{formatLongDate(lease.endDate)}</span>
                                            </td>

                                            <td className="px-5 py-4 font-medium text-[#243b35]">
                                                {formatMoney(lease.monthlyRentCents)}
                                            </td>

                                            <td className="px-5 py-4 text-[#42574e]">
                                                {formatMoney(lease.securityDepositCents)}
                                            </td>

                                            <td className="px-5 py-4">
                                                <LeaseStatusBadge status={displayStatus} />
                                            </td>

                                            <td className="px-5 py-4 text-right">
                                                <Link
                                                    to={`/app/leases/${lease.id}`}
                                                    className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 font-medium text-[#426b5c] hover:bg-[#edf3ef] hover:text-[#14302b]"
                                                >
                                                    View lease
                                                    <ArrowRight className="h-3.5 w-3.5" />
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {/* Payment history */}
            <section className="overflow-hidden rounded-xl border border-[#e0e7e2] bg-white">
                <div className="flex flex-col gap-3 border-b border-[#edf1ee] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="flex items-center gap-2 font-semibold text-[#14302b]">
                            <CreditCard className="h-4 w-4" />
                            Payment history
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">
                            Payments associated with this tenant's leases.
                            Overdue amounts are included in outstanding payments.
                        </p>
                    </div>

                    <span className="w-fit rounded-full bg-[#edf3ef] px-3 py-1 text-sm font-medium text-[#426b5c]">
                        {payments.length}{" "}
                        {payments.length === 1 ? "payment" : "payments"}
                    </span>
                </div>

                {paymentsLoading ? (
                    <div className="px-5 py-8 text-sm text-gray-500">
                        Loading payment history...
                    </div>
                ) : paymentsError ? (
                    <div
                        role="alert"
                        className="m-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
                    >
                        {paymentsError}
                    </div>
                ) : (
                    <>
                        <div className="grid gap-3 border-b border-[#edf1ee] p-5 sm:grid-cols-3">
                            <article className="rounded-lg border border-[#e0e7e2] bg-[#fbfcfb] p-4">
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <Wallet className="h-4 w-4" />
                                    Collected
                                </div>
                                <p className="mt-2 text-xl font-semibold text-[#14302b]">
                                    {formatMoney(collectedCents)}
                                </p>
                                <p className="mt-1 text-xs text-gray-500">
                                    {paidPayments.length} paid{" "}
                                    {paidPayments.length === 1 ? "payment" : "payments"}
                                </p>
                            </article>

                            <article className="rounded-lg border border-[#e0e7e2] bg-[#fbfcfb] p-4">
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <CalendarDays className="h-4 w-4" />
                                    Outstanding
                                </div>
                                <p className="mt-2 text-xl font-semibold text-[#14302b]">
                                    {formatMoney(outstandingCents)}
                                </p>
                                <p className="mt-1 text-xs text-gray-500">
                                    {pendingPayments.length} pending{" "}
                                    {pendingPayments.length === 1 ? "payment" : "payments"}
                                </p>
                            </article>

                            <article className="rounded-lg border border-red-100 bg-red-50/50 p-4">
                                <div className="flex items-center gap-2 text-sm text-red-700">
                                    <CalendarDays className="h-4 w-4" />
                                    Overdue
                                </div>
                                <p className="mt-2 text-xl font-semibold text-red-800">
                                    {formatMoney(overdueCents)}
                                </p>
                                <p className="mt-1 text-xs text-red-700">
                                    {overduePayments.length} overdue{" "}
                                    {overduePayments.length === 1 ? "payment" : "payments"}
                                </p>
                            </article>
                        </div>

                        {payments.length === 0 ? (
                            <div className="px-5 py-10 text-center">
                                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#edf3ef] text-[#426b5c]">
                                    <CreditCard className="h-5 w-5" />
                                </div>
                                <h3 className="mt-3 text-sm font-semibold text-[#243b35]">
                                    No payment records yet
                                </h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    Payments generated for this tenant's leases will appear here.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-225 text-left text-sm">
                                    <thead className="bg-[#f8faf8] text-xs uppercase tracking-wide text-gray-500">
                                        <tr>
                                            <th className="px-5 py-3 font-medium">Payment</th>
                                            <th className="px-5 py-3 font-medium">Due date</th>
                                            <th className="px-5 py-3 font-medium">Amount</th>
                                            <th className="px-5 py-3 font-medium">Status</th>
                                            <th className="px-5 py-3 font-medium">Paid at</th>
                                            <th className="px-5 py-3 font-medium">Method</th>
                                            <th className="px-5 py-3 text-right font-medium">Lease</th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-[#edf1ee]">
                                        {payments.map((payment) => {
                                            const displayStatus =
                                                getPaymentDisplayStatus(payment, today);

                                            return (
                                                <tr
                                                    key={payment.id}
                                                    className="align-middle hover:bg-[#fbfcfb]"
                                                >
                                                    <td className="px-5 py-4 font-semibold text-[#243b35]">
                                                        Payment #{payment.id}
                                                    </td>

                                                    <td className="px-5 py-4 text-[#42574e]">
                                                        {formatLongDate(payment.dueDate)}
                                                    </td>

                                                    <td className="px-5 py-4 font-medium text-[#243b35]">
                                                        {formatMoney(payment.amountCents)}
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        <PaymentStatusBadge status={displayStatus} />
                                                    </td>

                                                    <td className="px-5 py-4 text-[#42574e]">
                                                        {formatDateTime(payment.paidAt)}
                                                    </td>

                                                    <td className="px-5 py-4 text-[#42574e]">
                                                        {formatPaymentMethod(payment.paymentMethod)}
                                                    </td>

                                                    <td className="px-5 py-4 text-right">
                                                        <Link
                                                            to={`/app/leases/${payment.leaseId}`}
                                                            className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 font-medium text-[#426b5c] hover:bg-[#edf3ef] hover:text-[#14302b]"
                                                        >
                                                            #{payment.leaseId}
                                                            <ArrowRight className="h-3.5 w-3.5" />
                                                        </Link>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}
            </section>
        </main>
    );
}