import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { Plus, Receipt } from "lucide-react";
import { createExpense, getExpenses, updateExpense } from "../api/expenseApi";
import type { CreateExpenseRequest, ExpenseResponse } from "../types";
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
import { listPropertiesWithSpaces, loadPropertyDirectory, type PropertyDirectory } from "../../properties/propertyDirectory";
import { useOrgQuery } from "../../../hooks/useOrgQuery";
import { useTableSort } from "../../../hooks/useTableSort";
import { formatDate, formatMoney } from "../../../lib/format";
import type { SortColumns, SortState } from "../../../lib/sort";
import PageHeader from "../../../components/ui/PageHeader";
import EmptyState from "../../../components/ui/EmptyState";
import FilterGroup from "../../../components/ui/FilterGroup";
import SortableHeader from "../../../components/ui/SortableHeader";
import StatusBadge from "../../../components/ui/StatusBadge";
import StatusNotice from "../../../components/ui/StatusNotice";

interface ExpenseRow {
    expense: ExpenseResponse;
    state: ExpenseState;
    propertyName: string;
    // null for an expense about the whole property rather than one space.
    spaceName: string | null;
}

interface ExpensesData {
    rows: ExpenseRow[];
    // Kept so new or edited expenses can be shown with names, and for the property lists.
    directory: PropertyDirectory;
}

// Which form is open above the list, if any.
type FormState = { mode: "create" } | { mode: "edit"; expenseId: number } | null;

type StateFilter = ExpenseState | "ALL";
// A property ID, or every property.
type PropertyFilter = number | "ALL";

const NO_ROWS: ExpenseRow[] = [];

function matchesState(row: ExpenseRow, state: StateFilter): boolean {
    return state === "ALL" || row.state === state;
}

function matchesProperty(row: ExpenseRow, propertyId: PropertyFilter): boolean {
    return propertyId === "ALL" || row.expense.propertyId === propertyId;
}

function toRow(expense: ExpenseResponse, { propertyById, spaceById }: PropertyDirectory): ExpenseRow {
    return {
        expense,
        state: getExpenseState(expense),
        propertyName: propertyById.get(expense.propertyId)?.name ?? `Property #${expense.propertyId}`,
        spaceName: expense.spaceId === null ? null : (spaceById.get(expense.spaceId)?.name ?? `Space #${expense.spaceId}`),
    };
}

// Newest first; same-day expenses in the order they were recorded, latest first.
function newestFirst(a: ExpenseRow, b: ExpenseRow): number {
    return b.expense.expenseDate.localeCompare(a.expense.expenseDate) || b.expense.id - a.expense.id;
}

type SortKey = "date" | "amount";

const sortColumns: SortColumns<ExpenseRow, SortKey> = {
    date: { value: (row) => row.expense.expenseDate, firstDirection: "desc" },
    amount: { value: (row) => row.expense.amountCents, firstDirection: "desc" },
};

const initialSort: SortState<SortKey> = { key: "date", direction: "desc" };

async function loadExpenses(organizationId: number): Promise<ExpensesData> {
    const [expenses, directory] = await Promise.all([
        getExpenses(organizationId),
        loadPropertyDirectory(organizationId),
    ]);

    return {
        rows: expenses.map((expense) => toRow(expense, directory)),
        directory,
    };
}

