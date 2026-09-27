CREATE TABLE payments (
    id BIGSERIAL PRIMARY KEY,
    organization_id BIGINT NOT NULL,
    lease_id BIGINT NOT NULL,

    due_date DATE NOT NULL,
    amount_cents BIGINT NOT NULL,

    status VARCHAR(30) NOT NULL,
    paid_at TIMESTAMPTZ,
    payment_method VARCHAR(30),

    recorded_by_user_id BIGINT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_payment_organization
        FOREIGN KEY (organization_id)
        REFERENCES organizations(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_payment_lease
        FOREIGN KEY (lease_id)
        REFERENCES leases(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_payment_recorded_by_user
        FOREIGN KEY (recorded_by_user_id)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT chk_payment_amount
        CHECK (amount_cents >= 0),

    CONSTRAINT uq_payment_lease_due_date
        UNIQUE (lease_id, due_date)
);

CREATE INDEX idx_payments_organization_id
    ON payments(organization_id);

CREATE INDEX idx_payments_lease_id
    ON payments(lease_id);

CREATE INDEX idx_payments_due_date
    ON payments(due_date);

CREATE INDEX idx_payments_status
    ON payments(status);

CREATE INDEX idx_payments_recorded_by_user_id
    ON payments(recorded_by_user_id);