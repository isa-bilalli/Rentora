import { apiRequest } from "../../../lib/api/client";
import type { AuthUser } from "../types";

export interface LoginRequest{
    email: string;
    password: string;
}

export interface  LoginResponse{
    userId: number;
    email: string;
    accessToken: string;
}

export async function login(request: LoginRequest): Promise<LoginResponse> {
    return apiRequest<LoginResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(request),
    });
}

export async function restoreSession(): Promise<AuthUser> {
    // backend call that verifies the existing authentication
    throw new Error("Not implemented");
}

export async function logout(): Promise<void> {
    // backend logout
}