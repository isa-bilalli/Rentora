import type { Operations } from "../types";

interface OperationsOverviewProps {
    data: Operations;
}

export default function OperationsOverview({
    data,
}: OperationsOverviewProps) {
    return (
        <section>
            <h2 className="mb-4 text-lg font-semibold">
                Operations
            </h2>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                    Active Leases: {data.activeLeases}
                </div>

                <div>
                    Expiring Soon: {data.leasesExpiringSoon}
                </div>

                <div>
                    Overdue Payments: {data.overduePayments}
                </div>

                <div>
                    Open Maintenance:{" "}
                    {data.openMaintenanceRequests}
                </div>
            </div>
        </section>
    );
}