import { apiRequest } from "../../../lib/api/client";
import { listFilterQuery, type ListFilter } from "../../../lib/api/listFilter";
import type { PageResponse } from "../../../lib/api/page";
import type { SortState } from "../../../lib/sort";
import type { PaymentDisplayStatus } from "../status";
import type { PaymentResponse, PaymentSortField, PaymentSummary, RecordPaymentRequest } from "../types";

// Every payment in the organization, or only those of one property's or one tenant's leases.
export async function getPayments(organizationId: number, filter?: ListFilter): Promise<PaymentResponse[]> {
    return apiRequest<PaymentResponse[]>(`/api/organizations/${organizationId}/payments${listFilterQuery(filter)}`, {
            authenticated: true,
    });
}

// One page of a Payments tab. With a sort, by that column (ties in the tab's own order); without one, most urgent
// first: soonest due while unpaid, latest first once paid or voided.
export async function getPaymentPage(
    organizationId: number,
    status: PaymentDisplayStatus,
    page: number,
    size: number,
    sort?: SortState<PaymentSortField>,
): Promise<PageResponse<PaymentResponse>> {
    const query = new URLSearchParams({ status, page: String(page), size: String(size) });
    if (sort) {
        query.set("sort", sort.key);
        query.set("direction", sort.direction.toUpperCase());
    }
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