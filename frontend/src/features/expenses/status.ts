import type { StatusBadgeTone } from "../../components/ui/StatusBadge";
import type { ExpenseCategory, ExpenseResponse } from "./types";

// One state for display, combining the backend's `status` and `paid` flag. A voided expense no longer counts,
// whether or not it had been paid.
export type ExpenseState = "UNPAID" | "PAID" | "VOIDED";

export const EXPENSE_STATES: ExpenseState[] = ["UNPAID", "PAID", "VOIDED"];

export function getExpenseState(expense: ExpenseResponse): ExpenseState {
    if (expense.status === "VOIDED") return "VOIDED";
    return expense.paid ? "PAID" : "UNPAID";
}

export const expenseStateLabel: Record<ExpenseState, string> = {
    UNPAID: "Unpaid",
    PAID: "Paid",
    VOIDED: "Voided",
};

export const expenseStateTone: Record<ExpenseState, StatusBadgeTone> = {
    UNPAID: "warning",
    PAID: "success",
    VOIDED: "neutral",
};

export const expenseCategoryLabel: Record<ExpenseCategory, string> = {
    MAINTENANCE: "Maintenance",
    UTILITIES: "Utilities",
    INSURANCE: "Insurance",
    TAX: "Tax",
    CLEANING: "Cleaning",
    RENOVATION: "Renovation",
    OTHER: "Other",
};
