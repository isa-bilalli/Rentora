interface FilterGroupProps<T extends string> {
    label: string;
    options: T[];
    optionLabel: (option: T) => string;
    counts: Record<T, number>;
    selected: T;
    onSelect: (option: T) => void;
}

// A labelled row of pill buttons with counts; the same style as the Leases status filter.
export default function FilterGroup<T extends string>({ label, options, optionLabel, counts, selected, onSelect }: FilterGroupProps<T>) {
    return (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <span className="w-16 shrink-0 text-xs font-semibold uppercase tracking-wide text-[#71847a]">{label}</span>
            <div className="flex flex-wrap gap-2" role="group" aria-label={`Filter by ${label.toLowerCase()}`}>
                {options.map((option) => {
                    const isSelected = selected === option;
                    return (
                        <button
                            key={option}
                            type="button"
                            onClick={() => onSelect(option)}
                            aria-pressed={isSelected}
                            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d4a94f] ${isSelected ? "border-[#14302b] bg-[#14302b] text-white" : "border-[#dce4de] bg-white text-[#42574e] hover:bg-[#f4f7f5]"}`}
                        >
                            {optionLabel(option)}
                            <span className={`text-xs ${isSelected ? "text-white/70" : "text-gray-400"}`}>{counts[option]}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
