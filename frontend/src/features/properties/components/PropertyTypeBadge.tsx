import type { PropertyType } from "../types";

interface PropertyTypeBadgeProps {
    type: PropertyType;
}

const labels: Record<PropertyType, string> = {
    RESIDENTIAL: "Residential",
    OFFICE: "Office",
    RETAIL: "Retail",
    MIXED_USE: "Mixed-use",
    OTHER: "Other",
    NOT_CLASSIFIED: "Not classified",
};

export default function PropertyTypeBadge({type}: PropertyTypeBadgeProps) {
    return (
        <span className="inline-flex rounded-full bg-[#e8efe9] px-2.5 py-1 text-xs font-medium text-[#14302b]">
            {labels[type]}
        </span>
    );
}