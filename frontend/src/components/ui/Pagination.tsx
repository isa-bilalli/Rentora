import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
    // 0-based, as the API counts pages.
    page: number;
    size: number;
    // Rows shown on this page, which can be fewer than size after one leaves it.
    itemCount: number;
    totalItems: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    // What the rows are, for the range text and screen readers.
    noun: { one: string; other: string };
}

const buttonClass =
    "inline-flex items-center gap-1 rounded-lg border border-[#d5dfd8] bg-white px-3 py-1.5 text-sm font-medium text-[#243b35] transition hover:bg-[#f8faf8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d4a94f] disabled:cursor-not-allowed disabled:opacity-50";

// "1–25 of 37 payments" with Previous and Next, under a paged table.
export default function Pagination({ page, size, itemCount, totalItems, totalPages, onPageChange, noun }: PaginationProps) {
    const first = page * size + 1;
    const last = page * size + itemCount;

    return (
        <nav
            aria-label={`Pages of ${noun.other}`}
            className="flex flex-col gap-3 border-t border-[#edf1ee] px-5 py-3 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between"
        >
            <p>
                {first}–{last} of {totalItems} {totalItems === 1 ? noun.one : noun.other}
            </p>
            {totalPages > 1 && (
                <div className="flex items-center gap-2">
                    <button type="button" onClick={() => onPageChange(page - 1)} disabled={page === 0} className={buttonClass}>
                        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                        Previous
                    </button>
                    <span className="px-1 tabular-nums">
                        Page {page + 1} of {totalPages}
                    </span>
                    <button type="button" onClick={() => onPageChange(page + 1)} disabled={page + 1 >= totalPages} className={buttonClass}>
                        Next
                        <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </button>
                </div>
            )}
        </nav>
    );
}
