import type { CreatePropertyRequest, CreateSpaceRequest, SpaceType } from "./types";

// What the property and space forms check before sending. The limits are the database columns' lengths,
// and the forms' inputs use them for maxLength too.

export type Checked<T> = { ok: true; value: T } | { ok: false; error: string };

export const propertyFieldLimits = {
    name: 150,
    addressLine: 255,
    city: 100,
    postalCode: 20,
    country: 100,
} as const;

export const spaceNameLimit = 100;

export interface PropertyFields {
    name: string;
    addressLine: string;
    city: string;
    postalCode: string;
    country: string;
}

// In the order the fields are checked, with the name each message uses.
const propertyFieldLabels: [keyof PropertyFields, string][] = [
    ["name", "Property name"],
    ["addressLine", "Address"],
    ["city", "City"],
    ["postalCode", "Postal code"],
    ["country", "Country"],
];

// The fields trimmed, as the API takes them for creating or updating a property. Name, address, city and
// country are required, and missingMessage says so in the form's own words; the postal code may be empty.
export function checkPropertyFields(fields: PropertyFields, missingMessage: string): Checked<CreatePropertyRequest> {
    const request: CreatePropertyRequest = {
        name: fields.name.trim(),
        addressLine: fields.addressLine.trim(),
        city: fields.city.trim(),
        postalCode: fields.postalCode.trim(),
        country: fields.country.trim(),
    };

    if (!request.name || !request.addressLine || !request.city || !request.country) {
        return { ok: false, error: missingMessage };
    }

    for (const [field, label] of propertyFieldLabels) {
        const limit = propertyFieldLimits[field];
        if (request[field].length > limit) {
            return { ok: false, error: `${label} cannot exceed ${limit} characters.` };
        }
    }

    return { ok: true, value: request };
}

export interface SpaceFields {
    name: string;
    type: SpaceType;
    // As typed; empty means not given.
    floor: string;
    area: string;
}

// How a form words each problem with a space.
export interface SpaceMessages {
    nameMissing: string;
    nameTooLong: string;
    floor: string;
    area: string;
}

// The space as the API takes it: the name trimmed, and the floor and area as numbers, or null when left
// empty. The floor must be a whole number and the area more than zero.
export function checkSpaceFields(fields: SpaceFields, messages: SpaceMessages): Checked<CreateSpaceRequest> {
    const name = fields.name.trim();

    if (!name) {
        return { ok: false, error: messages.nameMissing };
    }

    if (name.length > spaceNameLimit) {
        return { ok: false, error: messages.nameTooLong };
    }

    const floor = fields.floor.trim() === "" ? null : Number(fields.floor);

    if (floor !== null && !Number.isInteger(floor)) {
        return { ok: false, error: messages.floor };
    }

    const area = fields.area.trim() === "" ? null : Number(fields.area);

    if (area !== null && (!Number.isFinite(area) || area <= 0)) {
        return { ok: false, error: messages.area };
    }

    return { ok: true, value: { name, type: fields.type, floor, area } };
}
