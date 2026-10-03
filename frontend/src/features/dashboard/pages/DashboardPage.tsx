import { useAuth } from "../../../features/auth/useAuth";

export default function DashboardPage() {
    const { logout } = useAuth();

    async function handleLogout() {
        await logout();
    }

    return (
        <div>
            <h1>Dashboard Page</h1>

            <button onClick={handleLogout}>
                Logout
            </button>
        </div>
    );
}