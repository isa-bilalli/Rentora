import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { login as loginApi, logout as logoutApi, restoreSession as restoreSessionApi, type LoginRequest } from "./api/authApi";
import type { AuthStatus, AuthUser } from "./types";

interface AuthContextValue {
    user: AuthUser | null;
    status: AuthStatus;
    login: (request: LoginRequest) => Promise<void>;
    logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(
    undefined
);

interface AuthProviderProps{
    children: ReactNode;
}

export function AuthProvider({children}: AuthProviderProps ){
    const [user, setUser] = useState<AuthUser | null>(null)
    const [status, setStatus] = useState<AuthStatus>("loading");

    const restoreSession = useCallback(async () => {
        try{
            const restoredUser = await restoreSessionApi();
            setUser(restoredUser);
            setStatus("authenticated");
        } catch {
            setUser(null);
            setStatus("unauthenticated");
        }
    }, []);

    useEffect(()=>{
        void restoreSession()
    }, []);

    const login = useCallback(async (request: LoginRequest) => {
        const response = await loginApi(request);
        
        localStorage.setItem("accessToken", response.accessToken);

        const user: AuthUser = {
            id: response.userId,
            email: response.email,
            firstName: "",
            lastName: "",
        }

        setUser(user);
        setStatus("authenticated");
    }, []);

    const logout = useCallback(async () =>{
        try{
            await logoutApi();
        } finally{
            setUser(null);
            setStatus("unauthenticated");
        }
    }, []);

    const value = useMemo(()=>({
        user,
        status,
        login,
        logout,
    }), [user, status, login, logout]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}