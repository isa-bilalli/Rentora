
import { useState, type FormEvent } from "react";
import { Plus, Save, X } from "lucide-react";

import type {
    CreateSpaceRequest,
    SpaceResponse,
    SpaceType,
} from "../../types";
import { spaceTypeLabels } from "../../spaceLabels";
import { checkSpaceFields, spaceNameLimit, type SpaceMessages } from "../../validation";
import FormField from "../../../../components/ui/FormField";
import { inputClass } from "../../../../components/ui/formStyles";

interface CreateSpaceFormProps {
    submitting: boolean;
    initialSpace?: SpaceResponse;
    onSubmit: (request: CreateSpaceRequest) => Promise<void>;
    onCancel: () => void;
}

// The name input stops at the limit, so the too-long message can't come up from typing or pasting.
const spaceMessages: SpaceMessages = {
    nameMissing: "Space name is required.",
    nameTooLong: `Space name cannot exceed ${spaceNameLimit} characters.`,
    floor: "Floor must be a whole number.",
    area: "Area must be greater than zero.",
};

export default function CreateSpaceForm({
    submitting,
    initialSpace,
    onSubmit,
    onCancel,
}: CreateSpaceFormProps) {
    const isEditing = initialSpace !== undefined;

    const [name, setName] = useState(initialSpace?.name ?? "");
    const [type, setType] = useState<SpaceType>(
        initialSpace?.type ?? "RESIDENTIAL",
    );
    const [floor, setFloor] = useState(
        initialSpace?.floor == null ? "" : String(initialSpace.floor),
    );
    const [area, setArea] = useState(
        initialSpace?.area == null ? "" : String(initialSpace.area),
    );
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);

        const checked = checkSpaceFields({ name, type, floor, area }, spaceMessages);

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
                    : `Failed to ${isEditing ? "update" : "create"} space.`,
            );
        }
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="rounded-xl border border-[#d5dfd8] bg-[#f8faf8] p-5"
        >
            <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                    <h3 className="font-semibold text-[#14302b]">
                        {isEditing ? "Edit space" : "Add a space"}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                        {isEditing
                            ? "Update the details of this rentable space."
                            : "Define a rentable apartment, office, shop or other space."}
                    </p>
                </div>

                <button
                    type="button"
                    onClick={onCancel}
                    disabled={submitting}
                    aria-label={`Cancel ${isEditing ? "editing" : "adding"} space`}
                    className="rounded-md p-2 text-gray-500 hover:bg-white hover:text-[#14302b] disabled:opacity-60"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <FormField htmlFor="space-name" label="Space name">
                    <input
                        id="space-name"
                        required
                        maxLength={spaceNameLimit}
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder="e.g. Apartment 1"
                        className={inputClass}
                    />
                </FormField>

                <FormField htmlFor="space-type" label="Space type">
                    <select
                        id="space-type"
                        value={type}
                        onChange={(event) =>
                            setType(event.target.value as SpaceType)
                        }
                        className={inputClass}
                    >
                        {(Object.keys(spaceTypeLabels) as SpaceType[]).map((spaceType) => (
                            <option key={spaceType} value={spaceType}>
                                {spaceTypeLabels[spaceType]}
                            </option>
                        ))}
                    </select>
                </FormField>

                <FormField htmlFor="space-floor" label="Floor" hint="optional">
                    <input
                        id="space-floor"
                        type="number"
                        step="1"
                        value={floor}
                        onChange={(event) => setFloor(event.target.value)}
                        placeholder="e.g. 2"
                        className={inputClass}
                    />
                </FormField>

                <FormField htmlFor="space-area" label="Area (m²)" hint="optional">
                    <input
                        id="space-area"
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={area}
                        onChange={(event) => setArea(event.target.value)}
                        placeholder="e.g. 75.5"
                        className={inputClass}
                    />
                </FormField>
            </div>

            {error && (
                <p role="alert" className="mt-4 text-sm text-red-700">
                    {error}
                </p>
            )}

            <div className="mt-5 flex justify-end gap-3">
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
                    {isEditing ? (
                        <Save className="h-4 w-4" />
                    ) : (
                        <Plus className="h-4 w-4" />
                    )}
                    {submitting
                        ? isEditing
                            ? "Saving..."
                            : "Adding..."
                        : isEditing
                            ? "Save changes"
                            : "Add space"}
                </button>
            </div>
        </form>
    );
}
