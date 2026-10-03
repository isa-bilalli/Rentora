export type AuthStatus = | "loading" | "authenticated" | "unauthenticated";

export interface AuthUser{
    id: number;
    email: string;
    firstName: string;
    lastName: string;
}