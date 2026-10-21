import { useState } from "react";

import { useConfirm } from "../../components/confirm/useConfirm";
import { formatMoney } from "../../lib/format";
import { useOrganization } from "../organizations/useOrganization";
import { markExpensePaid, voidExpense } from "./api/expenseApi";
import type { ExpenseResponse } from "./types";

export type ExpenseAction = "pay" | "void";

// State and handlers behind the Mark paid and Void buttons. Neither action can be undone through the API,
// so both ask for confirmation first.
export function useExpenseActions(onUpdated: (expense: ExpenseResponse, action: ExpenseAction) => void) {
    const { activeOrganization } = useOrganization();
    const confirm = useConfirm();

    const [busy, setBusy] = useState<{ expenseId: number; action: ExpenseAction } | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);

    async function runAction(expense: ExpenseResponse, action: ExpenseAction): Promise<void> {
        if (!activeOrganization) {
            setActionError("An active organization is required.");
            return;
        }

        const amount = formatMoney(expense.amountCents);
        const confirmed = await confirm(action === "pay"
            ? {
                title: `Mark expense #${expense.id} as paid?`,
                message: `The ${amount} will be recorded as paid. This can't be undone.`,
                confirmLabel: "Mark paid",
            }
            : {
                title: `Void expense #${expense.id}?`,
                message: expense.paid
                    ? `It is already marked paid, and once voided the ${amount} no longer counts. This can't be undone.`
                    : `The ${amount} will no longer count. This can't be undone.`,
                confirmLabel: "Void expense",
                tone: "danger",
            });
        if (!confirmed) {
            return;
        }

        setBusy({ expenseId: expense.id, action });
        setActionError(null);

        try {
            const updated = action === "pay"
                ? await markExpensePaid(activeOrganization.id, expense.id)
                : await voidExpense(activeOrganization.id, expense.id);
            onUpdated(updated, action);
        } catch (requestError) {
            setActionError(
                requestError instanceof Error
                    ? requestError.message
                    : action === "pay" ? "Failed to mark the expense as paid." : "Failed to void the expense.",
            );
        } finally {
            setBusy(null);
        }
    }

    return {
        busy,
        actionError,
        clearActionError: () => setActionError(null),
        runAction,
    };
}
