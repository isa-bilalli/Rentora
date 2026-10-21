import { describe, expect, it } from "vitest";

import { addDays, addYears } from "./dates";

// vitest.config.ts runs these in America/Los_Angeles, behind UTC.

describe("addDays", () => {
    it("moves across the end of a month and a year", () => {
        expect(addDays("2027-04-30", 1)).toBe("2027-05-01");
        expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    });

    it("moves backwards", () => {
        expect(addDays("2027-03-01", -1)).toBe("2027-02-28");
    });

    it("is not shifted by a daylight-saving change", () => {
        // US clocks go back on 1 November 2026.
        expect(addDays("2026-10-31", 2)).toBe("2026-11-02");
    });
});

describe("addYears", () => {
    it("keeps the day and month", () => {
        expect(addYears("2027-05-01", 1)).toBe("2028-05-01");
    });

    it("moves 29 February to 1 March in a year without one", () => {
        expect(addYears("2028-02-29", 1)).toBe("2029-03-01");
    });
});
