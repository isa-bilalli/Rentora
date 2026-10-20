import { useMemo, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getFinancialReport, getLeaseReport, getMaintenanceReport, getOccupancyReport } from "../api/reportsApi";
import type { ReportPeriodRequest, ReportingPeriod } from "../types";
import { customRangeProblem, describePeriod, resolveRange, shiftReferenceDate, type CalendarPeriod } from "../period";
import { getProperties } from "../../properties/api/propertyApi";
import type { PropertyResponse } from "../../properties/types";
import { expenseCategoryLabel } from "../../expenses/status";
import { Link } from "react-router";
import { useOrgQuery, type OrgQuery } from "../../../hooks/useOrgQuery";
import { formatHours, formatMoney, formatNumber, formatPercent } from "../../../lib/format";
import { todayLocalDateString } from "../../../lib/dates";
import PageHeader from "../../../components/ui/PageHeader";

const PERIODS: { value: ReportingPeriod; label: string }[] = [
    { value: "MONTH", label: "Month" },
    { value: "QUARTER", label: "Quarter" },
    { value: "YEAR", label: "Year" },
    { value: "CUSTOM", label: "Custom" },
];

const periodNoun: Record<CalendarPeriod, string> = { MONTH: "month", QUARTER: "quarter", YEAR: "year" };

const NO_PROPERTIES: PropertyResponse[] = [];

type ReportLoader<T> = (organizationId: number, period: ReportPeriodRequest, propertyId?: number) => Promise<T>;

// Loads one report and reloads it whenever the period, its dates or the property change.
// An unfinished custom range is reported as an error without contacting the server.
function useReport<T>(load: ReportLoader<T>, request: ReportPeriodRequest, propertyId: number | "ALL", rangeProblem: string | null) {
    return useOrgQuery(
        (organizationId) => {
            if (rangeProblem) return Promise.reject(new Error(rangeProblem));
            return load(organizationId, request, propertyId === "ALL" ? undefined : propertyId);
        },
        [request.period, request.referenceDate, request.from, request.to, propertyId, rangeProblem],
    );
}

