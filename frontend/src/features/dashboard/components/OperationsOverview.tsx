import { AlertTriangle, CalendarClock, FileText, Wrench } from "lucide-react";
 
import type { Operations } from "../types";
 
interface OperationsOverviewProps {
    data: Operations;
}
 
export default function OperationsOverview({
    data,
}: OperationsOverviewProps) {
    const stats = [
        {
            label: "Active Leases",
            value: data.activeLeases,
            icon: FileText,
            tone: "bg-emerald-100 text-emerald-800",
        },
        {
            label: "Expiring Soon",
            value: data.leasesExpiringSoon,
            icon: CalendarClock,
            tone: "bg-[#d4a94f]/20 text-[#8a6a1c]",
            alert: "border-l-[#d4a94f]",
        },
        {
            label: "Overdue Payments",
            value: data.overduePayments,
            icon: AlertTriangle,
            tone: "bg-red-100 text-red-700",
            alert: "border-l-red-500",
        },
        {
            label: "Open Maintenance",
            value: data.openMaintenanceRequests,
            icon: Wrench,
            tone: "bg-orange-100 text-orange-700",
            alert: "border-l-orange-500",
        },
    ];
 
    return (
        <section>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    const needsAttention = stat.alert !== undefined && stat.value > 0;
                    return (
                        <div
                            key={stat.label}
                            className={`rounded-xl border border-[#14302b]/10 border-l-4 bg-white p-4 shadow-sm transition-shadow hover:shadow-md ${
                                needsAttention ? stat.alert : "border-l-[#14302b]/10"
                            }`}
                        >
                            <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.tone}`}>
                                <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                            </span>
                            <p className="mt-4 text-2xl font-semibold tracking-tight text-[#14302b]">
                                {stat.value}
                            </p>
                            <p className="mt-0.5 text-xs font-medium uppercase tracking-wide text-gray-500">
                                {stat.label}
                            </p>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
 