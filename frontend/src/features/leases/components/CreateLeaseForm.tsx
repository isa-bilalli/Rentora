
import { useState, type FormEvent } from "react";
import { Plus, X } from "lucide-react";

import { addDays, addYears, todayLocalDateString } from "../../../lib/dates";
import { parseMoneyToCents } from "../../../lib/money";
import type { CreateLeaseRequest } from "../types";
import type { TenantResponse } from "../../tenants/types";
import { getTenantDisplayName } from "../../tenants/types";
import type { SpaceResponse } from "../../properties/types";
import { spaceStatusLabels, spaceTypeLabels } from "../../properties/spaceLabels";

interface CreateLeaseFormProps {
    tenants: TenantResponse[];
    spaces: SpaceResponse[];
    submitting: boolean;
    onSubmit: (request: CreateLeaseRequest) => Promise<void>;
    onCancel: () => void;
}

export default function CreateLeaseForm({
    tenants,
    spaces,
    submitting,
    onSubmit,
    onCancel,
}: CreateLeaseFormProps) {
    const [tenantId, setTenantId] = useState("");
    const [spaceId, setSpaceId] = useState("");
    const [startDate, setStartDate] = useState(todayLocalDateString);
    const [endDate, setEndDate] = useState(() =>
        addYears(todayLocalDateString(), 1),
    );
    const [monthlyRent, setMonthlyRent] = useState("");
    const [securityDeposit, setSecurityDeposit] = useState("0");
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);

        if (!tenantId || !spaceId) {
            setError("Select both a tenant and a space.");
            return;
        }

        if (!startDate || !endDate || endDate <= startDate) {
            setError("The end date must be after the start date.");
            return;
        }

        const monthlyRentCents = parseMoneyToCents(monthlyRent);
        const securityDepositCents = parseMoneyToCents(securityDeposit);

        if (monthlyRentCents === null) {
            setError("Enter a valid monthly rent with up to two decimal places.");
            return;
        }

        if (securityDepositCents === null) {
            setError("Enter a valid security deposit with up to two decimal places.");
            return;
        }

        try {
            await onSubmit({
                tenantId: Number(tenantId),
                spaceId: Number(spaceId),
                startDate,
                endDate,
                monthlyRentCents,
                securityDepositCents,
            });
        } catch (submitError) {
            setError(
                submitError instanceof Error
                    ? submitError.message
                    : "Failed to create lease.",
            );
        }
    }

    const inputClass =
        "w-full rounded-lg border border-[#dce4de] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#14302b] focus:ring-2 focus:ring-[#14302b]/10 disabled:cursor-not-allowed disabled:bg-gray-100";

    const labelClass =
        "mb-1.5 block text-sm font-medium text-[#243b35]";

    return (
        <form
            onSubmit={handleSubmit}
            className="rounded-xl border border-[#d5dfd8] bg-[#f8faf8] p-5"
        >
            <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                    <h3 className="font-semibold text-[#14302b]">
                        Create lease
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Assign a tenant to a space and define the lease terms.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={onCancel}
                    disabled={submitting}
                    aria-label="Cancel creating lease"
                    className="rounded-md p-2 text-gray-500 hover:bg-white hover:text-[#14302b] disabled:opacity-60"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            {tenants.length === 0 || spaces.length === 0 ? (
                <div
                    role="alert"
                    className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
                >
                    {tenants.length === 0 &&
                    spaces.length === 0
                        ? "You need to create a tenant and at least one space before creating a lease."
                        : tenants.length === 0
                          ? "Create a tenant before creating a lease."
                          : "Create a space for this property before creating a lease."}
                </div>
            ) : (
                <>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label
                                htmlFor="lease-tenant"
                                className={labelClass}
                            >
                                Tenant
                            </label>
                            <select
                                id="lease-tenant"
                                required
                                value={tenantId}
                                onChange={(event) =>
                                    setTenantId(event.target.value)
                                }
                                disabled={submitting}
                                className={inputClass}
                            >
                                <option value="">
                                    Select a tenant
                                </option>
                                {tenants.map((tenant) => (
                                    <option
                                        key={tenant.id}
                                        value={tenant.id}
                                    >
                                        {getTenantDisplayName(tenant)}
                                        {" — "}
                                        {tenant.email
                                            ? tenant.email
                                            : `Tenant #${tenant.id}`}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label
                                htmlFor="lease-space"
                                className={labelClass}
                            >
                                Property space
                            </label>
                            <select
                                id="lease-space"
                                required
                                value={spaceId}
                                onChange={(event) =>
                                    setSpaceId(event.target.value)
                                }
                                disabled={submitting}
                                className={inputClass}
                            >
                                <option value="">
                                    Select a space
                                </option>
                                {spaces.map((space) => (
                                    <option
                                        key={space.id}
                                        value={space.id}
                                    >
                                        {space.name}
                                        {" — "}
                                        {spaceTypeLabels[space.type]}
                                        {" ("}
                                        {spaceStatusLabels[space.status]}
                                        {")"}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label
                                htmlFor="lease-start-date"
                                className={labelClass}
                            >
                                Start date
                            </label>
                            <input
                                id="lease-start-date"
                                type="date"
                                required
                                value={startDate}
                                onChange={(event) =>
                                    setStartDate(event.target.value)
                                }
                                disabled={submitting}
                                className={inputClass}
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="lease-end-date"
                                className={labelClass}
                            >
                                End date
                            </label>
                            <input
                                id="lease-end-date"
                                type="date"
                                required
                                min={startDate ? addDays(startDate, 1) : undefined}
                                value={endDate}
                                onChange={(event) =>
                                    setEndDate(event.target.value)
                                }
                                disabled={submitting}
                                className={inputClass}
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                The end date must be later than the start date.
                            </p>
                        </div>

                        <div>
                            <label
                                htmlFor="lease-monthly-rent"
                                className={labelClass}
                            >
                                Monthly rent (€)
                            </label>
                            <input
                                id="lease-monthly-rent"
                                type="number"
                                required
                                min="0"
                                step="0.01"
                                value={monthlyRent}
                                onChange={(event) =>
                                    setMonthlyRent(event.target.value)
                                }
                                placeholder="e.g. 650.00"
                                disabled={submitting}
                                className={inputClass}
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="lease-security-deposit"
                                className={labelClass}
                            >
                                Security deposit (€)
                            </label>
                            <input
                                id="lease-security-deposit"
                                type="number"
                                required
                                min="0"
                                step="0.01"
                                value={securityDeposit}
                                onChange={(event) =>
                                    setSecurityDeposit(event.target.value)
                                }
                                placeholder="e.g. 650.00"
                                disabled={submitting}
                                className={inputClass}
                            />
                        </div>
                    </div>
                </>
            )}

            {error && (
                <p role="alert" className="mt-4 text-sm text-red-700">
                    {error}
                </p>
            )}

            <div className="mt-5 flex justify-end gap-3">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={submitting}
                    className="rounded-lg border border-[#d5dfd8] bg-white px-4 py-2.5 text-sm font-medium text-[#243b35] hover:bg-gray-50 disabled:opacity-60"
                >
                    Cancel
                </button>

                <button
                    type="submit"
                    disabled={
                        submitting ||
                        tenants.length === 0 ||
                        spaces.length === 0
                    }
                    className="inline-flex items-center gap-2 rounded-lg bg-[#14302b] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#20453d] disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <Plus className="h-4 w-4" />
                    {submitting ? "Creating lease..." : "Create lease"}
                </button>
            </div>
        </form>
    );
}
