import { propertyTypeLabels } from "../propertyLabels";
import type { PropertyType } from "../types";

export type PropertyTypeFilter = PropertyType | "ALL";

interface PropertyFiltersProps {
    search: string;
    onSearchChange: (value: string) => void;
    propertyType: PropertyTypeFilter;
    onPropertyTypeChange: (value: PropertyTypeFilter) => void;
}

export default function PropertyFilters({
    search,
    onSearchChange,
    propertyType,
    onPropertyTypeChange,
}: PropertyFiltersProps) {
    return (
        <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex-1">
                <label
                    htmlFor="property-search"
                    className="sr-only"
                >
                    Search properties
                </label>

                <input
                    id="property-search"
                    type="search"
                    value={search}
                    onChange={(event) =>
                        onSearchChange(event.target.value)
                    }
                    placeholder="Search by property name or address..."
                    className="w-full rounded-lg border border-[#dce4de] bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[#14302b] focus:ring-2 focus:ring-[#14302b]/10"
                />
            </div>

            <div className="sm:w-56">
                <label
                    htmlFor="property-type-filter"
                    className="sr-only"
                >
                    Filter by property type
                </label>

                <select
                    id="property-type-filter"
                    value={propertyType}
                    onChange={(event) =>
                        onPropertyTypeChange(
                            event.target.value as PropertyTypeFilter,
                        )
                    }
                    className="w-full rounded-lg border border-[#dce4de] bg-white px-3 py-2.5 text-sm text-[#243b35] outline-none transition focus:border-[#14302b] focus:ring-2 focus:ring-[#14302b]/10"
                >
                    <option value="ALL">All property types</option>
                    {(Object.keys(propertyTypeLabels) as PropertyType[]).map((type) => (
                        <option
                            key={type}
                            value={type}
                        >
                            {propertyTypeLabels[type]}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
}