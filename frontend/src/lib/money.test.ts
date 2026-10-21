import { describe, expect, it } from "vitest";

import { moneyInputFromCents, parseMoneyToCents } from "./money";

describe("parseMoneyToCents", () => {
    it("turns euros into whole cents", () => {
        expect(parseMoneyToCents("1234.56")).toBe(123456);
        expect(parseMoneyToCents("980")).toBe(98000);
        expect(parseMoneyToCents("0")).toBe(0);
    });

    it("isn't thrown by amounts that floating point can't hold exactly", () => {
        // 19.99 * 100 is 1998.9999999999998.
        expect(parseMoneyToCents("19.99")).toBe(1999);
    });

    it("rejects empty, negative and non-numeric values", () => {
        expect(parseMoneyToCents("")).toBeNull();
        expect(parseMoneyToCents("  ")).toBeNull();
        expect(parseMoneyToCents("-5")).toBeNull();
        expect(parseMoneyToCents("abc")).toBeNull();
    });

    it("rejects more than two decimals", () => {
        expect(parseMoneyToCents("12.345")).toBeNull();
    });
});

describe("moneyInputFromCents", () => {
    it("always shows two decimals", () => {
        expect(moneyInputFromCents(123456)).toBe("1234.56");
        expect(moneyInputFromCents(98000)).toBe("980.00");
    });
});
