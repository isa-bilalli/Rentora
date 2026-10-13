import { apiRequest } from "../../../lib/api/client";

import type {
    PropertyResponse,
    CreatePropertyRequest,
    SpaceResponse,
    PropertySummaryResponse,
    CreateSpaceRequest,
    UpdateSpaceRequest,
    UpdateSpaceStatusRequest,
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