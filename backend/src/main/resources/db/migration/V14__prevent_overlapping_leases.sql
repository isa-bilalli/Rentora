-- Two active leases on one space must not overlap. LeaseService checks this before saving, but two
-- requests at the same moment can both pass that check; this rule makes the database refuse the second.
-- Dates count at both ends ('[]'), the same as LeaseRepository.existsOverlappingActiveLease.
-- Ended and cancelled leases are left out, so history never blocks a new lease.

-- Lets the plain space_id column take part in the GiST index behind the rule.
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE leases
    ADD CONSTRAINT leases_no_overlapping_active
        EXCLUDE USING gist (
            space_id WITH =,
            daterange(start_date, end_date, '[]') WITH &&
        )
        WHERE (status = 'ACTIVE');
