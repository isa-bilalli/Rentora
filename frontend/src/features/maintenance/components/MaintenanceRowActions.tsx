import type { MaintenanceAction } from "../useMaintenanceActions";
import type { MaintenanceResponse } from "../types";

interface MaintenanceRowActionsProps {
    request: MaintenanceResponse;
    // The request an action is running for.
    busyRequestId: number | null;
    // True while any action or a create is running; every row's buttons are disabled meanwhile.
    disabled: boolean;
    onAction: (action: MaintenanceAction) => void;
}

// Open: Start work / Cancel. In progress: Resolve / Cancel. Resolved or cancelled: a dash.
// Same buttons and labels as the property page's Maintenance tab.
export default function MaintenanceRowActions({ request, busyRequestId, disabled, onAction }: MaintenanceRowActionsProps) {
    const busy = busyRequestId === request.id;
    const cancelButton = (
        <button
            type="button"
            disabled={disabled}
            onClick={() => onAction("cancel")}
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
        >
            Cancel
        </button>
    );

    if (request.status === "OPEN") {
        return (
            <div className="flex flex-wrap gap-2">
                <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onAction("start")}
                    className="rounded-lg border border-[#d5dfd8] bg-white px-3 py-2 text-xs font-medium text-[#14302b] hover:bg-[#f8faf8] disabled:opacity-50"
                >
                    {busy ? "Saving..." : "Start work"}
                </button>
                {cancelButton}
            </div>
        );
    }

    if (request.status === "IN_PROGRESS") {
        return (
            <div className="flex flex-wrap gap-2">
                <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onAction("resolve")}
                    className="rounded-lg border border-[#d5dfd8] bg-[#e8efe9] px-3 py-2 text-xs font-medium text-[#14302b] hover:bg-[#dce8df] disabled:opacity-50"
                >
                    {busy ? "Saving..." : "Resolve"}
                </button>
                {cancelButton}
            </div>
        );
    }

    return <span className="text-sm text-gray-400">—</span>;
}
