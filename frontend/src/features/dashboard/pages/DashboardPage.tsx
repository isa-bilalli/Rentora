import { act, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
 
import { getDashboard } from "../api/dashboardApi";
 
import { useOrganization } from "../../organizations/OrganizationProvider";
 
import PortfolioOverview from "../components/PortfolioOverview";
import FinancialOverview from "../components/FinancialOverview";
import OperationsOverview from "../components/OperationsOverview";
 
import type { DashboardResponse } from "../types";
 
function Section({ label, children }: { label: string; children: ReactNode }) {
    return (
        <section aria-label={label}>
            <div className="mb-4 flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-[#d4a94f]" aria-hidden="true" />
                <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#14302b]/70">
                    {label}
                </h2>
                <span className="h-px flex-1 bg-[#14302b]/10" aria-hidden="true" />
            </div>
            {children}
        </section>
    );
}
 
export default function DashboardPage() {
    const { activeOrganization } = useOrganization();
    const [dashboard, setDashboard] =
        useState<DashboardResponse | null>(null);
 
    const [loading, setLoading] = useState(true);
    const [error, setError] =
        useState<string | null>(null);
 
    useEffect(() => {
        async function loadDashboard() {
            try {
                setLoading(true);
                setError(null);
                if (!activeOrganization) {
                    return;
                }
                const data = await getDashboard(activeOrganization.id);
                setDashboard(data);
            } catch (error) {
                setError(
                    error instanceof Error
                        ? error.message
                        : "Failed to load dashboard",
                );
            } finally {
                setLoading(false);
            }
        }
 
        void loadDashboard();
    }, []);
 
    if (loading) {
        return (
            <div className="min-h-full bg-[#f7f6f1]">
                <div
                    className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8"
                    role="status"
                    aria-live="polite"
                >
                    <span className="sr-only">Loading dashboard...</span>
 
                    <div className="mb-10 h-32 animate-pulse rounded-2xl bg-[#14302b]/90" />
 
                    <div className="space-y-10">
                        {[0, 1, 2].map((section) => (
                            <div key={section} className="animate-pulse space-y-4">
                                <div className="h-4 w-36 rounded bg-[#14302b]/10" />
                                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                    {[0, 1, 2, 3].map((card) => (
                                        <div
                                            key={card}
                                            className="h-28 rounded-xl border border-[#14302b]/10 bg-white"
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }
 
    if (error) {
        return (
            <div className="min-h-full bg-[#f7f6f1]">
                <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
                    <div
                        role="alert"
                        className="flex max-w-xl items-start gap-4 rounded-2xl border border-red-200 bg-white p-5 shadow-sm"
                    >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <div>
                            <h1 className="text-lg font-semibold text-[#14302b]">
                                Failed to load dashboard
                            </h1>
                            <p className="mt-1 text-sm text-gray-600">{error}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
 
    if (!dashboard) {
        return null;
    }
 
    return (
        <div className="min-h-full bg-[#f7f6f1]">
            <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
                <header className="relative mb-10 overflow-hidden rounded-2xl bg-linear-to-br from-[#14302b] to-[#1f4a41] px-6 py-8 text-[#e8efe9] shadow-sm sm:px-8">
                    <div
                        className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full border-[28px] border-[#d4a94f]/15"
                        aria-hidden="true"
                    />
                    <div
                        className="pointer-events-none absolute -bottom-10 right-24 h-24 w-24 rounded-full bg-[#d4a94f]/10"
                        aria-hidden="true"
                    />
 
                    <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            
                            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white">
                                {activeOrganization?.name}
                            </h1>
                            <p className="mt-1 text-sm text-[#e8efe9]/70">
                                Overview of your rental portfolio.
                            </p>
                        </div>
 
                        <span className="self-start rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-medium text-[#e8efe9]/80 sm:self-auto">
                            {new Date().toLocaleDateString(undefined, {
                                weekday: "long",
                                month: "long",
                                day: "numeric",
                            })}
                        </span>
                    </div>
                </header>
 
                <div className="space-y-10">
                    <Section label="Portfolio">
                        <PortfolioOverview
                            data={dashboard.portfolio}
                        />
                    </Section>
 
                    <Section label="Financial">
                        <FinancialOverview
                            data={dashboard.financial}
                        />
                    </Section>
 
                    <Section label="Operations">
                        <OperationsOverview
                            data={dashboard.operations}
                        />
                    </Section>
                </div>
            </div>
        </div>
    );
}