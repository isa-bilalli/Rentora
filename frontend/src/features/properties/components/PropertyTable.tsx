import { Link } from "react-router";
import { ArrowUpRight, MapPin } from "lucide-react";

import type { PropertySummaryResponse } from "../types";
import PropertyTypeBadge from "./PropertyTypeBadge";
import OccupancyIndicator from "./OccupancyIndicator";
import { formatMoney } from "../../../lib/format";

interface PropertyTableProps {
    properties: PropertySummaryResponse[];
}

export default function PropertyTable({
    properties,
}: PropertyTableProps) {
    if (properties.length === 0) {
        return (
            <div className="rounded-xl border border-dashed border-[#d5dfd8] bg-white px-6 py-14 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#e8efe9] text-[#14302b]">
                    <MapPin className="h-6 w-6" aria-hidden="true" />
                </div>

                <h3 className="mt-4 text-base font-semibold text-[#14302b]">
                    No properties found
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                    Try adjusting your search or filters.
                </p>
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-xl border border-[#e1e8e3] bg-white shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full min-w-212.5 border-collapse text-left">
                    <thead className="border-b border-[#e7ece8] bg-[#f8faf8]">
                        <tr>
                            <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                                Property
                            </th>

                            <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                                Type
                            </th>

                            <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                                Spaces
                            </th>

                            <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                                Occupancy
                            </th>

                            <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                                Expected rent / month
                            </th>

                            <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                                Action
                            </th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-[#edf0ee]">
                        {properties.map((property) => (
                            <tr
                                key={property.id}
                                className="transition-colors hover:bg-[#f8faf8]"
                            >
                                <td className="px-5 py-4">
                                    <Link
                                        to={`/app/properties/${property.id}`}
                                        className="group inline-flex flex-col rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d4a94f]"
                                    >
                                        <span className="font-semibold text-[#14302b] group-hover:text-[#426b5e]">
                                            {property.name}
                                        </span>

                                        <span className="mt-1 text-sm text-gray-500">
                                            {property.addressLine},{" "}
                                            {property.city}
                                        </span>

                                        <span className="text-xs text-gray-400">
                                            {[
                                                property.postalCode,
                                                property.country,
                                            ]
                                                .filter(Boolean)
                                                .join(" ")}
                                        </span>
                                    </Link>
                                </td>

                                <td className="px-4 py-4">
                                    <PropertyTypeBadge
                                        type={property.propertyType}
                                    />
                                </td>

                                <td className="px-4 py-4 text-sm font-medium text-[#243b35]">
                                    {property.totalSpaces}
                                </td>

                                <td className="px-4 py-4">
                                    <OccupancyIndicator
                                        occupied={property.occupiedSpaces}
                                        total={property.totalSpaces}
                                    />
                                </td>

                                <td className="px-5 py-4 text-right">
                                    <span className="whitespace-nowrap text-sm font-semibold tabular-nums text-[#14302b]">
                                        {formatMoney(
                                            property.monthlyExpectedRentCents,
                                        )}
                                    </span>
                                </td>

                                <td className="px-5 py-4 text-right">
                                    <Link
                                        to={`/app/properties/${property.id}`}
                                        aria-label={`View ${property.name}`}
                                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-[#e8efe9] hover:text-[#14302b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d4a94f]"
                                    >
                                        <ArrowUpRight
                                            className="h-4 w-4"
                                            aria-hidden="true"
                                        />
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="border-t border-[#e7ece8] px-5 py-3">
                <p className="text-sm text-gray-500">
                    Showing {properties.length}{" "}
                    {properties.length === 1
                        ? "property"
                        : "properties"}
                </p>
            </div>
        </div>
    );
}