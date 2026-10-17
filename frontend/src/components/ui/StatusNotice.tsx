import { X } from "lucide-react";

interface StatusNoticeProps {
    // The confirmation to show, or null for none.
    message: string | null;
    onDismiss: () => void;
}

// A green confirmation after an action, e.g. when the changed row leaves the current filter.
// Always rendered so screen readers announce new messages; invisible and out of the layout while empty.
export default function StatusNotice({ message, onDismiss }: StatusNoticeProps) {
    return (
        <div
            role="status"
            className={message ? "flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800" : "sr-only"}
        >
            {message && (
                <>
                    <span>{message}</span>
                    <button
                        type="button"
                        onClick={onDismiss}
                        aria-label="Dismiss message"
                        className="-m-1 rounded-md p-1 text-emerald-700 hover:bg-emerald-100 focus-visible:outline-2 focus-visible:outline-[#d4a94f]"
                    >
                        <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                </>
            )}
        </div>
    );
}
