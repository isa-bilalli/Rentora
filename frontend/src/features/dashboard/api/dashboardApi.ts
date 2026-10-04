import { apiRequest } from "../../../lib/api/client";
import type { DashboardResponse } from "../types";
import type { Organization } from "../../organizations/types";

export async function getDashboard(
    organizationId: number,
): Promise<DashboardResponse> {
    return apiRequest<DashboardResponse>(
        `/api/organizations/${organizationId}/dashboard`,
        {
            method: "GET",
            authenticated: true,
        },
    );
}