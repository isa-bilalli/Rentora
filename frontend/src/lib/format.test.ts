import { describe, expect, it } from "vitest";

import {
    formatDate,
    formatDateTime,
    formatHours,
    formatLongDate,
    formatMoney,
    formatNumber,
    formatPercent,
} from "./format";

// vitest.config.ts runs these in America/Los_Angeles, behind UTC.

describe("formatMoney", () => {
    it("turns cents into euros with thousands separators", () => {
        expect(formatMoney(123456)).toBe("€1,234.56");
        expect(formatMoney(0)).toBe("€0.00");
    });

    it("keeps the sign of a negative amount", () => {
        expect(formatMoney(-1250)).toBe("-€12.50");
    });
});

describe("formatPercent and formatNumber", () => {
    it("takes a percentage, not a fraction, and keeps at most one decimal", () => {
        expect(formatPercent(61.08)).toBe("61.1%");
        expect(formatPercent(100)).toBe("100%");
    });

    it("rounds to one decimal and groups thousands", () => {
        expect(formatNumber(3.516)).toBe("3.5");
        expect(formatNumber(1234)).toBe("1,234");
        expect(formatNumber(2)).toBe("2");
    });
});

describe("formatHours", () => {
    it("picks a unit that reads naturally", () => {
        expect(formatHours(0.01)).toBe("under a minute");
        expect(formatHours(0.75)).toBe("45 min");
        expect(formatHours(1)).toBe("1 hour");
        expect(formatHours(5.5)).toBe("5.5 hours");
        expect(formatHours(47)).toBe("47 hours");
        expect(formatHours(77)).toBe("3.2 days");
    });
});

describe("formatDate and formatLongDate", () => {
    it("formats the API's date-only values", () => {
        expect(formatDate("2026-10-16")).toBe("16 Oct 2026");
        expect(formatLongDate("2026-10-16")).toBe("16 October 2026");
    });

    // Read as UTC midnight, "2026-01-01" would be the evening of 31 December here.
    it("never moves a date-only value to the day before", () => {
        expect(formatDate("2026-01-01")).toBe("1 Jan 2026");
    });

    it("shows a dash for a missing or broken value", () => {
        expect(formatDate(null)).toBe("—");
        expect(formatDate(undefined)).toBe("—");
        expect(formatDate("")).toBe("—");
        expect(formatLongDate("not a date")).toBe("—");
    });
});

describe("formatDateTime", () => {
    it("shows a timestamp in the browser's time zone", () => {
        // 18:54 UTC is 11:54 in Los Angeles in October (UTC-7).
        expect(formatDateTime("2026-10-16T18:54:00Z")).toBe("16 Oct 2026, 11:54");
    });

    it("shows a dash for a missing value", () => {
        expect(formatDateTime(null)).toBe("—");
    });
});
