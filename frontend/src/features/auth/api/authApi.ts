import type { AuthUser } from "../types";

export interface LoginRequest{
    email: string;
    password: string;
}

export interface  LoginResponse{
    user: AuthUser;
    accessToken: string;
}

export async function login(request: LoginRequest): Promise<LoginResponse> {
    //TODO: implement backend call
    throw new Error("Not implemented");
}

export async function restoreSession(): Promise<AuthUser> {
    // backend call that verifies the existing authentication
    throw new Error("Not implemented");
}

export async function logout(): Promise<void> {
    // backend logout
}