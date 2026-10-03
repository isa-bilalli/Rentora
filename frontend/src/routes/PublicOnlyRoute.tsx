import { Navigate, Outlet } from "react-router";
import { useAuth } from "../features/auth/useAuth";

export default function PublicOnlyRoute() {
    const { status } = useAuth();

    if (status === "loading") {
        return <div>Loading...</div>;
    }

    if (status === "authenticated") {
        return <Navigate to="/app/dashboard" replace />;
    }

    return <Outlet />;
}