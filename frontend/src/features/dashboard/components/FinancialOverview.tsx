import {
    AlertTriangle,
    Clock,
    Hourglass,
    Receipt,
    Target,
    TrendingUp,
    Wallet,
} from "lucide-react";
 
import type { Financial } from "../types";
 
interface FinancialOverviewProps {
    data: Financial;
}
 
// Change this to the currency your backend uses.
const CURRENCY = "USD";
 
function formatMoney(cents: number) {
    return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: CURRENCY,
    }).format(cents / 100);
}
 
export default function FinancialOverview({
    data,
}: FinancialOverviewProps) {
    const stats = [
        { label: "Expected Rent", value: data.expectedRentCents, icon: Target, tone: "bg-[#14302b]/10 text-[#14302b]" },
        { label: "Collected Rent", value: data.collectedRentCents, icon: Wallet, tone: "bg-emerald-100 text-emerald-800" },
        { label: "Outstanding Rent", value: data.outstandingRentCents, icon: Hourglass, tone: "bg-[#d4a94f]/20 text-[#8a6a1c]" },
        { label: "Overdue Rent", value: data.overdueRentCents, icon: AlertTriangle, tone: "bg-red-100 text-red-700" },
        { label: "Paid Expenses", value: data.paidExpensesCents, icon: Receipt, tone: "bg-slate-100 text-slate-600" },
        { label: "Unpaid Expenses", value: data.unpaidExpensesCents, icon: Clock, tone: "bg-orange-100 text-orange-700" },
    ];
 
    const collectedPercent =
        data.expectedRentCents > 0
            ? Math.min(100, (data.collectedRentCents / data.expectedRentCents) * 100)
            : 0;
 
    return (
        <section className="space-y-4">
            <div className="relative overflow-hidden rounded-xl bg-linear-to-br from-[#14302b] to-[#1f4a41] p-5 text-[#e8efe9] shadow-sm sm:p-6">
                <div
                    className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full border-[20px] border-[#d4a94f]/15"
                    aria-hidden="true"
                />
                <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-[#d4a94f]">
                            <TrendingUp className="h-4 w-4" aria-hidden="true" />
                            Net Income
                        </p>
                        <p
                            className={`mt-2 text-3xl font-semibold tracking-tight sm:text-4xl ${
                                data.netIncomeCents < 0 ? "text-red-300" : "text-white"
                            }`}
                        >
                            {formatMoney(data.netIncomeCents)}
                        </p>
                    </div>
 
                    {data.expectedRentCents > 0 && (
                        <div className="w-full sm:max-w-xs">
                            <div className="mb-1.5 flex justify-between text-xs text-[#e8efe9]/70">
                                <span>Rent collected</span>
                                <span>{Math.round(collectedPercent)}%</span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                                <div
                                    className="h-full rounded-full bg-[#d4a94f]"
                                    style={{ width: `${collectedPercent}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
 
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <div
                            key={stat.label}
                            className="flex items-center gap-4 rounded-xl border border-[#14302b]/10 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                        >
                            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${stat.tone}`}>
                                <Icon className="h-5 w-5" aria-hidden="true" />
                            </span>
                            <div className="min-w-0">
                                <p className="truncate text-xl font-semibold tracking-tight text-[#14302b]">
                                    {formatMoney(stat.value)}
                                </p>
                                <p className="mt-0.5 text-xs font-medium uppercase tracking-wide text-gray-500">
                                    {stat.label}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}