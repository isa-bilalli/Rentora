import { useState } from "react";
import { LayoutGrid, Pencil, Plus } from "lucide-react";

import { useOrganization } from "../../../organizations/useOrganization";
import { createSpace, updateSpace, updateSpaceStatus } from "../../api/propertyApi";
import { spaceStatusLabels, spaceTypeLabels } from "../../spaceLabels";
import type { CreateSpaceRequest, SpaceResponse, SpaceStatus } from "../../types";
import CreateSpaceForm from "../form/CreateSpaceForm";
import TableHeader from "./TableHeader";

const spaceStatusStyles: Record<SpaceStatus, string> = {
    VACANT: "border-gray-200 bg-gray-100 text-gray-700",
    OCCUPIED: "border-[#d5dfd8] bg-[#e8efe9] text-[#14302b]",
    RESERVED: "border-amber-200 bg-amber-50 text-amber-800",
    MAINTENANCE: "border-red-200 bg-red-50 text-red-700",
};

interface PropertySpacesTabProps {
    propertyId: number;
    // The page keeps the spaces, because its header and other tabs use them too.
    spaces: SpaceResponse[];
    onSpacesChange: (update: (current: SpaceResponse[]) => SpaceResponse[]) => void;
}

// One property's spaces: add, edit and change status. The forms and their state live here.
export default function PropertySpacesTab({ propertyId, spaces, onSpacesChange }: PropertySpacesTabProps) {
    const { activeOrganization } = useOrganization();

    const [showCreateSpace, setShowCreateSpace] = useState(false);
    const [creatingSpace, setCreatingSpace] = useState(false);

    const [editingSpaceId, setEditingSpaceId] =
        useState<number | null>(null);

    const [updatingSpace, setUpdatingSpace] = useState(false);

    const [updatingSpaceStatusId, setUpdatingSpaceStatusId] =
        useState<number | null>(null);

    const [statusUpdateError, setStatusUpdateError] =
        useState<string | null>(null);

    const editingSpace =
        spaces.find((space) => space.id === editingSpaceId) ?? null;

    function replaceSpace(updatedSpace: SpaceResponse) {
        onSpacesChange((currentSpaces) =>
            currentSpaces.map((space) =>
                space.id === updatedSpace.id ? updatedSpace : space,
            ),
        );
    }

    async function handleCreateSpace(
        request: CreateSpaceRequest,
    ): Promise<void> {
        if (!activeOrganization) {
            throw new Error("An active organization is required.");
        }

        setCreatingSpace(true);

        try {
            const createdSpace = await createSpace(
                activeOrganization.id,
                propertyId,
                request,
            );

            onSpacesChange((currentSpaces) => [
                ...currentSpaces,
                createdSpace,
            ]);

            setShowCreateSpace(false);
        } finally {
            setCreatingSpace(false);
        }
    }

    async function handleUpdateSpace(
        spaceId: number,
        request: CreateSpaceRequest,
    ): Promise<void> {
        if (!activeOrganization) {
            throw new Error("An active organization is required.");
        }

        setUpdatingSpace(true);

        try {
            const updatedSpace = await updateSpace(
                activeOrganization.id,
                propertyId,
                spaceId,
                {
                    name: request.name,
                    type: request.type,
                    floor: request.floor,
                    area: request.area,
                },
            );

            replaceSpace(updatedSpace);
            setEditingSpaceId(null);
        } finally {
            setUpdatingSpace(false);
        }
    }

    async function handleSpaceStatusChange(
        spaceId: number,
        status: SpaceStatus,
    ): Promise<void> {
        if (!activeOrganization) {
            setStatusUpdateError("An active organization is required.");
            return;
        }

        setStatusUpdateError(null);
        setUpdatingSpaceStatusId(spaceId);

        try {
            replaceSpace(
                await updateSpaceStatus(
                    activeOrganization.id,
                    propertyId,
                    spaceId,
                    { status },
                ),
            );
        } catch (requestError) {
            setStatusUpdateError(
                requestError instanceof Error
                    ? requestError.message
                    : "Failed to update space status.",
            );
        } finally {
            setUpdatingSpaceStatusId(null);
        }
    }

    function cancelSpaceForm() {
        setShowCreateSpace(false);
        setEditingSpaceId(null);
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                    <h2 className="text-lg font-semibold text-[#14302b]">
                        Spaces
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Rentable spaces within this property.
                    </p>
                </div>

                {!showCreateSpace &&
                    editingSpaceId === null && (
                        <button
                            type="button"
                            onClick={() => {
                                setStatusUpdateError(null);
                                setShowCreateSpace(true);
                            }}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#14302b] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#20453d]"
                        >
                            <Plus className="h-4 w-4" />
                            Add space
                        </button>
                    )}
            </div>

            {statusUpdateError && (
                <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {statusUpdateError}
                </div>
            )}

            {(showCreateSpace || editingSpaceId !== null) && (
                <CreateSpaceForm
                    key={editingSpace?.id ?? "new-space"}
                    initialSpace={editingSpace ?? undefined}
                    submitting={editingSpaceId !== null ? updatingSpace : creatingSpace}
                    onSubmit={
                        editingSpace
                            ? (request) => handleUpdateSpace(editingSpace.id, request)
                            : handleCreateSpace
                    }
                    onCancel={cancelSpaceForm}
                />
            )}

            {spaces.length === 0 ? (
                <div className="rounded-lg border border-dashed border-[#d5dfd8] px-6 py-12 text-center">
                    <LayoutGrid className="mx-auto h-8 w-8 text-[#14302b]/50" />
                    <h3 className="mt-3 font-semibold text-[#14302b]">
                        No spaces yet
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                        This property has no configured rentable spaces.
                    </p>

                    {!showCreateSpace && editingSpaceId === null && (
                        <button
                            type="button"
                            onClick={() => setShowCreateSpace(true)}
                            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#14302b] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#20453d]"
                        >
                            <Plus className="h-4 w-4" />
                            Add first space
                        </button>
                    )}
                </div>
            ) : (
                <div className="overflow-x-auto rounded-lg border border-[#e1e8e3]">
                    <table className="w-full min-w-212.5 text-left">
                        <thead className="bg-[#f8faf8]">
                            <tr>
                                <TableHeader>Name</TableHeader>
                                <TableHeader>Type</TableHeader>
                                <TableHeader>Floor</TableHeader>
                                <TableHeader>Area</TableHeader>
                                <TableHeader>Status</TableHeader>
                                <TableHeader>Actions</TableHeader>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#edf0ee]">
                            {spaces.map((space) => (
                                <tr key={space.id} className="hover:bg-[#f8faf8]">
                                    <td className="px-4 py-4 text-sm font-medium text-[#14302b]">
                                        {space.name}
                                    </td>
                                    <td className="px-4 py-4 text-sm text-gray-600">
                                        {spaceTypeLabels[space.type]}
                                    </td>
                                    <td className="px-4 py-4 text-sm text-gray-600">
                                        {space.floor ?? "—"}
                                    </td>
                                    <td className="px-4 py-4 text-sm text-gray-600">
                                        {space.area != null ? `${space.area} m²` : "—"}
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex flex-col items-start gap-1.5">
                                            <select
                                                aria-label={`Change status for ${space.name}`}
                                                value={space.status}
                                                disabled={updatingSpaceStatusId !== null}
                                                onChange={(event) => {
                                                    void handleSpaceStatusChange(
                                                        space.id,
                                                        event.target.value as SpaceStatus,
                                                    );
                                                }}
                                                className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium outline-none transition focus:ring-2 focus:ring-[#14302b]/20 disabled:cursor-wait disabled:opacity-60 ${spaceStatusStyles[space.status]}`}
                                            >
                                                {(Object.keys(spaceStatusLabels) as SpaceStatus[]).map((status) => (
                                                    <option key={status} value={status}>
                                                        {spaceStatusLabels[status]}
                                                    </option>
                                                ))}
                                            </select>
                                            {updatingSpaceStatusId === space.id && (
                                                <span className="text-xs text-gray-500">
                                                    Saving status...
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setStatusUpdateError(null);
                                                setShowCreateSpace(false);
                                                setEditingSpaceId(space.id);
                                            }}
                                            disabled={
                                                creatingSpace ||
                                                updatingSpace ||
                                                updatingSpaceStatusId !== null
                                            }
                                            aria-label={`Edit ${space.name}`}
                                            className="inline-flex items-center gap-2 rounded-lg border border-[#d5dfd8] bg-white px-3 py-2 text-sm font-medium text-[#14302b] transition hover:bg-[#f8faf8] disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <Pencil className="h-4 w-4" />
                                            Edit
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
