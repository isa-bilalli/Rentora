import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { CreditCard } from "lucide-react";
import { getPayments } from "../api/paymentApi";
import type { PaymentResponse } from "../types";
import {
    formatPaymentMethod,
    getPaymentDisplayStatus,
    PAYMENT_DISPLAY_STATUSES,
    paymentStatusLabel,
    type PaymentDisplayStatus,
} from "../status";
import { usePaymentActions } from "../usePaymentActions";
import RecordPaymentForm from "../components/RecordPaymentForm";
import PaymentRowActions from "../components/PaymentRowActions";
import { loadLeaseRows } from "../../leases/leaseRows";
import { useOrgQuery } from "../../../hooks/useOrgQuery";
import { formatDate, formatDateTime, formatMoney } from "../../../lib/format";
import { daysBetween, todayLocalDateString } from "../../../lib/dates";
import PageHeader from "../../../components/ui/PageHeader";
import EmptyState from "../../../components/ui/EmptyState";
import StatusNotice from "../../../components/ui/StatusNotice";

interface PaymentRow {
    payment: PaymentResponse;
    status: PaymentDisplayStatus;
    tenantName: string;
    propertyName: string;
    spaceName: string;
}

interface PaymentsData {
    rows: PaymentRow[];
    // The date the overdue split was made against, so "days overdue" uses the same day.
    today: string;
}

const NO_ROWS: PaymentRow[] = [];

const tabCaption: Record<PaymentDisplayStatus, string> = {
    OVERDUE: "past their due date",
    PENDING: "not yet due",
    PAID: "received",
    VOIDED: "no longer owed",
};

const emptyTab: Record<PaymentDisplayStatus, { title: string; description: string }> = {
    OVERDUE: { title: "Nothing overdue", description: "Every payment that has fallen due is paid or voided." },
    PENDING: { title: "Nothing coming up", description: "No payments are scheduled after today." },
    PAID: { title: "No payments received yet", description: "Payments you record will appear here." },
    VOIDED: { title: "No voided payments", description: "Payments voided by hand or by ending or cancelling a lease appear here." },
};

// Most urgent first: oldest overdue and soonest due at the top, latest payments first once paid or voided.
function compareRows(status: PaymentDisplayStatus) {
    return (a: PaymentRow, b: PaymentRow) => {
        if (status === "OVERDUE" || status === "PENDING") {
            return a.payment.dueDate.localeCompare(b.payment.dueDate);
        }
        if (status === "PAID") {
            return (b.payment.paidAt ?? "").localeCompare(a.payment.paidAt ?? "");
        }
        return b.payment.dueDate.localeCompare(a.payment.dueDate);
    };
}

// Payments only carry a lease ID; the lease rows supply the tenant, property and space names.
async function loadPayments(organizationId: number): Promise<PaymentsData> {
    const [payments, leaseRows] = await Promise.all([
        getPayments(organizationId),
        loadLeaseRows(organizationId),
    ]);
    const leaseById = new Map(leaseRows.map((row) => [row.lease.id, row]));
    const today = todayLocalDateString();

    const rows = payments.map((payment) => {
        const lease = leaseById.get(payment.leaseId);
        return {
            payment,
            status: getPaymentDisplayStatus(payment, today),
            tenantName: lease?.tenantName ?? `Lease #${payment.leaseId}`,
            propertyName: lease?.propertyName ?? "Unknown property",
            spaceName: lease?.spaceName ?? "",
        };
    });

    return { rows, today };
}

