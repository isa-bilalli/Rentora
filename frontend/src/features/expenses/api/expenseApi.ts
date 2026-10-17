import { apiRequest } from "../../../lib/api/client";
import type { CreateExpenseRequest, ExpenseResponse, UpdateExpenseRequest } from "../types";

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
