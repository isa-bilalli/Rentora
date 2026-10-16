import type { PaymentResponse } from "./types";

// The backend has no OVERDUE status; the UI derives it from a PENDING payment whose due date has passed.
export type PaymentDisplayStatus = "OVERDUE" | "PENDING" | "PAID" | "VOIDED";

export const PAYMENT_DISPLAY_STATUSES: PaymentDisplayStatus[] = ["OVERDUE", "PENDING", "PAID", "VOIDED"];

// today: "YYYY-MM-DD", compared as a string like the API's dates.
export function getPaymentDisplayStatus(payment: PaymentResponse, today: string): PaymentDisplayStatus {
    if (payment.status === "PENDING" && payment.dueDate < today) {
        return "OVERDUE";
    }
    return payment.status;
}

export const paymentStatusLabel: Record<PaymentDisplayStatus, string> = {
    OVERDUE: "Overdue",
    PENDING: "Pending",
    PAID: "Paid",
    VOIDED: "Voided",
};

// Same wording as the options in RecordPaymentForm.
const paymentMethodLabels: Record<string, string> = {
    CASH: "Cash",
    BANK_TRANSFER: "Bank transfer",
    CARD: "Card",
    OTHER: "Other",
};

export function formatPaymentMethod(method: string | null): string {
    if (!method) return "—";
    return paymentMethodLabels[method] ?? method;
}
