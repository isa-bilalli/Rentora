import { useState, type FormEvent } from "react";
import { Plus, X } from "lucide-react";

import type { SpaceResponse } from "../../properties/types";
import { spaceStatusLabels, spaceTypeLabels } from "../../properties/spaceLabels";
import type {
    CreateMaintenanceRequest,
    MaintenancePriority,
} from "../types";
import FormField from "../../../components/ui/FormField";
import { inputClass } from "../../../components/ui/formStyles";

export interface MaintenancePropertyOption {
    id: number;
    name: string;
    spaces: SpaceResponse[];
}

type CreateMaintenanceFormProps = {
    submitting: boolean;
    onSubmit: (request: CreateMaintenanceRequest) => Promise<void>;
    onCancel: () => void;
} & (
    // On a property's page: the property is fixed.
    | { propertyId: number; spaces: SpaceResponse[]; properties?: undefined }
    // On the Maintenance page: the user picks the property first.
    | { properties: MaintenancePropertyOption[]; propertyId?: undefined; spaces?: undefined }
);

const priorities: {
    value: MaintenancePriority;
    label: string;
}[] = [
    { value: "LOW", label: "Low" },
    { value: "MEDIUM", label: "Medium" },
    { value: "HIGH", label: "High" },
    { value: "URGENT", label: "Urgent" },
];

export default function CreateMaintenanceForm({
    propertyId,
    spaces,
    properties,
    submitting,
    onSubmit,
    onCancel,
}: CreateMaintenanceFormProps) {
    const [pickedPropertyId, setPickedPropertyId] = useState("");
    // With a fixed property these are just propertyId and spaces.
    const selectedPropertyId = properties ? Number(pickedPropertyId) || null : propertyId;
    const availableSpaces = properties
        ? properties.find((option) => option.id === selectedPropertyId)?.spaces ?? []
        : spaces;
    const noSpaces = selectedPropertyId !== null && availableSpaces.length === 0;

    const [spaceId, setSpaceId] = useState("");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] =
        useState<MaintenancePriority>("MEDIUM");

    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);

        const trimmedTitle = title.trim();
        const trimmedDescription = description.trim();

        if (selectedPropertyId === null) {
            setError("Select the property that needs maintenance.");
            return;
        }

        if (!spaceId) {
            setError("Select the space that needs maintenance.");
            return;
        }

        if (!trimmedTitle) {
            setError("A maintenance request title is required.");
            return;
        }

        if (!trimmedDescription) {
            setError("Please describe the maintenance issue.");
            return;
        }

        try {
            await onSubmit({
                propertyId: selectedPropertyId,
                spaceId: Number(spaceId),
                title: trimmedTitle,
                description: trimmedDescription,
                priority,
            });
        } catch (submitError) {
            setError(
                submitError instanceof Error
                    ? submitError.message
                    : "Failed to create maintenance request.",
            );
        }
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="rounded-xl border border-[#d5dfd8] bg-[#f8faf8] p-5 sm:p-6"
        >
            <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                    <h3 className="font-semibold text-[#14302b]">
                        New maintenance request
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                        Describe the issue and assign its priority.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={onCancel}
                    disabled={submitting}
                    aria-label="Cancel maintenance request"
                    className="rounded-md p-2 text-gray-500 transition hover:bg-white hover:text-[#14302b] disabled:opacity-60"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            {properties && (
                <FormField htmlFor="maintenance-property" label="Property" className="mb-4">
                    <select
                        id="maintenance-property"
                        required
                        value={pickedPropertyId}
                        onChange={(event) => {
                            setPickedPropertyId(event.target.value);
                            setSpaceId("");
                        }}
                        disabled={submitting}
                        className={inputClass}
                    >
                        <option value="">
                            Select a property
                        </option>

                        {properties.map((option) => (
                            <option
                                key={option.id}
                                value={option.id}
                            >
                                {option.name}
                            </option>
                        ))}
                    </select>
                </FormField>
            )}

            {noSpaces ? (
                <div
                    role="alert"
                    className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
                >
                    This property has no spaces. Add a space before
                    creating a maintenance request.
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                    <FormField htmlFor="maintenance-space" label="Property space" className="sm:col-span-2">
                        <select
                            id="maintenance-space"
                            required
                            value={spaceId}
                            onChange={(event) =>
                                setSpaceId(event.target.value)
                            }
                            disabled={submitting || selectedPropertyId === null}
                            className={inputClass}
                        >
                            <option value="">
                                {selectedPropertyId === null ? "Select a property first" : "Select a space"}
                            </option>

                            {availableSpaces.map((space) => (
                                <option
                                    key={space.id}
                                    value={space.id}
                                >
                                    {space.name}
                                    {" — "}
                                    {spaceTypeLabels[space.type]}
                                    {" ("}
                                    {spaceStatusLabels[space.status]}
                                    {")"}
                                </option>
                            ))}
                        </select>
                    </FormField>

                    <FormField htmlFor="maintenance-title" label="Issue title" className="sm:col-span-2">
                        <input
                            id="maintenance-title"
                            required
                            value={title}
                            onChange={(event) =>
                                setTitle(event.target.value)
                            }
                            placeholder="e.g. Water leak in bathroom"
                            disabled={submitting}
                            className={inputClass}
                        />
                    </FormField>

                    <FormField htmlFor="maintenance-description" label="Description" className="sm:col-span-2">
                        <textarea
                            id="maintenance-description"
                            required
                            rows={4}
                            value={description}
                            onChange={(event) =>
                                setDescription(event.target.value)
                            }
                            placeholder="Describe the issue, where it occurs, and any relevant details."
                            disabled={submitting}
                            className={`${inputClass} resize-y`}
                        />
                    </FormField>

                    <FormField htmlFor="maintenance-priority" label="Priority">
                        <select
                            id="maintenance-priority"
                            value={priority}
                            onChange={(event) =>
                                setPriority(
                                    event.target.value as MaintenancePriority,
                                )
                            }
                            disabled={submitting}
                            className={inputClass}
                        >
                            {priorities.map((option) => (
                                <option
                                    key={option.value}
                                    value={option.value}
                                >
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </FormField>
                </div>
            )}

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
                    className="rounded-lg border border-[#d5dfd8] bg-white px-4 py-2.5 text-sm font-medium text-[#243b35] transition hover:bg-gray-50 disabled:opacity-60"
                >
                    Cancel
                </button>

                <button
                    type="submit"
                    disabled={submitting || availableSpaces.length === 0}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#14302b] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#20453d] disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <Plus className="h-4 w-4" />
                    {submitting
                        ? "Creating request..."
                        : "Create request"}
                </button>
            </div>
        </form>
    );
}
