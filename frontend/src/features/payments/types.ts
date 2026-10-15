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
