import { useEffect, useState } from "react";

import { getDashboard } from "../api/dashboardApi";

import PortfolioOverview from "../components/PortfolioOverview";
import FinancialOverview from "../components/FinancialOverview";
import OperationsOverview from "../components/OperationsOverview";

import type { DashboardResponse } from "../types";

const DEVELOPMENT_ORGANIZATION_ID = 1;

export default function DashboardPage() {
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

                const data = await getDashboard(
                    DEVELOPMENT_ORGANIZATION_ID,
                );

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
            <div className="p-6">
                <h1>Loading dashboard...</h1>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <h1>Failed to load dashboard</h1>
                <p>{error}</p>
            </div>
        );
    }

    if (!dashboard) {
        return null;
    }

    return (
        <div className="p-6">
            <div className="mb-8">
                <h1 className="text-2xl font-semibold">
                    Dashboard
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                    Overview of your rental portfolio.
                </p>
            </div>

            <div className="space-y-8">
                <PortfolioOverview
                    data={dashboard.portfolio}
                />

                <FinancialOverview
                    data={dashboard.financial}
                />

                <OperationsOverview
                    data={dashboard.operations}
                />
            </div>
        </div>
    );
}