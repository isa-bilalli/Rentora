import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { Building2, Mail, Plus, Search, Users } from "lucide-react";
import { createTenant, getTenants } from "../api/tenantApi";
import { useOrganization } from "../../organizations/OrganizationProvider";
import TenantForm from "../components/TenantForm";
import {
    getTenantDisplayName,
    type CreateTenantRequest,
    type TenantResponse,
} from "../types";

function formatDate(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
    }).format(date);
}

export default function TenantsPage() {
    const { activeOrganization } = useOrganization();
    const organizationId = activeOrganization?.id ?? 0;
    const [tenants, setTenants] = useState<TenantResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [query, setQuery] = useState("");
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        let cancelled = false;

        async function loadTenants() {
            setLoading(true);
            setLoadError(null);
            setTenants([]);
            try {
                const result = await getTenants(organizationId);
                if (!cancelled) setTenants(result);
            } catch (error) {
                if (!cancelled) {
                    setLoadError(
                        error instanceof Error
                            ? error.message
                            : "Unable to load tenants.",
                    );
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        if (Number.isFinite(organizationId) && organizationId > 0) {
            void loadTenants();
        } else {
            setTenants([]);
            setLoading(false);
            setLoadError("Select an organization to view its tenants.");
        }

        return () => {
            cancelled = true;
        };
    }, [organizationId]);

    const filteredTenants = useMemo(() => {
        const normalizedQuery = query.trim().toLocaleLowerCase();
        if (!normalizedQuery) return tenants;

        return tenants.filter((tenant) => {
            const searchable = [
                getTenantDisplayName(tenant),
                tenant.type,
                tenant.email ?? "",
                tenant.phone ?? "",
                String(tenant.id),
            ]
                .join(" ")
                .toLocaleLowerCase();
            return searchable.includes(normalizedQuery);
        });
    }, [tenants, query]);

    async function handleCreate(request: CreateTenantRequest) {
        setCreating(true);
        try {
            const created = await createTenant(organizationId, request);
            setTenants((current) => [created, ...current]);
            setShowCreateForm(false);
        } finally {
            setCreating(false);
        }
    }

    const individuals = tenants.filter((tenant) => tenant.type === "INDIVIDUAL").length;
    const companies = tenants.filter((tenant) => tenant.type === "COMPANY").length;

    return (
        <main className="mx-auto w-full max-w-7xl space-y-6 p-5 md:p-8">
            <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                    <p className="text-sm font-medium text-[#7b8e84]">RENTORA / DIRECTORY</p>
                    <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#14302b] sm:text-3xl">
                        Tenants
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm text-gray-500">
                        Manage the people and companies renting your spaces.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => setShowCreateForm((current) => !current)}
                    disabled={organizationId <= 0 || creating}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#14302b] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#20453d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d4a94f]"
                >
                    <Plus className="h-4 w-4" />
                    {showCreateForm ? "Close form" : "Add tenant"}
                </button>
            </header>

            {showCreateForm && organizationId > 0 && (
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
                    <p className="mt-3 text-2xl font-semibold text-[#14302b]">{tenants.length}</p>
                </div>
                <div className="rounded-xl border border-[#e0e7e2] bg-white p-5">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Individuals</span>
                        <Users className="h-5 w-5 text-[#638176]" />
                    </div>
                    <p className="mt-3 text-2xl font-semibold text-[#14302b]">{individuals}</p>
                </div>
                <div className="rounded-xl border border-[#e0e7e2] bg-white p-5">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Companies</span>
                        <Building2 className="h-5 w-5 text-[#638176]" />
                    </div>
                    <p className="mt-3 text-2xl font-semibold text-[#14302b]">{companies}</p>
                </div>
            </section>

            <section className="overflow-hidden rounded-xl border border-[#e0e7e2] bg-white">
                <div className="flex flex-col gap-3 border-b border-[#edf1ee] p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="font-semibold text-[#14302b]">Tenant directory</h2>
                        <p className="mt-1 text-sm text-gray-500">
                            {filteredTenants.length} {filteredTenants.length === 1 ? "result" : "results"}
                        </p>
                    </div>
                    <div className="relative w-full sm:max-w-xs">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            aria-label="Search tenants"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Search name, email, phone..."
                            className="w-full rounded-lg border border-[#dce4de] bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#14302b] focus:ring-2 focus:ring-[#14302b]/10"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="p-10 text-center text-sm text-gray-500">Loading tenants...</div>
                ) : tenants.length === 0 && !loadError ? (
                    <div className="p-10 text-center">
                        <Users className="mx-auto h-8 w-8 text-[#8aa096]" />
                        <h3 className="mt-3 font-semibold text-[#14302b]">No tenants yet</h3>
                        <p className="mt-1 text-sm text-gray-500">Create your first tenant to use them in a lease.</p>
                        <button
                            type="button"
                            onClick={() => setShowCreateForm(true)}
                            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#14302b] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#20453d]"
                        >
                            <Plus className="h-4 w-4" /> Add tenant
                        </button>
                    </div>
                ) : filteredTenants.length === 0 ? (
                    <div className="p-10 text-center text-sm text-gray-500">No tenants match that search.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[700px] text-left text-sm">
                            <thead className="bg-[#f8faf8] text-xs uppercase tracking-wide text-[#71847a]">
                                <tr>
                                    <th className="px-5 py-3 font-semibold">Tenant</th>
                                    <th className="px-5 py-3 font-semibold">Type</th>
                                    <th className="px-5 py-3 font-semibold">Contact</th>
                                    <th className="px-5 py-3 font-semibold">Added</th>
                                    <th className="px-5 py-3 text-right font-semibold"> </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#edf1ee]">
                                {filteredTenants.map((tenant) => (
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
                                            <span className="inline-flex rounded-full bg-[#edf3ef] px-2.5 py-1 text-xs font-medium text-[#365a4e]">
                                                {tenant.type === "INDIVIDUAL" ? "Individual" : "Company"}
                                            </span>
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
                )}
            </section>
        </main>
    );
}
