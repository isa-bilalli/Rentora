-- Before V13, ending or cancelling a lease left its schedule untouched. This brings existing rows in line
-- with the new rules. An ENDED lease is never modified after it ends, so updated_at is the day it was ended.

-- A lease "ended" on or before its start date never ran; the new rules require cancelling it instead.
UPDATE leases
SET status = 'CANCELLED'
WHERE status = 'ENDED'
  AND updated_at::date < end_date
  AND updated_at::date <= start_date;

-- A lease ended early keeps its actual last day as its end date.
UPDATE leases
SET end_date = updated_at::date
WHERE status = 'ENDED'
  AND updated_at::date < end_date
  AND updated_at::date > start_date;

-- Rent on a cancelled lease, or due after an ended lease's last day, is not owed.
UPDATE payments p
SET status = 'VOIDED',
    updated_at = CURRENT_TIMESTAMP
FROM leases l
WHERE l.id = p.lease_id
  AND p.status = 'PENDING'
  AND (
        l.status = 'CANCELLED'
        OR (l.status = 'ENDED' AND p.due_date > l.end_date)
      );
