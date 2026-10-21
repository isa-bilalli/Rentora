import { apiRequest } from "../../../lib/api/client";

import type {
    PropertyResponse,
    CreatePropertyRequest,
    SpaceResponse,
    PropertySummaryResponse,
    CreateSpaceRequest,
    UpdateSpaceRequest,
    UpdateSpaceStatusRequest,
    UpdatePropertyRequest,
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

// Every space across the organization's properties, ordered by property and then space.
export async function getOrganizationSpaces(organizationId: number): Promise<SpaceResponse[]> {
    return apiRequest<SpaceResponse[]>(`/api/organizations/${organizationId}/spaces`, {
        authenticated: true,
    });
}

// One space by its ID alone. The response names the space's property.
export async function getSpace(organizationId: number, spaceId: number): Promise<SpaceResponse> {
    return apiRequest<SpaceResponse>(`/api/organizations/${organizationId}/spaces/${spaceId}`, {
        authenticated: true,
    });
}

export async function createSpace(organizationId: number, propertyId: number, request: CreateSpaceRequest): Promise<SpaceResponse> {
    return apiRequest<SpaceResponse>(`/api/organizations/${organizationId}/properties/${propertyId}/spaces`, {
            method: "POST",
            body: JSON.stringify(request),
            authenticated: true,
        },
    );
}

export async function getPropertySummaries(organizationId: number): Promise<PropertySummaryResponse[]> {
    return apiRequest<PropertySummaryResponse[]>(`/api/organizations/${organizationId}/properties/summary`, {
            method: "GET",
            authenticated: true,
        },
    );
}

export async function getProperty(organizationId: number, propertyId: number): Promise<PropertyResponse> {
    return apiRequest<PropertyResponse>(`/api/organizations/${organizationId}/properties/${propertyId}`, {
        method: "GET",
        authenticated: true,
    })
}

export async function updateSpace(organizationId: number, propertyId: number, spaceId: number, request: UpdateSpaceRequest): Promise<SpaceResponse>{
    return apiRequest<SpaceResponse>(`/api/organizations/${organizationId}/properties/${propertyId}/spaces/${spaceId}`, {
        method: "PATCH",
        body: JSON.stringify(request),
        authenticated: true,
    })
}

export async function updateSpaceStatus(organizationId: number, propertyId: number, spaceId: number, request: UpdateSpaceStatusRequest): Promise<SpaceResponse>{
    return apiRequest<SpaceResponse>(`/api/organizations/${organizationId}/properties/${propertyId}/spaces/${spaceId}/status`,{
        method: "PATCH",
        body: JSON.stringify(request),
        authenticated: true,    
    })
}

export async function updateProperty(organizationId: number, propertyId: number, request: UpdatePropertyRequest): Promise<PropertyResponse>{
    return apiRequest<PropertyResponse>(`/api/organizations/${organizationId}/properties/${propertyId}`, {
        method: "PUT",
        body: JSON.stringify(request),
        authenticated: true,
    })
}