# Roles

Every member of an organization has one role. Roles are ordered: each may do everything the roles below it may.

| Action | Owner | Manager | Member |
|---|:-:|:-:|:-:|
| View everything in the organization, including reports and its members | ✓ | ✓ | ✓ |
| Create and edit properties, spaces, tenants, leases, expenses and maintenance requests | ✓ | ✓ | ✓ |
| Record payments, pay expenses, renew leases, change a space's status, start, resolve or cancel maintenance | ✓ | ✓ | ✓ |
| Add people to the organization, as managers or members | ✓ | ✓ | — |
| Delete tenants and spaces | ✓ | ✓ | — |
| Void payments and expenses | ✓ | ✓ | — |
| End and cancel leases | ✓ | ✓ | — |

The last three rows are the destructive actions: they can't be undone and change the financial history.
Each one starts with `OrganizationAccessService.requireRole(user, organizationId, OrganizationRole.MANAGER)`,
and a refused request gets `403` with "Your role in this organization does not allow this action".
Everything else only checks membership (`requireAccess`).

Whoever registers becomes the owner of the organization created with them. Managers and members are added by
an owner or manager (`POST /api/organizations/{id}/members` with their account's email); nobody can be added as an owner.
