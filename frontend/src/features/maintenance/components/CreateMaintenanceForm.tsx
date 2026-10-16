import { useState, type FormEvent } from "react";
import { Plus, X } from "lucide-react";

import type { SpaceResponse } from "../../properties/types";
import type {
    CreateMaintenanceRequest,
    MaintenancePriority,
} from "../types";

interface CreateMaintenanceFormProps {
    propertyId: number;
    spaces: SpaceResponse[];
    submitting: boolean;
    onSubmit: (request: CreateMaintenanceRequest) => Promise<void>;
    onCancel: () => void;
}

const priorities: {
    value: MaintenancePriority;
    label: string;
}[] = [
    { value: "LOW", label: "Low" },
    { value: "MEDIUM", label: "Medium" },
    { value: "HIGH", label: "High" },
    { value: "URGENT", label: "Urgent" },
];

const inputClass =
    "w-full rounded-lg border border-[#dce4de] bg-white px-3 py-2.5 text-sm text-[#243b35] outline-none transition placeholder:text-gray-400 focus:border-[#14302b] focus:ring-2 focus:ring-[#14302b]/10 disabled:cursor-not-allowed disabled:bg-gray-100";

const labelClass =
    "mb-1.5 block text-sm font-medium text-[#243b35]";

export default function CreateMaintenanceForm({
    propertyId,
    spaces,
    submitting,
    onSubmit,
    onCancel,
}: CreateMaintenanceFormProps) {
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
                propertyId,
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

            {spaces.length === 0 ? (
                <div
                    role="alert"
                    className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
                >
                    This property has no spaces. Add a space before
                    creating a maintenance request.
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                        <label
                            htmlFor="maintenance-space"
                            className={labelClass}
                        >
                            Property space
                        </label>

                        <select
                            id="maintenance-space"
                            required
                            value={spaceId}
                            onChange={(event) =>
                                setSpaceId(event.target.value)
                            }
                            disabled={submitting}
                            className={inputClass}
                        >
                            <option value="">
                                Select a space
                            </option>

                            {spaces.map((space) => (
                                <option
                                    key={space.id}
                                    value={space.id}
                                >
                                    {space.name}
                                    {" — "}
                                    {space.type
                                        .toLowerCase()
                                        .replace("_", " ")}
                                    {" ("}
                                    {space.status
                                        .toLowerCase()
                                        .replace("_", " ")}
                                    {")"}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="sm:col-span-2">
                        <label
                            htmlFor="maintenance-title"
                            className={labelClass}
                        >
                            Issue title
                        </label>

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
                    </div>

                    <div className="sm:col-span-2">
                        <label
                            htmlFor="maintenance-description"
                            className={labelClass}
                        >
                            Description
                        </label>

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
                    </div>

                    <div>
                        <label
                            htmlFor="maintenance-priority"
                            className={labelClass}
                        >
                            Priority
                        </label>

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
                    </div>
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
                    disabled={submitting || spaces.length === 0}
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
