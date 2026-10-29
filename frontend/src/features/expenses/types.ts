import type { ExpenseState } from "./status";

export type ExpenseCategory =
    | "MAINTENANCE"
    | "UTILITIES"
    | "INSURANCE"
    | "TAX"
    | "CLEANING"
    | "RENOVATION"
    | "OTHER";

// Whether an expense still counts. Whether it has been paid is the separate `paid` flag.
// Only RECORDED expenses can be paid, updated or voided.
export type ExpenseStatus = "RECORDED" | "VOIDED";

// One row of the Expenses page, with its state and the names shown beside it. spaceName is null for an
// expense about the whole property.
export interface ExpenseListItem {
    expense: ExpenseResponse;
    state: ExpenseState;
    propertyName: string;
    spaceName: string | null;
}

// How many expenses one property has in one state, and what they add up to.
export interface ExpenseStateTotal {
    state: ExpenseState;
    propertyId: number;
    expenses: number;
    amountCents: number;
}

// The Expenses page's sortable columns, as the server names them.
export type ExpenseSortField = "DATE" | "AMOUNT";

export interface ExpenseResponse {
    id: number;
    organizationId: number;
    propertyId: number;
    // null when the expense is for the whole property rather than one space.
    spaceId: number | null;
    category: ExpenseCategory;
    vendorName: string | null;
    description: string | null;
    amountCents: number;
    // "YYYY-MM-DD"
    expenseDate: string;
    paid: boolean;
    status: ExpenseStatus;
    // null if the user who recorded it has been deleted.
    recordedByUserId: number | null;
    createdAt: string;
    updatedAt: string;
}

export interface CreateExpenseRequest {
    propertyId: number;
    spaceId?: number | null;
    category: ExpenseCategory;
    vendorName?: string | null;
    description?: string | null;
    amountCents: number;
    // "YYYY-MM-DD"
    expenseDate: string;
}

// Only the fields you send change; a missing field keeps its value.
// That also means a vendor name or description can't be cleared through this request.
export interface UpdateExpenseRequest {
    category?: ExpenseCategory;
    vendorName?: string;
    description?: string;
    amountCents?: number;
    // "YYYY-MM-DD"
    expenseDate?: string;
}
