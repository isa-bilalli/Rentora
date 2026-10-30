
import { useState, type FormEvent } from "react";
import { Save, X } from "lucide-react";

import type {
    PropertyResponse,
    UpdatePropertyRequest,
} from "../../types";
import { checkPropertyFields, type PropertyFields as PropertyFieldValues } from "../../validation";
import PropertyFields from "./PropertyFields";

interface EditPropertyFormProps {
    property: PropertyResponse;
    submitting: boolean;
    onSubmit: (request: UpdatePropertyRequest) => Promise<void>;
    onCancel: () => void;
}

export default function EditPropertyForm({
    property,
    submitting,
    onSubmit,
    onCancel,
}: EditPropertyFormProps) {
    const [fields, setFields] = useState<PropertyFieldValues>({
        name: property.name,
        addressLine: property.addressLine,
        city: property.city,
        postalCode: property.postalCode ?? "",
        country: property.country,
    });
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);

        const checked = checkPropertyFields(
            fields,
            "Property name, address, city and country are required.",
        );

        if (!checked.ok) {
            setError(checked.error);
            return;
        }

        try {
            await onSubmit(checked.value);
        } catch (submitError) {
            setError(
                submitError instanceof Error
                    ? submitError.message
                    : "Failed to update property.",
            );
        }
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="rounded-xl border border-[#d5dfd8] bg-white p-5 shadow-sm sm:p-7"
        >
            <div className="mb-6 flex items-start justify-between gap-3">
                <div>
                    <h2 className="text-lg font-semibold text-[#14302b]">
                        Edit property
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Update the property's name and address details.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={onCancel}
                    disabled={submitting}
                    aria-label="Cancel editing property"
                    className="rounded-md p-2 text-gray-500 hover:bg-[#f8faf8] hover:text-[#14302b] disabled:opacity-60"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            <PropertyFields
                idPrefix="edit-property"
                mode="edit"
                values={fields}
                onChange={(field, value) =>
                    setFields((current) => ({ ...current, [field]: value }))
                }
                disabled={submitting}
            />

            {error && (
                <p role="alert" className="mt-4 text-sm text-red-700">
                    {error}
                </p>
            )}

            <div className="mt-6 flex justify-end gap-3">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={submitting}
                    className="rounded-lg border border-[#d5dfd8] bg-white px-4 py-2.5 text-sm font-medium text-[#243b35] hover:bg-gray-50 disabled:opacity-60"
                >
                    Cancel
                </button>

                <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#14302b] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#20453d] disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <Save className="h-4 w-4" />
                    {submitting ? "Saving..." : "Save changes"}
                </button>
            </div>
        </form>
    );
}
