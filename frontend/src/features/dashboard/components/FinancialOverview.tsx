import type { Financial } from "../types";

interface FinancialOverviewProps {
    data: Financial;
}

export default function FinancialOverview({
    data,
}: FinancialOverviewProps) {
    return (
        <section>
            <h2 className="mb-4 text-lg font-semibold">
                Financial Overview
            </h2>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                    Expected Rent: {data.expectedRentCents}
                </div>

                <div>
                    Collected Rent: {data.collectedRentCents}
                </div>

                <div>
                    Outstanding Rent: {data.outstandingRentCents}
                </div>

                <div>
                    Overdue Rent: {data.overdueRentCents}
                </div>

                <div>
                    Paid Expenses: {data.paidExpensesCents}
                </div>

                <div>
                    Unpaid Expenses: {data.unpaidExpensesCents}
                </div>

                <div>
                    Net Income: {data.netIncomeCents}
                </div>
            </div>
        </section>
    );
}