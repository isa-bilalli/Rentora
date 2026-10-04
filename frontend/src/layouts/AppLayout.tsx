import { Outlet } from "react-router";
import Sidebar from "../components/navigation/Sidebar";

function AppLayout() {
    return (
        <div className="flex min-h-screen">
            <Sidebar />

            <main className="min-w-0 flex-1">
                <Outlet />
            </main>
        </div>
    );
}

export default AppLayout;