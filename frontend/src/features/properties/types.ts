export interface PropertyResponse {
    id: number;
    organizationId: number;
    name: string;
    addressLine: string;
    city: string;
    postalCode: string | null;
    country: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreatePropertyRequest {
    name: string;
    addressLine: string;
    city: string;
    postalCode: string;
    country: string;
}

export type SpaceType =
    | "RESIDENTIAL"
    | "OFFICE"
    | "RETAIL"
    | "OTHER";

export type SpaceStatus =
    | "VACANT"
    | "OCCUPIED"
    | "RESERVED"
    | "MAINTENANCE";

export interface SpaceResponse {
    id: number;
    propertyId: number;
    name: string;
    type: SpaceType;
    floor: number | null;
    area: number | null;
    status: SpaceStatus;
    createdAt: string;
    updatedAt: string;
}

export interface CreateSpaceRequest {
    name: string;
    type: SpaceType;
    floor: number | null;
    area: number | null;
}