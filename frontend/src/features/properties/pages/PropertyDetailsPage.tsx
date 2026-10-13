import { useEffect, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router";
import {
    ArrowLeft,
    Building2,
    LayoutGrid,
    Plus,
    Pencil,
} from "lucide-react";

import { useOrganization } from "../../organizations/OrganizationProvider";

import {
    getProperty,
    getSpaces,
    createSpace,
    updateSpace,
    updateSpaceStatus,
} from "../api/propertyApi";

import CreateSpaceForm from "../components/form/CreateSpaceForm";

import type {
    CreateSpaceRequest,
    PropertyResponse,
    SpaceResponse,
    SpaceStatus,
    SpaceType,
} from "../types";

type DetailsTab =
    | "overview"
    | "spaces"
    | "leases"
    | "financials"
    | "maintenance";

const tabs: { id: DetailsTab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "spaces", label: "Spaces" },
    { id: "leases", label: "Leases" },
    { id: "financials", label: "Financials" },
    { id: "maintenance", label: "Maintenance" },
];

const spaceTypeLabels: Record<SpaceType, string> = {
    RESIDENTIAL: "Residential",
    OFFICE: "Office",
    RETAIL: "Retail",
    OTHER: "Other",
};

const spaceStatusLabels: Record<SpaceStatus, string> = {
    VACANT: "Vacant",
    OCCUPIED: "Occupied",
    RESERVED: "Reserved",
    MAINTENANCE: "Maintenance",
};

const spaceStatusStyles: Record<SpaceStatus, string> = {
    VACANT: "border-gray-200 bg-gray-100 text-gray-700",
    OCCUPIED: "border-[#d5dfd8] bg-[#e8efe9] text-[#14302b]",
    RESERVED: "border-amber-200 bg-amber-50 text-amber-800",
    MAINTENANCE: "border-red-200 bg-red-50 text-red-700",
};

function getPropertyType(spaces: SpaceResponse[]): string {
    const types = new Set(spaces.map((space) => space.type));

    if (types.size === 0) {
        return "Not classified";
    }

    if (types.size > 1) {
        return "Mixed-use";
    }

    return spaceTypeLabels[spaces[0].type];
}

function formatDate(value: string): string {
    return new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
    }).format(new Date(value));
}

