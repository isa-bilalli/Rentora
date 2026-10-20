import { isRouteErrorResponse, useRouteError } from "react-router";

import ErrorScreen from "./ErrorScreen";
import NotFoundPage from "./NotFoundPage";

interface RouteErrorBoundaryProps {
    // Inside the app layout, so the sidebar stays.
    withinApp?: boolean;
}

function describeError(error: unknown): string {
    if (isRouteErrorResponse(error)) return `${error.status} ${error.statusText}`;
    if (error instanceof Error) return error.message;
    return String(error);
}

// Shown by the router when a page throws while rendering, in place of React Router's default error screen.
export default function RouteErrorBoundary({ withinApp = false }: RouteErrorBoundaryProps) {
    const error = useRouteError();

    if (isRouteErrorResponse(error) && error.status === 404) {
        return <NotFoundPage withinApp={withinApp} />;
    }

    return (
        <ErrorScreen
            withinApp={withinApp}
            title="Something went wrong"
            description="This page ran into an unexpected problem. Reloading it usually helps."
            action={
                <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#d5dfd8] bg-white px-4 py-2.5 text-sm font-medium text-[#243b35] hover:bg-[#f8faf8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d4a94f]"
                >
                    Reload page
                </button>
            }
        >
            {/* The error itself only in development; users get the message above. */}
            {import.meta.env.DEV && (
                <pre className="mt-4 max-h-40 w-full overflow-auto whitespace-pre-wrap rounded-lg bg-red-50 p-3 text-left text-xs text-red-800">
                    {describeError(error)}
                </pre>
            )}
        </ErrorScreen>
    );
}
