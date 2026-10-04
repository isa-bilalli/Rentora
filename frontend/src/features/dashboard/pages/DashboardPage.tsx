import { useAuth } from "../../../features/auth/useAuth";

function DashboardPage() {
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

export default DashboardPage;