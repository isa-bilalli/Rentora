import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { Plus, Receipt } from "lucide-react";
import { createExpense, getExpensePage, getExpenseSummary, updateExpense } from "../api/expenseApi";
import type { CreateExpenseRequest, ExpenseListItem, ExpenseSortField, ExpenseStateTotal } from "../types";
import ExpenseForm from "../components/ExpenseForm";
import ExpenseRowActions from "../components/ExpenseRowActions";
import { useExpenseActions } from "../useExpenseActions";
import {
    EXPENSE_STATES,
    expenseCategoryLabel,
    expenseStateLabel,
    expenseStateTone,
    getExpenseState,
    type ExpenseState,
} from "../status";
import { listPropertiesWithSpaces, loadPropertyDirectory } from "../../properties/propertyDirectory";
import { useOrgQuery } from "../../../hooks/useOrgQuery";
import { formatDate, formatMoney } from "../../../lib/format";
import { nextSort, type SortDirection, type SortState } from "../../../lib/sort";
import PageHeader from "../../../components/ui/PageHeader";
import EmptyState from "../../../components/ui/EmptyState";
import FilterGroup from "../../../components/ui/FilterGroup";
import Pagination from "../../../components/ui/Pagination";
import SortableHeader from "../../../components/ui/SortableHeader";
import StatusBadge from "../../../components/ui/StatusBadge";
import StatusNotice from "../../../components/ui/StatusNotice";

// Which form is open above the list, if any.
type FormState = { mode: "create" } | { mode: "edit"; expenseId: number } | null;

type StateFilter = ExpenseState | "ALL";
// A property ID, or every property.
type PropertyFilter = number | "ALL";

const PAGE_SIZE = 25;
const NO_ROWS: ExpenseListItem[] = [];
const NO_TOTALS: ExpenseStateTotal[] = [];

// Newest expense first, the server's order when no sort is sent.
const initialSort: SortState<ExpenseSortField> = { key: "DATE", direction: "desc" };

// Latest or largest first on the first click.
const sortColumns: Record<ExpenseSortField, { firstDirection: SortDirection }> = {
    DATE: { firstDirection: "desc" },
    AMOUNT: { firstDirection: "desc" },
};

function matchesState(filter: StateFilter, state: ExpenseState): boolean {
    return filter === "ALL" || filter === state;
}

function matchesProperty(filter: PropertyFilter, propertyId: number): boolean {
    return filter === "ALL" || filter === propertyId;
}

