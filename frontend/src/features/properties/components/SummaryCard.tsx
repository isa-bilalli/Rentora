// A figure with a label and a short explanation, as in the property page's header and Financials tab.
export default function SummaryCard({
    label,
    value,
    description,
}: {
    label: string;
    value: string;
    description: string;
}) {
    return (
        <article className="rounded-xl border border-[#e1e8e3] bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">{label}</p>
            <p className="mt-3 text-2xl font-semibold text-[#14302b]">{value}</p>
            <p className="mt-1 text-sm text-gray-500">{description}</p>
        </article>
    );
}
