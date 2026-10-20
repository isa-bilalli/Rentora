import type { ReactNode } from "react";
import { Link } from "react-router";

import { useAuth } from "../../features/auth/useAuth";
import Rentora from "../../assets/rentora-wordmark.svg";

interface ErrorScreenProps {
    // Shown large above the title, e.g. "404".
    code?: string;
    title: string;
    description: ReactNode;
    // Inside the app layout, so the sidebar stays; otherwise a page of its own, styled like sign-in.
    withinApp?: boolean;
    // Shown before the link home, e.g. a reload button.
    action?: ReactNode;
    // Extra detail under the description.
    children?: ReactNode;
}

// The page shown instead of content that doesn't exist or failed to render, with a way back.
export default function ErrorScreen({
    code,
    title,
    description,
    withinApp = false,
    action,
    children,
}: ErrorScreenProps) {
    const { status } = useAuth();
    const home = withinApp || status === "authenticated"
        ? { to: "/app/dashboard", label: "Go to dashboard" }
        : { to: "/auth/login", label: "Go to sign in" };

    const body = (
        <>
            {code && (
                <p className="text-5xl font-semibold tracking-tight text-[#426b5c]">{code}</p>
            )}
            <h1 className={`${code ? "mt-2 " : ""}text-2xl font-semibold tracking-tight text-[#14302b]`}>{title}</h1>
            <p className="mt-2 text-sm text-gray-500">{description}</p>
            {children}
            <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
                {action}
                <Link
                    to={home.to}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#14302b] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#20453d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d4a94f]"
                >
                    {home.label}
                </Link>
            </div>
        </>
    );

    if (withinApp) {
        return (
            <main className="mx-auto w-full max-w-xl p-5 md:p-8">
                <div className="mt-8 flex flex-col items-center rounded-xl border border-[#e0e7e2] bg-white px-6 py-10 text-center">
                    {body}
                </div>
            </main>
        );
    }

    return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-[#e8e2d6] px-4 py-10">
            <div className="w-full max-w-md overflow-hidden rounded-2xl border border-[#14302b]/10 bg-white shadow-xl shadow-[#14302b]/10">
                <div className="h-1.5 w-full bg-[#d4a94f]" aria-hidden="true" />
                <div className="flex flex-col items-center px-6 py-8 text-center sm:px-10">
                    <img src={Rentora} className="mb-6 h-10 w-auto" alt="Rentora" />
                    {body}
                </div>
            </div>
        </main>
    );
}
