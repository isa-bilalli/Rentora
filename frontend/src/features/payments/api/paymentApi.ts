import { apiRequest } from "../../../lib/api/client";
import type { PaymentResponse } from "../types";

export async function getPayments(organizationId: number): Promise<PaymentResponse[]> {
    return apiRequest<PaymentResponse[]>(`/api/organizations/${organizationId}/payments`, {
            authenticated: true,
        },
    );
}