export default function PaymentsPage() {
    const { organizationId, data, loading, error, setData } = useOrgQuery(loadPayments);
    const rows = data?.rows ?? NO_ROWS;
    const loadError = organizationId === undefined
        ? "Select an organization to view its payments."
        : error;
    const [selected, setSelected] = useState<PaymentDisplayStatus>("OVERDUE");

    // Confirms a record or void, since the payment then leaves the tab it was on.
    const [notice, setNotice] = useState<string | null>(null);

    // The server returns the recorded or voided payment; re-deriving its status moves it to the right tab.
    const paymentActions = usePaymentActions((updatedPayment) => {
        setData((current) => ({
            ...current,
            rows: current.rows.map((row) =>
                row.payment.id === updatedPayment.id
                    ? { ...row, payment: updatedPayment, status: getPaymentDisplayStatus(updatedPayment, current.today) }
                    : row,
            ),
        }));
        const tenantName = rows.find((row) => row.payment.id === updatedPayment.id)?.tenantName ?? "this lease";
        const amount = formatMoney(updatedPayment.amountCents);
        setNotice(
            updatedPayment.status === "PAID"
                ? `Recorded ${amount} from ${tenantName} (payment #${updatedPayment.id}). It now appears under Paid.`
                : `Voided ${amount} for ${tenantName} (payment #${updatedPayment.id}). It now appears under Voided.`,
        );
    });
    const recordingRow = rows.find((row) => row.payment.id === paymentActions.recordingPaymentId) ?? null;
    const recordFormRef = useRef<HTMLDivElement>(null);

    // The form opens above the table, which can be far from the row that was clicked in a long list.
    useEffect(() => {
        if (paymentActions.recordingPaymentId !== null) {
            recordFormRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
    }, [paymentActions.recordingPaymentId]);

    // Only pending payments (including overdue ones) can be recorded or voided.
    const showActions = selected === "OVERDUE" || selected === "PENDING";

    const totals = useMemo(() => {
        const result = Object.fromEntries(
            PAYMENT_DISPLAY_STATUSES.map((status) => [status, { count: 0, cents: 0 }]),
        ) as Record<PaymentDisplayStatus, { count: number; cents: number }>;
        for (const row of rows) {
            result[row.status].count += 1;
            result[row.status].cents += row.payment.amountCents;
        }
        return result;
    }, [rows]);

    const visibleRows = useMemo(
        () => rows.filter((row) => row.status === selected).sort(compareRows(selected)),
        [rows, selected],
    );

    return (
        <main className="mx-auto w-full max-w-7xl space-y-6 p-5 md:p-8">
            <PageHeader
                eyebrow="RENTORA / FINANCE"
                title="Payments"
                description="Rent due across every lease, from due date to payment."
            />

            {loadError && (
                <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                    {loadError}
                </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" role="group" aria-label="Show payments by status">
                {PAYMENT_DISPLAY_STATUSES.map((status) => {
                    const isSelected = selected === status;
                    const { count, cents } = totals[status];
                    return (
                        <button
                            key={status}
                            type="button"
                            onClick={() => {
                                setSelected(status);
                                paymentActions.cancelRecording();
                                setNotice(null);
                            }}
                            aria-pressed={isSelected}
                            className={`flex flex-col rounded-xl border bg-white p-5 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d4a94f] ${isSelected ? "border-[#14302b] ring-1 ring-[#14302b]" : "border-[#e0e7e2] hover:border-[#c9d5cd]"}`}
                        >
                            <span className="text-sm text-gray-500">{paymentStatusLabel[status]}</span>
                            <span className={`mt-3 block text-2xl font-semibold tabular-nums ${status === "OVERDUE" && count > 0 ? "text-red-700" : "text-[#14302b]"}`}>
                                {loading ? "—" : formatMoney(cents)}
                            </span>
                            <span className="mt-1 block text-xs text-gray-500">
                                {loading ? "Loading..." : `${count} ${count === 1 ? "payment" : "payments"} ${tabCaption[status]}`}
                            </span>
                        </button>
                    );
                })}
            </div>

            <StatusNotice message={notice} onDismiss={() => setNotice(null)} />

            {paymentActions.actionError && (
                <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                    {paymentActions.actionError}
                </div>
            )}

            {recordingRow && (
                <div ref={recordFormRef}>
                    <RecordPaymentForm
                        key={recordingRow.payment.id}
                        payment={recordingRow.payment}
                        submitting={paymentActions.busyPaymentId === recordingRow.payment.id}
                        onSubmit={(request) => paymentActions.recordPayment(recordingRow.payment.id, request)}
                        onCancel={paymentActions.cancelRecording}
                    />
                </div>
            )}

            <section className="overflow-hidden rounded-xl border border-[#e0e7e2] bg-white" aria-label={`${paymentStatusLabel[selected]} payments`}>
                {loading ? (
                    <div className="p-10 text-center text-sm text-gray-500">Loading payments...</div>
                ) : rows.length === 0 && !loadError ? (
                    <EmptyState
                        icon={CreditCard}
                        title="No payments yet"
                        description="Rent payments are created automatically when you add a lease."
                        action={
                            <Link
                                to="/app/leases"
                                className="inline-flex items-center gap-2 rounded-lg bg-[#14302b] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#20453d]"
                            >
                                Go to leases
                            </Link>
                        }
                    />
                ) : visibleRows.length === 0 ? (
                    <EmptyState title={emptyTab[selected].title} description={emptyTab[selected].description} />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px] text-left text-sm">
                            <thead className="bg-[#f8faf8] text-xs uppercase tracking-wide text-[#71847a]">
                                <tr>
                                    <th className="px-5 py-3 font-semibold">Due date</th>
                                    <th className="px-5 py-3 font-semibold">Tenant</th>
                                    <th className="px-5 py-3 font-semibold">Property</th>
                                    <th className="px-5 py-3 text-right font-semibold">Amount</th>
                                    {selected === "OVERDUE" && <th className="px-5 py-3 font-semibold">Overdue by</th>}
                                    {selected === "PAID" && <th className="px-5 py-3 font-semibold">Paid at</th>}
                                    {selected === "PAID" && <th className="px-5 py-3 font-semibold">Method</th>}
                                    {showActions && <th className="px-5 py-3 font-semibold">Actions</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#edf1ee]">
                                {visibleRows.map((row) => {
                                    const daysOverdue = data ? daysBetween(row.payment.dueDate, data.today) : 0;
                                    return (
                                        <tr key={row.payment.id} className="transition hover:bg-[#fafcfb]">
                                            <td className="whitespace-nowrap px-5 py-4 text-[#42574e]">
                                                {formatDate(row.payment.dueDate)}
                                                <p className="mt-1 text-xs text-gray-400">Payment #{row.payment.id}</p>
                                            </td>
                                            <td className="px-5 py-4">
                                                <Link
                                                    to={`/app/leases/${row.payment.leaseId}`}
                                                    className="font-medium text-[#14302b] hover:underline"
                                                >
                                                    {row.tenantName}
                                                </Link>
                                                <p className="mt-1 text-xs text-gray-400">Lease #{row.payment.leaseId}</p>
                                            </td>
                                            <td className="px-5 py-4">
                                                <p className="text-[#42574e]">{row.propertyName}</p>
                                                {row.spaceName && <p className="mt-1 text-xs text-gray-500">{row.spaceName}</p>}
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-4 text-right font-medium tabular-nums text-[#14302b]">
                                                {formatMoney(row.payment.amountCents)}
                                            </td>
                                            {selected === "OVERDUE" && (
                                                <td className="whitespace-nowrap px-5 py-4 font-medium text-red-700">
                                                    {daysOverdue} {daysOverdue === 1 ? "day" : "days"}
                                                </td>
                                            )}
                                            {selected === "PAID" && (
                                                <td className="whitespace-nowrap px-5 py-4 text-[#42574e]">
                                                    {formatDateTime(row.payment.paidAt)}
                                                </td>
                                            )}
                                            {selected === "PAID" && (
                                                <td className="px-5 py-4 text-[#42574e]">
                                                    {formatPaymentMethod(row.payment.paymentMethod)}
                                                </td>
                                            )}
                                            {showActions && (
                                                <td className="px-5 py-4">
                                                    <PaymentRowActions
                                                        payment={row.payment}
                                                        busyPaymentId={paymentActions.busyPaymentId}
                                                        recordingPaymentId={paymentActions.recordingPaymentId}
                                                        onRecord={() => {
                                                            setNotice(null);
                                                            paymentActions.startRecording(row.payment.id);
                                                        }}
                                                        onVoid={() => {
                                                            setNotice(null);
                                                            void paymentActions.voidPayment(row.payment);
                                                        }}
                                                    />
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </main>
    );
}
