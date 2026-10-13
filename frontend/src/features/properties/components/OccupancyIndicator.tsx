interface OccupancyIndicatorProps {
    occupied: number;
    total: number;
}

export default function OccupancyIndicator({
    occupied,
    total,
}: OccupancyIndicatorProps) {
    const percentage =
        total > 0
            ? Math.round((occupied / total) * 100)
            : 0;

    return (
        <div className="min-w-28">
            <div className="mb-1.5 flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-[#243b35]">
                    {occupied}/{total}
                </span>

                <span className="text-xs text-gray-500">
                    {percentage}%
                </span>
            </div>

            <div
                className="h-1.5 overflow-hidden rounded-full bg-gray-100"
                role="progressbar"
                aria-label={`${occupied} of ${total} spaces occupied`}
                aria-valuenow={occupied}
                aria-valuemin={0}
                aria-valuemax={total}
            >
                <div
                    className="h-full rounded-full bg-[#14302b] transition-[width]"
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}