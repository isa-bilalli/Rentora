import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";

import { getMyOrganizations } from "./api/organizationApi";
import type { Organization } from "./types";

import { Outlet } from "react-router";

type OrganizationStatus =
    | "loading"
    | "ready"
    | "error";

interface OrganizationContextValue {
    organizations: Organization[];
    activeOrganization: Organization | null;
    status: OrganizationStatus;
    error: string | null;
    setActiveOrganization: (organizationId: number) => void;
}

export const OrganizationContext =
    createContext<OrganizationContextValue | undefined>(
        undefined,
    );

const ACTIVE_ORGANIZATION_KEY =
    "activeOrganizationId";

export function OrganizationProvider() {
    const [organizations, setOrganizations] =
        useState<Organization[]>([]);

    const [activeOrganization, setActiveOrganizationState] =
        useState<Organization | null>(null);

    const [status, setStatus] =
        useState<OrganizationStatus>("loading");

    const [error, setError] =
        useState<string | null>(null);

    useEffect(() => {
        async function loadOrganizations() {
            try {
                setStatus("loading");
                setError(null);

                const result =
                    await getMyOrganizations();

                setOrganizations(result);

                if (result.length === 0) {
                    localStorage.removeItem(
                        ACTIVE_ORGANIZATION_KEY,
                    );

                    setActiveOrganizationState(null);
                    setStatus("ready");

                    return;
                }

                const storedId =
                    Number(
                        localStorage.getItem(
                            ACTIVE_ORGANIZATION_KEY,
                        ),
                    );

                const storedOrganization =
                    result.find(
                        (organization) =>
                            organization.id === storedId,
                    );

                const selectedOrganization =
                    storedOrganization ?? result[0];

                setActiveOrganizationState(
                    selectedOrganization,
                );

                localStorage.setItem(
                    ACTIVE_ORGANIZATION_KEY,
                    selectedOrganization.id.toString(),
                );

                setStatus("ready");
            } catch (error) {
                setOrganizations([]);
                setActiveOrganizationState(null);
                setStatus("error");

                setError(
                    error instanceof Error
                        ? error.message
                        : "Failed to load organizations",
                );
            }
        }

        void loadOrganizations();
    }, []);

    const setActiveOrganization = useCallback(
        (organizationId: number) => {
            const organization =
                organizations.find(
                    (item) => item.id === organizationId,
                );

            if (!organization) {
                return;
            }

            setActiveOrganizationState(
                organization,
            );

            localStorage.setItem(
                ACTIVE_ORGANIZATION_KEY,
                organization.id.toString(),
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
                <div className="flex min-h-screen items-center justify-center">
                    Failed to load organizations.
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

export function useOrganization() {
    const context =
        useContext(OrganizationContext);

    if (context === undefined) {
        throw new Error(
            "useOrganization must be used within an OrganizationProvider",
        );
    }

    return context;
}