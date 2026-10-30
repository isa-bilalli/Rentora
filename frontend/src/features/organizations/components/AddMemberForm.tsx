import { useState, type FormEvent } from "react";
import { UserPlus, X } from "lucide-react";

import { ApiError } from "../../../lib/api/client";
import type { AddMemberRequest } from "../types";
import FormField from "../../../components/ui/FormField";
import { inputClass } from "../../../components/ui/formStyles";

interface AddMemberFormProps {
    submitting: boolean;
    onSubmit: (request: AddMemberRequest) => Promise<void>;
    onCancel: () => void;
}

const roleOptions: { value: AddMemberRequest["role"]; label: string; description: string }[] = [
    {
        value: "MEMBER",
        label: "Member",
        description: "Day-to-day work: properties, tenants, leases, payments, expenses and maintenance.",
    },
    {
        value: "MANAGER",
        label: "Manager",
        description: "Everything a member can do, plus adding people and deleting, voiding, ending or cancelling.",
    },
];

export default function AddMemberForm({ submitting, onSubmit, onCancel }: AddMemberFormProps) {
    const [email, setEmail] = useState("");
    const [role, setRole] = useState<AddMemberRequest["role"]>("MEMBER");
    const [emailError, setEmailError] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setEmailError(null);
        setError(null);

        try {
            await onSubmit({ email: email.trim(), role });
        } catch (submitError) {
            if (submitError instanceof ApiError && submitError.fieldErrors.email) {
                setEmailError(submitError.fieldErrors.email);
            } else {
                setError(submitError instanceof Error ? submitError.message : "Failed to add this person.");
            }
        }
    }

    return (
        <form onSubmit={handleSubmit} className="rounded-xl border border-[#d5dfd8] bg-[#f8faf8] p-5 sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                    <h2 className="font-semibold text-[#14302b]">Add a member</h2>
                    <p className="mt-1 text-sm text-gray-500">
                        They need a Rentora account already. Adding them gives them access straight away.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={submitting}
                    aria-label="Close the add member form"
                    className="rounded-md p-2 text-gray-500 transition hover:bg-white hover:text-[#14302b] disabled:opacity-60"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <FormField htmlFor="member-email" label="Email">
                    <input
                        id="member-email"
                        type="email"
                        required
                        autoComplete="off"
                        value={email}
                        onChange={(event) => {
                            setEmail(event.target.value);
                            setEmailError(null);
                        }}
                        placeholder="The email they sign in with"
                        disabled={submitting}
                        aria-invalid={emailError ? true : undefined}
                        aria-describedby={emailError ? "member-email-error" : undefined}
                        className={`${inputClass} ${emailError ? "border-red-400" : ""}`}
                    />
                    {emailError && <p id="member-email-error" className="mt-1.5 text-xs text-red-700">{emailError}</p>}
                </FormField>

                <FormField htmlFor="member-role" label="Role">
                    <select
                        id="member-role"
                        value={role}
                        onChange={(event) => setRole(event.target.value as AddMemberRequest["role"])}
                        disabled={submitting}
                        aria-describedby="member-role-description"
                        className={inputClass}
                    >
                        {roleOptions.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                    </select>
                    <p id="member-role-description" className="mt-1.5 text-xs text-gray-500">
                        {roleOptions.find((option) => option.value === role)?.description}
                    </p>
                </FormField>
            </div>

            {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}

            <div className="mt-5 flex justify-end gap-3">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={submitting}
                    className="rounded-lg border border-[#d5dfd8] bg-white px-4 py-2.5 text-sm font-medium text-[#243b35] transition hover:bg-gray-50 disabled:opacity-60"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#14302b] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#20453d] disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <UserPlus className="h-4 w-4" />
                    {submitting ? "Adding..." : "Add member"}
                </button>
            </div>
        </form>
    );
}
