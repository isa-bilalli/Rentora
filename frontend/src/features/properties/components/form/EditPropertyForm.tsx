
import { useState, type FormEvent } from "react";
import { Save, X } from "lucide-react";

import type {
    PropertyResponse,
    UpdatePropertyRequest,
} from "../../types";

interface EditPropertyFormProps {
    property: PropertyResponse;
    submitting: boolean;
    onSubmit: (request: UpdatePropertyRequest) => Promise<void>;
    onCancel: () => void;
}

const inputClass =
    "w-full rounded-lg border border-[#dce4de] bg-white px-3 py-2.5 text-sm text-[#243b35] outline-none transition placeholder:text-gray-400 focus:border-[#14302b] focus:ring-2 focus:ring-[#14302b]/10 disabled:cursor-not-allowed disabled:bg-gray-100";

const labelClass =
    "mb-1.5 block text-sm font-medium text-[#243b35]";

export default function EditPropertyForm({
    property,
    submitting,
    onSubmit,
    onCancel,
}: EditPropertyFormProps) {
    const [name, setName] = useState(property.name);
    const [addressLine, setAddressLine] = useState(property.addressLine);
    const [city, setCity] = useState(property.city);
    const [postalCode, setPostalCode] = useState(
        property.postalCode ?? "",
    );
    const [country, setCountry] = useState(property.country);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);

        const request: UpdatePropertyRequest = {
            name: name.trim(),
            addressLine: addressLine.trim(),
            city: city.trim(),
            postalCode: postalCode.trim(),
            country: country.trim(),
        };

        if (
            !request.name ||
            !request.addressLine ||
            !request.city ||
            !request.country
        ) {
            setError(
                "Property name, address, city and country are required.",
            );
            return;
        }

        if (request.name.length > 150) {
            setError("Property name cannot exceed 150 characters.");
            return;
        }

        if (request.addressLine.length > 255) {
            setError("Address cannot exceed 255 characters.");
            return;
        }

        if (request.city.length > 100) {
            setError("City cannot exceed 100 characters.");
            return;
        }

        if (request.postalCode.length > 20) {
            setError("Postal code cannot exceed 20 characters.");
            return;
        }

        if (request.country.length > 100) {
            setError("Country cannot exceed 100 characters.");
            return;
        }

        try {
            await onSubmit(request);
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

            <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                    <label htmlFor="edit-property-name" className={labelClass}>
                        Property name
                    </label>
                    <input
                        id="edit-property-name"
                        required
                        maxLength={150}
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        disabled={submitting}
                        className={inputClass}
                    />
                </div>

                <div className="sm:col-span-2">
                    <label htmlFor="edit-property-address" className={labelClass}>
                        Street address
                    </label>
                    <input
                        id="edit-property-address"
                        required
                        maxLength={255}
                        value={addressLine}
                        onChange={(event) =>
                            setAddressLine(event.target.value)
                        }
                        disabled={submitting}
                        className={inputClass}
                    />
                </div>

                <div>
                    <label htmlFor="edit-property-city" className={labelClass}>
                        City
                    </label>
                    <input
                        id="edit-property-city"
                        required
                        maxLength={100}
                        value={city}
                        onChange={(event) => setCity(event.target.value)}
                        disabled={submitting}
                        className={inputClass}
                    />
                </div>

                <div>
                    <label
                        htmlFor="edit-property-postal"
                        className={labelClass}
                    >
                        Postal code (optional)
                    </label>
                    <input
                        id="edit-property-postal"
                        maxLength={20}
                        value={postalCode}
                        onChange={(event) =>
                            setPostalCode(event.target.value)
                        }
                        disabled={submitting}
                        className={inputClass}
                    />
                </div>

                <div className="sm:col-span-2">
                    <label
                        htmlFor="edit-property-country"
                        className={labelClass}
                    >
                        Country
                    </label>
                    <input
                        id="edit-property-country"
                        required
                        maxLength={100}
                        value={country}
                        onChange={(event) => setCountry(event.target.value)}
                        disabled={submitting}
                        className={inputClass}
                    />
                </div>
            </div>

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
