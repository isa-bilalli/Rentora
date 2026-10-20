import { useEffect, useEffectEvent, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router";
import { BarChart3, Building2, CreditCard, FileText, LayoutDashboard, LogOut, PanelLeftClose, PanelLeftOpen, Receipt, UserCog, UserRound, Users, Wrench, X } from "lucide-react";
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
// Collapsing only applies from md up; the phone drawer always shows labels.
function navLinkClass(isActive: boolean, collapsed: boolean): string {
    return `relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d4a94f] ${collapsed ? "md:justify-center" : ""} ${isActive ? "bg-white/10 font-semibold text-white before:absolute before:left-0 before:top-2 before:bottom-2 before:w-0.75 before:rounded-full before:bg-[#d4a94f]" : "text-[#e8efe9]/70 hover:bg-white/5 hover:text-white"}`;
}

interface SidebarProps {
    // Below md the sidebar is a drawer over the page, opened from the layout's top bar.
    mobileOpen: boolean;
    onMobileClose: () => void;
}

export default function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
    const [collapsed, setCollapsed] = useState(false);
    const { logout } = useAuth();
    const { organizations, activeOrganization, setActiveOrganization } = useOrganization();
    const navigate = useNavigate();
    const location = useLocation();
    const closeButtonRef = useRef<HTMLButtonElement>(null);

    const closeOnEscape = useEffectEvent((event: KeyboardEvent) => {
        if (event.key === "Escape") {
            onMobileClose();
        }
    });

    // While the drawer is open: focus starts on its close button, and Escape closes it.
    useEffect(() => {
        if (!mobileOpen) return;
        closeButtonRef.current?.focus();
        document.addEventListener("keydown", closeOnEscape);
        return () => document.removeEventListener("keydown", closeOnEscape);
    }, [mobileOpen]);

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

    // Labels and the organization block hide only in the collapsed desktop sidebar.
    const hiddenWhenCollapsed = collapsed ? "md:hidden" : undefined;

    return (
        <>
            {mobileOpen && (
                <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={onMobileClose} aria-hidden="true" />
            )}
            <aside
                id="app-sidebar"
                aria-label="Main navigation"
                className={`fixed inset-y-0 left-0 z-50 flex h-dvh w-64 flex-col bg-[#14302b] text-[#e8efe9] transition-[translate,width,visibility] duration-200 md:sticky md:top-0 md:z-auto md:h-screen md:translate-x-0 md:visible ${
                    mobileOpen ? "translate-x-0" : "-translate-x-full invisible"
                } ${collapsed ? "md:w-18" : "md:w-64"}`}
            >
                <div
                    className={`flex items-center justify-between border-b border-white/10 p-4 ${
                        collapsed ? "md:justify-center" : ""
                    }`}
                >
                    <img src={RentoraLight} className={`block h-8 w-auto ml-0.5 ${hiddenWhenCollapsed ?? ""}`} alt="Rentora" />
                    <button type="button" onClick={() => setCollapsed((value) => !value)} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} className="hidden h-9 w-9 items-center justify-center rounded-md text-[#e8efe9]/70 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d4a94f] md:flex">
                    {collapsed ? (<PanelLeftOpen className="h-5 w-5" aria-hidden="true" />) : (<PanelLeftClose className="h-5 w-5" aria-hidden="true" />)}
                    </button>
                    <button ref={closeButtonRef} type="button" onClick={onMobileClose} aria-label="Close menu" className="flex h-9 w-9 items-center justify-center rounded-md text-[#e8efe9]/70 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d4a94f] md:hidden">
                        <X className="h-5 w-5" aria-hidden="true" />
                    </button>
                </div>
                {activeOrganization && (
                    <div className={`border-b border-white/10 px-4 py-3 ${hiddenWhenCollapsed ?? ""}`}>
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
                                <NavLink key={item.to} to={item.to} onClick={onMobileClose} title={collapsed ? item.label : undefined} aria-label={item.label} className={({ isActive }) => navLinkClass(isActive, collapsed)}>
                                    <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                                    <span className={hiddenWhenCollapsed}>{item.label}</span>
                                </NavLink>
                            );
                        })}
                    </div>
                </nav>
                <div className="space-y-1 border-t border-white/10 p-3">
                    <NavLink to="/app/members" onClick={onMobileClose} title={collapsed ? "Members" : undefined} aria-label="Members" className={({ isActive }) => navLinkClass(isActive, collapsed)}>
                        <UserCog className="h-5 w-5 shrink-0" aria-hidden="true" />
                        <span className={hiddenWhenCollapsed}>Members</span>
                    </NavLink>
                    <NavLink to="/app/profile" onClick={onMobileClose} title={collapsed ? "Profile" : undefined} aria-label="Profile" className={({ isActive }) => navLinkClass(isActive, collapsed)}>
                        <UserRound className="h-5 w-5 shrink-0" aria-hidden="true" />
                        <span className={hiddenWhenCollapsed}>Profile</span>
                    </NavLink>
                    <button type="button" onClick={handleLogout} title={collapsed ? "Logout" : undefined} aria-label="Logout" className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[#e8efe9]/70 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d4a94f] ${collapsed ? "md:justify-center" : ""}`}>
                        <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />
                        <span className={hiddenWhenCollapsed}>Logout</span>
                    </button>
                </div>
            </aside>
        </>
    );
}
