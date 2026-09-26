CREATE TABLE properties (
    id BIGSERIAL PRIMARY KEY,
    organization_id BIGINT NOT NULL,
    name VARCHAR(150) NOT NULL,
    address_line VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20),
    country VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_property_organization
        FOREIGN KEY (organization_id)
        REFERENCES organizations(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_properties_organization_id
    ON properties(organization_id);