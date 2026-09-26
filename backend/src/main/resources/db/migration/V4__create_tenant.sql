CREATE TABLE tenants (
    id BIGSERIAL PRIMARY KEY,
    organization_id BIGINT NOT NULL,
    type VARCHAR(30) NOT NULL,

    first_name VARCHAR(100),
    last_name VARCHAR(100),
    company_name VARCHAR(150),

    email VARCHAR(255),
    phone VARCHAR(50),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_tenant_organization
        FOREIGN KEY (organization_id)
        REFERENCES organizations(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_tenants_organization_id
    ON tenants(organization_id);