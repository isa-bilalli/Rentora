import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";
import { Outlet } from "react-router";

import { getMyOrganizations } from "./api/organizationApi";
import { OrganizationContext, type OrganizationStatus } from "./OrganizationContext";
import type { Organization } from "./types";

const ACTIVE_ORGANIZATION_KEY = "activeOrganizationId";

export function OrganizationProvider() {
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [activeOrganization, setActiveOrganizationState] =
        useState<Organization | null>(null);
    const [status, setStatus] = useState<OrganizationStatus>("loading");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function loadOrganizations() {
            try {
                setStatus("loading");
                setError(null);

                const result = await getMyOrganizations();
                if (cancelled) return;

                setOrganizations(result);

                if (result.length === 0) {
                    localStorage.removeItem(ACTIVE_ORGANIZATION_KEY);
                    setActiveOrganizationState(null);
                    setStatus("ready");
                    return;
                }

                const storedValue = localStorage.getItem(ACTIVE_ORGANIZATION_KEY);
                const storedId = storedValue ? Number(storedValue) : NaN;
                const selectedOrganization =
                    result.find((organization) => organization.id === storedId) ??
                    result[0];

                setActiveOrganizationState(selectedOrganization);
                localStorage.setItem(
                    ACTIVE_ORGANIZATION_KEY,
                    String(selectedOrganization.id),
                );
                setStatus("ready");
            } catch (loadError) {
                if (cancelled) return;

                setOrganizations([]);
                setActiveOrganizationState(null);
                setStatus("error");
                setError(
                    loadError instanceof Error
                        ? loadError.message
                        : "Failed to load organizations",
                );
            }
        }

        void loadOrganizations();
        return () => {
            cancelled = true;
        };
    }, []);

    const setActiveOrganization = useCallback(
        (organizationId: number) => {
            const organization = organizations.find(
                (item) => item.id === organizationId,
            );

            if (!organization) return;

            setActiveOrganizationState(organization);
            localStorage.setItem(
                ACTIVE_ORGANIZATION_KEY,
                String(organization.id),
            );
        },
        [organizations],
    );

    const value = useMemo(
        () => ({
            organizations,
            activeOrganization,
            status,
            error,
            setActiveOrganization,
        }),
        [
            organizations,
            activeOrganization,
            status,
            error,
            setActiveOrganization,
        ],
    );

    if (status === "loading") {
        return (
            <OrganizationContext.Provider value={value}>
                <div className="flex min-h-screen items-center justify-center">
                    Loading organization...
                </div>
            </OrganizationContext.Provider>
        );
    }

    if (status === "error") {
        return (
            <OrganizationContext.Provider value={value}>
                <div className="flex min-h-screen flex-col items-center justify-center gap-2 px-6 text-center">
                    <p className="font-medium">Failed to load organizations.</p>
                    {error && <p className="text-sm text-gray-500">{error}</p>}
                </div>
            </OrganizationContext.Provider>
        );
    }

    return (
        <OrganizationContext.Provider value={value}>
            <Outlet />
        </OrganizationContext.Provider>
    );
}
