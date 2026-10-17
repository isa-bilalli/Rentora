import { getProperties, getSpaces } from "./api/propertyApi";
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

// There is no organization-wide spaces endpoint, so this makes one request per property.
export async function loadPropertyDirectory(organizationId: number): Promise<PropertyDirectory> {
    const properties = await getProperties(organizationId);
    const spaceLists = await Promise.all(
        properties.map((property) => getSpaces(organizationId, property.id)),
    );

    return {
        propertyById: new Map(properties.map((property) => [property.id, property])),
        spaceById: new Map(spaceLists.flat().map((space) => [space.id, space])),
    };
}