export default function PropertyDetailsPage() {
    const { propertyId } = useParams();

    const {
        activeOrganization,
        status: organizationStatus,
    } = useOrganization();

    const [property, setProperty] =
        useState<PropertyResponse | null>(null);

    const [spaces, setSpaces] =
        useState<SpaceResponse[]>([]);

    const [activeTab, setActiveTab] =
        useState<DetailsTab>("overview");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [showCreateSpace, setShowCreateSpace] =
        useState(false);

    const [creatingSpace, setCreatingSpace] =
        useState(false);

    const [editingSpaceId, setEditingSpaceId] =
        useState<number | null>(null);

    const [updatingSpace, setUpdatingSpace] =
        useState(false);

    const [updatingSpaceStatusId, setUpdatingSpaceStatusId] =
        useState<number | null>(null);

    const [statusUpdateError, setStatusUpdateError] =
        useState<string | null>(null);

    const parsedPropertyId = Number(propertyId);

    const editingSpace =
        spaces.find((space) => space.id === editingSpaceId) ?? null;

    useEffect(() => {
        if (
            organizationStatus !== "ready" ||
            !activeOrganization
        ) {
            return;
        }

        if (
            !Number.isInteger(parsedPropertyId) ||
            parsedPropertyId <= 0
        ) {
            setProperty(null);
            setError("Invalid property ID.");
            setLoading(false);
            return;
        }

        const organizationId = activeOrganization.id;
        let cancelled = false;

        async function loadProperty() {
            setLoading(true);
            setError(null);
            setStatusUpdateError(null);
            setProperty(null);
            setSpaces([]);
            setShowCreateSpace(false);
            setEditingSpaceId(null);

            try {
                const [propertyData, spacesData] =
                    await Promise.all([
                        getProperty(
                            organizationId,
                            parsedPropertyId,
                        ),
                        getSpaces(
                            organizationId,
                            parsedPropertyId,
                        ),
                    ]);

                if (!cancelled) {
                    setProperty(propertyData);
                    setSpaces(spacesData);
                }
            } catch (requestError) {
                if (!cancelled) {
                    setError(
                        requestError instanceof Error
                            ? requestError.message
                            : "Failed to load property.",
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        void loadProperty();

        return () => {
            cancelled = true;
        };
    }, [
        organizationStatus,
        activeOrganization?.id,
        parsedPropertyId,
    ]);

    async function handleCreateSpace(
        request: CreateSpaceRequest,
    ): Promise<void> {
        if (!activeOrganization || !property) {
            throw new Error(
                "An active organization and property are required.",
            );
        }

        setCreatingSpace(true);

        try {
            const createdSpace = await createSpace(
                activeOrganization.id,
                property.id,
                request,
            );

            setSpaces((currentSpaces) => [
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
        if (!activeOrganization || !property) {
            throw new Error(
                "An active organization and property are required.",
            );
        }

        setUpdatingSpace(true);

        try {
            const updatedSpace = await updateSpace(
                activeOrganization.id,
                property.id,
                spaceId,
                {
                    name: request.name,
                    type: request.type,
                    floor: request.floor,
                    area: request.area,
                },
            );

            setSpaces((currentSpaces) =>
                currentSpaces.map((space) =>
                    space.id === spaceId ? updatedSpace : space,
                ),
            );

            setEditingSpaceId(null);
        } finally {
            setUpdatingSpace(false);
        }
    }

    async function handleSpaceStatusChange(
        spaceId: number,
        status: SpaceStatus,
    ): Promise<void> {
        if (!activeOrganization || !property) {
            setStatusUpdateError(
                "An active organization and property are required.",
            );
            return;
        }

        setStatusUpdateError(null);
        setUpdatingSpaceStatusId(spaceId);

        try {
            const updatedSpace = await updateSpaceStatus(
                activeOrganization.id,
                property.id,
                spaceId,
                { status },
            );

            setSpaces((currentSpaces) =>
                currentSpaces.map((space) =>
                    space.id === spaceId ? updatedSpace : space,
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

    if (organizationStatus === "loading") {
        return (
            <div className="p-8 text-sm text-gray-500">
                Loading organization...
            </div>
        );
    }

    if (
        organizationStatus === "error" ||
        !activeOrganization
    ) {
        return (
            <div className="p-8">
                <p className="font-medium text-red-700">
                    Unable to load the active organization.
                </p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="p-8 text-sm text-gray-500">
                Loading property...
            </div>
        );
    }

    if (error || !property) {
        return (
            <div className="space-y-4 p-8">
                <Link
                    to="/app/properties"
                    className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#14302b]"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Properties
                </Link>

                <div
                    role="alert"
                    className="rounded-xl border border-red-200 bg-white p-6"
                >
                    <h1 className="font-semibold text-red-800">
                        Unable to load property
                    </h1>

                    <p className="mt-1 text-sm text-red-700">
                        {error ?? "Property not found."}
                    </p>
                </div>
            </div>
        );
    }

    const occupiedSpaces = spaces.filter(
        (space) => space.status === "OCCUPIED",
    ).length;

    const vacantSpaces = spaces.filter(
        (space) => space.status === "VACANT",
    ).length;

    const reservedSpaces = spaces.filter(
        (space) => space.status === "RESERVED",
    ).length;

    const maintenanceSpaces = spaces.filter(
        (space) => space.status === "MAINTENANCE",
    ).length;

    return (
        <div className="min-h-full bg-[#f7f9f7] p-5 sm:p-8">
            <div className="mx-auto max-w-[1600px] space-y-7">
                <Link
                    to="/app/properties"
                    className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-[#14302b]"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Properties
                </Link>

                <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#e8efe9] text-[#14302b]">
                            <Building2 className="h-6 w-6" />
                        </div>

                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight text-[#14302b] sm:text-3xl">
                                {property.name}
                            </h1>

                            <p className="mt-1 text-sm text-gray-500">
                                {property.addressLine},{" "}
                                {property.city}
                            </p>

                            <p className="text-sm text-gray-500">
                                {[
                                    property.postalCode,
                                    property.country,
                                ]
                                    .filter(Boolean)
                                    .join(" ")}
                            </p>
                        </div>
                    </div>

                    <span className="inline-flex w-fit rounded-full bg-[#e8efe9] px-3 py-1.5 text-xs font-medium text-[#14302b]">
                        {getPropertyType(spaces)}
                    </span>
                </header>

                <section
                    aria-label="Property summary"
                    className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
                >
                    <SummaryCard
                        label="Total spaces"
                        value={spaces.length.toString()}
                        description="Configured rentable spaces"
                    />

                    <SummaryCard
                        label="Occupied"
                        value={occupiedSpaces.toString()}
                        description="Currently occupied spaces"
                    />

                    <SummaryCard
                        label="Vacant"
                        value={vacantSpaces.toString()}
                        description="Available spaces"
                    />

                    <SummaryCard
                        label="Reserved"
                        value={reservedSpaces.toString()}
                        description={`${maintenanceSpaces} under maintenance`}
                    />
                </section>

                <section className="overflow-hidden rounded-xl border border-[#e1e8e3] bg-white shadow-sm">
                    <div
                        role="tablist"
                        aria-label="Property details"
                        className="flex gap-1 overflow-x-auto border-b border-[#e7ece8] px-3 pt-3 sm:px-5"
                    >
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                role="tab"
                                id={`property-tab-${tab.id}`}
                                aria-selected={activeTab === tab.id}
                                aria-controls="property-tab-panel"
                                onClick={() => {
                                    setActiveTab(tab.id);
                                    cancelSpaceForm();
                                    setStatusUpdateError(null);
                                }}
                                className={`whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium transition ${
                                    activeTab === tab.id
                                        ? "border-[#d4a94f] text-[#14302b]"
                                        : "border-transparent text-gray-500 hover:text-[#14302b]"
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div
                        id="property-tab-panel"
                        role="tabpanel"
                        aria-labelledby={`property-tab-${activeTab}`}
                        className="p-5 sm:p-6"
                    >
                        {activeTab === "overview" && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-lg font-semibold text-[#14302b]">
                                        Property information
                                    </h2>

                                    <p className="mt-1 text-sm text-gray-500">
                                        Basic information about this property.
                                    </p>
                                </div>

                                <dl className="grid gap-5 sm:grid-cols-2">
                                    <DetailField
                                        label="Property name"
                                        value={property.name}
                                    />

                                    <DetailField
                                        label="Address"
                                        value={property.addressLine}
                                    />

                                    <DetailField
                                        label="City"
                                        value={property.city}
                                    />

                                    <DetailField
                                        label="Postal code"
                                        value={property.postalCode || "—"}
                                    />

                                    <DetailField
                                        label="Country"
                                        value={property.country}
                                    />

                                    <DetailField
                                        label="Added to Rentora"
                                        value={formatDate(property.createdAt)}
                                    />
                                </dl>

                                <div className="border-t border-[#e7ece8] pt-5">
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab("spaces")}
                                        className="inline-flex items-center gap-2 text-sm font-medium text-[#14302b] hover:text-[#426b5e]"
                                    >
                                        <LayoutGrid className="h-4 w-4" />
                                        View all {spaces.length} spaces
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === "spaces" && (
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
                                                <Plus
                                                    className="h-4 w-4"
                                                    aria-hidden="true"
                                                />
                                                Add space
                                            </button>
                                        )}
                                </div>

                                {statusUpdateError && (
                                    <div
                                        role="alert"
                                        className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                                    >
                                        {statusUpdateError}
                                    </div>
                                )}

                                {(showCreateSpace ||
                                    editingSpaceId !== null) && (
                                    <CreateSpaceForm
                                        key={editingSpace?.id ?? "new-space"}
                                        initialSpace={
                                            editingSpace ?? undefined
                                        }
                                        submitting={
                                            editingSpaceId !== null
                                                ? updatingSpace
                                                : creatingSpace
                                        }
                                        onSubmit={
                                            editingSpace
                                                ? (request) =>
                                                      handleUpdateSpace(
                                                          editingSpace.id,
                                                          request,
                                                      )
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
                                            This property has no configured
                                            rentable spaces.
                                        </p>

                                        {!showCreateSpace &&
                                            editingSpaceId === null && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setShowCreateSpace(true)
                                                    }
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
                                                    <tr
                                                        key={space.id}
                                                        className="hover:bg-[#f8faf8]"
                                                    >
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
                                                            {space.area != null
                                                                ? `${space.area} m²`
                                                                : "—"}
                                                        </td>

                                                        <td className="px-4 py-4">
                                                            <div className="flex flex-col items-start gap-1.5">
                                                                <select
                                                                    aria-label={`Change status for ${space.name}`}
                                                                    value={space.status}
                                                                    disabled={
                                                                        updatingSpaceStatusId !== null
                                                                    }
                                                                    onChange={(event) => {
                                                                        void handleSpaceStatusChange(
                                                                            space.id,
                                                                            event.target.value as SpaceStatus,
                                                                        );
                                                                    }}
                                                                    className={`cursor-pointer appearance-auto rounded-full border px-3 py-1.5 text-xs font-medium outline-none transition focus:ring-2 focus:ring-[#14302b]/20 disabled:cursor-wait disabled:opacity-60 ${spaceStatusStyles[space.status]}`}
                                                                >
                                                                    {(
                                                                        Object.keys(
                                                                            spaceStatusLabels,
                                                                        ) as SpaceStatus[]
                                                                    ).map((status) => (
                                                                        <option
                                                                            key={status}
                                                                            value={status}
                                                                        >
                                                                            {spaceStatusLabels[status]}
                                                                        </option>
                                                                    ))}
                                                                </select>

                                                                {updatingSpaceStatusId ===
                                                                    space.id && (
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
                        )}

                        {activeTab === "leases" && (
                            <TabPlaceholder
                                title="Leases"
                                description="Lease management for this property's spaces will be connected here."
                            />
                        )}

                        {activeTab === "financials" && (
                            <TabPlaceholder
                                title="Financials"
                                description="Property-specific rent, payments and expenses will appear here."
                            />
                        )}

                        {activeTab === "maintenance" && (
                            <TabPlaceholder
                                title="Maintenance"
                                description="Maintenance requests associated with this property's spaces will appear here."
                            />
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}

function SummaryCard({
    label,
    value,
    description,
}: {
    label: string;
    value: string;
    description: string;
}) {
    return (
        <article className="rounded-xl border border-[#e1e8e3] bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
                {label}
            </p>

            <p className="mt-3 text-2xl font-semibold text-[#14302b]">
                {value}
            </p>

            <p className="mt-1 text-sm text-gray-500">
                {description}
            </p>
        </article>
    );
}

function DetailField({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <div>
            <dt className="text-sm text-gray-500">{label}</dt>
            <dd className="mt-1 text-sm font-medium text-[#243b35]">
                {value}
            </dd>
        </div>
    );
}

function TableHeader({
    children,
}: {
    children: ReactNode;
}) {
    return (
        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
            {children}
        </th>
    );
}

function TabPlaceholder({
    title,
    description,
}: {
    title: string;
    description: string;
}) {
    return (
        <div className="rounded-lg border border-dashed border-[#d5dfd8] px-6 py-12 text-center">
            <h2 className="font-semibold text-[#14302b]">
                {title}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
                {description}
            </p>
        </div>
    );
}
