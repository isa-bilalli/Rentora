import { useRolePermissions } from "../../organizations/useRolePermissions";
import type { PaymentResponse } from "../types";

interface PaymentRowActionsProps {
    payment: PaymentResponse;
    // The payment a record or void request is running for; every row's buttons are disabled meanwhile.
    busyPaymentId: number | null;
    // The payment whose record form is open, which decides whether the busy row says "Saving..." or "Voiding...".
    recordingPaymentId: number | null;
    onRecord: () => void;
    onVoid: () => void;
}

// Record / Void buttons for a pending payment; a dash for paid or voided ones.
// Void is for managers and owners only (docs/ROLES.md).
export default function PaymentRowActions({
    payment,
    busyPaymentId,
    recordingPaymentId,
    onRecord,
    onVoid,
}: PaymentRowActionsProps) {
    const { canManage } = useRolePermissions();

    if (payment.status !== "PENDING") {
        return <span className="text-sm text-gray-400">—</span>;
    }

    return (
        <div className="flex flex-wrap gap-2">
            <button
                type="button"
                disabled={busyPaymentId !== null}
                onClick={onRecord}
                className="rounded-lg border border-[#d5dfd8] bg-white px-3 py-2 text-xs font-medium text-[#14302b] hover:bg-[#f8faf8] disabled:cursor-not-allowed disabled:opacity-50"
            >
                {busyPaymentId === payment.id && recordingPaymentId === payment.id
                    ? "Saving..."
                    : "Record payment"}
            </button>
            {canManage && (
                <button
                    type="button"
                    disabled={busyPaymentId !== null}
                    onClick={onVoid}
                    className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {busyPaymentId === payment.id && recordingPaymentId !== payment.id
                        ? "Voiding..."
                        : "Void"}
                </button>
            )}
        </div>
    );
}
