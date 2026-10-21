import type { StatusBadgeTone } from "../../components/ui/StatusBadge";
import type { LeaseResponse } from "./types";

// The backend calls a lease that hasn't started yet ACTIVE; the UI shows it as UPCOMING.
export type LeaseDisplayStatus = "UPCOMING" | "ACTIVE" | "ENDED" | "CANCELLED";

export const LEASE_DISPLAY_STATUSES: LeaseDisplayStatus[] = ["ACTIVE", "UPCOMING", "ENDED", "CANCELLED"];

// today: "YYYY-MM-DD", compared as a string like the API's dates.
export function getLeaseDisplayStatus(lease: LeaseResponse, today: string): LeaseDisplayStatus {
    if (lease.status === "ACTIVE" && lease.startDate > today) {
        return "UPCOMING";
    }
    return lease.status;
}

export const leaseStatusLabel: Record<LeaseDisplayStatus, string> = {
    UPCOMING: "Upcoming",
    ACTIVE: "Active",
    ENDED: "Ended",
    CANCELLED: "Cancelled",
};

// The lease badge's colors, wherever a lease's status is shown.
export const leaseStatusTone: Record<LeaseDisplayStatus, StatusBadgeTone> = {
    UPCOMING: "info",
    ACTIVE: "success",
    ENDED: "neutral",
    CANCELLED: "danger",
};
