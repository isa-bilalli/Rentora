import { useEffect, useState } from "react";
import { Building2, Mail, UserRound, type LucideIcon } from "lucide-react";

import PageHeader from "../../../components/ui/PageHeader";
import { getCurrentUser } from "../../auth/api/authApi";
import type { AuthUser } from "../../auth/types";
import { useOrganization } from "../../organizations/useOrganization";

function initials(user: AuthUser): string {
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
}

export default function ProfilePage() {
    const { activeOrganization } = useOrganization();

    const [user, setUser] = useState<AuthUser | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Read from the server each visit rather than from the copy the app kept at sign-in.
    useEffect(() => {
        let cancelled = false;

        getCurrentUser()
            .then((result) => {
                if (!cancelled) setUser(result);
            })
            .catch((loadError: unknown) => {
                if (cancelled) return;
                setError(loadError instanceof Error ? loadError.message : "Failed to load your profile.");
            });

        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <main className="mx-auto w-full max-w-3xl space-y-6 p-5 md:p-8">
            <PageHeader
                eyebrow="RENTORA / ACCOUNT"
                title="Profile"
                description="The account you're signed in with."
            />

            {error ? (
                <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>
            ) : !user ? (
                <div className="rounded-xl border border-[#e0e7e2] bg-white p-8 text-center text-sm text-gray-500">Loading profile...</div>
            ) : (
                <section aria-labelledby="profile-name" className="overflow-hidden rounded-xl border border-[#e0e7e2] bg-white">
                    <div className="flex items-center gap-4 border-b border-[#edf1ee] px-5 py-5">
                        <div aria-hidden="true" className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#14302b] text-lg font-semibold text-white">
                            {initials(user)}
                        </div>
                        <div className="min-w-0">
                            <h2 id="profile-name" className="truncate text-lg font-semibold text-[#14302b]">
                                {user.firstName} {user.lastName}
                            </h2>
                            <p className="truncate text-sm text-gray-500">{user.email}</p>
                        </div>
                    </div>

                    <dl className="grid sm:grid-cols-2">
                        <ProfileField label="First name" icon={UserRound} value={user.firstName} />
                        <ProfileField label="Last name" icon={UserRound} value={user.lastName} />
                        <ProfileField label="Email" icon={Mail} value={user.email} />
                        <ProfileField label="Organization" icon={Building2} value={activeOrganization?.name ?? "No organization"} />
                    </dl>

                    <p className="px-5 py-4 text-sm text-gray-500">Changing these details isn't available yet.</p>
                </section>
            )}
        </main>
    );
}

interface ProfileFieldProps {
    label: string;
    icon: LucideIcon;
    value: string;
}

function ProfileField({ label, icon: Icon, value }: ProfileFieldProps) {
    return (
        <div className="border-b border-[#edf1ee] px-5 py-4">
            <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-400">
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                {label}
            </dt>
            <dd className="mt-1 wrap-break-words text-sm font-medium text-[#243b35]">{value}</dd>
        </div>
    );
}
