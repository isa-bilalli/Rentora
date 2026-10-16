
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import {
    ArrowLeft,
    Building2,
    Plus,
    Trash2,
    LayoutGrid,
} from "lucide-react";

import { useOrganization } from "../../organizations/useOrganization";

import {
    createProperty,
    createSpace,
} from "../api/propertyApi";

import type {
    CreatePropertyRequest,
    CreateSpaceRequest,
    PropertyResponse,
    SpaceType,
} from "../types";

interface InitialSpaceDraft {
    id: number;
    name: string;
    type: SpaceType;
    floor: string;
    area: string;
}

const spaceTypes: { value: SpaceType; label: string }[] = [
    { value: "RESIDENTIAL", label: "Residential" },
    { value: "OFFICE", label: "Office" },
    { value: "RETAIL", label: "Retail" },
    { value: "OTHER", label: "Other" },
];

const inputClass =
    "w-full rounded-lg border border-[#dce4de] bg-white px-3 py-2.5 text-sm text-[#243b35] outline-none transition placeholder:text-gray-400 focus:border-[#14302b] focus:ring-2 focus:ring-[#14302b]/10 disabled:cursor-not-allowed disabled:bg-gray-100";

const labelClass =
    "mb-1.5 block text-sm font-medium text-[#243b35]";

