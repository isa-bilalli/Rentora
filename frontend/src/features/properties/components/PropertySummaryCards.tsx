import {
    Building2,
    LayoutGrid,
    CheckCircle2,
    Wallet,
} from "lucide-react";

import type { PropertySummaryResponse } from "../types";
import { formatCurrencyFromCents } from "../utils/formatters";

interface PropertySummaryCardsProps {
    properties: PropertySummaryResponse[];
}

export default function PropertySummaryCards({
    properties,
}: PropertySummaryCardsProps) {
    const totalSpaces = properties.reduce(
        (sum, property) => sum + property.totalSpaces,
        0,
    );

    const occupiedSpaces = properties.reduce(
        (sum, property) => sum + property.occupiedSpaces,
        0,
    );

    const monthlyExpectedRentCents = properties.reduce(
        (sum, property) =>
            sum + property.monthlyExpectedRentCents,
        0,
    );

    const cards = [
        {
            label: "Properties",
            value: properties.length.toLocaleString(),
            description: "In your portfolio",
            Icon: Building2,
        },
        {
            label: "Total spaces",
            value: totalSpaces.toLocaleString(),
            description: "Across all properties",
            Icon: LayoutGrid,
        },
        {
            label: "Occupied spaces",
            value: `${occupiedSpaces.toLocaleString()} / ${totalSpaces.toLocaleString()}`,
            description:
                totalSpaces > 0
                    ? `${Math.round((occupiedSpaces / totalSpaces) * 100)}% occupancy`
                    : "No spaces configured",
            Icon: CheckCircle2,
        },
        {
            label: "Monthly expected rent",
            value: formatCurrencyFromCents(
                monthlyExpectedRentCents,
            ),
            description: "Current active leases",
            Icon: Wallet,
        },
    ];

    return (
        <section
            aria-label="Portfolio summary"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
            {cards.map(({ label, value, description, Icon }) => (
                <article
                    key={label}
                    className="rounded-xl border border-[#e1e8e3] bg-white p-5 shadow-sm"
                >
                    <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-medium text-gray-500">
                            {label}
                        </p>

                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e8efe9] text-[#14302b]">
                            <Icon
                                className="h-5 w-5"
                                aria-hidden="true"
                            />
                        </div>
                    </div>

                    <p className="mt-3 text-2xl font-semibold tracking-tight text-[#14302b]">
                        {value}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                        {description}
                    </p>
                </article>
            ))}
        </section>
    );
}