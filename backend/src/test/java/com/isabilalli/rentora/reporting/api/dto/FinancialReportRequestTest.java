package com.isabilalli.rentora.reporting.api.dto;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

import java.util.Set;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;

class FinancialReportRequestTest {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    // Without this the request reached the range resolver with no period and failed with a 500.
    @Test
    void periodIsRequired() {
        Set<ConstraintViolation<FinancialReportRequest>> violations =
                validator.validate(new FinancialReportRequest(null, null, null, null, null));

        assertEquals(
                Set.of("period"),
                violations.stream().map(violation -> violation.getPropertyPath().toString()).collect(Collectors.toSet())
        );
    }
}
