import { DISPLAY_LOCALE, formatDate } from "../../lib/format";
import { toLocalDateString } from "../../lib/dates";
import type { ReportPeriodRequest, ReportingPeriod } from "./types";

// The API doesn't return the dates a report covers, so these mirror the backend's ReportRangeResolver.

export type CalendarPeriod = Exclude<ReportingPeriod, "CUSTOM">;

const monthYearFormat = new Intl.DateTimeFormat(DISPLAY_LOCALE, { month: "long", year: "numeric" });
const monthFormat = new Intl.DateTimeFormat(DISPLAY_LOCALE, { month: "long" });

// "YYYY-MM-DD" at local noon, so no time zone moves it to another day.
function parse(value: string): Date {
    return new Date(`${value}T12:00:00`);
}

function quarterStartMonth(date: Date): number {
    return Math.floor(date.getMonth() / 3) * 3;
}

// The first day of the month, quarter or year containing `referenceDate`, moved `steps` periods forward or back.
export function shiftReferenceDate(period: CalendarPeriod, referenceDate: string, steps: number): string {
    const date = parse(referenceDate);
    if (period === "MONTH") {
        return toLocalDateString(new Date(date.getFullYear(), date.getMonth() + steps, 1));
    }
    if (period === "QUARTER") {
        return toLocalDateString(new Date(date.getFullYear(), quarterStartMonth(date) + steps * 3, 1));
    }
    return toLocalDateString(new Date(date.getFullYear() + steps, 0, 1));
}

// The first and last day a request covers ("YYYY-MM-DD"); empty strings for a custom range not yet filled in.
export function resolveRange(request: ReportPeriodRequest): { from: string; to: string } {
    if (request.period === "CUSTOM") {
        return { from: request.from ?? "", to: request.to ?? "" };
    }
    const reference = request.referenceDate ?? toLocalDateString(new Date());
    const nextStart = parse(shiftReferenceDate(request.period, reference, 1));
    return {
        from: shiftReferenceDate(request.period, reference, 0),
        // Day 0 of a month is the last day of the month before it.
        to: toLocalDateString(new Date(nextStart.getFullYear(), nextStart.getMonth(), 0)),
    };
}

// "October 2026", "Q4 2026 (October–December)", "2026" or "1 Oct 2026 – 10 Oct 2026".
export function describePeriod(request: ReportPeriodRequest): string {
    if (request.period === "CUSTOM") {
        return `${formatDate(request.from)} – ${formatDate(request.to)}`;
    }
    const date = parse(request.referenceDate ?? toLocalDateString(new Date()));
    if (request.period === "MONTH") {
        return monthYearFormat.format(date);
    }
    if (request.period === "QUARTER") {
        const firstMonth = quarterStartMonth(date);
        const first = monthFormat.format(new Date(date.getFullYear(), firstMonth, 1));
        const last = monthFormat.format(new Date(date.getFullYear(), firstMonth + 2, 1));
        return `Q${firstMonth / 3 + 1} ${date.getFullYear()} (${first}–${last})`;
    }
    return String(date.getFullYear());
}

// Why a custom range can't be requested yet, or null when it can.
export function customRangeProblem(from: string, to: string): string | null {
    if (!from || !to) return "Choose a start and an end date.";
    if (to < from) return "The end date can't be before the start date.";
    return null;
}
