import ErrorScreen from "./ErrorScreen";

interface NotFoundPageProps {
    // Inside the app layout, so the sidebar stays.
    withinApp?: boolean;
}

export default function NotFoundPage({ withinApp = false }: NotFoundPageProps) {
    return (
        <ErrorScreen
            withinApp={withinApp}
            code="404"
            title="Page not found"
            description="The address may be mistyped, or the page may have moved."
        />
    );
}
