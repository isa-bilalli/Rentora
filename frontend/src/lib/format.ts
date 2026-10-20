// Every date and amount in the UI uses this locale, whatever language the browser is set to.
export const DISPLAY_LOCALE = "en-IE";

const CURRENCY = "EUR";

const EMPTY = "—";

const moneyFormat = new Intl.NumberFormat(DISPLAY_LOCALE, {
    style: "currency",
    currency: CURRENCY,
});

const dateFormat = new Intl.DateTimeFormat(DISPLAY_LOCALE, {
    day: "numeric",
    month: "short",
    year: "numeric",
});

const longDateFormat = new Intl.DateTimeFormat(DISPLAY_LOCALE, {
    day: "numeric",
    month: "long",
    year: "numeric",
});

const dateTimeFormat = new Intl.DateTimeFormat(DISPLAY_LOCALE, {
    dateStyle: "medium",
    timeStyle: "short",
});

// Date-only values ("2026-10-16") are read as local noon, so no time zone can shift them to another day.
function toDate(value: string | null | undefined): Date | null {
    if (!value) return null;

    const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
        ? new Date(`${value}T12:00:00`)
        : new Date(value);

    return Number.isNaN(date.getTime()) ? null : date;
}

// 123456 -> "€1,234.56"
export function formatMoney(cents: number): string {
    return moneyFormat.format(cents / 100);
}

const percentFormat = new Intl.NumberFormat(DISPLAY_LOCALE, {
    maximumFractionDigits: 1,
});

// 61.08 -> "61.1%". Takes a percentage (0–100), as the report API returns them, not a fraction.
export function formatPercent(percentage: number): string {
    return `${percentFormat.format(percentage)}%`;
}

// 3.516 -> "3.5", 1234 -> "1,234".
export function formatNumber(value: number): string {
    return percentFormat.format(value);
}

// A duration given in hours: "under a minute", "45 min", "5.5 hours" or, from two days up, "3.2 days".
export function formatHours(hours: number): string {
    if (hours < 1 / 60) return "under a minute";
    if (hours < 1) return `${Math.round(hours * 60)} min`;
    if (hours < 48) return `${formatNumber(hours)} ${hours === 1 ? "hour" : "hours"}`;
    return `${formatNumber(hours / 24)} days`;
}

// "16 Oct 2026"
export function formatDate(value: string | null | undefined): string {
    const date = toDate(value);
    return date ? dateFormat.format(date) : EMPTY;
}

// "16 October 2026"
export function formatLongDate(value: string | null | undefined): string {
    const date = toDate(value);
    return date ? longDateFormat.format(date) : EMPTY;
}

// "16 Oct 2026, 18:54"
export function formatDateTime(value: string | null | undefined): string {
    const date = toDate(value);
    return date ? dateTimeFormat.format(date) : EMPTY;
}
