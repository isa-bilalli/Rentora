// Euro amounts in form inputs, which the API stores as whole cents.

// 123456 -> "1234.56", for pre-filling an input.
export function moneyInputFromCents(cents: number): string {
    return (cents / 100).toFixed(2);
}

// "1234.56" -> 123456. null for an empty, negative or non-numeric value, or one with more than 2 decimals.
export function parseMoneyToCents(value: string): number | null {
    if (!value.trim()) return null;

    const amount = Number(value);

    if (!Number.isFinite(amount) || amount < 0) return null;

    const cents = Math.round(amount * 100);

    if (
        !Number.isSafeInteger(cents) ||
        Math.abs(amount * 100 - cents) > 1e-7
    ) {
        return null;
    }

    return cents;
}
