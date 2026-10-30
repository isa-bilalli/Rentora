
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import {
    ArrowLeft,
    Building2,
    Plus,
} from "lucide-react";

import { useOrganization } from "../../organizations/useOrganization";

import {
    createProperty,
    createSpace,
} from "../api/propertyApi";

import type {
    CreateSpaceRequest,
    PropertyResponse,
} from "../types";
import {
    checkPropertyFields,
    checkSpaceFields,
    spaceNameLimit,
    type PropertyFields as PropertyFieldValues,
    type SpaceFields,
    type SpaceMessages,
} from "../validation";
import PropertyFields from "../components/form/PropertyFields";
import InitialSpacesSection, { type InitialSpaceDraft } from "../components/InitialSpacesSection";
import PartialCreationNotice from "../components/PartialCreationNotice";

// How this page words a problem with one of the spaces added along with the property.
function initialSpaceMessages(position: number): SpaceMessages {
    return {
        nameMissing: `Please enter a name for initial space ${position}.`,
        nameTooLong: `The name of initial space ${position} cannot exceed ${spaceNameLimit} characters.`,
        floor: `The floor for initial space ${position} must be a whole number.`,
        area: `The area for initial space ${position} must be greater than zero.`,
    };
}

export default function CreatePropertyPage() {
    const navigate = useNavigate();

    const {
        activeOrganization,
        status: organizationStatus,
    } = useOrganization();

    const [fields, setFields] = useState<PropertyFieldValues>({
        name: "",
        addressLine: "",
        city: "",
        postalCode: "",
        country: "",
    });

    const [initialSpaces, setInitialSpaces] =
        useState<InitialSpaceDraft[]>([]);

    const [nextDraftId, setNextDraftId] = useState(1);

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [createdProperty, setCreatedProperty] =
        useState<PropertyResponse | null>(null);

    const [partialCreationError, setPartialCreationError] =
        useState<string | null>(null);

    // Nothing can change while saving, or once the property exists.
    const locked = submitting || Boolean(createdProperty);

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
        field: keyof SpaceFields,
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

    // The spaces as the API takes them, or null once the first problem is shown.
    function validateInitialSpaces(): CreateSpaceRequest[] | null {
        const requests: CreateSpaceRequest[] = [];

        for (let index = 0; index < initialSpaces.length; index++) {
            const checked = checkSpaceFields(initialSpaces[index], initialSpaceMessages(index + 1));

            if (!checked.ok) {
                setError(checked.error);
                return null;
            }

            requests.push(checked.value);
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

        const checked = checkPropertyFields(
            fields,
            "Please complete all required property fields.",
        );

        if (!checked.ok) {
            setError(checked.error);
            return;
        }

        const spaceRequests = validateInitialSpaces();

        if (spaceRequests === null) {
            return;
        }

        setSubmitting(true);

        try {
            const property = await createProperty(
                activeOrganization.id,
                checked.value,
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
                    <PartialCreationNotice
                        propertyId={createdProperty.id}
                        message={partialCreationError}
                    />
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

                        <PropertyFields
                            idPrefix="property"
                            mode="create"
                            values={fields}
                            onChange={(field, value) =>
                                setFields((current) => ({ ...current, [field]: value }))
                            }
                            disabled={locked}
                        />

                        <p className="mt-5 text-xs text-gray-500">
                            Fields marked with <span className="text-red-600">*</span> are required.
                        </p>
                    </section>

                    <InitialSpacesSection
                        spaces={initialSpaces}
                        onAdd={addInitialSpace}
                        onChange={updateInitialSpace}
                        onRemove={removeInitialSpace}
                        disabled={locked}
                    />

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
                            disabled={locked}
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
