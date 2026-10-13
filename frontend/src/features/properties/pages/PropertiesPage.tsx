import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Plus, Building2 } from "lucide-react";

import { useOrganization } from "../../organizations/OrganizationProvider";
import { getPropertySummaries } from "../api/propertyApi";

import PropertySummaryCards from "../components/PropertySummaryCards";
import PropertyFilters, {
    type PropertyTypeFilter,
} from "../components/PropertyFilters";
import PropertyTable from "../components/PropertyTable";

import type { PropertySummaryResponse } from "../types";

export default function PropertiesPage() {
    const {
        activeOrganization,
        status: organizationStatus,
    } = useOrganization();

    const [properties, setProperties] =
        useState<PropertySummaryResponse[]>([]);

    const [search, setSearch] = useState("");
    const [propertyType, setPropertyType] =
        useState<PropertyTypeFilter>("ALL");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (
            organizationStatus !== "ready" ||
            !activeOrganization
        ) {
            setLoading(false);
            return;
        }

        let cancelled = false;

        async function loadProperties() {
            setLoading(true);
            setError(null);
            try {
                const result = await getPropertySummaries(
                    activeOrganization.id,
                );

                if (!cancelled) {
                    setProperties(result);
                }
            } catch (error) {
                if (!cancelled) {
                    setError(
                        error instanceof Error
                            ? error.message
                            : "Failed to load properties.",
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        void loadProperties();

        return () => {
            cancelled = true;
        };
    }, [
        organizationStatus,
        activeOrganization?.id,
    ]);

    const normalizedSearch = search.trim().toLowerCase();

    const filteredProperties = properties.filter(
        (property) => {
            const matchesSearch =
                [
                    property.name,
                    property.addressLine,
                    property.city,
                    property.postalCode ?? "",
                    property.country,
                ]
                    .join(" ")
                    .toLowerCase()
                    .includes(normalizedSearch);

            const matchesType =
                propertyType === "ALL" ||
                property.propertyType === propertyType;

            return matchesSearch && matchesType;
        },
    );

    if (organizationStatus === "loading") {
        return (
            <div className="p-6 text-sm text-gray-500">
                Loading organization...
            </div>
        );
    }

    if (organizationStatus === "error") {
        return (
            <div className="p-6">
                <h1 className="text-xl font-semibold text-[#14302b]">
                    Unable to load your organization
                </h1>
            </div>
        );
    }

    if (!activeOrganization) {
        return (
            <div className="p-6">
                <h1 className="text-xl font-semibold text-[#14302b]">
                    No organization selected
                </h1>
            </div>
        );
    }

    return (
        <div className="min-h-full bg-[#f7f9f7] p-5 sm:p-8">
            <div className="mx-auto max-w-[1600px] space-y-7">
                <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-[#14302b] sm:text-3xl">
                            Properties
                        </h1>

                        <p className="mt-1 text-sm text-gray-500">
                            Manage your rental portfolio.
                        </p>
                    </div>

                    <Link
                        to="/app/properties/new"
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#14302b] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#20453d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d4a94f]"
                    >
                        <Plus
                            className="h-4 w-4"
                            aria-hidden="true"
                        />
                        Add property
                    </Link>
                </header>

                {loading ? (
                    <div
                        className="rounded-xl border border-[#e1e8e3] bg-white p-8 text-sm text-gray-500"
                        role="status"
                    >
                        Loading properties...
                    </div>
                ) : error ? (
                    <div
                        className="rounded-xl border border-red-200 bg-white p-6"
                        role="alert"
                    >
                        <h2 className="font-semibold text-red-800">
                            Couldn't load properties
                        </h2>

                        <p className="mt-1 text-sm text-red-700">
                            {error}
                        </p>
                    </div>
                ) : (
                    <>
                        <PropertySummaryCards
                            properties={properties}
                        />

                        <section className="space-y-4">
                            <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-end">
                                <div>
                                    <h2 className="text-lg font-semibold text-[#14302b]">
                                        Your portfolio
                                    </h2>

                                    <p className="mt-1 text-sm text-gray-500">
                                        View and manage your properties.
                                    </p>
                                </div>

                                <span className="text-sm text-gray-500">
                                    {filteredProperties.length}{" "}
                                    {filteredProperties.length === 1
                                        ? "property"
                                        : "properties"}
                                </span>
                            </div>

                            <PropertyFilters
                                search={search}
                                onSearchChange={setSearch}
                                propertyType={propertyType}
                                onPropertyTypeChange={setPropertyType}
                            />

                            {properties.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-[#d5dfd8] bg-white px-6 py-14 text-center">
                                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#e8efe9] text-[#14302b]">
                                        <Building2
                                            className="h-6 w-6"
                                            aria-hidden="true"
                                        />
                                    </div>

                                    <h3 className="mt-4 text-base font-semibold text-[#14302b]">
                                        No properties yet
                                    </h3>

                                    <p className="mt-1 text-sm text-gray-500">
                                        Add your first property to start
                                        managing your portfolio.
                                    </p>

                                    <Link
                                        to="/app/properties/new"
                                        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#14302b] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#20453d]"
                                    >
                                        <Plus
                                            className="h-4 w-4"
                                            aria-hidden="true"
                                        />
                                        Add your first property
                                    </Link>
                                </div>
                            ) : (
                                <PropertyTable
                                    properties={filteredProperties}
                                />
                            )}
                        </section>
                    </>
                )}
            </div>
        </div>
    );
}