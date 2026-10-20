import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router";
import { BarChart3, Building2, CreditCard, FileText, LayoutDashboard, LogOut, PanelLeftClose, PanelLeftOpen, Receipt, UserCog, UserRound, Users, Wrench } from "lucide-react";
import { useAuth } from "../../features/auth/useAuth";
import { useOrganization } from "../../features/organizations/useOrganization";
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
    const { organizations, activeOrganization, setActiveOrganization } = useOrganization();
    const navigate = useNavigate();
    const location = useLocation();

    // Lists reload for the new organization by themselves. A details page (e.g. /app/tenants/5)
    // shows a record of the old one, so it is swapped for its list.
    function switchOrganization(organizationId: number) {
        setActiveOrganization(organizationId);
        const [, , section, detail] = location.pathname.split("/");
        if (detail) {
            navigate(`/app/${section}`);
        }
    }

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
            {!collapsed && activeOrganization && (
                <div className="border-b border-white/10 px-4 py-3">
                    {organizations.length > 1 ? (
                        <>
                            <label htmlFor="organization-switcher" className="block text-xs font-medium uppercase tracking-wide text-[#e8efe9]/50">Organization</label>
                            <select
                                id="organization-switcher"
                                value={activeOrganization.id}
                                onChange={(event) => switchOrganization(Number(event.target.value))}
                                className="mt-1.5 w-full rounded-md border border-white/15 bg-[#1d3d36] px-2.5 py-2 text-sm text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d4a94f]"
                            >
                                {organizations.map((organization) => (
                                    <option key={organization.id} value={organization.id}>{organization.name}</option>
                                ))}
                            </select>
                        </>
                    ) : (
                        <>
                            <p className="text-xs font-medium uppercase tracking-wide text-[#e8efe9]/50">Organization</p>
                            <p className="mt-1 truncate text-sm font-medium text-white" title={activeOrganization.name}>{activeOrganization.name}</p>
                        </>
                    )}
                </div>
            )}
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
                <NavLink to="/app/members" title={collapsed ? "Members" : undefined} aria-label="Members" className={({ isActive }) => navLinkClass(isActive, collapsed)}>
                    <UserCog className="h-5 w-5 shrink-0" aria-hidden="true" />
                    {!collapsed && <span>Members</span>}
                </NavLink>
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