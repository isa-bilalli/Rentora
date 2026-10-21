import { propertyTypeLabels } from "../propertyLabels";
import type { PropertyType } from "../types";

interface PropertyTypeBadgeProps {
    type: PropertyType;
}

export default function PropertyTypeBadge({type}: PropertyTypeBadgeProps) {
    return (
        <span className="inline-flex rounded-full bg-[#e8efe9] px-2.5 py-1 text-xs font-medium text-[#14302b]">
            {propertyTypeLabels[type]}
        </span>
    );
}
