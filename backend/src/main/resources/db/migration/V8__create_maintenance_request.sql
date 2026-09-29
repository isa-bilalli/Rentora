CREATE TABLE maintenance_requests (
    id BIGSERIAL PRIMARY KEY,

    organization_id BIGINT NOT NULL,
    property_id BIGINT NOT NULL,
    space_id BIGINT,

    title VARCHAR(200) NOT NULL,
    description VARCHAR(1000),

    priority VARCHAR(30) NOT NULL,
    status VARCHAR(30) NOT NULL,

    reported_at TIMESTAMPTZ NOT NULL,
    resolved_at TIMESTAMPTZ,

    reported_by_user_id BIGINT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_maintenance_organization
        FOREIGN KEY (organization_id)
        REFERENCES organizations(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_maintenance_property
        FOREIGN KEY (property_id)
        REFERENCES properties(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_maintenance_space
        FOREIGN KEY (space_id)
        REFERENCES spaces(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_maintenance_reported_by
        FOREIGN KEY (reported_by_user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
);

CREATE INDEX idx_maintenance_organization_id
    ON maintenance_requests(organization_id);

CREATE INDEX idx_maintenance_property_id
    ON maintenance_requests(property_id);

CREATE INDEX idx_maintenance_space_id
    ON maintenance_requests(space_id);

CREATE INDEX idx_maintenance_status
    ON maintenance_requests(status);

CREATE INDEX idx_maintenance_priority
    ON maintenance_requests(priority);