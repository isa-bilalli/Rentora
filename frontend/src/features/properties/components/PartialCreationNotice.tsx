import { Link } from "react-router";

interface PartialCreationNoticeProps {
    propertyId: number;
    message: string;
}

// Shown when a new property was created but one of the spaces added with it wasn't.
export default function PartialCreationNotice({ propertyId, message }: PartialCreationNoticeProps) {
    return (
        <div
            role="alert"
            className="rounded-xl border border-amber-200 bg-amber-50 p-5"
        >
            <h2 className="font-semibold text-amber-900">
                Property created with incomplete setup
            </h2>

            <p className="mt-2 text-sm text-amber-900">
                {message}
            </p>

            <p className="mt-2 text-sm text-amber-900">
                You can add any missing spaces from the
                property's Spaces tab.
            </p>

            <Link
                to={`/app/properties/${propertyId}`}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#14302b] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#20453d]"
            >
                Open property
            </Link>
        </div>
    );
}
