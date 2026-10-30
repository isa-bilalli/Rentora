import { useOrgQuery } from "../../../../hooks/useOrgQuery";
import { useTableSort } from "../../../../hooks/useTableSort";
import { todayLocalDateString } from "../../../../lib/dates";
import { formatDate, formatDateTime, formatMoney } from "../../../../lib/format";
import type { SortColumns, SortState } from "../../../../lib/sort";
import { getLeases } from "../../../leases/api/leasesApi";
import { getPayments } from "../../../payments/api/paymentApi";
import PaymentRowActions from "../../../payments/components/PaymentRowActions";
import PaymentStatusBadge from "../../../payments/components/PaymentStatusBadge";
import RecordPaymentForm from "../../../payments/components/RecordPaymentForm";
import { formatPaymentMethod, getPaymentDisplayStatus } from "../../../payments/status";
import type { PaymentResponse } from "../../../payments/types";
import { usePaymentActions } from "../../../payments/usePaymentActions";
import type { SpaceResponse } from "../../types";
import StatCard from "../../../../components/ui/StatCard";
import TableHeader from "./TableHeader";

// Latest due date first.
function latestDueFirst(a: PaymentResponse, b: PaymentResponse): number {
    return b.dueDate.localeCompare(a.dueDate) || b.id - a.id;
}

type SortKey = "due" | "amount" | "paid";

// Payments not yet paid have no paid date, so they go last when sorting by it.
const sortColumns: SortColumns<PaymentResponse, SortKey> = {
    due: { value: (payment) => payment.dueDate, firstDirection: "desc" },
    amount: { value: (payment) => payment.amountCents, firstDirection: "desc" },
    paid: { value: (payment) => payment.paidAt, firstDirection: "desc" },
};

const initialSort: SortState<SortKey> = { key: "due", direction: "desc" };

interface PropertyFinancialsTabProps {
    propertyId: number;
    spaces: SpaceResponse[];
}

