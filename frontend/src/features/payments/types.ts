import type { PaymentDisplayStatus } from "./status";

export type PaymentStatus = "PENDING" | "PAID" | "VOIDED";

export interface PaymentResponse {
    id: number;
    organizationId: number;
    leaseId: number;
    dueDate: string;
    amountCents: number;
    status: PaymentStatus;
    paidAt: string | null;
    paymentMethod: string | null;
    recordedByUserId: number | null;
    createdAt: string;
    updatedAt: string;
}

export type PaymentMethod = | "CASH" | "BANK_TRANSFER" | "CARD" | "OTHER";

// The Payments page's sortable columns, as the server names them.
export type PaymentSortField = "DUE_DATE" | "AMOUNT" | "PAID_AT";

// Count and total per Payments tab, over all of the organization's payments.
export type PaymentSummary = Record<PaymentDisplayStatus, { count: number; amountCents: number }>;

export interface RecordPaymentRequest{
    paidAt: string;
    paymentMethod: PaymentMethod;
}