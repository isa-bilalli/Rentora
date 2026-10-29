import { apiRequest } from "../../../lib/api/client";
import type { PageResponse } from "../../../lib/api/page";
import type { SortState } from "../../../lib/sort";
import type { ExpenseState } from "../status";
import type {
    CreateExpenseRequest,
    ExpenseListItem,
    ExpenseResponse,
    ExpenseSortField,
    ExpenseStateTotal,
    UpdateExpenseRequest,
} from "../types";

export interface ExpensePageQuery {
    // Every state or property when left out.
    state?: ExpenseState;
    propertyId?: number;
    page: number;
    size: number;
    // Newest expense first when left out.
    sort?: SortState<ExpenseSortField>;
}

// One page of the Expenses page, filtered and sorted on the server.
export async function getExpensePage(organizationId: number, { state, propertyId, page, size, sort }: ExpensePageQuery): Promise<PageResponse<ExpenseListItem>> {
    const query = new URLSearchParams({ page: String(page), size: String(size) });
    if (state) query.set("state", state);
    if (propertyId !== undefined) query.set("propertyId", String(propertyId));
    if (sort) {
        query.set("sort", sort.key);
        query.set("direction", sort.direction.toUpperCase());
    }
    return apiRequest<PageResponse<ExpenseListItem>>(`/api/organizations/${organizationId}/expenses/page?${query}`, {
        authenticated: true,
    });
}

// Count and sum per state and property, for the Expenses page's filter counts and total.
export async function getExpenseSummary(organizationId: number): Promise<ExpenseStateTotal[]> {
    return apiRequest<ExpenseStateTotal[]>(`/api/organizations/${organizationId}/expenses/summary`, {
        authenticated: true,
    });
}

export async function getExpenses(organizationId: number): Promise<ExpenseResponse[]> {
    return apiRequest<ExpenseResponse[]>(`/api/organizations/${organizationId}/expenses`, {
        authenticated: true,
    });
}

export async function getPropertyExpenses(organizationId: number, propertyId: number): Promise<ExpenseResponse[]> {
    return apiRequest<ExpenseResponse[]>(`/api/organizations/${organizationId}/expenses/properties/${propertyId}`, {
        authenticated: true,
    });
}

// Recorded expenses only: voided ones are left out whichever value `paid` has.
export async function getExpensesByPaid(organizationId: number, paid: boolean): Promise<ExpenseResponse[]> {
    return apiRequest<ExpenseResponse[]>(`/api/organizations/${organizationId}/expenses/paid?paid=${paid}`, {
        authenticated: true,
    });
}

export async function getExpense(organizationId: number, expenseId: number): Promise<ExpenseResponse> {
    return apiRequest<ExpenseResponse>(`/api/organizations/${organizationId}/expenses/${expenseId}`, {
        authenticated: true,
    });
}

export async function createExpense(organizationId: number, request: CreateExpenseRequest): Promise<ExpenseResponse> {
    return apiRequest<ExpenseResponse>(`/api/organizations/${organizationId}/expenses`, {
        method: "POST",
        body: JSON.stringify(request),
        authenticated: true,
    });
}

export async function updateExpense(organizationId: number, expenseId: number, request: UpdateExpenseRequest): Promise<ExpenseResponse> {
    return apiRequest<ExpenseResponse>(`/api/organizations/${organizationId}/expenses/${expenseId}`, {
        method: "PATCH",
        body: JSON.stringify(request),
        authenticated: true,
    });
}

export async function markExpensePaid(organizationId: number, expenseId: number): Promise<ExpenseResponse> {
    return apiRequest<ExpenseResponse>(`/api/organizations/${organizationId}/expenses/${expenseId}/pay`, {
        method: "POST",
        authenticated: true,
    });
}

export async function voidExpense(organizationId: number, expenseId: number): Promise<ExpenseResponse> {
    return apiRequest<ExpenseResponse>(`/api/organizations/${organizationId}/expenses/${expenseId}/void`, {
        method: "POST",
        authenticated: true,
    });
}
