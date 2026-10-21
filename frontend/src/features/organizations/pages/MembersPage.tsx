import { useState } from "react";
import { UserPlus, UsersRound } from "lucide-react";

import EmptyState from "../../../components/ui/EmptyState";
import PageHeader from "../../../components/ui/PageHeader";
import StatusBadge from "../../../components/ui/StatusBadge";
import StatusNotice from "../../../components/ui/StatusNotice";
import { useOrgQuery } from "../../../hooks/useOrgQuery";
import { formatDate } from "../../../lib/format";
import { useAuth } from "../../auth/useAuth";
import { addMember, getMembers } from "../api/organizationApi";
import AddMemberForm from "../components/AddMemberForm";
import { ROLE_LABELS, ROLE_TONES } from "../roles";
import type { AddMemberRequest } from "../types";
import { useOrganization } from "../useOrganization";
import { useRolePermissions } from "../useRolePermissions";

// Keyed by organization, so switching organization also clears the form and any confirmation.
export default function MembersPage() {
    const { activeOrganization } = useOrganization();
    return <OrganizationMembers key={activeOrganization?.id} organizationName={activeOrganization?.name} />;
}

function OrganizationMembers({ organizationName }: { organizationName: string | undefined }) {
    const { user } = useAuth();
    const { organizationId, data: members, loading, error, setData: setMembers } = useOrgQuery(getMembers);

    const [showForm, setShowForm] = useState(false);
    const [adding, setAdding] = useState(false);
    const [notice, setNotice] = useState<string | null>(null);

    // Adding people is for managers and owners. The backend checks this as well; here it only decides
    // whether to offer the form.
    const { role, canManage: canAdd } = useRolePermissions();

    async function handleAdd(request: AddMemberRequest) {
        if (organizationId === undefined) return;
        setAdding(true);
        try {
            const added = await addMember(organizationId, request);
            setMembers((current) => [...current, added]);
            setNotice(`${added.firstName} ${added.lastName} was added as a ${ROLE_LABELS[added.role].toLowerCase()}.`);
            setShowForm(false);
        } finally {
            setAdding(false);
        }
    }

    return (
        <main className="mx-auto w-full max-w-5xl space-y-6 p-5 md:p-8">
            <PageHeader
                eyebrow="RENTORA / ORGANIZATION"
                title="Members"
                description={`The people who can use ${organizationName ?? "this organization"}.`}
                actions={canAdd && !showForm ? (
                    <button
                        type="button"
                        onClick={() => {
                            setNotice(null);
                            setShowForm(true);
                        }}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#14302b] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#20453d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d4a94f]"
                    >
                        <UserPlus className="h-4 w-4" />
                        Add member
                    </button>
                ) : undefined}
            />

            <StatusNotice message={notice} onDismiss={() => setNotice(null)} />

            {canAdd && showForm && (
                <AddMemberForm submitting={adding} onSubmit={handleAdd} onCancel={() => setShowForm(false)} />
            )}

            {error && (
                <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>
            )}

            <section className="overflow-hidden rounded-xl border border-[#e0e7e2] bg-white" aria-labelledby="members-heading">
                <div className="border-b border-[#edf1ee] p-4">
                    <h2 id="members-heading" className="font-semibold text-[#14302b]">People</h2>
                    {members && (
                        <p className="mt-1 text-sm text-gray-500">
                            {members.length} {members.length === 1 ? "person" : "people"}
                        </p>
                    )}
                </div>

                {loading ? (
                    <div className="p-10 text-center text-sm text-gray-500">Loading members...</div>
                ) : !members || members.length === 0 ? (
                    !error && <EmptyState icon={UsersRound} title="No members" />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[600px] text-left text-sm">
                            <thead className="bg-[#f8faf8] text-xs uppercase tracking-wide text-[#71847a]">
                                <tr>
                                    <th className="px-5 py-3 font-semibold">Name</th>
                                    <th className="px-5 py-3 font-semibold">Email</th>
                                    <th className="px-5 py-3 font-semibold">Role</th>
                                    <th className="px-5 py-3 font-semibold">Joined</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#edf1ee]">
                                {members.map((member) => (
                                    <tr key={member.userId}>
                                        <td className="px-5 py-4 font-medium text-[#14302b]">
                                            {member.firstName} {member.lastName}
                                            {member.userId === user?.id && (
                                                <span className="ml-2 text-xs font-normal text-gray-400">(you)</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-4 text-[#42574e]">{member.email}</td>
                                        <td className="px-5 py-4">
                                            <StatusBadge tone={ROLE_TONES[member.role]}>{ROLE_LABELS[member.role]}</StatusBadge>
                                        </td>
                                        <td className="px-5 py-4 text-[#42574e]">{formatDate(member.joinedAt)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            <section className="rounded-xl border border-[#e0e7e2] bg-white p-5 text-sm text-gray-600" aria-labelledby="roles-heading">
                <h2 id="roles-heading" className="font-semibold text-[#14302b]">What each role can do</h2>
                <ul className="mt-3 space-y-2">
                    <li><span className="font-medium text-[#243b35]">Members</span> handle the day-to-day: properties, tenants, leases, payments, expenses and maintenance.</li>
                    <li><span className="font-medium text-[#243b35]">Managers</span> can also add people, and delete, void, end or cancel.</li>
                    <li><span className="font-medium text-[#243b35]">Owners</span> can do everything managers can. Ownership comes with creating the organization.</li>
                </ul>
                {role === "MEMBER" && (
                    <p className="mt-3 text-gray-500">To add someone, ask an owner or manager of this organization.</p>
                )}
            </section>
        </main>
    );
}
