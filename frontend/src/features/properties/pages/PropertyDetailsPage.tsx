import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import {
    ArrowLeft,
    Building2,
    LayoutGrid,
    Plus,
    Pencil,
} from "lucide-react";

import { useOrganization } from "../../organizations/useOrganization";

import {
    getProperty,
    getSpaces,
    createSpace,
    updateSpace,
    updateSpaceStatus,
    updateProperty,
} from "../api/propertyApi";

import {
    getLeases,
    createLease,
    endLease,
    cancelLease,
    renewLease,
} from "../../leases/api/leasesApi";

import type { RenewLeaseRequest } from "../../leases/types";

import type {
    CreateLeaseRequest,
    LeaseResponse,
    LeaseStatus,
} from "../../leases/types";

import { getTenants } from "../../tenants/api/tenantApi";
import type { TenantResponse } from "../../tenants/types";

import CreateLeaseForm from "../../leases/components/CreateLeaseForm";
import RenewLeaseForm from "../../leases/components/RenewLeaseForm";
import UpdatePropertyForm from "../components/form/EditPropertyForm";
import CreateSpaceForm from "../components/form/CreateSpaceForm";
import SummaryCard from "../components/SummaryCard";
import PropertyFinancialsTab from "../components/tabs/PropertyFinancialsTab";
import PropertyMaintenanceTab from "../components/tabs/PropertyMaintenanceTab";
import TableHeader from "../components/tabs/TableHeader";

import { formatDate, formatMoney } from "../../../lib/format";