export default function ReportsPage() {
    const today = todayLocalDateString();
    const [period, setPeriod] = useState<ReportingPeriod>("MONTH");
    // The first day of the month, quarter or year being shown.
    const [referenceDate, setReferenceDate] = useState(() => shiftReferenceDate("MONTH", today, 0));
    const [customFrom, setCustomFrom] = useState(() => shiftReferenceDate("MONTH", today, 0));
    const [customTo, setCustomTo] = useState(today);
    const [propertyId, setPropertyId] = useState<number | "ALL">("ALL");

    const properties = useOrgQuery(getProperties);
    const propertyList = properties.data ?? NO_PROPERTIES;

    const request: ReportPeriodRequest = period === "CUSTOM"
        ? { period, from: customFrom, to: customTo }
        : { period, referenceDate };
    const rangeProblem = period === "CUSTOM" ? customRangeProblem(customFrom, customTo) : null;

    const propertyName = propertyId === "ALL"
        ? "All properties"
        : propertyList.find((property) => property.id === propertyId)?.name ?? "Selected property";
    const financial = useReport(getFinancialReport, request, propertyId, rangeProblem);
    const occupancy = useReport(getOccupancyReport, request, propertyId, rangeProblem);
    const leases = useReport(getLeaseReport, request, propertyId, rangeProblem);
    const maintenance = useReport(getMaintenanceReport, request, propertyId, rangeProblem);
    const subtitle = `${describePeriod(request)} · ${propertyName}`;

    // Keeps looking at roughly the same time: today's period if the current view includes today,
    // otherwise the period where the current view starts. Custom starts from the dates being shown.
    function choosePeriod(next: ReportingPeriod) {
        if (next === period) return;
        const { from, to } = resolveRange(request);
        if (next === "CUSTOM") {
            setCustomFrom(from);
            setCustomTo(to);
        } else {
            const viewIncludesToday = from !== "" && to !== "" && from <= today && today <= to;
            setReferenceDate(shiftReferenceDate(next, viewIncludesToday ? today : from || today, 0));
        }
        setPeriod(next);
    }

    const currentReference = period === "CUSTOM" ? null : shiftReferenceDate(period, today, 0);

    return (
        <main className="mx-auto w-full max-w-7xl space-y-6 p-5 md:p-8">
            <PageHeader
                eyebrow="RENTORA / INSIGHTS"
                title="Reports"
                description="How your portfolio performed over a period."
            />

            <section className="flex flex-col gap-4 rounded-xl border border-[#e0e7e2] bg-white p-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex shrink-0 flex-wrap gap-2" role="group" aria-label="Report period">
                        {PERIODS.map((option) => {
                            const selected = period === option.value;
                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => choosePeriod(option.value)}
                                    aria-pressed={selected}
                                    className={`rounded-full border px-3 py-1.5 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d4a94f] ${selected ? "border-[#14302b] bg-[#14302b] text-white" : "border-[#dce4de] bg-white text-[#42574e] hover:bg-[#f4f7f5]"}`}
                                >
                                    {option.label}
                                </button>
                            );
                        })}
                    </div>

                    {period === "CUSTOM" ? (
                        <div className="flex items-center gap-2 text-sm text-[#42574e]">
                            <label htmlFor="report-from" className="sr-only">From</label>
                            <input id="report-from" type="date" value={customFrom} onChange={(event) => setCustomFrom(event.target.value)} className="rounded-lg border border-[#dce4de] px-2.5 py-1.5 text-sm outline-none focus:border-[#14302b] focus:ring-2 focus:ring-[#14302b]/10" />
                            <span aria-hidden="true">–</span>
                            <label htmlFor="report-to" className="sr-only">To</label>
                            <input id="report-to" type="date" value={customTo} onChange={(event) => setCustomTo(event.target.value)} className="rounded-lg border border-[#dce4de] px-2.5 py-1.5 text-sm outline-none focus:border-[#14302b] focus:ring-2 focus:ring-[#14302b]/10" />
                        </div>
                    ) : (
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={() => setReferenceDate(shiftReferenceDate(period, referenceDate, -1))}
                                aria-label={`Previous ${periodNoun[period]}`}
                                className="rounded-md p-1.5 text-[#42574e] hover:bg-[#f4f7f5] focus-visible:outline-2 focus-visible:outline-[#d4a94f]"
                            >
                                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                            </button>
                            <span className="min-w-[12rem] text-center text-sm font-semibold text-[#14302b]" aria-live="polite">
                                {describePeriod(request)}
                            </span>
                            <button
                                type="button"
                                onClick={() => setReferenceDate(shiftReferenceDate(period, referenceDate, 1))}
                                aria-label={`Next ${periodNoun[period]}`}
                                className="rounded-md p-1.5 text-[#42574e] hover:bg-[#f4f7f5] focus-visible:outline-2 focus-visible:outline-[#d4a94f]"
                            >
                                <ChevronRight className="h-4 w-4" aria-hidden="true" />
                            </button>
                            {referenceDate !== currentReference && (
                                <button
                                    type="button"
                                    onClick={() => setReferenceDate(currentReference ?? referenceDate)}
                                    className="ml-1 text-xs font-medium text-[#426b5c] hover:text-[#14302b] hover:underline"
                                >
                                    Back to this {periodNoun[period]}
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <label htmlFor="report-property" className="text-xs font-semibold uppercase tracking-wide text-[#71847a]">Property</label>
                    <select
                        id="report-property"
                        value={propertyId}
                        onChange={(event) => setPropertyId(event.target.value === "ALL" ? "ALL" : Number(event.target.value))}
                        className="w-full rounded-lg border border-[#dce4de] bg-white px-3 py-2 text-sm text-[#243b35] outline-none focus:border-[#14302b] focus:ring-2 focus:ring-[#14302b]/10 sm:w-64"
                    >
                        <option value="ALL">All properties</option>
                        {propertyList.map((property) => (
                            <option key={property.id} value={property.id}>{property.name}</option>
                        ))}
                    </select>
                </div>
            </section>

            {/* An unfinished custom range is shown once here rather than in every section. */}
            {rangeProblem ? (
                <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{rangeProblem}</div>
            ) : (
                <>
                    <ReportSection id="financial" title="Financial" subtitle={subtitle} query={financial}>
                        {(report) => (
                            <>
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                    <ReportStat label="Expected rent" value={formatMoney(report.expectedRentCents)} note="Rent due in this period" />
                                    <ReportStat label="Collected" value={formatMoney(report.collectedRentCents)} note={`${formatPercent(report.collectionRate)} of expected rent`} />
                                    <ReportStat label="Outstanding" value={formatMoney(report.outstandingRentCents)} note="Rent due in this period, not yet paid" />
                                    <ReportStat
                                        label="Overdue"
                                        value={formatMoney(report.overdueRentCents)}
                                        note="All unpaid rent due before the period ended"
                                        emphasis={report.overdueRentCents > 0 ? "negative" : undefined}
                                    />
                                </div>
                                <div className="grid gap-4 sm:grid-cols-3">
                                    <ReportStat label="Paid expenses" value={formatMoney(report.paidExpensesCents)} note="Voided expenses not counted" />
                                    <ReportStat label="Unpaid expenses" value={formatMoney(report.unpaidExpensesCents)} note="Recorded, not yet paid" />
                                    <ReportStat
                                        label="Net income"
                                        value={formatMoney(report.netIncomeCents)}
                                        note="Collected rent minus paid expenses"
                                        emphasis={report.netIncomeCents < 0 ? "negative" : "positive"}
                                    />
                                </div>

                                <div className="rounded-xl border border-[#e0e7e2] bg-white p-5">
                                    <h3 className="font-semibold text-[#14302b]">Expenses by category</h3>
                                    {report.expensesByCategory.length === 0 ? (
                                        <p className="mt-3 text-sm text-gray-500">No expenses recorded in this period.</p>
                                    ) : (
                                        <CategoryBreakdown rows={report.expensesByCategory} />
                                    )}
                                </div>
                            </>
                        )}
                    </ReportSection>

                    <ReportSection id="occupancy" title="Occupancy" subtitle={subtitle} query={occupancy}>
                        {(report) => (
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                <ReportStat label="Occupancy" value={formatPercent(report.occupancyRate)} note="Of all space-days in the period, the share that was let" />
                                <ReportStat
                                    label="Average let"
                                    value={`${formatNumber(report.averageOccupiedSpaces)} of ${formatNumber(report.totalSpaces)}`}
                                    note="Spaces let on an average day"
                                />
                                <ReportStat
                                    label="Occupied space-days"
                                    value={formatNumber(report.occupiedSpaceDays)}
                                    note={`Out of ${formatNumber(report.totalSpaces * report.totalDays)} possible`}
                                />
                                <ReportStat
                                    label="Days in period"
                                    value={formatNumber(report.totalDays)}
                                    note={`Across ${formatNumber(report.totalSpaces)} ${report.totalSpaces === 1 ? "space" : "spaces"}`}
                                />
                            </div>
                        )}
                    </ReportSection>

                    <ReportSection
                        id="leases"
                        title="Leases"
                        subtitle={subtitle}
                        query={leases}
                        action={<Link to="/app/leases" className="text-sm font-medium text-[#426b5c] hover:text-[#14302b] hover:underline">View all leases <span aria-hidden="true">→</span></Link>}
                    >
                        {(report) => (
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                <ReportStat label="Started" value={formatNumber(report.leasesStarted)} note="Leases whose start date falls in this period" />
                                <ReportStat label="Ended or ending" value={formatNumber(report.leasesEnded)} note="Leases whose end date falls in this period" />
                                <ReportStat label="Renewed" value={formatNumber(report.leasesRenewed)} note="Renewals starting in this period" />
                                <ReportStat label="Expiring" value={formatNumber(report.leasesExpiring)} note="Active leases due to end in this period" />
                            </div>
                        )}
                    </ReportSection>

                    <ReportSection
                        id="maintenance"
                        title="Maintenance"
                        subtitle={subtitle}
                        query={maintenance}
                        action={<Link to="/app/maintenance" className="text-sm font-medium text-[#426b5c] hover:text-[#14302b] hover:underline">View maintenance <span aria-hidden="true">→</span></Link>}
                    >
                        {(report) => (
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                <ReportStat label="Opened" value={formatNumber(report.requestsOpened)} note="Requests reported in this period" />
                                <ReportStat label="Resolved" value={formatNumber(report.requestsResolved)} note="Requests resolved in this period, whenever they were reported" />
                                <ReportStat label="Cancelled" value={formatNumber(report.requestsCancelled)} note="Requests cancelled in this period" />
                                <ReportStat
                                    label="Average time to resolve"
                                    value={report.requestsResolved === 0 ? "—" : formatHours(report.averageResolutionHours)}
                                    note={report.requestsResolved === 0
                                        ? "Nothing was resolved in this period"
                                        : "From report to resolution, for requests resolved in this period"}
                                />
                            </div>
                        )}
                    </ReportSection>
                </>
            )}
        </main>
    );
}

interface ReportSectionProps<T> {
    id: string;
    title: string;
    subtitle: string;
    query: OrgQuery<T>;
    // Shown next to the title, e.g. a link to the full list.
    action?: ReactNode;
    children: (report: T) => ReactNode;
}

// A titled report block: loading text, the error, or the report itself.
function ReportSection<T>({ id, title, subtitle, query, action, children }: ReportSectionProps<T>) {
    return (
        <section className="space-y-4" aria-labelledby={`${id}-heading`}>
            <div className="flex items-end justify-between gap-3">
                <div>
                    <h2 id={`${id}-heading`} className="text-lg font-semibold text-[#14302b]">{title}</h2>
                    <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
                </div>
                {action}
            </div>

            {query.loading ? (
                <div className="rounded-xl border border-[#e0e7e2] bg-white p-8 text-center text-sm text-gray-500">Loading report...</div>
            ) : query.error ? (
                <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{query.error}</div>
            ) : query.data !== undefined && children(query.data)}
        </section>
    );
}

function ReportStat({ label, value, note, emphasis }: { label: string; value: ReactNode; note: string; emphasis?: "positive" | "negative" }) {
    const valueColor = emphasis === "negative" ? "text-red-700" : emphasis === "positive" ? "text-emerald-700" : "text-[#14302b]";
    return (
        <div className="rounded-xl border border-[#e0e7e2] bg-white p-5">
            <p className="text-sm text-gray-500">{label}</p>
            <p className={`mt-2 text-2xl font-semibold tabular-nums ${valueColor}`}>{value}</p>
            <p className="mt-1 text-xs text-gray-500">{note}</p>
        </div>
    );
}

function CategoryBreakdown({ rows }: { rows: { category: keyof typeof expenseCategoryLabel; amountCents: number }[] }) {
    const total = rows.reduce((sum, row) => sum + row.amountCents, 0);
    const sorted = useMemo(() => [...rows].sort((a, b) => b.amountCents - a.amountCents), [rows]);
    return (
        <ul className="mt-4 space-y-3">
            {sorted.map((row) => {
                const share = total === 0 ? 0 : (row.amountCents / total) * 100;
                return (
                    <li key={row.category}>
                        <div className="flex items-baseline justify-between gap-3 text-sm">
                            <span className="text-[#243b35]">{expenseCategoryLabel[row.category]}</span>
                            <span className="tabular-nums text-[#14302b]">
                                {formatMoney(row.amountCents)} <span className="text-xs text-gray-400">({formatPercent(share)})</span>
                            </span>
                        </div>
                        <div className="mt-1.5 h-2 rounded-full bg-[#edf3ef]" aria-hidden="true">
                            <div className="h-2 rounded-full bg-[#426b5c]" style={{ width: `${share}%` }} />
                        </div>
                    </li>
                );
            })}
        </ul>
    );
}
