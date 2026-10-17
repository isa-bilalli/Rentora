import { getProperties, getSpaces } from "./api/propertyApi";
import type { PropertyResponse, SpaceResponse } from "./types";

// Every property and space in the organization, for pages that show names next to IDs.
export interface PropertyDirectory {
    propertyById: Map<number, PropertyResponse>;
    spaceById: Map<number, SpaceResponse>;
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