// One property's payments and rent totals. The tab loads the payments itself when it opens,
// with the property's leases, which say which space each payment is for.
export default function PropertyFinancialsTab({ propertyId, spaces }: PropertyFinancialsTabProps) {
    const { data, loading: paymentsLoading, error, setData } = useOrgQuery(
        (organizationId) => getPayments(organizationId, { propertyId }),
        [propertyId],
    );
    const leasesQuery = useOrgQuery(
        (organizationId) => getLeases(organizationId, { propertyId }),
        [propertyId],
    );
    // Without the leases, a payment's space shows as its number, so a failure there is not shown as an error.
    const loading = paymentsLoading || leasesQuery.loading;

    const paymentActions = usePaymentActions((updatedPayment) =>
        setData((currentPayments) =>
            currentPayments.map((payment) =>
                payment.id === updatedPayment.id ? updatedPayment : payment,
            ),
        ),
    );

    const spacesById = new Map(spaces.map((space) => [space.id, space]));
    const leasesById = new Map((leasesQuery.data ?? []).map((lease) => [lease.id, lease]));

    const payments = data ?? [];
    const { sortedRows: sortedPayments, directionOf, toggle } = useTableSort(payments, {
        columns: sortColumns,
        initial: initialSort,
        pageOrder: latestDueFirst,
    });

    const recordingPayment =
        payments.find((payment) => payment.id === paymentActions.recordingPaymentId) ?? null;

    const today = todayLocalDateString();

    const collectedCents = payments
        .filter((payment) => payment.status === "PAID")
        .reduce((total, payment) => total + payment.amountCents, 0);

    const pendingPayments = payments.filter(
        (payment) => payment.status === "PENDING",
    );

    const outstandingCents = pendingPayments.reduce(
        (total, payment) => total + payment.amountCents,
        0,
    );

    const overduePayments = pendingPayments.filter(
        (payment) => payment.dueDate < today,
    );

    const overdueCents = overduePayments.reduce(
        (total, payment) => total + payment.amountCents,
        0,
    );

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold text-[#14302b]">
                    Financials
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                    Payment obligations and collected rent for this property.
                </p>
            </div>

            {error && (
                <div
                    role="alert"
                    className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                    Unable to load payments: {error}
                </div>
            )}

            {paymentActions.actionError && (
                <div
                    role="alert"
                    className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                    {paymentActions.actionError}
                </div>
            )}

            {loading ? (
                <div
                    role="status"
                    className="rounded-xl border border-[#e1e8e3] bg-white p-8 text-sm text-gray-500"
                >
                    Loading financial data...
                </div>
            ) : error ? null : (
                <>
                    <section
                        aria-label="Financial summary"
                        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
                    >
                        <StatCard
                            label="Rent collected"
                            value={formatMoney(collectedCents)}
                            description="Payments recorded as paid"
                        />

                        <StatCard
                            label="Outstanding"
                            value={formatMoney(outstandingCents)}
                            description="All pending payments, including overdue"
                        />

                        <StatCard
                            label="Overdue"
                            value={formatMoney(overdueCents)}
                            description={`${overduePayments.length} overdue ${overduePayments.length === 1 ? "payment" : "payments"}`}
                        />
                    </section>

                    {recordingPayment && (
                        <RecordPaymentForm
                            key={recordingPayment.id}
                            payment={recordingPayment}
                            submitting={paymentActions.busyPaymentId === recordingPayment.id}
                            onSubmit={(request) =>
                                paymentActions.recordPayment(recordingPayment.id, request)
                            }
                            onCancel={paymentActions.cancelRecording}
                        />
                    )}

                    <section className="space-y-4">
                        <div>
                            <h3 className="font-semibold text-[#14302b]">
                                Payment history
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Recorded, pending, and voided payment obligations.
                            </p>
                        </div>

                        {payments.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-[#d5dfd8] bg-white px-6 py-12 text-center">
                                <h4 className="font-semibold text-[#14302b]">
                                    No payment records yet
                                </h4>
                                <p className="mt-1 text-sm text-gray-500">
                                    Payments associated with this property's leases will appear here.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto rounded-lg border border-[#e1e8e3]">
                                <table className="w-full min-w-300 text-left">
                                    <thead className="bg-[#f8faf8]">
                                        <tr>
                                            <TableHeader sort={{ direction: directionOf("due"), onToggle: () => toggle("due") }}>Due date</TableHeader>
                                            <TableHeader>Space</TableHeader>
                                            <TableHeader>Lease</TableHeader>
                                            <TableHeader sort={{ direction: directionOf("amount"), onToggle: () => toggle("amount") }}>Amount</TableHeader>
                                            <TableHeader>Status</TableHeader>
                                            <TableHeader sort={{ direction: directionOf("paid"), onToggle: () => toggle("paid") }}>Paid at</TableHeader>
                                            <TableHeader>Method</TableHeader>
                                            <TableHeader>Actions</TableHeader>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-[#edf0ee]">
                                        {sortedPayments.map((payment) => {
                                            const lease = leasesById.get(payment.leaseId);
                                            const space = lease
                                                ? spacesById.get(lease.spaceId)
                                                : undefined;

                                            return (
                                                <tr
                                                    key={payment.id}
                                                    className="hover:bg-[#f8faf8]"
                                                >
                                                    <td className="px-4 py-4 text-sm text-gray-600">
                                                        {formatDate(payment.dueDate)}
                                                    </td>

                                                    <td className="px-4 py-4 text-sm font-medium text-[#14302b]">
                                                        {space?.name ?? `Space #${lease?.spaceId ?? "—"}`}
                                                    </td>

                                                    <td className="px-4 py-4 text-sm text-gray-600">
                                                        #{payment.leaseId}
                                                    </td>

                                                    <td className="px-4 py-4 text-sm font-medium text-[#243b35]">
                                                        {formatMoney(payment.amountCents)}
                                                    </td>

                                                    <td className="px-4 py-4">
                                                        <PaymentStatusBadge status={getPaymentDisplayStatus(payment, today)} />
                                                    </td>

                                                    <td className="px-4 py-4 text-sm text-gray-600">
                                                        {formatDateTime(payment.paidAt)}
                                                    </td>

                                                    <td className="px-4 py-4 text-sm text-gray-600">
                                                        {formatPaymentMethod(payment.paymentMethod)}
                                                    </td>

                                                    <td className="px-4 py-4">
                                                        <PaymentRowActions
                                                            payment={payment}
                                                            busyPaymentId={paymentActions.busyPaymentId}
                                                            recordingPaymentId={paymentActions.recordingPaymentId}
                                                            onRecord={() => paymentActions.startRecording(payment.id)}
                                                            onVoid={() => void paymentActions.voidPayment(payment)}
                                                        />
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                </>
            )}
        </div>
    );
}
