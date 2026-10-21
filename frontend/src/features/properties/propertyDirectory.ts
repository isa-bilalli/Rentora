import { getOrganizationSpaces, getProperties } from "./api/propertyApi";
import type { PropertyResponse, SpaceResponse } from "./types";

// Every property and space in the organization, for pages that show names next to IDs.
export interface PropertyDirectory {
    propertyById: Map<number, PropertyResponse>;
    spaceById: Map<number, SpaceResponse>;
}

export interface PropertyWithSpaces {
    id: number;
    name: string;
    spaces: SpaceResponse[];
}

// Properties A–Z, each with its spaces, for forms that pick a property and then a space.
export function listPropertiesWithSpaces({ propertyById, spaceById }: PropertyDirectory): PropertyWithSpaces[] {
    const spaces = [...spaceById.values()];
    return [...propertyById.values()]
        .map((property) => ({
            id: property.id,
            name: property.name,
            spaces: spaces.filter((space) => space.propertyId === property.id),
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
}

// Two requests side by side, however many properties there are: the properties, and every space across them.
export async function loadPropertyDirectory(organizationId: number): Promise<PropertyDirectory> {
    const [properties, spaces] = await Promise.all([
        getProperties(organizationId),
        getOrganizationSpaces(organizationId),
    ]);

    return {
        propertyById: new Map(properties.map((property) => [property.id, property])),
        spaceById: new Map(spaces.map((space) => [space.id, space])),
    };
}
