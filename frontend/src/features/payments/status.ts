import type { StatusBadgeTone } from "../../components/ui/StatusBadge";
import type { PaymentMethod, PaymentResponse } from "./types";

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

export const paymentStatusTone: Record<PaymentDisplayStatus, StatusBadgeTone> = {
    OVERDUE: "danger",
    PENDING: "warning",
    PAID: "success",
    VOIDED: "neutral",
};

// Display names for payment methods, used by RecordPaymentForm's options and wherever a method is shown.
export const paymentMethodLabels: Record<PaymentMethod, string> = {
    CASH: "Cash",
    BANK_TRANSFER: "Bank transfer",
    CARD: "Card",
    OTHER: "Other",
};

// The API types a payment's method as a plain string, so an unknown value is shown as it is.
export function formatPaymentMethod(method: string | null): string {
    if (!method) return "—";
    return paymentMethodLabels[method as PaymentMethod] ?? method;
}
