import { useCallback, useEffect, useEffectEvent, useState } from "react";

import { useOrganization } from "../features/organizations/useOrganization";

interface Settled<T> {
    // The organization and keys the result was loaded for.
    requestKey: string;
    data: T | undefined;
    error: string | null;
}

export interface OrgQuery<T> {
    // undefined when the user has no active organization; nothing is loaded then.
    organizationId: number | undefined;
    data: T | undefined;
    loading: boolean;
    error: string | null;
    // Applies a local change (e.g. a newly created row) without refetching.
    setData: (update: (current: T) => T) => void;
}

// Loads data for the active organization and loads it again whenever the organization or one of `keys` changes.
// A response that arrives after either changed is ignored.
export function useOrgQuery<T>(
    load: (organizationId: number) => Promise<T>,
    // Anything else that decides what is loaded, e.g. a report's period or a property filter.
    keys: readonly (string | number | boolean | null | undefined)[] = [],
): OrgQuery<T> {
    const { activeOrganization } = useOrganization();
    const organizationId = activeOrganization?.id;
    const requestKey = organizationId === undefined ? null : JSON.stringify([organizationId, ...keys]);

    const [settled, setSettled] = useState<Settled<T> | null>(null);

    // Callers usually pass an inline or imported function; only the organization and keys should trigger a reload.
    const runLoad = useEffectEvent((id: number) => load(id));

    useEffect(() => {
        if (organizationId === undefined || requestKey === null) return;

        let cancelled = false;

        runLoad(organizationId).then(
            (data) => {
                if (!cancelled) setSettled({ requestKey, data, error: null });
            },
            (error: unknown) => {
                if (!cancelled) {
                    setSettled({
                        requestKey,
                        data: undefined,
                        error: error instanceof Error ? error.message : "Request failed",
                    });
                }
            },
        );

        return () => {
            cancelled = true;
        };
    }, [organizationId, requestKey]);

    const setData = useCallback((update: (current: T) => T) => {
        setSettled((previous) =>
            previous && previous.data !== undefined
                ? { ...previous, data: update(previous.data) }
                : previous,
        );
    }, []);

    // Loading is derived rather than stored: the request for this organization and these keys simply hasn't settled yet.
    const current = settled !== null && settled.requestKey === requestKey ? settled : null;

    return {
        organizationId,
        data: current?.data,
        loading: organizationId !== undefined && current === null,
        error: current?.error ?? null,
        setData,
    };
}
