import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { getCurrentUser, login as loginApi, logout as logoutApi } from "./api/authApi";

import { clearAccessToken, refreshAccessToken } from "../../lib/api/client";

import type { LoginRequest } from "./api/authApi";
import type { AuthStatus, AuthUser } from "./types";

interface AuthContextValue {
    user: AuthUser | null;
    status: AuthStatus;
    login: (request: LoginRequest) => Promise<void>;
    logout: () => Promise<void>;
}

export const AuthContext =
    createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({
    children,
}: AuthProviderProps) {
    const [user, setUser] = useState<AuthUser | null>(null);

    const [status, setStatus] = useState<AuthStatus>("loading");

    const restoreSession = useCallback(async () => {
        setStatus("loading");
        try {
            const token = await refreshAccessToken();

            if (!token) {
                setUser(null);
                setStatus("unauthenticated");
                return;
            }

            const currentUser = await getCurrentUser();
            setUser(currentUser);
            setStatus("authenticated");
        } catch {
            clearAccessToken();
            setUser(null);
            setStatus("unauthenticated");
        }
    }, []);

    useEffect(() => {
        void restoreSession();
    }, [restoreSession]);

    const login = useCallback(
        async (request: LoginRequest) => {
            await loginApi(request);

            const currentUser = await getCurrentUser();
            setUser(currentUser);
            setStatus("authenticated");
        },
        [],
    );

    const logout = useCallback(async () => {
        try {
            await logoutApi();
        } finally {
            clearAccessToken();
            setUser(null);
            setStatus("unauthenticated");
        }
    }, []);

    const value = useMemo(
        () => ({
            user,
            status,
            login,
            logout,
        }),
        [user, status, login, logout],
    );

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (context === undefined) {
        throw new Error(
            "useAuth must be used within an AuthProvider",
        );
    }

    return context;
}