import { createContext } from "react";

import type { LoginRequest } from "./api/authApi";
import type { AuthStatus, AuthUser } from "./types";

export interface AuthContextValue {
    user: AuthUser | null;
    status: AuthStatus;
    login: (request: LoginRequest) => Promise<void>;
    logout: () => Promise<void>;
}

export const AuthContext =
    createContext<AuthContextValue | undefined>(undefined);
