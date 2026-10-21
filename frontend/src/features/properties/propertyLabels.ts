import type { PropertyType } from "./types";

// Display names for property types, used wherever a property's type is shown or filtered on.
export const propertyTypeLabels: Record<PropertyType, string> = {
    RESIDENTIAL: "Residential",
    OFFICE: "Office",
    RETAIL: "Retail",
    MIXED_USE: "Mixed-use",
    OTHER: "Other",
    NOT_CLASSIFIED: "Not classified",
};
