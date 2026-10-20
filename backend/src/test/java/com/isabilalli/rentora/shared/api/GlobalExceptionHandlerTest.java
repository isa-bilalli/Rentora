package com.isabilalli.rentora.shared.api;

import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;

import java.sql.SQLException;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    // What a request that lost the race against another one for the same space gets.
    @Test
    void overlappingLeaseRuleGetsItsOwnMessage() {
        DataIntegrityViolationException exception = violation(
                "ERROR: conflicting key value violates exclusion constraint \"leases_no_overlapping_active\"", "23P01"
        );

        assertEquals(
                Map.of("error", "Space already has an overlapping active lease"),
                handler.handleDataIntegrityViolationException(exception)
        );
    }

    // Two requests adding the same person to an organization at the same moment.
    @Test
    void duplicateMembershipGetsItsOwnMessage() {
        DataIntegrityViolationException exception = violation(
                "ERROR: duplicate key value violates unique constraint \"uq_membership_organization_user\"", "23505"
        );

        assertEquals(
                Map.of("error", "This person is already a member of the organization"),
                handler.handleDataIntegrityViolationException(exception)
        );
    }

    @Test
    void otherViolationsKeepTheGenericMessage() {
        DataIntegrityViolationException exception = violation(
                "ERROR: update or delete on table \"spaces\" violates foreign key constraint \"fk_lease_space\"", "23503"
        );

        assertEquals(
                Map.of("error", "The request conflicts with existing data"),
                handler.handleDataIntegrityViolationException(exception)
        );
    }

    private static DataIntegrityViolationException violation(String databaseMessage, String sqlState) {
        return new DataIntegrityViolationException("could not execute statement", new SQLException(databaseMessage, sqlState));
    }
}
