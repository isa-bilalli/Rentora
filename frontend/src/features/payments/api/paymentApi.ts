import { apiRequest } from "../../../lib/api/client";
import type { PageResponse } from "../../../lib/api/page";
import type { PaymentDisplayStatus } from "../status";
import type { PaymentResponse, PaymentSummary, RecordPaymentRequest } from "../types";

// Every payment in the organization, or only those of leases on one property.
export async function getPayments(organizationId: number, propertyId?: number): Promise<PaymentResponse[]> {
    const query = propertyId === undefined ? "" : `?propertyId=${propertyId}`;
    return apiRequest<PaymentResponse[]>(`/api/organizations/${organizationId}/payments${query}`, {
            authenticated: true,
    });
}

// One page of a Payments tab, most urgent first: soonest due while unpaid, latest first once paid or voided.
export async function getPaymentPage(organizationId: number, status: PaymentDisplayStatus, page: number, size: number): Promise<PageResponse<PaymentResponse>> {
    const query = new URLSearchParams({ status, page: String(page), size: String(size) });
    return apiRequest<PageResponse<PaymentResponse>>(`/api/organizations/${organizationId}/payments/page?${query}`, {
        authenticated: true,
    });
}

export async function getPaymentSummary(organizationId: number): Promise<PaymentSummary> {
    return apiRequest<PaymentSummary>(`/api/organizations/${organizationId}/payments/summary`, {
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