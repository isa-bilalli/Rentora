import StatusBadge from "../../../components/ui/StatusBadge";
import { paymentStatusLabel, paymentStatusTone, type PaymentDisplayStatus } from "../status";

export default function PaymentStatusBadge({ status }: { status: PaymentDisplayStatus }) {
    return (
        <StatusBadge tone={paymentStatusTone[status]}>
            {paymentStatusLabel[status]}
        </StatusBadge>
    );
}
