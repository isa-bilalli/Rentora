import type { Portfolio } from "../types";

interface PortfolioOverviewProps {
    data: Portfolio;
}

export default function PortfolioOverview({
    data,
}: PortfolioOverviewProps) {
    return (
        <section>
            <h2 className="mb-4 text-lg font-semibold">
                Portfolio
            </h2>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                <div>Total Properties: {data.totalProperties}</div>
                <div>Total Spaces: {data.totalSpaces}</div>
                <div>Occupied: {data.occupiedSpaces}</div>
                <div>Reserved: {data.reservedSpaces}</div>
                <div>Vacant: {data.vacantSpaces}</div>
                <div>Maintenance: {data.maintenanceSpaces}</div>
            </div>
        </section>
    );
}