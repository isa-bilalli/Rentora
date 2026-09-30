ALTER TABLE leases
ADD COLUMN renewed_from_lease_id BIGINT;

ALTER TABLE leases
ADD CONSTRAINT fk_lease_renewed_from
    FOREIGN KEY (renewed_from_lease_id)
    REFERENCES leases(id)
    ON DELETE SET NULL;

CREATE INDEX idx_leases_renewed_from
    ON leases(renewed_from_lease_id);