export default function ExpensesPage() {
    const { organizationId, data, loading, error, setData } = useOrgQuery(loadExpenses);
    const rows = data?.rows ?? NO_ROWS;
    const properties = useMemo(() => (data ? listPropertiesWithSpaces(data.directory) : []), [data]);
    const loadError = organizationId === undefined
        ? "Select an organization to view its expenses."
        : error;
    const [stateFilter, setStateFilter] = useState<StateFilter>("ALL");
    const [propertyFilter, setPropertyFilter] = useState<PropertyFilter>("ALL");
    const [form, setForm] = useState<FormState>(null);
    const [saving, setSaving] = useState(false);
    const formRef = useRef<HTMLDivElement>(null);
    const [notice, setNotice] = useState<string | null>(null);

    // Paying or voiding can move an expense out of the current filter, so the page says what happened.
    const expenseActions = useExpenseActions((updated, action) => {
        setData((current) => ({
            ...current,
            rows: current.rows.map((row) => (row.expense.id === updated.id ? toRow(updated, current.directory) : row)),
        }));
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

    // Errors are thrown on to the form, which shows them.
    async function handleSubmitExpense(request: CreateExpenseRequest): Promise<void> {
        if (organizationId === undefined || !form) {
            throw new Error("An active organization is required.");
        }

        setSaving(true);
        try {
            if (form.mode === "create") {
                const created = await createExpense(organizationId, request);
                setData((current) => ({
                    ...current,
                    rows: [...current.rows, toRow(created, current.directory)],
                }));
                // Show everything again if the current filters would hide what was just added.
                const createdState = getExpenseState(created);
                if ((stateFilter !== "ALL" && stateFilter !== createdState) || (propertyFilter !== "ALL" && propertyFilter !== created.propertyId)) {
                    setStateFilter("ALL");
                    setPropertyFilter("ALL");
                }
            } else {
                const updated = await updateExpense(organizationId, form.expenseId, {
                    category: request.category,
                    // Sent even when empty: the API only changes the fields it receives, so "" is how a value is cleared.
                    vendorName: request.vendorName ?? "",
                    description: request.description ?? "",
                    amountCents: request.amountCents,
                    expenseDate: request.expenseDate,
                });
                setData((current) => ({
                    ...current,
                    rows: current.rows.map((row) => (row.expense.id === updated.id ? toRow(updated, current.directory) : row)),
                }));
            }
            setForm(null);
        } finally {
            setSaving(false);
        }
    }

    // Each filter's counts respect the other filter, so a count always matches what choosing it shows.
    const stateCounts = useMemo(() => {
        const inProperty = rows.filter((row) => matchesProperty(row, propertyFilter));
        return Object.fromEntries(
            (["ALL", ...EXPENSE_STATES] as StateFilter[]).map((state) => [state, inProperty.filter((row) => matchesState(row, state)).length]),
        ) as Record<StateFilter, number>;
    }, [rows, propertyFilter]);

    const propertyCounts = useMemo(() => {
        const inState = rows.filter((row) => matchesState(row, stateFilter));
        const counts = new Map<PropertyFilter, number>([["ALL", inState.length]]);
        for (const row of inState) {
            counts.set(row.expense.propertyId, (counts.get(row.expense.propertyId) ?? 0) + 1);
        }
        return counts;
    }, [rows, stateFilter]);

    const visibleRows = rows.filter((row) => matchesState(row, stateFilter) && matchesProperty(row, propertyFilter));
    const { sortedRows, directionOf, toggle } = useTableSort(visibleRows, {
        columns: sortColumns,
        initial: initialSort,
        pageOrder: newestFirst,
    });

    // Voided expenses no longer count, so they never add to the total.
    const countedCents = visibleRows
        .filter((row) => row.state !== "VOIDED")
        .reduce((sum, row) => sum + row.expense.amountCents, 0);
    const voidedShown = visibleRows.some((row) => row.state === "VOIDED");

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
                            onChange={(event) => {
                                setPropertyFilter(event.target.value === "ALL" ? "ALL" : Number(event.target.value));
                                setNotice(null);
                            }}
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
                        onSelect={(state) => {
                            setStateFilter(state);
                            setNotice(null);
                        }}
                    />
                </div>

                {loading ? (
                    <div className="p-10 text-center text-sm text-gray-500">Loading expenses...</div>
                ) : rows.length === 0 && !loadError ? (
                    <EmptyState
                        icon={Receipt}
                        title="No expenses yet"
                        description="Costs such as repairs, utilities and insurance will appear here once they're recorded."
                    />
                ) : visibleRows.length === 0 ? (
                    <div className="p-10 text-center text-sm text-gray-500">No expenses match these filters.</div>
                ) : (
                    <>
                        <p className="border-b border-[#edf1ee] px-5 py-3 text-sm text-gray-500" aria-live="polite">
                            {visibleRows.length} {visibleRows.length === 1 ? "expense" : "expenses"} ·{" "}
                            <span className="font-semibold tabular-nums text-[#14302b]">{formatMoney(countedCents)}</span>
                            {voidedShown && " (voided expenses not counted)"}
                        </p>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1100px] text-left text-sm">
                                <thead className="bg-[#f8faf8] text-xs uppercase tracking-wide text-[#71847a]">
                                    <tr>
                                        <SortableHeader
                                            label="Date"
                                            direction={directionOf("date")}
                                            onToggle={() => toggle("date")}
                                            className="px-5 py-3 font-semibold"
                                        />
                                        <th className="px-5 py-3 font-semibold">Expense</th>
                                        <th className="px-5 py-3 font-semibold">Location</th>
                                        <SortableHeader
                                            label="Amount"
                                            direction={directionOf("amount")}
                                            onToggle={() => toggle("amount")}
                                            className="px-5 py-3 text-right font-semibold"
                                        />
                                        <th className="px-5 py-3 font-semibold">State</th>
                                        <th className="px-5 py-3 font-semibold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#edf1ee]">
                                    {sortedRows.map(({ expense, state, propertyName, spaceName }) => (
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
                    </>
                )}
            </section>
        </main>
    );
}
