import { Pencil } from "lucide-react";

import { useRolePermissions } from "../../organizations/useRolePermissions";
import type { ExpenseState } from "../status";
import type { ExpenseAction } from "../useExpenseActions";

interface ExpenseRowActionsProps {
    expenseId: number;
    state: ExpenseState;
    // The action running right now, if any; it decides which button shows "Saving..." or "Voiding...".
    busy: { expenseId: number; action: ExpenseAction } | null;
    // True while any action or form save is running; every row's buttons are disabled meanwhile.
    disabled: boolean;
    onEdit: () => void;
    onPay: () => void;
    onVoid: () => void;
}

// Unpaid: Edit / Mark paid / Void. Paid: Edit / Void. Voided: a dash, since the API won't change it.
// Void is for managers and owners only (docs/ROLES.md).
export default function ExpenseRowActions({ expenseId, state, busy, disabled, onEdit, onPay, onVoid }: ExpenseRowActionsProps) {
    const { canManage } = useRolePermissions();

    if (state === "VOIDED") {
        return <span className="text-sm text-gray-400">—</span>;
    }

    const busyWith = busy?.expenseId === expenseId ? busy.action : null;

    return (
        <div className="flex flex-wrap gap-2">
            <button
                type="button"
                onClick={onEdit}
                disabled={disabled}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#d5dfd8] bg-white px-3 py-2 text-xs font-medium text-[#14302b] hover:bg-[#f8faf8] disabled:opacity-50"
            >
                <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                Edit
            </button>
            {state === "UNPAID" && (
                <button
                    type="button"
                    onClick={onPay}
                    disabled={disabled}
                    className="rounded-lg border border-[#d5dfd8] bg-[#e8efe9] px-3 py-2 text-xs font-medium text-[#14302b] hover:bg-[#dce8df] disabled:opacity-50"
                >
                    {busyWith === "pay" ? "Saving..." : "Mark paid"}
                </button>
            )}
            {canManage && (
                <button
                    type="button"
                    onClick={onVoid}
                    disabled={disabled}
                    className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                >
                    {busyWith === "void" ? "Voiding..." : "Void"}
                </button>
            )}
        </div>
    );
}
