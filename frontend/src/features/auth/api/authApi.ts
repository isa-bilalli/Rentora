import { apiRequest, clearAccessToken, setAccessToken } from "../../../lib/api/client";

import type { AuthUser } from "../types";

export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    userId: number;
    email: string;
    accessToken: string;
}

export async function login(request: LoginRequest,): Promise<LoginResponse> {
    const response = await apiRequest<LoginResponse>("/api/auth/login",
            {
                method: "POST",
                body: JSON.stringify(request),
            },
        );
    setAccessToken(response.accessToken);
    return response;
}

export async function getCurrentUser(): Promise<AuthUser> {
    return apiRequest<AuthUser>("/api/auth/me",
        {
            method: "GET",
            authenticated: true,
        },
    );
}

export async function logout(): Promise<void> {
    try {
        await apiRequest<void>("/api/auth/logout",
            {
                method: "POST",
            },
        );
    } finally {
        clearAccessToken();
    }
}