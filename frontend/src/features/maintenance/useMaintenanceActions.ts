import { useState } from "react";

import { useConfirm } from "../../components/confirm/useConfirm";
import { useOrganization } from "../organizations/useOrganization";
import {
    cancelMaintenance,
    createMaintenanceRequest,
    resolveMaintenance,
    startProgress,
} from "./api/maintenanceApi";
import type { CreateMaintenanceRequest, MaintenanceResponse } from "./types";

export type MaintenanceAction = "start" | "resolve" | "cancel";

// State and handlers behind creating a request and the Start work / Resolve / Cancel buttons.
// Same messages and confirmation as the property page's Maintenance tab.
export function useMaintenanceActions({
    onCreated,
    onUpdated,
}: {
    onCreated: (request: MaintenanceResponse) => void;
    onUpdated: (request: MaintenanceResponse) => void;
}) {
    const { activeOrganization } = useOrganization();
    const confirm = useConfirm();

    const [creating, setCreating] = useState(false);
    const [busyRequestId, setBusyRequestId] = useState<number | null>(null);
    // Action failures only; create failures are thrown so the open form can show them.
    const [actionError, setActionError] = useState<string | null>(null);

    async function createRequest(request: CreateMaintenanceRequest): Promise<void> {
        if (!activeOrganization) {
            throw new Error("An active organization is required.");
        }

        setCreating(true);
        setActionError(null);

        try {
            const createdRequest = await createMaintenanceRequest(activeOrganization.id, request);
            onCreated(createdRequest);
        } finally {
            setCreating(false);
        }
    }

    async function runAction(maintenance: MaintenanceResponse, action: MaintenanceAction): Promise<void> {
        if (!activeOrganization) {
            setActionError("An active organization is required.");
            return;
        }

        if (action === "cancel") {
            const confirmed = await confirm({
                title: `Cancel maintenance request #${maintenance.id}?`,
                message: `"${maintenance.title}" will be marked as cancelled.`,
                confirmLabel: "Cancel request",
                cancelLabel: "Keep request",
                tone: "danger",
            });
            if (!confirmed) {
                return;
            }
        }

        setBusyRequestId(maintenance.id);
        setActionError(null);

        try {
            const send = { start: startProgress, resolve: resolveMaintenance, cancel: cancelMaintenance }[action];
            onUpdated(await send(activeOrganization.id, maintenance.id));
        } catch (requestError) {
            setActionError(
                requestError instanceof Error
                    ? requestError.message
                    : `Failed to ${action} maintenance request.`,
            );
        } finally {
            setBusyRequestId(null);
        }
    }

    return {
        creating,
        busyRequestId,
        actionError,
        clearActionError: () => setActionError(null),
        createRequest,
        runAction,
    };
}
