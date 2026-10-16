import StatusBadge from "../../../components/ui/StatusBadge";
import { leaseStatusLabel, leaseStatusTone, type LeaseDisplayStatus } from "../status";

export default function LeaseStatusBadge({ status }: { status: LeaseDisplayStatus }) {
    return (
        <StatusBadge tone={leaseStatusTone[status]}>
            {leaseStatusLabel[status]}
        </StatusBadge>
    );
}
