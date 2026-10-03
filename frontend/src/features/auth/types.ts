export type AuthStatus = | "loading" | "authenticated" | "unauthenticated";

export interface AuthUser{
    id: number;
    firstName: string;
    lastName: string;
    email: string;
}