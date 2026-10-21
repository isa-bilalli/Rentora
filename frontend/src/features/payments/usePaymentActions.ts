import { useState } from "react";

import { useConfirm } from "../../components/confirm/useConfirm";
import { formatMoney } from "../../lib/format";
import { useOrganization } from "../organizations/useOrganization";
import { recordPayment as recordPaymentRequest, voidPayment as voidPaymentRequest } from "./api/paymentApi";
import type { PaymentResponse, RecordPaymentRequest } from "./types";

// State and handlers behind the Record payment form and the Record / Void row buttons.
// onPaymentUpdated receives the payment as the server returned it, so the page can replace its copy.
export function usePaymentActions(onPaymentUpdated: (payment: PaymentResponse) => void) {
    const { activeOrganization } = useOrganization();
    const confirm = useConfirm();

    const [recordingPaymentId, setRecordingPaymentId] = useState<number | null>(null);
    const [busyPaymentId, setBusyPaymentId] = useState<number | null>(null);
    // Void failures only; record failures are thrown so the open form can show them.
    const [actionError, setActionError] = useState<string | null>(null);

    function startRecording(paymentId: number) {
        setActionError(null);
        setRecordingPaymentId(paymentId);
    }

    function cancelRecording() {
        setRecordingPaymentId(null);
    }

    async function recordPayment(
        paymentId: number,
        request: RecordPaymentRequest,
    ): Promise<void> {
        if (!activeOrganization) {
            throw new Error("An active organization is required.");
        }

        setBusyPaymentId(paymentId);
        setActionError(null);

        try {
            const updatedPayment = await recordPaymentRequest(
                activeOrganization.id,
                paymentId,
                request,
            );

            onPaymentUpdated(updatedPayment);
            setRecordingPaymentId(null);
        } finally {
            setBusyPaymentId(null);
        }
    }

    async function voidPayment(payment: PaymentResponse): Promise<void> {
        const confirmed = await confirm({
            title: `Void payment #${payment.id}?`,
            message: `The ${formatMoney(payment.amountCents)} will no longer be owed. This can't be undone.`,
            confirmLabel: "Void payment",
            tone: "danger",
        });

        if (!confirmed || !activeOrganization) {
            return;
        }

        setBusyPaymentId(payment.id);
        setActionError(null);

        try {
            const updatedPayment = await voidPaymentRequest(
                activeOrganization.id,
                payment.id,
            );

            onPaymentUpdated(updatedPayment);
            setRecordingPaymentId(null);
        } catch (requestError) {
            setActionError(
                requestError instanceof Error
                    ? requestError.message
                    : "Failed to void payment.",
            );
        } finally {
            setBusyPaymentId(null);
        }
    }

    return {
        recordingPaymentId,
        busyPaymentId,
        actionError,
        startRecording,
        cancelRecording,
        recordPayment,
        voidPayment,
    };
}
