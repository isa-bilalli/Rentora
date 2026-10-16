import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, ArrowRight, Building2, CalendarDays, FileText, Mail, Pencil, Phone, UserRound } from "lucide-react";
import { getTenant, updateTenant } from "../api/tenantApi";
import { useOrganization } from "../../organizations/OrganizationProvider";
import TenantForm from "../components/TenantForm";
import { getLeases } from "../../leases/api/leasesApi";
import type { LeaseResponse } from "../../leases/types";
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

function formatDate(value: string): string {
    // Lease start/end dates are date-only strings; parsing them at local noon
    // avoids showing the previous day in time zones west of UTC.
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

function formatMoney(cents: number): string {
    return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: "EUR",
    }).format(cents / 100);
}

function getLeaseDisplayStatus(lease: LeaseResponse, today: string): string {
    if (lease.status === "ACTIVE" && lease.startDate > today) {
        return "UPCOMING";
    }
    return lease.status;
}

function LeaseStatusBadge({ status }: { status: string }) {
    const classes = status === "ACTIVE"
        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
        : status === "UPCOMING"
          ? "border-blue-200 bg-blue-50 text-blue-800"
          : status === "ENDED"
            ? "border-gray-200 bg-gray-100 text-gray-700"
            : "border-red-200 bg-red-50 text-red-800";

    const label = status === "UPCOMING"
        ? "Upcoming"
        : status.charAt(0) + status.slice(1).toLowerCase();

    return (
        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${classes}`}>
            {label}
        </span>
    );
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

    useEffect(() => {
        let cancelled = false;

        async function loadTenant() {
            setLoading(true);
            setLoadError(null);
            setTenant(null);
            try {
                if (!Number.isFinite(tenantId) || tenantId <= 0) {
                    throw new Error("The tenant ID in this URL is invalid.");
                }
                if (!Number.isFinite(organizationId) || organizationId <= 0) {
                    throw new Error("Select an organization to view this tenant.");
                }
                const result = await getTenant(organizationId, tenantId);
                if (!cancelled) setTenant(result);
            } catch (error) {
                if (!cancelled) {
                    setLoadError(
                        error instanceof Error
                            ? error.message
                            : "Unable to load tenant details.",
                    );
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        void loadTenant();
        return () => {
            cancelled = true;
        };
    }, [organizationId, tenantId]);

    useEffect(() => {
        let cancelled = false;

        async function loadLeaseHistory() {
            setLeasesLoading(true);
            setLeasesError(null);
            setLeases([]);

            try {
                if (!Number.isFinite(tenantId) || tenantId <= 0) {
                    throw new Error("The tenant ID in this URL is invalid.");
                }
                if (!Number.isFinite(organizationId) || organizationId <= 0) {
                    throw new Error("Select an organization to view lease history.");
                }

                const organizationLeases = await getLeases(organizationId);
                const tenantLeases = organizationLeases
                    .filter((lease) => lease.tenantId === tenantId)
                    .sort((a, b) => b.startDate.localeCompare(a.startDate));

                if (!cancelled) setLeases(tenantLeases);
            } catch (error) {
                if (!cancelled) {
                    setLeasesError(
                        error instanceof Error
                            ? error.message
                            : "Unable to load lease history.",
                    );
                }
            } finally {
                if (!cancelled) setLeasesLoading(false);
            }
        }

        void loadLeaseHistory();
        return () => {
            cancelled = true;
        };
    }, [organizationId, tenantId]);

    async function handleUpdate(request: UpdateTenantRequest) {
        if (!tenant) return;
        setSaving(true);
        try {
            const updated = await updateTenant(organizationId, tenant.id, request);
            setTenant(updated);
            setEditing(false);
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return <main className="mx-auto w-full max-w-5xl p-5 md:p-8"><p className="text-sm text-gray-500">Loading tenant details...</p></main>;
    }

    if (loadError || !tenant) {
        return (
            <main className="mx-auto w-full max-w-5xl space-y-4 p-5 md:p-8">
                <Link to="/app/tenants" className="inline-flex items-center gap-2 text-sm font-medium text-[#426b5c] hover:text-[#14302b]">
                    <ArrowLeft className="h-4 w-4" /> Back to tenants
                </Link>
                <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                    {loadError ?? "Tenant not found."}
                </div>
            </main>
        );
    }

    return (
        <main className="mx-auto w-full max-w-5xl space-y-6 p-5 md:p-8">
            <Link to="/app/tenants" className="inline-flex items-center gap-2 text-sm font-medium text-[#426b5c] hover:text-[#14302b]">
                <ArrowLeft className="h-4 w-4" /> Back to tenants
            </Link>

            <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div>
                    <p className="text-sm font-medium text-[#7b8e84]">TENANT #{tenant.id}</p>
                    <div className="mt-2 flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#edf3ef] text-[#426b5c]">
                            {tenant.type === "COMPANY" ? <Building2 className="h-6 w-6" /> : <UserRound className="h-6 w-6" />}
                        </div>
                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight text-[#14302b] sm:text-3xl">
                                {getTenantDisplayName(tenant)}
                            </h1>
                            <p className="mt-1 text-sm text-gray-500">
                                {tenant.type === "INDIVIDUAL" ? "Individual tenant" : "Company tenant"}
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
                        <Pencil className="h-4 w-4" /> Edit tenant
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
                        <h2 className="font-semibold text-[#14302b]">Contact information</h2>
                        <p className="mt-1 text-sm text-gray-500">Tenant identity and contact details.</p>
                    </div>
                    <dl className="grid gap-x-8 sm:grid-cols-2">
                        {tenant.type === "INDIVIDUAL" ? (
                            <>
                                <div className="border-b border-[#edf1ee] px-5 py-4">
                                    <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">First name</dt>
                                    <dd className="mt-1 text-sm font-medium text-[#243b35]">{tenant.firstName || "—"}</dd>
                                </div>
                                <div className="border-b border-[#edf1ee] px-5 py-4">
                                    <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">Last name</dt>
                                    <dd className="mt-1 text-sm font-medium text-[#243b35]">{tenant.lastName || "—"}</dd>
                                </div>
                            </>
                        ) : (
                            <div className="border-b border-[#edf1ee] px-5 py-4 sm:col-span-2">
                                <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">Company name</dt>
                                <dd className="mt-1 text-sm font-medium text-[#243b35]">{tenant.companyName || "—"}</dd>
                            </div>
                        )}
                        <div className="border-b border-[#edf1ee] px-5 py-4">
                            <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-400"><Mail className="h-3.5 w-3.5" /> Email</dt>
                            <dd className="mt-1 wrap-break-words text-sm font-medium text-[#243b35]">{tenant.email || "Not provided"}</dd>
                        </div>
                        <div className="border-b border-[#edf1ee] px-5 py-4">
                            <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-400"><Phone className="h-3.5 w-3.5" /> Phone</dt>
                            <dd className="mt-1 text-sm font-medium text-[#243b35]">{tenant.phone || "Not provided"}</dd>
                        </div>
                    </dl>
                    <div className="grid gap-x-8 sm:grid-cols-2">
                        <div className="px-5 py-4">
                            <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-400"><CalendarDays className="h-3.5 w-3.5" /> Created</p>
                            <p className="mt-1 text-sm text-[#42574e]">{formatDate(tenant.createdAt)}</p>
                        </div>
                        <div className="px-5 py-4">
                            <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-400"><CalendarDays className="h-3.5 w-3.5" /> Last updated</p>
                            <p className="mt-1 text-sm text-[#42574e]">{formatDate(tenant.updatedAt)}</p>
                        </div>
                    </div>
                </section>
            )}

            <section className="overflow-hidden rounded-xl border border-[#e0e7e2] bg-white">
                <div className="flex flex-col gap-3 border-b border-[#edf1ee] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="flex items-center gap-2 font-semibold text-[#14302b]">
                            <FileText className="h-4 w-4" /> Lease history
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">
                            Current, upcoming, and previous leases associated with this tenant.
                        </p>
                    </div>
                    <span className="w-fit rounded-full bg-[#edf3ef] px-3 py-1 text-sm font-medium text-[#426b5c]">
                        {leases.length} {leases.length === 1 ? "lease" : "leases"}
                    </span>
                </div>

                {leasesLoading ? (
                    <div className="px-5 py-8 text-sm text-gray-500">Loading lease history...</div>
                ) : leasesError ? (
                    <div role="alert" className="m-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                        {leasesError}
                    </div>
                ) : leases.length === 0 ? (
                    <div className="px-5 py-10 text-center">
                        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#edf3ef] text-[#426b5c]">
                            <FileText className="h-5 w-5" />
                        </div>
                        <h3 className="mt-3 text-sm font-semibold text-[#243b35]">No leases yet</h3>
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
                                    const displayStatus = getLeaseDisplayStatus(lease, getLocalDateString());
                                    return (
                                        <tr key={lease.id} className="align-middle hover:bg-[#fbfcfb]">
                                            <td className="px-5 py-4">
                                                <p className="font-semibold text-[#243b35]">Lease #{lease.id}</p>
                                                <p className="mt-1 text-xs text-gray-500">Space #{lease.spaceId}</p>
                                            </td>
                                            <td className="px-5 py-4 text-[#42574e]">
                                                <span>{formatDate(lease.startDate)}</span>
                                                <span className="mx-1.5 text-gray-400">→</span>
                                                <span>{formatDate(lease.endDate)}</span>
                                            </td>
                                            <td className="px-5 py-4 font-medium text-[#243b35]">{formatMoney(lease.monthlyRentCents)}</td>
                                            <td className="px-5 py-4 text-[#42574e]">{formatMoney(lease.securityDepositCents)}</td>
                                            <td className="px-5 py-4"><LeaseStatusBadge status={displayStatus} /></td>
                                            <td className="px-5 py-4 text-right">
                                                <Link
                                                    to={`/app/leases/${lease.id}`}
                                                    className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 font-medium text-[#426b5c] hover:bg-[#edf3ef] hover:text-[#14302b]"
                                                >
                                                    View lease <ArrowRight className="h-3.5 w-3.5" />
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
        </main>
    );
}
