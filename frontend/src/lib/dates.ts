// "YYYY-MM-DD" for a date in the browser's time zone, the format the API uses for dates.
export function toLocalDateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

export function todayLocalDateString(): string {
    return toLocalDateString(new Date());
}

// A "YYYY-MM-DD" date moved by whole days or years. The arithmetic runs in UTC, so the browser's time zone
// and daylight saving can't shift the result. A year after 29 February is 1 March.
export function addDays(value: string, days: number): string {
    const date = new Date(`${value}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
}

export function addYears(value: string, years: number): string {
    const date = new Date(`${value}T00:00:00Z`);
    date.setUTCFullYear(date.getUTCFullYear() + years);
    return date.toISOString().slice(0, 10);
}

// Whole days from `from` to `to`, both "YYYY-MM-DD"; negative when `to` is earlier.
export function daysBetween(from: string, to: string): number {
    // Noon avoids daylight-saving shifts turning a day into 23 or 25 hours.
    const start = new Date(`${from}T12:00:00`).getTime();
    const end = new Date(`${to}T12:00:00`).getTime();
    return Math.round((end - start) / 86_400_000);
}