import type {
    CreateSpaceRequest,
    PropertyResponse,
    SpaceResponse,
    SpaceStatus,
    SpaceType,
    UpdatePropertyRequest,
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

export default function PropertyDetailsPage() {
    const { propertyId } = useParams();

    const {
        activeOrganization,
        status: organizationStatus,
    } = useOrganization();

    const activeOrganizationId = activeOrganization?.id;

    const [property, setProperty] =
        useState<PropertyResponse | null>(null);

    const [spaces, setSpaces] = useState<SpaceResponse[]>([]);
    const [leases, setLeases] = useState<LeaseResponse[]>([]);
    const [tenants, setTenants] = useState<TenantResponse[]>([]);
    const [showEditProperty, setShowEditProperty] = useState(false);
    const [updatingProperty, setUpdatingProperty] = useState(false);

    const [activeTab, setActiveTab] =
        useState<DetailsTab>("overview");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [leasesLoading, setLeasesLoading] = useState(true);
    const [leasesError, setLeasesError] =
        useState<string | null>(null);

    const [tenantsLoading, setTenantsLoading] = useState(true);
    const [tenantsError, setTenantsError] =
        useState<string | null>(null);

    const [showCreateSpace, setShowCreateSpace] = useState(false);
    const [creatingSpace, setCreatingSpace] = useState(false);

    const [editingSpaceId, setEditingSpaceId] =
        useState<number | null>(null);

    const [updatingSpace, setUpdatingSpace] = useState(false);

    const [updatingSpaceStatusId, setUpdatingSpaceStatusId] =
        useState<number | null>(null);

    const [statusUpdateError, setStatusUpdateError] =
        useState<string | null>(null);

    const [showCreateLease, setShowCreateLease] = useState(false);
    const [creatingLease, setCreatingLease] = useState(false);

    const [renewingLeaseId, setRenewingLeaseId] =
        useState<number | null>(null);

    const [renewingLeaseSubmitting, setRenewingLeaseSubmitting] =
        useState(false);

    const [leaseActionBusyId, setLeaseActionBusyId] =
        useState<number | null>(null);

    const [leaseActionError, setLeaseActionError] =
        useState<string | null>(null);

    const parsedPropertyId = Number(propertyId);

    const isValidPropertyId =
        Number.isInteger(parsedPropertyId) && parsedPropertyId > 0;

    const editingSpace =
        spaces.find((space) => space.id === editingSpaceId) ?? null;

    useEffect(() => {
        if (
            organizationStatus !== "ready" ||
            activeOrganizationId === undefined
        ) {
            return;
        }

        // An invalid ID is rendered directly below; there is nothing to fetch.
        if (!isValidPropertyId) {
            return;
        }

        const organizationId = activeOrganizationId;
        let cancelled = false;

        async function loadProperty() {
            setLoading(true);
            setError(null);
            setProperty(null);
            setSpaces([]);
            setShowCreateSpace(false);
            setEditingSpaceId(null);

            try {
                const [propertyData, spacesData] =
                    await Promise.all([
                        getProperty(organizationId, parsedPropertyId),
                        getSpaces(organizationId, parsedPropertyId),
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
        activeOrganizationId,
        parsedPropertyId,
        isValidPropertyId,
    ]);

    useEffect(() => {
        if (
            organizationStatus !== "ready" ||
            activeOrganizationId === undefined
        ) {
            return;
        }

        // An invalid ID is rendered by the property load; there is nothing to fetch.
        if (!isValidPropertyId) {
            return;
        }

        const organizationId = activeOrganizationId;
        let cancelled = false;

        async function loadLeases() {
            setLeasesLoading(true);
            setLeasesError(null);
            setLeases([]);

            try {
                const data = await getLeases(organizationId, parsedPropertyId);

                if (!cancelled) {
                    setLeases(data);
                }
            } catch (requestError) {
                if (!cancelled) {
                    setLeasesError(
                        requestError instanceof Error
                            ? requestError.message
                            : "Failed to load leases.",
                    );
                }
            } finally {
                if (!cancelled) {
                    setLeasesLoading(false);
                }
            }
        }

        void loadLeases();

        return () => {
            cancelled = true;
        };
    }, [
        organizationStatus,
        activeOrganizationId,
        parsedPropertyId,
        isValidPropertyId,
    ]);

    useEffect(() => {
        if (
            organizationStatus !== "ready" ||
            activeOrganizationId === undefined
        ) {
            return;
        }

        const organizationId = activeOrganizationId;
        let cancelled = false;

        async function loadTenants() {
            setTenantsLoading(true);
            setTenantsError(null);
            setTenants([]);

            try {
                const data = await getTenants(organizationId);

                if (!cancelled) {
                    setTenants(data);
                }
            } catch (requestError) {
                if (!cancelled) {
                    setTenantsError(
                        requestError instanceof Error
                            ? requestError.message
                            : "Failed to load tenants.",
                    );
                }
            } finally {
                if (!cancelled) {
                    setTenantsLoading(false);
                }
            }
        }

        void loadTenants();

        return () => {
            cancelled = true;
        };
    }, [organizationStatus, activeOrganizationId]);

    async function handleUpdateProperty(
        request: UpdatePropertyRequest,
    ): Promise<void> {
        if (!activeOrganization || !property) {
            throw new Error(
                "An active organization and property are required.",
            );
        }

        setUpdatingProperty(true);

        try {
            const updatedProperty = await updateProperty(
                activeOrganization.id,
                property.id,
                request,
            );

            setProperty(updatedProperty);
            setShowEditProperty(false);
        } finally {
            setUpdatingProperty(false);
        }
    }

    // For a tab whose actions change space statuses. Throws if the reload fails, so the tab can say so.
    async function reloadSpaces(): Promise<void> {
        if (!activeOrganization || !property) {
            return;
        }
        setSpaces(await getSpaces(activeOrganization.id, property.id));
    }

    async function refreshPropertySpaces(): Promise<void> {
        if (!activeOrganization || !property) {
            return;
        }

        try {
            const latestSpaces = await getSpaces(
                activeOrganization.id,
                property.id,
            );

            setSpaces(latestSpaces);
        } catch {
            setLeaseActionError(
                "The lease action succeeded, but space statuses could not be refreshed. Reload the page to see the latest statuses.",
            );
        }
    }

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

    async function handleCreateLease(
        request: CreateLeaseRequest,
    ): Promise<void> {
        if (!activeOrganization || !property) {
            throw new Error(
                "An active organization and property are required.",
            );
        }

        setCreatingLease(true);
        setLeaseActionError(null);

        try {
            const createdLease = await createLease(
                activeOrganization.id,
                request,
            );

            setLeases((currentLeases) =>
                [createdLease, ...currentLeases].sort(
                    (a, b) => b.startDate.localeCompare(a.startDate),
                ),
            );

            setShowCreateLease(false);
            await refreshPropertySpaces();
        } finally {
            setCreatingLease(false);
        }
    }

    async function handleEndLease(
        lease: LeaseResponse,
    ): Promise<void> {
        const confirmed = window.confirm(
            `End lease #${lease.id}? This will mark the lease as ended.`,
        );

        if (!confirmed || !activeOrganization) {
            return;
        }

        setLeaseActionBusyId(lease.id);
        setLeaseActionError(null);

        try {
            const updatedLease = await endLease(
                activeOrganization.id,
                lease.id,
            );

            setLeases((currentLeases) =>
                currentLeases.map((item) =>
                    item.id === updatedLease.id ? updatedLease : item,
                ),
            );

            await refreshPropertySpaces();
        } catch (requestError) {
            setLeaseActionError(
                requestError instanceof Error
                    ? requestError.message
                    : "Failed to end lease.",
            );
        } finally {
            setLeaseActionBusyId(null);
        }
    }

    async function handleCancelLease(
        lease: LeaseResponse,
    ): Promise<void> {
        const confirmed = window.confirm(
            `Cancel lease #${lease.id}? This action cannot be undone from this screen.`,
        );

        if (!confirmed || !activeOrganization) {
            return;
        }

        setLeaseActionBusyId(lease.id);
        setLeaseActionError(null);

        try {
            const updatedLease = await cancelLease(
                activeOrganization.id,
                lease.id,
            );

            setLeases((currentLeases) =>
                currentLeases.map((item) =>
                    item.id === updatedLease.id ? updatedLease : item,
                ),
            );

            await refreshPropertySpaces();
        } catch (requestError) {
            setLeaseActionError(
                requestError instanceof Error
                    ? requestError.message
                    : "Failed to cancel lease.",
            );
        } finally {
            setLeaseActionBusyId(null);
        }
    }

    async function handleRenewLease(
        request: RenewLeaseRequest,
    ): Promise<void> {
        if (!activeOrganization || renewingLeaseId === null) {
            throw new Error(
                "Select an active lease to renew.",
            );
        }

        setRenewingLeaseSubmitting(true);
        setLeaseActionError(null);

        try {
            const renewedLease = await renewLease(
                activeOrganization.id,
                renewingLeaseId,
                request,
            );

            setLeases((currentLeases) =>
                [renewedLease, ...currentLeases].sort(
                    (a, b) => b.startDate.localeCompare(a.startDate),
                ),
            );

            setRenewingLeaseId(null);
            await refreshPropertySpaces();
        } finally {
            setRenewingLeaseSubmitting(false);
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

    if (loading && isValidPropertyId) {
        return (
            <div className="p-8 text-sm text-gray-500">
                Loading property...
            </div>
        );
    }

    const propertyError = isValidPropertyId ? error : "Invalid property ID.";

    if (propertyError || !property) {
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
                        {propertyError ?? "Property not found."}
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

    // Leases are loaded for this property only.
    const propertyLeases = [...leases]
        .sort((a, b) => b.startDate.localeCompare(a.startDate));

    const spacesById = new Map(
        spaces.map((space) => [space.id, space]),
    );

    const renewingLease =
        propertyLeases.find((lease) => lease.id === renewingLeaseId) ?? null;

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
                                {property.addressLine}, {property.city}
                            </p>

                            <p className="text-sm text-gray-500">
                                {[property.postalCode, property.country]
                                    .filter(Boolean)
                                    .join(" ")}
                            </p>
                        </div>
                    </div>
                    <div className="flex w-fit flex-wrap items-center gap-3">
                        <span className="inline-flex rounded-full bg-[#e8efe9] px-3 py-1.5 text-xs font-medium text-[#14302b]">
                            {getPropertyType(spaces)}
                        </span>

                        {!showEditProperty && (
                            <button
                                type="button"
                                onClick={() => setShowEditProperty(true)}
                                className="inline-flex items-center gap-2 rounded-lg border border-[#d5dfd8] bg-white px-4 py-2 text-sm font-medium text-[#14302b] transition hover:bg-[#f8faf8]"
                            >
                                <Pencil className="h-4 w-4" />
                                Edit property
                            </button>
                        )}
                    </div>
                </header>
                    {showEditProperty && (
                        <UpdatePropertyForm
                            key={property.id}
                            property={property}
                            submitting={updatingProperty}
                            onSubmit={handleUpdateProperty}
                            onCancel={() => setShowEditProperty(false)}
                        />
                    )}  
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
                                    setShowCreateLease(false);
                                    setRenewingLeaseId(null);
                                    setStatusUpdateError(null);
                                    setLeaseActionError(null);
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
                                    <DetailField label="Property name" value={property.name} />
                                    <DetailField label="Address" value={property.addressLine} />
                                    <DetailField label="City" value={property.city} />
                                    <DetailField label="Postal code" value={property.postalCode || "—"} />
                                    <DetailField label="Country" value={property.country} />
                                    <DetailField label="Added to Rentora" value={formatDate(property.createdAt)} />
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
                        )}

                        {activeTab === "leases" && (
                            <div className="space-y-5">
                                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                                    <div>
                                        <h2 className="text-lg font-semibold text-[#14302b]">
                                            Leases
                                        </h2>
                                        <p className="mt-1 text-sm text-gray-500">
                                            Lease agreements associated with this property's spaces.
                                        </p>
                                    </div>

                                    {!showCreateLease && renewingLeaseId === null && (
                                        <button
                                            type="button"
                                            disabled={
                                                tenantsLoading ||
                                                Boolean(tenantsError) ||
                                                creatingLease ||
                                                leaseActionBusyId !== null
                                            }
                                            onClick={() => {
                                                setLeaseActionError(null);
                                                setShowCreateLease(true);
                                            }}
                                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#14302b] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#20453d] disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            <Plus className="h-4 w-4" />
                                            {tenantsLoading ? "Loading tenants..." : "Create lease"}
                                        </button>
                                    )}
                                </div>

                                {tenantsError && (
                                    <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                        Unable to load tenants: {tenantsError}
                                    </div>
                                )}

                                {leaseActionError && (
                                    <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                        {leaseActionError}
                                    </div>
                                )}

                                {showCreateLease && (
                                    <CreateLeaseForm
                                        tenants={tenants}
                                        spaces={spaces}
                                        submitting={creatingLease}
                                        onSubmit={handleCreateLease}
                                        onCancel={() => setShowCreateLease(false)}
                                    />
                                )}

                                {renewingLease && (
                                    <RenewLeaseForm
                                        key={renewingLease.id}
                                        lease={renewingLease}
                                        submitting={renewingLeaseSubmitting}
                                        onSubmit={handleRenewLease}
                                        onCancel={() => setRenewingLeaseId(null)}
                                    />
                                )}

                                {leasesError && (
                                    <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                        Unable to load leases: {leasesError}
                                    </div>
                                )}

                                {leasesLoading ? (
                                    <p className="py-8 text-center text-sm text-gray-500">
                                        Loading leases...
                                    </p>
                                ) : leasesError ? null : propertyLeases.length === 0 ? (
                                    <div className="rounded-lg border border-dashed border-[#d5dfd8] px-6 py-12 text-center">
                                        <h3 className="font-semibold text-[#14302b]">
                                            No leases yet
                                        </h3>
                                        <p className="mt-1 text-sm text-gray-500">
                                            No leases have been recorded for this property's spaces.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto rounded-lg border border-[#e1e8e3]">
                                        <table className="w-full min-w-287.5 text-left">
                                            <thead className="bg-[#f8faf8]">
                                                <tr>
                                                    <TableHeader>Space</TableHeader>
                                                    <TableHeader>Tenant ID</TableHeader>
                                                    <TableHeader>Lease period</TableHeader>
                                                    <TableHeader>Monthly rent</TableHeader>
                                                    <TableHeader>Deposit</TableHeader>
                                                    <TableHeader>Status</TableHeader>
                                                    <TableHeader>Actions</TableHeader>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[#edf0ee]">
                                                {propertyLeases.map((lease) => (
                                                    <tr key={lease.id} className="hover:bg-[#f8faf8]">
                                                        <td className="px-4 py-4">
                                                            <p className="text-sm font-medium text-[#14302b]">
                                                                {spacesById.get(lease.spaceId)?.name ?? `Space #${lease.spaceId}`}
                                                            </p>
                                                            <p className="mt-1 text-xs text-gray-500">
                                                                Lease #{lease.id}
                                                            </p>
                                                        </td>
                                                        <td className="px-4 py-4 text-sm text-gray-600">
                                                            #{lease.tenantId}
                                                        </td>
                                                        <td className="px-4 py-4 text-sm text-gray-600">
                                                            <div>{formatDate(lease.startDate)}</div>
                                                            <div className="mt-1 text-gray-400">
                                                                to {formatDate(lease.endDate)}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4 text-sm font-medium text-[#243b35]">
                                                            {formatMoney(lease.monthlyRentCents)}
                                                        </td>
                                                        <td className="px-4 py-4 text-sm text-gray-600">
                                                            {formatMoney(lease.securityDepositCents)}
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <LeaseStatusBadge status={lease.status} />
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            {lease.status === "ACTIVE" ? (
                                                                <div className="flex flex-wrap gap-2">
                                                                    <button
                                                                        type="button"
                                                                        disabled={
                                                                            leaseActionBusyId !== null ||
                                                                            renewingLeaseSubmitting ||
                                                                            creatingLease
                                                                        }
                                                                        onClick={() => {
                                                                            setLeaseActionError(null);
                                                                            setShowCreateLease(false);
                                                                            setRenewingLeaseId(lease.id);
                                                                        }}
                                                                        className="rounded-lg border border-[#d5dfd8] bg-white px-3 py-2 text-xs font-medium text-[#14302b] hover:bg-[#f8faf8] disabled:opacity-50"
                                                                    >
                                                                        Renew
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        disabled={
                                                                            leaseActionBusyId !== null ||
                                                                            renewingLeaseSubmitting ||
                                                                            creatingLease
                                                                        }
                                                                        onClick={() => void handleEndLease(lease)}
                                                                        className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 hover:bg-amber-100 disabled:opacity-50"
                                                                    >
                                                                        {leaseActionBusyId === lease.id ? "Saving..." : "End"}
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        disabled={
                                                                            leaseActionBusyId !== null ||
                                                                            renewingLeaseSubmitting ||
                                                                            creatingLease
                                                                        }
                                                                        onClick={() => void handleCancelLease(lease)}
                                                                        className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                                                                    >
                                                                        {leaseActionBusyId === lease.id ? "Saving..." : "Cancel"}
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <span className="text-sm text-gray-400">
                                                                    —
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === "financials" && (
                            <PropertyFinancialsTab
                                propertyId={property.id}
                                spaces={spaces}
                                leases={leases}
                            />
                        )}

                        {activeTab === "maintenance" && (
                            <PropertyMaintenanceTab
                                propertyId={property.id}
                                spaces={spaces}
                                onSpacesChanged={reloadSpaces}
                            />
                        )}
                    </div>
                </section>
            </div>
        </div>
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

function LeaseStatusBadge({
    status,
}: {
    status: LeaseStatus;
}) {
    const styles: Record<LeaseStatus, string> = {
        ACTIVE: "bg-[#e8efe9] text-[#14302b]",
        ENDED: "bg-gray-100 text-gray-600",
        CANCELLED: "bg-red-50 text-red-700",
    };

    const labels: Record<LeaseStatus, string> = {
        ACTIVE: "Active",
        ENDED: "Ended",
        CANCELLED: "Cancelled",
    };

    return (
        <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${styles[status]}`}
        >
            {labels[status]}
        </span>
    );
}
