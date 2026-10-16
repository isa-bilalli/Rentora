import { createContext } from "react";

import type { Organization } from "./types";

export type OrganizationStatus = "loading" | "ready" | "error";

export interface OrganizationContextValue {
    organizations: Organization[];
    activeOrganization: Organization | null;
    status: OrganizationStatus;
    error: string | null;
    setActiveOrganization: (organizationId: number) => void;
}

export const OrganizationContext =
    createContext<OrganizationContextValue | undefined>(undefined);
