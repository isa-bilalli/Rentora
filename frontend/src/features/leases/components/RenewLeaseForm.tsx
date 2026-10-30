
import { useState, type FormEvent } from "react";
import { CalendarDays, Save, X } from "lucide-react";

import { addDays, addYears } from "../../../lib/dates";
import { formatLongDate } from "../../../lib/format";
import { moneyInputFromCents, parseMoneyToCents } from "../../../lib/money";
import type { LeaseResponse, RenewLeaseRequest } from "../types";
import FormField from "../../../components/ui/FormField";
import { inputClass } from "../../../components/ui/formStyles";

interface RenewLeaseFormProps {
    lease: LeaseResponse;
    submitting: boolean;
    onSubmit: (request: RenewLeaseRequest) => Promise<void>;
    onCancel: () => void;
}

export default function RenewLeaseForm({
    lease,
    submitting,
    onSubmit,
    onCancel,
}: RenewLeaseFormProps) {
    const minimumStartDate = addDays(lease.endDate, 1);

    const [startDate, setStartDate] = useState(minimumStartDate);
    const [endDate, setEndDate] = useState(() =>
        addYears(minimumStartDate, 1),
    );
    const [monthlyRent, setMonthlyRent] = useState(
        moneyInputFromCents(lease.monthlyRentCents),
    );
    const [securityDeposit, setSecurityDeposit] = useState(
        moneyInputFromCents(lease.securityDepositCents),
    );
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);

        if (!startDate || startDate <= lease.endDate) {
            setError(
                "The renewal must start after the existing lease ends.",
            );
            return;
        }

        if (!endDate || endDate <= startDate) {
            setError("The end date must be after the start date.");
            return;
        }

        const monthlyRentCents = parseMoneyToCents(monthlyRent);
        const securityDepositCents = parseMoneyToCents(securityDeposit);

        if (monthlyRentCents === null) {
            setError(
                "Enter a valid monthly rent with up to two decimal places.",
            );
            return;
        }

        if (securityDepositCents === null) {
            setError(
                "Enter a valid security deposit with up to two decimal places.",
            );
            return;
        }

        try {
            await onSubmit({
                startDate,
                endDate,
                monthlyRentCents,
                securityDepositCents,
            });
        } catch (submitError) {
            setError(
                submitError instanceof Error
                    ? submitError.message
                    : "Failed to renew lease.",
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
                    <h3 className="font-semibold text-[#14302b]">
                        Renew lease #{lease.id}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                        The renewed lease must start after the current
                        lease's end date.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={onCancel}
                    disabled={submitting}
                    aria-label="Cancel lease renewal"
                    className="rounded-md p-2 text-gray-500 hover:bg-white hover:text-[#14302b] disabled:opacity-60"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            <div className="mb-4 rounded-lg border border-[#e1e8e3] bg-white px-3 py-3 text-sm text-gray-600">
                <p>
                    Existing lease ends:{" "}
                    <strong className="text-[#14302b]">
                        {formatLongDate(lease.endDate)}
                    </strong>
                </p>
                <p className="mt-1">
                    The renewal begins no earlier than{" "}
                    <strong className="text-[#14302b]">
                        {formatLongDate(minimumStartDate)}
                    </strong>.
                </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <FormField htmlFor="renew-start-date" label="Renewal start date">
                    <input
                        id="renew-start-date"
                        type="date"
                        required
                        min={minimumStartDate}
                        value={startDate}
                        onChange={(event) => {
                            const nextStartDate = event.target.value;
                            setStartDate(nextStartDate);

                            if (nextStartDate && endDate <= nextStartDate) {
                                setEndDate(addYears(nextStartDate, 1));
                            }
                        }}
                        disabled={submitting}
                        className={inputClass}
                    />
                </FormField>

                <FormField htmlFor="renew-end-date" label="Renewal end date">
                    <input
                        id="renew-end-date"
                        type="date"
                        required
                        min={startDate ? addDays(startDate, 1) : undefined}
                        value={endDate}
                        onChange={(event) => setEndDate(event.target.value)}
                        disabled={submitting}
                        className={inputClass}
                    />
                </FormField>

                <FormField htmlFor="renew-monthly-rent" label="Monthly rent (€)">
                    <input
                        id="renew-monthly-rent"
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={monthlyRent}
                        onChange={(event) =>
                            setMonthlyRent(event.target.value)
                        }
                        disabled={submitting}
                        className={inputClass}
                    />
                </FormField>

                <FormField htmlFor="renew-security-deposit" label="Security deposit (€)">
                    <input
                        id="renew-security-deposit"
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={securityDeposit}
                        onChange={(event) =>
                            setSecurityDeposit(event.target.value)
                        }
                        disabled={submitting}
                        className={inputClass}
                    />
                </FormField>
            </div>

            <div className="mt-4 flex items-start gap-2 rounded-lg border border-[#e1e8e3] bg-white px-3 py-3 text-xs text-gray-500">
                <CalendarDays className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                    Rent and deposit are entered in euros and submitted
                    to the backend in cents.
                </p>
            </div>

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
                    disabled={submitting}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#14302b] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#20453d] disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <Save className="h-4 w-4" />
                    {submitting ? "Renewing..." : "Renew lease"}
                </button>
            </div>
        </form>
    );
}
