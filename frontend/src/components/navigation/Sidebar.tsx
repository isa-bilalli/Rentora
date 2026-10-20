import { useState } from "react";
import { NavLink, useNavigate } from "react-router";
import { BarChart3, Building2, CreditCard, FileText, LayoutDashboard, LogOut, PanelLeftClose, PanelLeftOpen, Receipt, UserRound, Users, Wrench } from "lucide-react";
import { useAuth } from "../../features/auth/useAuth";
import RentoraLight from "../../assets/rentora-wordmark-light.svg";

const navigation = [
    { label: "Dashboard", to: "/app/dashboard", icon: LayoutDashboard },
    { label: "Properties", to: "/app/properties", icon: Building2 },
    { label: "Tenants", to: "/app/tenants", icon: Users },
    { label: "Leases", to: "/app/leases", icon: FileText },
    { label: "Payments", to: "/app/payments", icon: CreditCard },
    { label: "Expenses", to: "/app/expenses", icon: Receipt },
    { label: "Maintenance", to: "/app/maintenance", icon: Wrench },
    { label: "Reports", to: "/app/reports", icon: BarChart3 },
];

// A sidebar link; the active one gets a gold bar on its left edge.
function navLinkClass(isActive: boolean, collapsed: boolean): string {
    return `relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d4a94f] ${collapsed ? "justify-center" : ""} ${isActive ? "bg-white/10 font-semibold text-white before:absolute before:left-0 before:top-2 before:bottom-2 before:w-0.75 before:rounded-full before:bg-[#d4a94f]" : "text-[#e8efe9]/70 hover:bg-white/5 hover:text-white"}`;
}

export default function Sidebar() {
    const [collapsed, setCollapsed] = useState(false);
    const { logout } = useAuth();
    const navigate = useNavigate();

    async function handleLogout() {
        await logout();
        navigate("/auth/login", { replace: true });
    }

    return (
        <aside
            className={`sticky top-0 flex h-screen flex-col bg-[#14302b] text-[#e8efe9] transition-[width] duration-200 ${
                collapsed ? "w-18" : "w-64"
            }`}
        >
            <div
                className={`flex items-center border-b border-white/10 p-4 ${
                    collapsed ? "justify-center" : "justify-between"
                }`}
            >
                {!collapsed && (<img src={RentoraLight} className="block h-8 w-auto ml-0.5" alt="Rentora" />)}
                <button type="button" onClick={() => setCollapsed((value) => !value)} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} className="flex h-9 w-9 items-center justify-center rounded-md text-[#e8efe9]/70 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d4a94f]">
                {collapsed ? (<PanelLeftOpen className="h-5 w-5" aria-hidden="true" />) : (<PanelLeftClose className="h-5 w-5" aria-hidden="true" />)}
                </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-4">
                <div className="space-y-1">
                    {navigation.map((item) => {
                        const Icon = item.icon;
                        return (
                            <NavLink key={item.to} to={item.to} title={collapsed ? item.label : undefined} aria-label={item.label} className={({ isActive }) => navLinkClass(isActive, collapsed)}>
                                <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                                {!collapsed && <span>{item.label}</span>}
                            </NavLink>
                        );
                    })}
                </div>
            </nav>
            <div className="space-y-1 border-t border-white/10 p-3">
                <NavLink to="/app/profile" title={collapsed ? "Profile" : undefined} aria-label="Profile" className={({ isActive }) => navLinkClass(isActive, collapsed)}>
                    <UserRound className="h-5 w-5 shrink-0" aria-hidden="true" />
                    {!collapsed && <span>Profile</span>}
                </NavLink>
                <button type="button" onClick={handleLogout} title={collapsed ? "Logout" : undefined} aria-label="Logout" className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[#e8efe9]/70 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d4a94f] ${collapsed ? "justify-center" : ""}`}>
                    <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" /> 
                    {!collapsed && <span>Logout</span>}
                </button>
            </div>
        </aside>
    );
}