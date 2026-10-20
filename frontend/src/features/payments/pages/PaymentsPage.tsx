import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { CreditCard } from "lucide-react";
import { getPaymentPage, getPaymentSummary } from "../api/paymentApi";
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
import Pagination from "../../../components/ui/Pagination";
import StatusNotice from "../../../components/ui/StatusNotice";

const PAGE_SIZE = 25;

interface PaymentRow {
    payment: PaymentResponse;
    tenantName: string;
    propertyName: string;
    spaceName: string;
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

export default function PaymentsPage() {
    const [selected, setSelected] = useState<PaymentDisplayStatus>("OVERDUE");
    const [page, setPage] = useState(0);
    // Bumped to fetch the current page again, e.g. after its last row was recorded or voided.
    const [reloadCount, setReloadCount] = useState(0);
    // The day "overdue by" counts from, fixed while the page is open.
    const [today] = useState(todayLocalDateString);

    // The server splits the tabs and sorts each one: most urgent first.
    const summaryQuery = useOrgQuery(getPaymentSummary);
    const pageQuery = useOrgQuery(
        (organizationId) => getPaymentPage(organizationId, selected, page, PAGE_SIZE),
        [selected, page, reloadCount],
    );
    // Payments only carry a lease ID; the lease rows supply the tenant, property and space names.
    const leaseQuery = useOrgQuery(loadLeaseRows);

    const summary = summaryQuery.data;
    const pageData = pageQuery.data;
    const leaseRows = leaseQuery.data;
    const loadError = pageQuery.organizationId === undefined
        ? "Select an organization to view its payments."
        : summaryQuery.error ?? pageQuery.error ?? leaseQuery.error;
    const tableLoading = pageQuery.loading || leaseQuery.loading;
    const noPaymentsAtAll = summary !== undefined && PAYMENT_DISPLAY_STATUSES.every((status) => summary[status].count === 0);

    const rows = useMemo(() => {
        if (!pageData) return NO_ROWS;
        const leaseById = new Map((leaseRows ?? []).map((row) => [row.lease.id, row]));
        return pageData.items.map((payment) => {
            const lease = leaseById.get(payment.leaseId);
            return {
                payment,
                tenantName: lease?.tenantName ?? `Lease #${payment.leaseId}`,
                propertyName: lease?.propertyName ?? "Unknown property",
                spaceName: lease?.spaceName ?? "",
            };
        });
    }, [pageData, leaseRows]);

    // Confirms a record or void, since the payment then leaves the tab it was on.
    const [notice, setNotice] = useState<string | null>(null);

    // A recorded or voided payment leaves this tab: it comes off the page, and its amount moves to Paid or Voided.
    const paymentActions = usePaymentActions((updatedPayment) => {
        const row = rows.find((candidate) => candidate.payment.id === updatedPayment.id);
        const from = row ? getPaymentDisplayStatus(row.payment, today) : selected;
        const to = getPaymentDisplayStatus(updatedPayment, today);
        const cents = updatedPayment.amountCents;
        summaryQuery.setData((current) => ({
            ...current,
            [from]: { count: current[from].count - 1, amountCents: current[from].amountCents - cents },
            [to]: { count: current[to].count + 1, amountCents: current[to].amountCents + cents },
        }));

        if (rows.length === 1) {
            // Nothing left on this page: show the one before it, or load this one again for the rows that move up.
            if (page > 0) {
                setPage(page - 1);
            } else {
                setReloadCount((count) => count + 1);
            }
        } else {
            pageQuery.setData((current) => ({
                ...current,
                items: current.items.filter((payment) => payment.id !== updatedPayment.id),
                totalItems: current.totalItems - 1,
                totalPages: Math.ceil((current.totalItems - 1) / current.size),
            }));
        }

        const tenantName = row?.tenantName ?? "this lease";
        const amount = formatMoney(cents);
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

    function goToPage(nextPage: number) {
        setPage(nextPage);
        paymentActions.cancelRecording();
    }

    // Only pending payments (including overdue ones) can be recorded or voided.
    const showActions = selected === "OVERDUE" || selected === "PENDING";

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
                    const count = summary?.[status].count ?? 0;
                    return (
                        <button
                            key={status}
                            type="button"
                            onClick={() => {
                                setSelected(status);
                                setPage(0);
                                paymentActions.cancelRecording();
                                setNotice(null);
                            }}
                            aria-pressed={isSelected}
                            className={`flex flex-col rounded-xl border bg-white p-5 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d4a94f] ${isSelected ? "border-[#14302b] ring-1 ring-[#14302b]" : "border-[#e0e7e2] hover:border-[#c9d5cd]"}`}
                        >
                            <span className="text-sm text-gray-500">{paymentStatusLabel[status]}</span>
                            <span className={`mt-3 block text-2xl font-semibold tabular-nums ${status === "OVERDUE" && count > 0 ? "text-red-700" : "text-[#14302b]"}`}>
                                {summary ? formatMoney(summary[status].amountCents) : "—"}
                            </span>
                            <span className="mt-1 block text-xs text-gray-500">
                                {summary ? `${count} ${count === 1 ? "payment" : "payments"} ${tabCaption[status]}` : "Loading..."}
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
                {tableLoading ? (
                    <div className="p-10 text-center text-sm text-gray-500">Loading payments...</div>
                ) : noPaymentsAtAll && !loadError ? (
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
                ) : rows.length === 0 && page > 0 ? (
                    // E.g. after switching organization while on a later page.
                    <EmptyState
                        title="This page is empty"
                        action={
                            <button
                                type="button"
                                onClick={() => goToPage(0)}
                                className="inline-flex items-center gap-2 rounded-lg bg-[#14302b] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#20453d]"
                            >
                                Go to the first page
                            </button>
                        }
                    />
                ) : rows.length === 0 ? (
                    !loadError && <EmptyState title={emptyTab[selected].title} description={emptyTab[selected].description} />
                ) : (
                    <>
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
                                    {rows.map((row) => {
                                        const daysOverdue = daysBetween(row.payment.dueDate, today);
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
                        {pageData && (
                            <Pagination
                                page={pageData.page}
                                size={pageData.size}
                                itemCount={rows.length}
                                totalItems={pageData.totalItems}
                                totalPages={pageData.totalPages}
                                onPageChange={goToPage}
                                noun={{ one: "payment", other: "payments" }}
                            />
                        )}
                    </>
                )}
            </section>
        </main>
    );
}
