import { useState, type FormEvent } from "react";
import { Pencil, X } from "lucide-react";

import { formatDate, formatMoney } from "../../../lib/format";
import { paymentMethodLabels } from "../status";
import type { PaymentMethod, PaymentResponse, RecordPaymentRequest } from "../types";
import FormField from "../../../components/ui/FormField";
import { inputClass } from "../../../components/ui/formStyles";

function getLocalDateTimeInputValue(): string {
    const now = new Date();
    const offsetMinutes = now.getTimezoneOffset();
    const localTime = new Date(now.getTime() - offsetMinutes * 60_000);
    return localTime.toISOString().slice(0, 16);
}

export default function RecordPaymentForm({
    payment,
    submitting,
    onSubmit,
    onCancel,
}: {
    payment: PaymentResponse;
    submitting: boolean;
    onSubmit: (request: RecordPaymentRequest) => Promise<void>;
    onCancel: () => void;
}) {
    const [paidAt, setPaidAt] = useState(getLocalDateTimeInputValue);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">("");
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);

        if (!paidAt) {
            setError("Select the date and time the payment was received.");
            return;
        }

        if (!paymentMethod) {
            setError("Select a payment method.");
            return;
        }

        const paidAtDate = new Date(paidAt);
        if (Number.isNaN(paidAtDate.getTime())) {
            setError("Enter a valid payment date and time.");
            return;
        }

        try {
            await onSubmit({
                // ISO UTC timestamps are valid OffsetDateTime values for Spring.
                paidAt: paidAtDate.toISOString(),
                paymentMethod,
            });
        } catch (submitError) {
            setError(
                submitError instanceof Error
                    ? submitError.message
                    : "Failed to record payment.",
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
                        Record payment #{payment.id}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Record receipt of {formatMoney(payment.amountCents)} for the payment due {formatDate(payment.dueDate)}.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={submitting}
                    aria-label="Cancel recording payment"
                    className="rounded-md p-2 text-gray-500 hover:bg-white hover:text-[#14302b] disabled:opacity-60"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <FormField htmlFor="payment-paid-at" label="Date and time received">
                    <input
                        id="payment-paid-at"
                        type="datetime-local"
                        required
                        value={paidAt}
                        onChange={(event) => setPaidAt(event.target.value)}
                        disabled={submitting}
                        className={inputClass}
                    />
                </FormField>

                <FormField htmlFor="payment-method" label="Payment method">
                    <select
                        id="payment-method"
                        required
                        value={paymentMethod}
                        onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod | "")}
                        disabled={submitting}
                        className={inputClass}
                    >
                        <option value="">Select payment method</option>
                        {(Object.keys(paymentMethodLabels) as PaymentMethod[]).map((method) => (
                            <option key={method} value={method}>
                                {paymentMethodLabels[method]}
                            </option>
                        ))}
                    </select>
                </FormField>
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
                    <Pencil className="h-4 w-4" />
                    {submitting ? "Recording..." : "Confirm payment"}
                </button>
            </div>
        </form>
    );
}
