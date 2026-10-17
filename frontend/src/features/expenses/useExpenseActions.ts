import { useState } from "react";

import { formatMoney } from "../../lib/format";
import { useOrganization } from "../organizations/useOrganization";
import { markExpensePaid, voidExpense } from "./api/expenseApi";
import type { ExpenseResponse } from "./types";

export type ExpenseAction = "pay" | "void";

// State and handlers behind the Mark paid and Void buttons. Neither action can be undone through the API,
// so both ask for confirmation first.
export function useExpenseActions(onUpdated: (expense: ExpenseResponse, action: ExpenseAction) => void) {
    const { activeOrganization } = useOrganization();

    const [busy, setBusy] = useState<{ expenseId: number; action: ExpenseAction } | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);

    async function runAction(expense: ExpenseResponse, action: ExpenseAction): Promise<void> {
        if (!activeOrganization) {
            setActionError("An active organization is required.");
            return;
        }

        const amount = formatMoney(expense.amountCents);
        const question = action === "pay"
            ? `Mark expense #${expense.id} (${amount}) as paid? This can't be undone.`
            : expense.paid
                ? `Void expense #${expense.id} (${amount})? It is already marked paid, and once voided it no longer counts. This can't be undone.`
                : `Void expense #${expense.id} (${amount})? It will no longer count. This can't be undone.`;
        if (!window.confirm(question)) {
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
