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
