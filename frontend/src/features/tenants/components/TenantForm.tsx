import { useState, type FormEvent } from "react";
import { Plus, Save, X } from "lucide-react";
import type {
    CreateTenantRequest,
    TenantResponse,
    TenantType,
} from "../types";
import FormField from "../../../components/ui/FormField";
import { inputClass } from "../../../components/ui/formStyles";

interface TenantFormProps {
    initialTenant?: TenantResponse;
    submitting: boolean;
    onSubmit: (request: CreateTenantRequest) => Promise<void>;
    onCancel: () => void;
}

export default function TenantForm({
    initialTenant,
    submitting,
    onSubmit,
    onCancel,
}: TenantFormProps) {
    const [type, setType] = useState<TenantType>(
        initialTenant?.type ?? "INDIVIDUAL",
    );
    const [firstName, setFirstName] = useState(initialTenant?.firstName ?? "");
    const [lastName, setLastName] = useState(initialTenant?.lastName ?? "");
    const [companyName, setCompanyName] = useState(
        initialTenant?.companyName ?? "",
    );
    const [email, setEmail] = useState(initialTenant?.email ?? "");
    const [phone, setPhone] = useState(initialTenant?.phone ?? "");
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);

        if (type === "INDIVIDUAL" && (!firstName.trim() || !lastName.trim())) {
            setError("Enter both the tenant's first and last name.");
            return;
        }

        if (type === "COMPANY" && !companyName.trim()) {
            setError("Enter the company's name.");
            return;
        }

        try {
            await onSubmit({
                type,
                firstName:
                    type === "INDIVIDUAL" ? firstName.trim() : null,
                lastName:
                    type === "INDIVIDUAL" ? lastName.trim() : null,
                companyName:
                    type === "COMPANY" ? companyName.trim() : null,
                // For edits, empty strings let the current backend clear optional fields
                // because Tenant.update currently ignores null values.
                email: initialTenant ? email.trim() : email.trim() || null,
                phone: initialTenant ? phone.trim() : phone.trim() || null,
            });
        } catch (submitError) {
            setError(
                submitError instanceof Error
                    ? submitError.message
                    : "Unable to save the tenant.",
            );
        }
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="rounded-xl border border-[#d5dfd8] bg-[#f8faf8] p-5"
        >
            <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                    <h2 className="font-semibold text-[#14302b]">
                        {initialTenant ? "Edit tenant" : "Add tenant"}
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        {initialTenant
                            ? "Update this tenant's contact information."
                            : "Add an individual or company to your organization."}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={submitting}
                    aria-label="Cancel tenant form"
                    className="rounded-md p-2 text-gray-500 hover:bg-white hover:text-[#14302b] disabled:opacity-60"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <FormField htmlFor="tenant-type" label="Tenant type">
                    <select
                        id="tenant-type"
                        value={type}
                        onChange={(event) => {
                            const nextType = event.target.value as TenantType;
                            setType(nextType);
                            setError(null);
                            if (nextType === "INDIVIDUAL") setCompanyName("");
                            else {
                                setFirstName("");
                                setLastName("");
                            }
                        }}
                        disabled={submitting || Boolean(initialTenant)}
                        className={inputClass}
                    >
                        <option value="INDIVIDUAL">Individual</option>
                        <option value="COMPANY">Company</option>
                    </select>
                    {initialTenant && (
                        <p className="mt-1 text-xs text-gray-500">
                            Tenant type cannot be changed after creation.
                        </p>
                    )}
                </FormField>

                {type === "INDIVIDUAL" ? (
                    <>
                        <FormField htmlFor="tenant-first-name" label="First name">
                            <input
                                id="tenant-first-name"
                                required
                                maxLength={100}
                                autoComplete="given-name"
                                value={firstName}
                                onChange={(event) => setFirstName(event.target.value)}
                                disabled={submitting}
                                className={inputClass}
                            />
                        </FormField>
                        <FormField htmlFor="tenant-last-name" label="Last name">
                            <input
                                id="tenant-last-name"
                                required
                                maxLength={100}
                                autoComplete="family-name"
                                value={lastName}
                                onChange={(event) => setLastName(event.target.value)}
                                disabled={submitting}
                                className={inputClass}
                            />
                        </FormField>
                    </>
                ) : (
                    <FormField htmlFor="tenant-company-name" label="Company name">
                        <input
                            id="tenant-company-name"
                            required
                            maxLength={150}
                            autoComplete="organization"
                            value={companyName}
                            onChange={(event) => setCompanyName(event.target.value)}
                            disabled={submitting}
                            className={inputClass}
                        />
                    </FormField>
                )}

                <FormField htmlFor="tenant-email" label="Email" hint="optional">
                    <input
                        id="tenant-email"
                        type="email"
                        maxLength={255}
                        autoComplete="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        disabled={submitting}
                        className={inputClass}
                    />
                </FormField>
                <FormField htmlFor="tenant-phone" label="Phone" hint="optional">
                    <input
                        id="tenant-phone"
                        type="tel"
                        maxLength={50}
                        autoComplete="tel"
                        value={phone}
                        onChange={(event) => setPhone(event.target.value)}
                        disabled={submitting}
                        className={inputClass}
                    />
                </FormField>
            </div>

            {error && (
                <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
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
                    disabled={submitting}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#14302b] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#20453d] disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {initialTenant ? (
                        <Save className="h-4 w-4" />
                    ) : (
                        <Plus className="h-4 w-4" />
                    )}
                    {submitting
                        ? "Saving..."
                        : initialTenant
                          ? "Save changes"
                          : "Create tenant"}
                </button>
            </div>
        </form>
    );
}
