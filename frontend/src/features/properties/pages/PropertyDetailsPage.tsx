import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import {
    ArrowLeft,
    Building2,
    LayoutGrid,
    Pencil,
} from "lucide-react";

import { useOrganization } from "../../organizations/useOrganization";

import {
    getProperty,
    getSpaces,
    updateProperty,
} from "../api/propertyApi";

import UpdatePropertyForm from "../components/form/EditPropertyForm";
import PropertyFinancialsTab from "../components/tabs/PropertyFinancialsTab";
import PropertyLeasesTab from "../components/tabs/PropertyLeasesTab";
import PropertyMaintenanceTab from "../components/tabs/PropertyMaintenanceTab";
import PropertySpacesTab from "../components/tabs/PropertySpacesTab";
import { propertyTypeLabels } from "../propertyLabels";
import { spaceTypeLabels } from "../spaceLabels";

import DetailField from "../../../components/ui/DetailField";
import StatCard from "../../../components/ui/StatCard";
import { formatDate } from "../../../lib/format";

import type {
    PropertyResponse,
    SpaceResponse,
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

function getPropertyType(spaces: SpaceResponse[]): string {
    const types = new Set(spaces.map((space) => space.type));

    if (types.size === 0) {
        return propertyTypeLabels.NOT_CLASSIFIED;
    }

    if (types.size > 1) {
        return propertyTypeLabels.MIXED_USE;
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
    const [showEditProperty, setShowEditProperty] = useState(false);
    const [updatingProperty, setUpdatingProperty] = useState(false);

    const [activeTab, setActiveTab] =
        useState<DetailsTab>("overview");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const parsedPropertyId = Number(propertyId);

    const isValidPropertyId =
        Number.isInteger(parsedPropertyId) && parsedPropertyId > 0;

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
                    <StatCard
                        label="Total spaces"
                        value={spaces.length.toString()}
                        description="Configured rentable spaces"
                    />
                    <StatCard
                        label="Occupied"
                        value={occupiedSpaces.toString()}
                        description="Currently occupied spaces"
                    />
                    <StatCard
                        label="Vacant"
                        value={vacantSpaces.toString()}
                        description="Available spaces"
                    />
                    <StatCard
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
                                    <DetailField variant="plain" label="Property name" value={property.name} />
                                    <DetailField variant="plain" label="Address" value={property.addressLine} />
                                    <DetailField variant="plain" label="City" value={property.city} />
                                    <DetailField variant="plain" label="Postal code" value={property.postalCode || "—"} />
                                    <DetailField variant="plain" label="Country" value={property.country} />
                                    <DetailField variant="plain" label="Added to Rentora" value={formatDate(property.createdAt)} />
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
                            <PropertySpacesTab
                                propertyId={property.id}
                                spaces={spaces}
                                onSpacesChange={setSpaces}
                            />
                        )}

                        {activeTab === "leases" && (
                            <PropertyLeasesTab
                                propertyId={property.id}
                                spaces={spaces}
                                onSpacesChanged={reloadSpaces}
                            />
                        )}

                        {activeTab === "financials" && (
                            <PropertyFinancialsTab
                                propertyId={property.id}
                                spaces={spaces}
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
