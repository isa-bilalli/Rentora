import { apiRequest } from "../../../lib/api/client";
import type { PaymentResponse, RecordPaymentRequest } from "../types";

export async function getPayments(organizationId: number): Promise<PaymentResponse[]> {
    return apiRequest<PaymentResponse[]>(`/api/organizations/${organizationId}/payments`, {
            authenticated: true,
    });
}

export async function recordPayment(organizationId: number, paymentId: number, request: RecordPaymentRequest): Promise<PaymentResponse> {
    return apiRequest<PaymentResponse>(`/api/organizations/${organizationId}/payments/${paymentId}/record`, {
        method: "POST",
        body: JSON.stringify(request),
        authenticated: true,
    });
}

export async function voidPayment(organizationId: number, paymentId: number): Promise<PaymentResponse> {
    return apiRequest<PaymentResponse>(`/api/organizations/${organizationId}/payments/${paymentId}/void`, {
        method: "POST",
        authenticated: true,
    });
}