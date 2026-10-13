export function formatCurrencyFromCents(cents: number): string {
    return new Intl.NumberFormat("en-IE", {
        style: "currency",
        currency: "EUR",
    }).format(cents / 100);
}