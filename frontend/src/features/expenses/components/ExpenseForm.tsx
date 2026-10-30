import { useState, type FormEvent } from "react";
import { Plus, Save, X } from "lucide-react";

import type { PropertyWithSpaces } from "../../properties/propertyDirectory";
import { todayLocalDateString } from "../../../lib/dates";
import { moneyInputFromCents, parseMoneyToCents } from "../../../lib/money";
import { expenseCategoryLabel } from "../status";
import type { CreateExpenseRequest, ExpenseCategory, ExpenseResponse } from "../types";
import FormField from "../../../components/ui/FormField";
import { inputClass } from "../../../components/ui/formStyles";

interface ExpenseFormProps {
    properties: PropertyWithSpaces[];
    // When set, the form edits this expense. The API can't move an expense, so its property and space are read-only.
    expense?: ExpenseResponse;
    submitting: boolean;
    onSubmit: (request: CreateExpenseRequest) => Promise<void>;
    onCancel: () => void;
}

const categories = Object.keys(expenseCategoryLabel) as ExpenseCategory[];

// Same field styling as the maintenance and lease forms.
export default function ExpenseForm({ properties, expense, submitting, onSubmit, onCancel }: ExpenseFormProps) {
    const editing = expense !== undefined;

    const [propertyId, setPropertyId] = useState(expense ? String(expense.propertyId) : "");
    // "" means the whole property.
    const [spaceId, setSpaceId] = useState(expense?.spaceId != null ? String(expense.spaceId) : "");
    const [category, setCategory] = useState<ExpenseCategory | "">(expense?.category ?? "");
    const [amount, setAmount] = useState(expense ? moneyInputFromCents(expense.amountCents) : "");
    const [expenseDate, setExpenseDate] = useState(expense?.expenseDate ?? todayLocalDateString());
    const [vendorName, setVendorName] = useState(expense?.vendorName ?? "");
    const [description, setDescription] = useState(expense?.description ?? "");
    const [error, setError] = useState<string | null>(null);

    const selectedProperty = properties.find((property) => property.id === Number(propertyId));

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);

        if (!selectedProperty) {
            setError("Select the property this expense is for.");
            return;
        }

        if (!category) {
            setError("Select a category.");
            return;
        }

        const amountCents = parseMoneyToCents(amount);
        if (amountCents === null) {
            setError("Enter an amount of 0 or more, with at most 2 decimal places.");
            return;
        }

        if (!expenseDate) {
            setError("Select the date of the expense.");
            return;
        }

        try {
            await onSubmit({
                propertyId: selectedProperty.id,
                spaceId: spaceId ? Number(spaceId) : null,
                category,
                vendorName: vendorName.trim() || null,
                description: description.trim() || null,
                amountCents,
                expenseDate,
            });
        } catch (submitError) {
            setError(
                submitError instanceof Error
                    ? submitError.message
                    : "Failed to save the expense.",
            );
        }
    }

    const spaceName = selectedProperty?.spaces.find((space) => space.id === Number(spaceId))?.name ?? "Whole property";

    return (
        <form onSubmit={handleSubmit} className="rounded-xl border border-[#d5dfd8] bg-[#f8faf8] p-5 sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                    <h3 className="font-semibold text-[#14302b]">
                        {editing ? `Edit expense #${expense.id}` : "New expense"}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                        {editing
                            ? `${selectedProperty?.name ?? `Property #${expense.propertyId}`} · ${spaceName}`
                            : "Record a cost against one of your properties."}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={submitting}
                    aria-label={editing ? "Cancel editing expense" : "Cancel new expense"}
                    className="rounded-md p-2 text-gray-500 transition hover:bg-white hover:text-[#14302b] disabled:opacity-60"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                {!editing && (
                    <>
                        <FormField htmlFor="expense-property" label="Property">
                            <select
                                id="expense-property"
                                required
                                value={propertyId}
                                onChange={(event) => {
                                    setPropertyId(event.target.value);
                                    setSpaceId("");
                                }}
                                disabled={submitting}
                                className={inputClass}
                            >
                                <option value="">Select a property</option>
                                {properties.map((property) => (
                                    <option key={property.id} value={property.id}>{property.name}</option>
                                ))}
                            </select>
                        </FormField>

                        <FormField htmlFor="expense-space" label="Space">
                            <select
                                id="expense-space"
                                value={spaceId}
                                onChange={(event) => setSpaceId(event.target.value)}
                                disabled={submitting || !selectedProperty}
                                className={inputClass}
                            >
                                <option value="">{selectedProperty ? "Whole property" : "Select a property first"}</option>
                                {selectedProperty?.spaces.map((space) => (
                                    <option key={space.id} value={space.id}>{space.name}</option>
                                ))}
                            </select>
                        </FormField>
                    </>
                )}

                <FormField htmlFor="expense-category" label="Category">
                    <select
                        id="expense-category"
                        required
                        value={category}
                        onChange={(event) => setCategory(event.target.value as ExpenseCategory | "")}
                        disabled={submitting}
                        className={inputClass}
                    >
                        <option value="">Select a category</option>
                        {categories.map((option) => (
                            <option key={option} value={option}>{expenseCategoryLabel[option]}</option>
                        ))}
                    </select>
                </FormField>

                <FormField htmlFor="expense-date" label="Date">
                    <input
                        id="expense-date"
                        type="date"
                        required
                        value={expenseDate}
                        onChange={(event) => setExpenseDate(event.target.value)}
                        disabled={submitting}
                        className={inputClass}
                    />
                </FormField>

                <FormField htmlFor="expense-amount" label="Amount (€)">
                    <input
                        id="expense-amount"
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={amount}
                        onChange={(event) => setAmount(event.target.value)}
                        placeholder="0.00"
                        disabled={submitting}
                        className={inputClass}
                    />
                </FormField>

                <FormField htmlFor="expense-vendor" label="Vendor" hint="optional">
                    <input
                        id="expense-vendor"
                        maxLength={150}
                        value={vendorName}
                        onChange={(event) => setVendorName(event.target.value)}
                        placeholder="e.g. Dublin Plumbing"
                        disabled={submitting}
                        className={inputClass}
                    />
                </FormField>

                <FormField htmlFor="expense-description" label="Description" hint="optional" className="sm:col-span-2">
                    <textarea
                        id="expense-description"
                        rows={3}
                        maxLength={500}
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                        placeholder="What was this for?"
                        disabled={submitting}
                        className={`${inputClass} resize-y`}
                    />
                </FormField>
            </div>

            {error && (
                <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>
            )}

            <div className="mt-5 flex justify-end gap-3">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={submitting}
                    className="rounded-lg border border-[#d5dfd8] bg-white px-4 py-2.5 text-sm font-medium text-[#243b35] transition hover:bg-gray-50 disabled:opacity-60"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#14302b] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#20453d] disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {editing ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    {editing
                        ? (submitting ? "Saving..." : "Save changes")
                        : (submitting ? "Adding expense..." : "Add expense")}
                </button>
            </div>
        </form>
    );
}
