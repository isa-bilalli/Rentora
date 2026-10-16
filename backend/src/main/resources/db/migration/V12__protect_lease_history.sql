-- Deleting a tenant or space used to cascade into its leases and, through them, its payments.
-- Lease history must survive, so those deletes are now refused while leases reference the row.
-- NO ACTION (checked at statement end) still lets an organization delete cascade through everything.
ALTER TABLE leases DROP CONSTRAINT fk_lease_tenant;
ALTER TABLE leases
    ADD CONSTRAINT fk_lease_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants(id)
        ON DELETE NO ACTION;

ALTER TABLE leases DROP CONSTRAINT fk_lease_space;
ALTER TABLE leases
    ADD CONSTRAINT fk_lease_space
        FOREIGN KEY (space_id)
        REFERENCES spaces(id)
        ON DELETE NO ACTION;