export default function CreatePropertyPage() {
    const navigate = useNavigate();

    const {
        activeOrganization,
        status: organizationStatus,
    } = useOrganization();

    const [name, setName] = useState("");
    const [addressLine, setAddressLine] = useState("");
    const [city, setCity] = useState("");
    const [postalCode, setPostalCode] = useState("");
    const [country, setCountry] = useState("");

    const [showInitialSpaces, setShowInitialSpaces] =
        useState(false);

    const [initialSpaces, setInitialSpaces] =
        useState<InitialSpaceDraft[]>([]);

    const [nextDraftId, setNextDraftId] = useState(1);

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [createdProperty, setCreatedProperty] =
        useState<PropertyResponse | null>(null);

    const [partialCreationError, setPartialCreationError] =
        useState<string | null>(null);

    function addInitialSpace() {
        setInitialSpaces((currentSpaces) => [
            ...currentSpaces,
            {
                id: nextDraftId,
                name: "",
                type: "RESIDENTIAL",
                floor: "",
                area: "",
            },
        ]);

        setNextDraftId((currentId) => currentId + 1);
    }

    function updateInitialSpace(
        id: number,
        field: keyof Omit<InitialSpaceDraft, "id">,
        value: string,
    ) {
        setInitialSpaces((currentSpaces) =>
            currentSpaces.map((space) =>
                space.id === id
                    ? { ...space, [field]: value }
                    : space,
            ),
        );
    }

    function removeInitialSpace(id: number) {
        setInitialSpaces((currentSpaces) =>
            currentSpaces.filter((space) => space.id !== id),
        );
    }

    function validateInitialSpaces(): CreateSpaceRequest[] | null {
        const requests: CreateSpaceRequest[] = [];

        for (let index = 0; index < initialSpaces.length; index++) {
            const space = initialSpaces[index];
            const position = index + 1;

            if (!space.name.trim()) {
                setError(
                    `Please enter a name for initial space ${position}.`,
                );
                return null;
            }

            if (space.name.trim().length > 100) {
                setError(
                    `The name of initial space ${position} cannot exceed 100 characters.`,
                );
                return null;
            }

            const floor =
                space.floor.trim() === ""
                    ? null
                    : Number(space.floor);

            if (
                floor !== null &&
                !Number.isInteger(floor)
            ) {
                setError(
                    `The floor for initial space ${position} must be a whole number.`,
                );
                return null;
            }

            const area =
                space.area.trim() === ""
                    ? null
                    : Number(space.area);

            if (
                area !== null &&
                (!Number.isFinite(area) || area <= 0)
            ) {
                setError(
                    `The area for initial space ${position} must be greater than zero.`,
                );
                return null;
            }

            requests.push({
                name: space.name.trim(),
                type: space.type,
                floor,
                area,
            });
        }

        return requests;
    }

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();
        setError(null);
        setPartialCreationError(null);

        if (!activeOrganization) {
            setError("No active organization is selected.");
            return;
        }

        if (createdProperty) {
            setError(
                "This property has already been created. Open its details page to continue.",
            );
            return;
        }

        const trimmedName = name.trim();
        const trimmedAddress = addressLine.trim();
        const trimmedCity = city.trim();
        const trimmedPostalCode = postalCode.trim();
        const trimmedCountry = country.trim();

        if (
            !trimmedName ||
            !trimmedAddress ||
            !trimmedCity ||
            !trimmedCountry
        ) {
            setError(
                "Please complete all required property fields.",
            );
            return;
        }

        if (trimmedName.length > 150) {
            setError("Property name cannot exceed 150 characters.");
            return;
        }

        if (trimmedAddress.length > 255) {
            setError("Address cannot exceed 255 characters.");
            return;
        }

        if (trimmedCity.length > 100) {
            setError("City cannot exceed 100 characters.");
            return;
        }

        if (trimmedPostalCode.length > 20) {
            setError("Postal code cannot exceed 20 characters.");
            return;
        }

        if (trimmedCountry.length > 100) {
            setError("Country cannot exceed 100 characters.");
            return;
        }

        const spaceRequests = validateInitialSpaces();

        if (spaceRequests === null) {
            return;
        }

        const request: CreatePropertyRequest = {
            name: trimmedName,
            addressLine: trimmedAddress,
            city: trimmedCity,
            postalCode: trimmedPostalCode,
            country: trimmedCountry,
        };

        setSubmitting(true);

        try {
            const property = await createProperty(
                activeOrganization.id,
                request,
            );

            // Keep the created property ID if initial-space creation
            // only partially succeeds. This prevents accidental
            // duplicate property creation when the user retries.
            setCreatedProperty(property);

            for (
                let index = 0;
                index < spaceRequests.length;
                index++
            ) {
                try {
                    await createSpace(
                        activeOrganization.id,
                        property.id,
                        spaceRequests[index],
                    );
                } catch (spaceError) {
                    const spaceName =
                        spaceRequests[index].name;

                    const message =
                        spaceError instanceof Error
                            ? spaceError.message
                            : "Unknown server error.";

                    setPartialCreationError(
                        `Property "${property.name}" was created successfully, but initial space "${spaceName}" could not be created. ${message}`,
                    );

                    return;
                }
            }

            navigate(`/app/properties/${property.id}`);
        } catch (requestError) {
            setError(
                requestError instanceof Error
                    ? requestError.message
                    : "Failed to create property.",
            );
        } finally {
            setSubmitting(false);
        }
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

    return (
        <div className="min-h-full bg-[#f7f9f7] p-5 sm:p-8">
            <div className="mx-auto max-w-4xl space-y-7">
                <Link
                    to="/app/properties"
                    className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-[#14302b]"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Properties
                </Link>

                <header className="flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#e8efe9] text-[#14302b]">
                        <Building2 className="h-6 w-6" />
                    </div>

                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-[#14302b] sm:text-3xl">
                            Create property
                        </h1>

                        <p className="mt-1 text-sm text-gray-500">
                            Add a property to{" "}
                            <span className="font-medium text-[#243b35]">
                                {activeOrganization.name}
                            </span>
                            {" "}and optionally configure its rentable spaces.
                        </p>
                    </div>
                </header>

                {partialCreationError && createdProperty && (
                    <div
                        role="alert"
                        className="rounded-xl border border-amber-200 bg-amber-50 p-5"
                    >
                        <h2 className="font-semibold text-amber-900">
                            Property created with incomplete setup
                        </h2>

                        <p className="mt-2 text-sm text-amber-900">
                            {partialCreationError}
                        </p>

                        <p className="mt-2 text-sm text-amber-900">
                            You can add any missing spaces from the
                            property's Spaces tab.
                        </p>

                        <Link
                            to={`/app/properties/${createdProperty.id}`}
                            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#14302b] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#20453d]"
                        >
                            Open property
                        </Link>
                    </div>
                )}

                <form
                    onSubmit={handleSubmit}
                    className="space-y-6"
                >
                    <section className="rounded-xl border border-[#e1e8e3] bg-white p-5 shadow-sm sm:p-7">
                        <div className="mb-6">
                            <h2 className="text-lg font-semibold text-[#14302b]">
                                Property information
                            </h2>

                            <p className="mt-1 text-sm text-gray-500">
                                Enter the basic information used to identify this property.
                            </p>
                        </div>

                        <div className="grid gap-5 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                                <label
                                    htmlFor="property-name"
                                    className={labelClass}
                                >
                                    Property name
                                    <span className="ml-1 text-red-600">
                                        *
                                    </span>
                                </label>

                                <input
                                    id="property-name"
                                    required
                                    maxLength={150}
                                    value={name}
                                    onChange={(event) =>
                                        setName(event.target.value)
                                    }
                                    placeholder="e.g. Riverside Apartments"
                                    disabled={submitting || Boolean(createdProperty)}
                                    className={inputClass}
                                />
                            </div>

                            <div className="sm:col-span-2">
                                <label
                                    htmlFor="property-address"
                                    className={labelClass}
                                >
                                    Street address
                                    <span className="ml-1 text-red-600">
                                        *
                                    </span>
                                </label>

                                <input
                                    id="property-address"
                                    required
                                    maxLength={255}
                                    value={addressLine}
                                    onChange={(event) =>
                                        setAddressLine(event.target.value)
                                    }
                                    placeholder="e.g. 25 Main Street"
                                    disabled={submitting || Boolean(createdProperty)}
                                    className={inputClass}
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="property-city"
                                    className={labelClass}
                                >
                                    City
                                    <span className="ml-1 text-red-600">
                                        *
                                    </span>
                                </label>

                                <input
                                    id="property-city"
                                    required
                                    maxLength={100}
                                    value={city}
                                    onChange={(event) =>
                                        setCity(event.target.value)
                                    }
                                    placeholder="e.g. Prishtina"
                                    disabled={submitting || Boolean(createdProperty)}
                                    className={inputClass}
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="property-postal-code"
                                    className={labelClass}
                                >
                                    Postal code
                                    <span className="font-normal text-gray-400">
                                        {" "}(optional)
                                    </span>
                                </label>

                                <input
                                    id="property-postal-code"
                                    maxLength={20}
                                    value={postalCode}
                                    onChange={(event) =>
                                        setPostalCode(event.target.value)
                                    }
                                    placeholder="e.g. 10000"
                                    disabled={submitting || Boolean(createdProperty)}
                                    className={inputClass}
                                />
                            </div>

                            <div className="sm:col-span-2">
                                <label
                                    htmlFor="property-country"
                                    className={labelClass}
                                >
                                    Country
                                    <span className="ml-1 text-red-600">
                                        *
                                    </span>
                                </label>

                                <input
                                    id="property-country"
                                    required
                                    maxLength={100}
                                    value={country}
                                    onChange={(event) =>
                                        setCountry(event.target.value)
                                    }
                                    placeholder="e.g. Kosovo"
                                    disabled={submitting || Boolean(createdProperty)}
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        <p className="mt-5 text-xs text-gray-500">
                            Fields marked with <span className="text-red-600">*</span> are required.
                        </p>
                    </section>

                    <section className="overflow-hidden rounded-xl border border-[#e1e8e3] bg-white shadow-sm">
                        <button
                            type="button"
                            onClick={() =>
                                setShowInitialSpaces((current) => !current)
                            }
                            disabled={submitting || Boolean(createdProperty)}
                            aria-expanded={showInitialSpaces}
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

                                    {initialSpaces.length > 0 && (
                                        <p className="mt-2 text-xs font-medium text-[#426b5e]">
                                            {initialSpaces.length}{" "}
                                            {initialSpaces.length === 1
                                                ? "space configured"
                                                : "spaces configured"}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <span className="shrink-0 text-sm font-medium text-[#14302b]">
                                {showInitialSpaces ? "Hide" : "Configure"}
                            </span>
                        </button>

                        {showInitialSpaces && (
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
                                        onClick={addInitialSpace}
                                        disabled={submitting || Boolean(createdProperty)}
                                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#d5dfd8] bg-white px-4 py-2.5 text-sm font-medium text-[#14302b] hover:bg-[#f8faf8] disabled:opacity-60"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Add space
                                    </button>
                                </div>

                                {initialSpaces.length === 0 ? (
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
                                        {initialSpaces.map((space, index) => (
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
                                                        onClick={() =>
                                                            removeInitialSpace(space.id)
                                                        }
                                                        disabled={submitting || Boolean(createdProperty)}
                                                        aria-label={`Remove space ${index + 1}`}
                                                        className="inline-flex items-center gap-2 rounded-lg p-2 text-gray-500 hover:bg-white hover:text-red-700 disabled:opacity-50"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                        <span className="text-xs font-medium">
                                                            Remove
                                                        </span>
                                                    </button>
                                                </div>

                                                <div className="grid gap-4 sm:grid-cols-2">
                                                    <div>
                                                        <label
                                                            htmlFor={`initial-space-name-${space.id}`}
                                                            className={labelClass}
                                                        >
                                                            Space name
                                                        </label>

                                                        <input
                                                            id={`initial-space-name-${space.id}`}
                                                            required
                                                            maxLength={100}
                                                            value={space.name}
                                                            onChange={(event) =>
                                                                updateInitialSpace(
                                                                    space.id,
                                                                    "name",
                                                                    event.target.value,
                                                                )
                                                            }
                                                            placeholder="e.g. Apartment 1"
                                                            disabled={submitting || Boolean(createdProperty)}
                                                            className={inputClass}
                                                        />
                                                    </div>

                                                    <div>
                                                        <label
                                                            htmlFor={`initial-space-type-${space.id}`}
                                                            className={labelClass}
                                                        >
                                                            Space type
                                                        </label>

                                                        <select
                                                            id={`initial-space-type-${space.id}`}
                                                            value={space.type}
                                                            onChange={(event) =>
                                                                updateInitialSpace(
                                                                    space.id,
                                                                    "type",
                                                                    event.target.value,
                                                                )
                                                            }
                                                            disabled={submitting || Boolean(createdProperty)}
                                                            className={inputClass}
                                                        >
                                                            {spaceTypes.map((option) => (
                                                                <option
                                                                    key={option.value}
                                                                    value={option.value}
                                                                >
                                                                    {option.label}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    <div>
                                                        <label
                                                            htmlFor={`initial-space-floor-${space.id}`}
                                                            className={labelClass}
                                                        >
                                                            Floor{" "}
                                                            <span className="font-normal text-gray-400">
                                                                (optional)
                                                            </span>
                                                        </label>

                                                        <input
                                                            id={`initial-space-floor-${space.id}`}
                                                            type="number"
                                                            step="1"
                                                            value={space.floor}
                                                            onChange={(event) =>
                                                                updateInitialSpace(
                                                                    space.id,
                                                                    "floor",
                                                                    event.target.value,
                                                                )
                                                            }
                                                            placeholder="e.g. 2"
                                                            disabled={submitting || Boolean(createdProperty)}
                                                            className={inputClass}
                                                        />
                                                    </div>

                                                    <div>
                                                        <label
                                                            htmlFor={`initial-space-area-${space.id}`}
                                                            className={labelClass}
                                                        >
                                                            Area (m²){" "}
                                                            <span className="font-normal text-gray-400">
                                                                (optional)
                                                            </span>
                                                        </label>

                                                        <input
                                                            id={`initial-space-area-${space.id}`}
                                                            type="number"
                                                            min="0.01"
                                                            step="0.01"
                                                            value={space.area}
                                                            onChange={(event) =>
                                                                updateInitialSpace(
                                                                    space.id,
                                                                    "area",
                                                                    event.target.value,
                                                                )
                                                            }
                                                            placeholder="e.g. 75.5"
                                                            disabled={submitting || Boolean(createdProperty)}
                                                            className={inputClass}
                                                        />
                                                    </div>
                                                </div>
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

                    {error && (
                        <div
                            role="alert"
                            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                        >
                            {error}
                        </div>
                    )}

                    <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
                        <Link
                            to="/app/properties"
                            className="inline-flex items-center justify-center rounded-lg border border-[#d5dfd8] bg-white px-5 py-3 text-sm font-medium text-[#243b35] transition hover:bg-gray-50"
                        >
                            Cancel
                        </Link>

                        <button
                            type="submit"
                            disabled={
                                submitting ||
                                Boolean(createdProperty)
                            }
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#14302b] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#20453d] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {submitting ? (
                                <>
                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                    Creating property...
                                </>
                            ) : (
                                <>
                                    <Plus className="h-4 w-4" />
                                    Create property
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
