import { useState } from "react";
import { NavLink, useNavigate } from "react-router";
import { useAuth } from "../../features/auth/useAuth";

const navigation = [
    { label: "Dashboard", to: "/app/dashboard" },
    { label: "Properties", to: "/app/properties" },
    { label: "Tenants", to: "/app/tenants" },
    { label: "Leases", to: "/app/leases" },
    { label: "Payments", to: "/app/payments" },
    { label: "Expenses", to: "/app/expenses" },
    { label: "Maintenance", to: "/app/maintenance" },
    { label: "Reports", to: "/app/reports" },
];

export default function Sidebar() {
    const [collapsed, setCollapsed] = useState(false);
    const { logout } = useAuth();
    const navigate = useNavigate();

    async function handleLogout() {
        await logout();
        navigate("/auth/login", { replace: true });
    }

    return (
        <aside className={`flex min-h-screen flex-col border-r ${collapsed ? "w-16" : "w-64"}`}>
            <div className="flex items-center justify-between p-4">
                <span className="font-bold">
                    {collapsed ? "R" : "Rentora"}
                </span>
                <button type="button" onClick={() => setCollapsed((value) => !value)}aria-label={collapsed ? "Expand sidebar": "Collapse sidebar"}>{collapsed ? "→" : "←"}</button>
            </div>
            <nav className="flex-1 px-2">
                <div className="space-y-1">
                    {navigation.map((item) => (
                        <NavLink key={item.to} to={item.to} title={collapsed ? item.label : undefined} className={({ isActive }) =>`block rounded px-3 py-2 ${isActive ? "font-semibold" : ""}`}>{collapsed ? item.label.charAt(0) : item.label}</NavLink>
                    ))}
                </div>
            </nav>
            <div className="p-2">
                <button type="button" onClick={handleLogout} className="w-full rounded px-3 py-2 text-left">{collapsed ? "↪" : "Logout"}</button>
            </div>
        </aside>
    );
}