import { apiRequest } from "../../../lib/api/client";

import type {
    PropertyResponse,
    CreatePropertyRequest,
    SpaceResponse,
    CreateSpaceRequest,
} from "../types";

export async function getProperties(organizationId: number): Promise<PropertyResponse[]> {
    return apiRequest<PropertyResponse[]>(`/api/organizations/${organizationId}/properties`, {
            method: "GET",
            authenticated: true,
        },
    );
}

export async function createProperty(organizationId: number, request: CreatePropertyRequest): Promise<PropertyResponse> {
    return apiRequest<PropertyResponse>(`/api/organizations/${organizationId}/properties`, {
            method: "POST",
            body: JSON.stringify(request),
            authenticated: true,
        },
    );
}

export async function getSpaces(organizationId: number, propertyId: number): Promise<SpaceResponse[]> {
    return apiRequest<SpaceResponse[]>(`/api/organizations/${organizationId}/properties/${propertyId}/spaces`, {
            method: "GET",
            authenticated: true,
        },
    );
}

export async function createSpace(organizationId: number, propertyId: number, request: CreateSpaceRequest): Promise<SpaceResponse> {
    return apiRequest<SpaceResponse>(`/api/organizations/${organizationId}/properties/${propertyId}/spaces`, {
            method: "POST",
            body: JSON.stringify(request),
            authenticated: true,
        },
    );
}