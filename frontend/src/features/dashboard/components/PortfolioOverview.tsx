import {
    Building2,
    CalendarClock,
    DoorOpen,
    KeyRound,
    LayoutGrid,
    Wrench,
} from "lucide-react";
 
import type { Portfolio } from "../types";
 
interface PortfolioOverviewProps {
    data: Portfolio;
}
 
export default function PortfolioOverview({
    data,
}: PortfolioOverviewProps) {
    const stats = [
        { label: "Total Properties", value: data.totalProperties, icon: Building2, tone: "bg-[#14302b]/10 text-[#14302b]" },
        { label: "Total Spaces", value: data.totalSpaces, icon: LayoutGrid, tone: "bg-[#14302b]/10 text-[#14302b]" },
        { label: "Occupied", value: data.occupiedSpaces, icon: KeyRound, tone: "bg-emerald-100 text-emerald-800", bar: "bg-emerald-600" },
        { label: "Reserved", value: data.reservedSpaces, icon: CalendarClock, tone: "bg-[#d4a94f]/20 text-[#8a6a1c]", bar: "bg-[#d4a94f]" },
        { label: "Vacant", value: data.vacantSpaces, icon: DoorOpen, tone: "bg-slate-100 text-slate-600", bar: "bg-slate-300" },
        { label: "Maintenance", value: data.maintenanceSpaces, icon: Wrench, tone: "bg-orange-100 text-orange-700", bar: "bg-orange-500" },
    ];
 
    const segments = stats.filter((stat) => stat.bar);
 
    return (
        <section className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <div
                            key={stat.label}
                            className="rounded-xl border border-[#14302b]/10 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
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
 
            {data.totalSpaces > 0 && (
                <div className="rounded-xl border border-[#14302b]/10 bg-white p-4 shadow-sm">
                    <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500">
                        Space status breakdown
                    </p>
                    <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
                        {segments.map((segment) => (
                            <div
                                key={segment.label}
                                className={segment.bar}
                                style={{ width: `${(segment.value / data.totalSpaces) * 100}%` }}
                                title={`${segment.label}: ${segment.value}`}
                            />
                        ))}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-600">
                        {segments.map((segment) => (
                            <span key={segment.label} className="flex items-center gap-1.5">
                                <span className={`h-2 w-2 rounded-full ${segment.bar}`} aria-hidden="true" />
                                {segment.label}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
}