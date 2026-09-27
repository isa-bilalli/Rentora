CREATE TABLE leases (
    id BIGSERIAL PRIMARY KEY,
    organization_id BIGINT NOT NULL,
    tenant_id BIGINT NOT NULL,
    space_id BIGINT NOT NULL,

    start_date DATE NOT NULL,
    end_date DATE NOT NULL,

    monthly_rent_cents BIGINT NOT NULL,
    security_deposit_cents BIGINT NOT NULL DEFAULT 0,

    status VARCHAR(30) NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_lease_organization
        FOREIGN KEY (organization_id)
        REFERENCES organizations(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_lease_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_lease_space
        FOREIGN KEY (space_id)
        REFERENCES spaces(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_lease_dates
        CHECK (end_date > start_date),

    CONSTRAINT chk_lease_monthly_rent
        CHECK (monthly_rent_cents >= 0),

    CONSTRAINT chk_lease_security_deposit
        CHECK (security_deposit_cents >= 0)
);