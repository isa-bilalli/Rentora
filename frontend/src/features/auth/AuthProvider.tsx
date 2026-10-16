import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { getCurrentUser, login as loginApi, logout as logoutApi } from "./api/authApi";

import { clearAccessToken, refreshAccessToken } from "../../lib/api/client";

import { AuthContext } from "./AuthContext";
import type { LoginRequest } from "./api/authApi";
import type { AuthStatus, AuthUser } from "./types";

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({
    children,
}: AuthProviderProps) {
    const [user, setUser] = useState<AuthUser | null>(null);

    const [status, setStatus] = useState<AuthStatus>("loading");

    // Status starts as "loading", so the restore only sets state once the refresh resolves.
    useEffect(() => {
        let cancelled = false;

        async function restoreSession() {
            try {
                const token = await refreshAccessToken();
                if (cancelled) return;

                if (!token) {
                    setUser(null);
                    setStatus("unauthenticated");
                    return;
                }

                const currentUser = await getCurrentUser();
                if (cancelled) return;
                setUser(currentUser);
                setStatus("authenticated");
            } catch {
                if (cancelled) return;
                clearAccessToken();
                setUser(null);
                setStatus("unauthenticated");
            }
        }

        void restoreSession();
        return () => {
            cancelled = true;
        };
    }, []);

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