// The server filters, sorts and pages the expenses; this page shows one page at a time, and works out the filter
// counts and the total from the server's count and sum for each state and property. The forms still need every
// property and its spaces, so it loads those too.
export default function ExpensesPage() {
    const [stateFilter, setStateFilter] = useState<StateFilter>("ALL");
    const [propertyFilter, setPropertyFilter] = useState<PropertyFilter>("ALL");
    const [page, setPage] = useState(0);
    const [sort, setSort] = useState(initialSort);
    // Bumped to load the page and the totals again (after adding or editing), or only the totals (after paying or voiding).
    const [reloadCount, setReloadCount] = useState(0);
    const [summaryReloadCount, setSummaryReloadCount] = useState(0);
    const [form, setForm] = useState<FormState>(null);
    const [saving, setSaving] = useState(false);
    const formRef = useRef<HTMLDivElement>(null);
    const [notice, setNotice] = useState<string | null>(null);

    const summaryQuery = useOrgQuery(getExpenseSummary, [reloadCount, summaryReloadCount]);
    const pageQuery = useOrgQuery(
        (organizationId) => getExpensePage(organizationId, {
            state: stateFilter === "ALL" ? undefined : stateFilter,
            propertyId: propertyFilter === "ALL" ? undefined : propertyFilter,
            page,
            size: PAGE_SIZE,
            sort,
        }),
        [stateFilter, propertyFilter, page, sort.key, sort.direction, reloadCount],
    );
    const directoryQuery = useOrgQuery(loadPropertyDirectory);

    const organizationId = pageQuery.organizationId;
    const totals = summaryQuery.data ?? NO_TOTALS;
    const pageData = pageQuery.data;
    const rows = pageData?.items ?? NO_ROWS;
    const properties = useMemo(
        () => (directoryQuery.data ? listPropertiesWithSpaces(directoryQuery.data) : []),
        [directoryQuery.data],
    );
    const loadError = organizationId === undefined
        ? "Select an organization to view its expenses."
        : summaryQuery.error ?? pageQuery.error ?? directoryQuery.error;
    const totalExpenses = summaryQuery.data?.reduce((total, row) => total + row.expenses, 0);

    // Paying or voiding can move an expense out of the current filter, so the page says what happened. The row
    // keeps its place (so rows don't jump under the pointer) unless it no longer matches the state filter.
    const expenseActions = useExpenseActions((updated, action) => {
        setSummaryReloadCount((count) => count + 1);
        const state = getExpenseState(updated);
        if (matchesState(stateFilter, state)) {
            pageQuery.setData((current) => ({
                ...current,
                items: current.items.map((item) => (item.expense.id === updated.id ? { ...item, expense: updated, state } : item)),
            }));
        } else if (rows.length === 1) {
            // Nothing left on this page: show the one before it, or load this one again for the rows that move up.
            if (page > 0) {
                setPage(page - 1);
            } else {
                setReloadCount((count) => count + 1);
            }
        } else {
            pageQuery.setData((current) => ({
                ...current,
                items: current.items.filter((item) => item.expense.id !== updated.id),
                totalItems: current.totalItems - 1,
                totalPages: Math.ceil((current.totalItems - 1) / current.size),
            }));
        }
        // A voided expense can't be edited any more, so close its edit form if it was open.
        if (action === "void") {
            setForm((current) => (current?.mode === "edit" && current.expenseId === updated.id ? null : current));
        }
        const what = `expense #${updated.id} (${formatMoney(updated.amountCents)}, ${updated.vendorName || expenseCategoryLabel[updated.category]})`;
        setNotice(action === "pay" ? `Marked ${what} as paid.` : `Voided ${what}. It no longer counts toward totals.`);
    });
    const actionsDisabled = saving || expenseActions.busy !== null;

    const editingExpense = form?.mode === "edit"
        ? rows.find((row) => row.expense.id === form.expenseId)?.expense
        : undefined;
    const showForm = form?.mode === "create" || editingExpense !== undefined;

    // The form opens above the list, which can be far from the row whose Edit button was clicked.
    useEffect(() => {
        if (form) {
            formRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
    }, [form]);

    // Errors are thrown on to the form, which shows them. Afterwards the page and the totals load again.
    async function handleSubmitExpense(request: CreateExpenseRequest): Promise<void> {
        if (organizationId === undefined || !form) {
            throw new Error("An active organization is required.");
        }

        setSaving(true);
        try {
            if (form.mode === "create") {
                const created = await createExpense(organizationId, request);
                // Show everything again if the current filters would hide what was just added.
                if (!matchesState(stateFilter, getExpenseState(created)) || !matchesProperty(propertyFilter, created.propertyId)) {
                    setStateFilter("ALL");
                    setPropertyFilter("ALL");
                }
                setPage(0);
            } else {
                await updateExpense(organizationId, form.expenseId, {
                    category: request.category,
                    // Sent even when empty: the API only changes the fields it receives, so "" is how a value is cleared.
                    vendorName: request.vendorName ?? "",
                    description: request.description ?? "",
                    amountCents: request.amountCents,
                    expenseDate: request.expenseDate,
                });
            }
            setForm(null);
            setReloadCount((count) => count + 1);
        } finally {
            setSaving(false);
        }
    }

    // Each filter's counts respect the other filter, so a count always matches what choosing it shows.
    const stateCounts = useMemo(() => {
        const inProperty = totals.filter((row) => matchesProperty(propertyFilter, row.propertyId));
        return Object.fromEntries(
            (["ALL", ...EXPENSE_STATES] as StateFilter[]).map((state) => [
                state,
                inProperty.filter((row) => matchesState(state, row.state)).reduce((total, row) => total + row.expenses, 0),
            ]),
        ) as Record<StateFilter, number>;
    }, [totals, propertyFilter]);

    const propertyCounts = useMemo(() => {
        const inState = totals.filter((row) => matchesState(stateFilter, row.state));
        const counts = new Map<PropertyFilter, number>([["ALL", inState.reduce((total, row) => total + row.expenses, 0)]]);
        for (const row of inState) {
            counts.set(row.propertyId, (counts.get(row.propertyId) ?? 0) + row.expenses);
        }
        return counts;
    }, [totals, stateFilter]);

    // Voided expenses no longer count, so they never add to the total.
    const shownTotals = totals.filter((row) => matchesState(stateFilter, row.state) && matchesProperty(propertyFilter, row.propertyId));
    const countedCents = shownTotals
        .filter((row) => row.state !== "VOIDED")
        .reduce((sum, row) => sum + row.amountCents, 0);
    const voidedShown = shownTotals.some((row) => row.state === "VOIDED");

    // Any change to what's shown starts again at the first page.
    function chooseState(state: StateFilter) {
        setStateFilter(state);
        setPage(0);
        setNotice(null);
    }

    function chooseProperty(propertyId: PropertyFilter) {
        setPropertyFilter(propertyId);
        setPage(0);
        setNotice(null);
    }

    function toggleSort(field: ExpenseSortField) {
        setSort((current) => nextSort(current, field, sortColumns, initialSort) ?? initialSort);
        setPage(0);
    }

    const directionOf = (field: ExpenseSortField) => (sort.key === field ? sort.direction : null);

    return (
        <main className="mx-auto w-full max-w-7xl space-y-6 p-5 md:p-8">
            <PageHeader
                eyebrow="RENTORA / FINANCE"
                title="Expenses"
                description="Costs recorded against your properties."
                actions={
                    <button
                        type="button"
                        onClick={() => {
                            setNotice(null);
                            expenseActions.clearActionError();
                            setForm((current) => (current?.mode === "create" ? null : { mode: "create" }));
                        }}
                        disabled={actionsDisabled || properties.length === 0}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#14302b] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#20453d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d4a94f] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <Plus className="h-4 w-4" />
                        {form?.mode === "create" ? "Close form" : "New expense"}
                    </button>
                }
            />

            {loadError && (
                <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                    {loadError}
                </div>
            )}

            <StatusNotice message={notice} onDismiss={() => setNotice(null)} />

            {expenseActions.actionError && (
                <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                    {expenseActions.actionError}
                </div>
            )}

            {showForm && (
                <div ref={formRef}>
                    <ExpenseForm
                        key={editingExpense ? editingExpense.id : "create"}
                        properties={properties}
                        expense={editingExpense}
                        submitting={saving}
                        onSubmit={handleSubmitExpense}
                        onCancel={() => setForm(null)}
                    />
                </div>
            )}

            <section className="overflow-hidden rounded-xl border border-[#e0e7e2] bg-white">
                <div className="space-y-3 border-b border-[#edf1ee] p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <label htmlFor="expense-property-filter" className="w-16 shrink-0 text-xs font-semibold uppercase tracking-wide text-[#71847a]">
                            Property
                        </label>
                        <select
                            id="expense-property-filter"
                            value={propertyFilter}
                            onChange={(event) => chooseProperty(event.target.value === "ALL" ? "ALL" : Number(event.target.value))}
                            className="w-full rounded-lg border border-[#dce4de] bg-white px-3 py-2 text-sm text-[#243b35] outline-none focus:border-[#14302b] focus:ring-2 focus:ring-[#14302b]/10 sm:max-w-xs"
                        >
                            <option value="ALL">All properties ({propertyCounts.get("ALL") ?? 0})</option>
                            {properties.map((property) => (
                                <option key={property.id} value={property.id}>
                                    {property.name} ({propertyCounts.get(property.id) ?? 0})
                                </option>
                            ))}
                        </select>
                    </div>
                    <FilterGroup
                        label="State"
                        options={["ALL", ...EXPENSE_STATES] as StateFilter[]}
                        optionLabel={(state) => (state === "ALL" ? "All" : expenseStateLabel[state])}
                        counts={stateCounts}
                        selected={stateFilter}
                        onSelect={chooseState}
                    />
                </div>

                {pageQuery.loading ? (
                    <div className="p-10 text-center text-sm text-gray-500">Loading expenses...</div>
                ) : totalExpenses === 0 && !loadError ? (
                    <EmptyState
                        icon={Receipt}
                        title="No expenses yet"
                        description="Costs such as repairs, utilities and insurance will appear here once they're recorded."
                    />
                ) : rows.length === 0 && page > 0 ? (
                    // E.g. after switching organization while on a later page.
                    <EmptyState
                        title="This page is empty"
                        action={
                            <button
                                type="button"
                                onClick={() => setPage(0)}
                                className="inline-flex items-center gap-2 rounded-lg bg-[#14302b] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#20453d]"
                            >
                                Go to the first page
                            </button>
                        }
                    />
                ) : rows.length === 0 ? (
                    !loadError && <div className="p-10 text-center text-sm text-gray-500">No expenses match these filters.</div>
                ) : (
                    <>
                        {pageData && (
                            <p className="border-b border-[#edf1ee] px-5 py-3 text-sm text-gray-500" aria-live="polite">
                                {pageData.totalItems} {pageData.totalItems === 1 ? "expense" : "expenses"} ·{" "}
                                <span className="font-semibold tabular-nums text-[#14302b]">{formatMoney(countedCents)}</span>
                                {voidedShown && " (voided expenses not counted)"}
                            </p>
                        )}
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1100px] text-left text-sm">
                                <thead className="bg-[#f8faf8] text-xs uppercase tracking-wide text-[#71847a]">
                                    <tr>
                                        <SortableHeader
                                            label="Date"
                                            direction={directionOf("DATE")}
                                            onToggle={() => toggleSort("DATE")}
                                            className="px-5 py-3 font-semibold"
                                        />
                                        <th className="px-5 py-3 font-semibold">Expense</th>
                                        <th className="px-5 py-3 font-semibold">Location</th>
                                        <SortableHeader
                                            label="Amount"
                                            direction={directionOf("AMOUNT")}
                                            onToggle={() => toggleSort("AMOUNT")}
                                            className="px-5 py-3 text-right font-semibold"
                                        />
                                        <th className="px-5 py-3 font-semibold">State</th>
                                        <th className="px-5 py-3 font-semibold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#edf1ee]">
                                    {rows.map(({ expense, state, propertyName, spaceName }) => (
                                        <tr key={expense.id} className="transition hover:bg-[#fafcfb]">
                                            <td className="whitespace-nowrap px-5 py-4 text-[#42574e]">
                                                {formatDate(expense.expenseDate)}
                                            </td>
                                            <td className="max-w-sm px-5 py-4">
                                                <p className="font-medium text-[#14302b]">{expenseCategoryLabel[expense.category]}</p>
                                                {(expense.vendorName || expense.description) && (
                                                    <p className="mt-1 truncate text-xs text-gray-500" title={[expense.vendorName, expense.description].filter(Boolean).join(" · ")}>
                                                        {[expense.vendorName, expense.description].filter(Boolean).join(" · ")}
                                                    </p>
                                                )}
                                                <p className="mt-1 text-xs text-gray-400">Expense #{expense.id}</p>
                                            </td>
                                            <td className="px-5 py-4">
                                                <Link
                                                    to={`/app/properties/${expense.propertyId}`}
                                                    className="text-[#42574e] hover:text-[#14302b] hover:underline"
                                                >
                                                    {propertyName}
                                                </Link>
                                                <p className="mt-1 text-xs text-gray-500">{spaceName ?? "Whole property"}</p>
                                            </td>
                                            <td className={`whitespace-nowrap px-5 py-4 text-right font-medium tabular-nums ${state === "VOIDED" ? "text-gray-400 line-through" : "text-[#14302b]"}`}>
                                                {formatMoney(expense.amountCents)}
                                            </td>
                                            <td className="px-5 py-4">
                                                <StatusBadge tone={expenseStateTone[state]}>{expenseStateLabel[state]}</StatusBadge>
                                            </td>
                                            <td className="px-5 py-4">
                                                <ExpenseRowActions
                                                    expenseId={expense.id}
                                                    state={state}
                                                    busy={expenseActions.busy}
                                                    disabled={actionsDisabled}
                                                    onEdit={() => {
                                                        setNotice(null);
                                                        expenseActions.clearActionError();
                                                        setForm({ mode: "edit", expenseId: expense.id });
                                                    }}
                                                    onPay={() => {
                                                        setNotice(null);
                                                        void expenseActions.runAction(expense, "pay");
                                                    }}
                                                    onVoid={() => {
                                                        setNotice(null);
                                                        void expenseActions.runAction(expense, "void");
                                                    }}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {pageData && (
                            <Pagination
                                page={pageData.page}
                                size={pageData.size}
                                itemCount={rows.length}
                                totalItems={pageData.totalItems}
                                totalPages={pageData.totalPages}
                                onPageChange={setPage}
                                noun={{ one: "expense", other: "expenses" }}
                            />
                        )}
                    </>
                )}
            </section>
        </main>
    );
}
