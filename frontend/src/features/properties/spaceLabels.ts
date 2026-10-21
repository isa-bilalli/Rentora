import type { SpaceStatus, SpaceType } from "./types";

// Display names for space types, used wherever a space's type is shown or picked.
export const spaceTypeLabels: Record<SpaceType, string> = {
    RESIDENTIAL: "Residential",
    OFFICE: "Office",
    RETAIL: "Retail",
    OTHER: "Other",
};

// Display names for space statuses, used wherever a space's status is shown or picked.
export const spaceStatusLabels: Record<SpaceStatus, string> = {
    VACANT: "Vacant",
    OCCUPIED: "Occupied",
    RESERVED: "Reserved",
    MAINTENANCE: "Maintenance",
};
