# Rentora Roadmap

Small, reviewable steps from the current state to a shippable product.

## Working agreement

- One step = one small change (usually 50–300 lines), touching only the files it names.
- After each step: a summary of the files changed, what and why, how to check it in the app, and any open questions.
- Each step is left uncommitted. Review the diff, commit, tick the box, then move to the next step.
- Nothing outside the current step without asking first.

## Already done

- [x] Error handling: correct status codes (401/404/409/400), logged catch-all, 401 entry point so token refresh works
- [x] Frontend lint errors fixed; Tailwind declared in `frontend/package.json`; root `node_modules` untracked
- [x] `GET /payments/status` scoped to the organization (cross-org leak)
- [x] Payments follow lease cancel / end / update
- [x] Deleting a tenant or space with leases is refused (service check + V12 foreign keys)
- [x] Reserved spaces become occupied when their lease starts (nightly + on startup)
- [x] Reports exclude cancelled leases; V13 backfills existing data

## Phase 0: Shared frontend groundwork

- [ ] **1.** API errors carry per-field messages (`ApiError` with field errors); LoginPage shows them. *Review:* `client.ts`, `LoginPage.tsx`
- [ ] **2.** Move the 5 copies of `formatDate` / `formatMoney` into `lib/format.ts`, with one locale. *Review:* refactor only; output should look identical
- [ ] **3.** `useOrgQuery` hook for the load/cancel/error pattern, used in TenantsPage only. *Review:* one hook, one page
- [ ] **4.** Extract `PageHeader`, `EmptyState` and `StatusBadge` from existing pages, used in TenantsPage. *Review:* small components; no visual change

## Phase 1: Sign-up

- [ ] **5.** `register()` in authApi plus a RegisterPage form with field errors. *Review:* form and validation
- [ ] **6.** Log in automatically after registering, plus links between Login and Register. *Review:* auth flow

## Phase 2: Leases and payments

- [ ] **7.** Leases list: status filter, search by tenant or property, rows open the details page. *Review:* read-only page
- [ ] **8.** Pull the record-payment and void controls out of LeaseDetailsPage into shared components. *Review:* refactor; lease page works the same
- [ ] **9.** Payments page: Overdue / Pending / Paid / Voided tabs, with totals. *Review:* read-only page
- [ ] **10.** Record and void payments on that page, using the step 8 components. *Review:* actions

## Phase 3: Maintenance and expenses

- [ ] **11.** Maintenance list with status and priority filters. *Review:* read-only page
- [ ] **12.** Create maintenance requests, plus start / resolve / cancel. *Review:* actions
- [ ] **13.** `expenseApi.ts` and types matching the backend, no UI yet. *Review:* API layer only
- [ ] **14.** Expenses list with property and paid/unpaid filters. *Review:* read-only page
- [ ] **15.** Create and edit expenses. *Review:* form
- [ ] **16.** Pay and void expenses. *Review:* actions

## Phase 4: Reports and finishing the app

- [ ] **17.** `reportsApi.ts` and types. *Review:* API layer only
- [ ] **18.** Reports page: period picker, property filter and the financial report. *Review:* page shell plus one report
- [ ] **19.** Occupancy and lease reports. *Review:* two sections
- [ ] **20.** Maintenance report. *Review:* one section
- [ ] **21.** Profile page (read-only, from `/me`), added to the router and sidebar. *Review:* small page
- [ ] **22.** A real 404 page plus an error boundary. *Review:* small

> After Phase 4 the app is a complete MVP.

## Phase 5: Backend hardening

- [ ] **23.** Cookie `secure` setting and allowed CORS origins come from environment variables, with a prod profile. *Review:* config only
- [ ] **24.** Make `syncSpaceStatus` safe to repeat, so it no longer throws "already vacant". *Review:* one method plus a test
- [ ] **25.** Database rule (migration) that stops two overlapping leases on one space, even under concurrent requests. *Review:* migration plus error mapping
- [ ] **26.** Enforce roles with a `requireRole` check on destructive endpoints. Decide who can do what first. *Review:* rules table plus checks
- [ ] **27.** Invite members: backend endpoint. *Review:* backend only
- [ ] **28.** Invite members: UI. *Review:* frontend only
- [ ] **29.** Pagination on the payments endpoint and Payments page, then the other lists one per step. *Review:* one endpoint per step

## Phase 6: Performance and cleanup

- [ ] **30.** Backend endpoints for leases and payments per property. *Review:* two endpoints
- [ ] **31.** PropertyDetailsPage loads one property's data instead of the whole organization's. *Review:* data loading only
- [ ] **32.** Move PropertyDetailsPage's state into its tab components, one tab per step. *Review:* refactor, split up
- [ ] **33.** Sidebar at phone width: below `md` it becomes a drawer opened from a menu button in a top bar, and closes once a link is chosen. Today it stays 256px wide and leaves pages about 120px. *Review:* `AppLayout` and `Sidebar` only

## Phase 7: Shipping

- [ ] **34.** Tests stop using the dev database (Testcontainers or a test profile). Can be pulled forward at any time. *Review:* test setup
- [ ] **35.** GitHub Actions: backend tests plus frontend lint and build. *Review:* CI file
- [ ] **36.** Dockerfiles and docker-compose (Postgres, backend, frontend). *Review:* infrastructure
- [ ] **37.** Vitest plus first frontend tests (token refresh, formatters). *Review:* test setup

## Later

- [ ] Password reset (needs email sending)
- [ ] Notifications for overdue rent and expiring leases
- [ ] Document uploads and exports
- [ ] Currency support (EUR is currently hardcoded)

## Known behaviors to revisit

- Ending a lease that hasn't started returns 400 ("cancel it instead").
- A rent change applies only to rent due today or later; unpaid rent from before keeps its billed amount.
- Ending early does not prorate the last partial month.
