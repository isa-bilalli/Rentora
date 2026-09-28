CREATE TABLE expenses (
    id BIGSERIAL PRIMARY KEY,
    organization_id BIGINT NOT NULL,
    property_id BIGINT NOT NULL,
    space_id BIGINT,

    category VARCHAR(30) NOT NULL,
    vendor_name VARCHAR(150),
    description VARCHAR(500),

    amount_cents BIGINT NOT NULL,
    expense_date DATE NOT NULL,

    paid BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(30) NOT NULL,

    recorded_by_user_id BIGINT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_expense_organization
        FOREIGN KEY (organization_id)
        REFERENCES organizations(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_expense_property
        FOREIGN KEY (property_id)
        REFERENCES properties(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_expense_space
        FOREIGN KEY (space_id)
        REFERENCES spaces(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_expense_recorded_by
        FOREIGN KEY (recorded_by_user_id)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT chk_expense_amount
        CHECK (amount_cents >= 0)
);

CREATE INDEX idx_expenses_organization_id
    ON expenses(organization_id);

CREATE INDEX idx_expenses_property_id
    ON expenses(property_id);

CREATE INDEX idx_expenses_space_id
    ON expenses(space_id);

CREATE INDEX idx_expenses_status
    ON expenses(status);

CREATE INDEX idx_expenses_expense_date
    ON expenses(expense_date);