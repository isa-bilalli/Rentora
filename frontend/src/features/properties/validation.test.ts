import { describe, expect, it } from "vitest";

import { checkPropertyFields, checkSpaceFields, type PropertyFields, type SpaceFields } from "./validation";

const MISSING = "Fill in the required fields.";

const property: PropertyFields = {
    name: "Riverside Apartments",
    addressLine: "14 Harbour Lane",
    city: "Dublin",
    postalCode: "D02 X285",
    country: "Ireland",
};

describe("checkPropertyFields", () => {
    it("trims every field", () => {
        expect(checkPropertyFields({ ...property, name: "  Riverside Apartments ", country: " Ireland" }, MISSING)).toEqual({
            ok: true,
            value: property,
        });
    });

    it("lets the postal code be empty", () => {
        expect(checkPropertyFields({ ...property, postalCode: "  " }, MISSING)).toEqual({
            ok: true,
            value: { ...property, postalCode: "" },
        });
    });

    it("needs a name, address, city and country, in the form's own words", () => {
        for (const field of ["name", "addressLine", "city", "country"] as const) {
            expect(checkPropertyFields({ ...property, [field]: "   " }, MISSING)).toEqual({ ok: false, error: MISSING });
        }
    });

    it("allows each field up to its limit, and says which one is too long", () => {
        const limits = [
            ["name", 150, "Property name cannot exceed 150 characters."],
            ["addressLine", 255, "Address cannot exceed 255 characters."],
            ["city", 100, "City cannot exceed 100 characters."],
            ["postalCode", 20, "Postal code cannot exceed 20 characters."],
            ["country", 100, "Country cannot exceed 100 characters."],
        ] as const;

        for (const [field, limit, message] of limits) {
            expect(checkPropertyFields({ ...property, [field]: "x".repeat(limit) }, MISSING).ok).toBe(true);
            expect(checkPropertyFields({ ...property, [field]: "x".repeat(limit + 1) }, MISSING)).toEqual({ ok: false, error: message });
        }
    });

    it("reports a missing field before a long one, and the fields in form order", () => {
        expect(checkPropertyFields({ ...property, name: "x".repeat(151), country: "" }, MISSING)).toEqual({ ok: false, error: MISSING });
        expect(checkPropertyFields({ ...property, name: "x".repeat(151), city: "x".repeat(101) }, MISSING)).toEqual({
            ok: false,
            error: "Property name cannot exceed 150 characters.",
        });
    });
});

const messages = { nameMissing: "no name", nameTooLong: "long name", floor: "bad floor", area: "bad area" };

const space: SpaceFields = { name: "Apartment 1", type: "RESIDENTIAL", floor: "2", area: "75.5" };

describe("checkSpaceFields", () => {
    it("trims the name and reads the floor and area as numbers", () => {
        expect(checkSpaceFields({ ...space, name: " Apartment 1 " }, messages)).toEqual({
            ok: true,
            value: { name: "Apartment 1", type: "RESIDENTIAL", floor: 2, area: 75.5 },
        });
    });

    it("leaves an empty floor or area out", () => {
        expect(checkSpaceFields({ ...space, floor: "", area: "  " }, messages)).toEqual({
            ok: true,
            value: { name: "Apartment 1", type: "RESIDENTIAL", floor: null, area: null },
        });
    });

    it("allows a basement floor", () => {
        expect(checkSpaceFields({ ...space, floor: "-1" }, messages)).toMatchObject({ ok: true, value: { floor: -1 } });
    });

    it("needs a name of at most 100 characters", () => {
        expect(checkSpaceFields({ ...space, name: "  " }, messages)).toEqual({ ok: false, error: "no name" });
        expect(checkSpaceFields({ ...space, name: "x".repeat(100) }, messages).ok).toBe(true);
        expect(checkSpaceFields({ ...space, name: "x".repeat(101) }, messages)).toEqual({ ok: false, error: "long name" });
    });

    it("needs a whole floor number", () => {
        for (const floor of ["2.5", "abc"]) {
            expect(checkSpaceFields({ ...space, floor }, messages)).toEqual({ ok: false, error: "bad floor" });
        }
    });

    it("needs an area above zero", () => {
        for (const area of ["0", "-3", "abc"]) {
            expect(checkSpaceFields({ ...space, area }, messages)).toEqual({ ok: false, error: "bad area" });
        }
    });
});
