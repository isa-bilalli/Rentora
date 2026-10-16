import type { ReactNode } from "react";

export type BadgeTone = "neutral" | "brand" | "success" | "warning" | "danger" | "info";

// The colors the app already uses for statuses. Pages map their own values
// (lease status, payment status, priority, ...) to one of these tones.
const toneClasses: Record<BadgeTone, string> = {
    neutral: "border-gray-200 bg-gray-100 text-gray-700",
    brand: "border-[#edf3ef] bg-[#edf3ef] text-[#365a4e]",
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    warning: "border-amber-200 bg-amber-50 text-amber-800",
    danger: "border-red-200 bg-red-50 text-red-800",
    info: "border-blue-200 bg-blue-50 text-blue-800",
};

interface BadgeProps {
    tone?: BadgeTone;
    children: ReactNode;
}

export default function Badge({ tone = "neutral", children }: BadgeProps) {
    return (
        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${toneClasses[tone]}`}>
            {children}
        </span>
    );
}
