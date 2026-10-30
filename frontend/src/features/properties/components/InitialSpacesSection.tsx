import { useState } from "react";
import { LayoutGrid, Plus, Trash2 } from "lucide-react";

import SpaceDraftFields from "./form/SpaceDraftFields";
import type { SpaceFields } from "../validation";

export interface InitialSpaceDraft extends SpaceFields {
    // Only identifies the draft on this page; the space gets its real ID when it's created.
    id: number;
}

interface InitialSpacesSectionProps {
    spaces: InitialSpaceDraft[];
    onAdd: () => void;
    onChange: (id: number, field: keyof SpaceFields, value: string) => void;
    onRemove: (id: number) => void;
    disabled: boolean;
}

// The spaces to create along with a new property, if any, in a section that opens on request.
export default function InitialSpacesSection({ spaces, onAdd, onChange, onRemove, disabled }: InitialSpacesSectionProps) {
    const [expanded, setExpanded] = useState(false);

    return (
        <section className="overflow-hidden rounded-xl border border-[#e1e8e3] bg-white shadow-sm">
            <button
                type="button"
                onClick={() => setExpanded((current) => !current)}
                disabled={disabled}
                aria-expanded={expanded}
                className="flex w-full items-center justify-between gap-4 p-5 text-left transition hover:bg-[#f8faf8] disabled:cursor-not-allowed disabled:hover:bg-white sm:p-6"
            >
                <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#e8efe9] text-[#14302b]">
                        <LayoutGrid className="h-5 w-5" />
                    </div>

                    <div>
                        <h2 className="font-semibold text-[#14302b]">
                            Initial rentable spaces
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            Optional. You can add spaces now or create them later.
                        </p>

                        {spaces.length > 0 && (
                            <p className="mt-2 text-xs font-medium text-[#426b5e]">
                                {spaces.length}{" "}
                                {spaces.length === 1
                                    ? "space configured"
                                    : "spaces configured"}
                            </p>
                        )}
                    </div>
                </div>

                <span className="shrink-0 text-sm font-medium text-[#14302b]">
                    {expanded ? "Hide" : "Configure"}
                </span>
            </button>

            {expanded && (
                <div className="space-y-4 border-t border-[#e7ece8] p-5 sm:p-6">
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                        <div>
                            <h3 className="font-medium text-[#243b35]">
                                Rentable spaces
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                                A single-family house can have one space representing the entire property.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={onAdd}
                            disabled={disabled}
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#d5dfd8] bg-white px-4 py-2.5 text-sm font-medium text-[#14302b] hover:bg-[#f8faf8] disabled:opacity-60"
                        >
                            <Plus className="h-4 w-4" />
                            Add space
                        </button>
                    </div>

                    {spaces.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-[#d5dfd8] px-5 py-8 text-center">
                            <LayoutGrid className="mx-auto h-7 w-7 text-[#14302b]/50" />

                            <p className="mt-3 text-sm font-medium text-[#14302b]">
                                No initial spaces added
                            </p>

                            <p className="mt-1 text-sm text-gray-500">
                                You can create this property first and configure spaces afterward.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {spaces.map((space, index) => (
                                <div
                                    key={space.id}
                                    className="rounded-xl border border-[#e1e8e3] bg-[#f8faf8] p-4 sm:p-5"
                                >
                                    <div className="mb-4 flex items-center justify-between gap-3">
                                        <h4 className="text-sm font-semibold text-[#14302b]">
                                            Space {index + 1}
                                        </h4>

                                        <button
                                            type="button"
                                            onClick={() => onRemove(space.id)}
                                            disabled={disabled}
                                            aria-label={`Remove space ${index + 1}`}
                                            className="inline-flex items-center gap-2 rounded-lg p-2 text-gray-500 hover:bg-white hover:text-red-700 disabled:opacity-50"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            <span className="text-xs font-medium">
                                                Remove
                                            </span>
                                        </button>
                                    </div>

                                    <SpaceDraftFields
                                        idPrefix={`initial-space-${space.id}`}
                                        values={space}
                                        onChange={(field, value) => onChange(space.id, field, value)}
                                        disabled={disabled}
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    <p className="text-xs text-gray-500">
                        New spaces start as Vacant. You can change
                        their statuses later.
                    </p>
                </div>
            )}
        </section>
    );
}
