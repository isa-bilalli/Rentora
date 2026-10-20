package com.isabilalli.rentora.lease.infrastructure;

import com.isabilalli.rentora.lease.domain.Lease;
import com.isabilalli.rentora.organization.domain.Organization;
import com.isabilalli.rentora.organization.infrastructure.OrganizationRepository;
import com.isabilalli.rentora.property.domain.Property;
import com.isabilalli.rentora.property.domain.Space;
import com.isabilalli.rentora.property.domain.SpaceStatus;
import com.isabilalli.rentora.property.domain.SpaceType;
import com.isabilalli.rentora.property.infrastructure.PropertyRepository;
import com.isabilalli.rentora.property.infrastructure.SpaceRepository;
import com.isabilalli.rentora.tenant.domain.Tenant;
import com.isabilalli.rentora.tenant.domain.TenantType;
import com.isabilalli.rentora.tenant.infrastructure.TenantRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.core.NestedExceptionUtils;
import org.springframework.dao.DataIntegrityViolationException;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

// The V14 rule against overlapping active leases, checked on the configured PostgreSQL database.
// @DataJpaTest rolls each test back, so nothing it creates is kept.
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class LeaseOverlapRuleTest {

    private static final LocalDate JANUARY_1 = LocalDate.of(2030, 1, 1);
    private static final LocalDate DECEMBER_31 = LocalDate.of(2030, 12, 31);

    @Autowired
    private LeaseRepository leaseRepository;

    @Autowired
    private OrganizationRepository organizationRepository;

    @Autowired
    private PropertyRepository propertyRepository;

    @Autowired
    private SpaceRepository spaceRepository;

    @Autowired
    private TenantRepository tenantRepository;

    private Long organizationId;
    private Long tenantId;
    private Long spaceId;

    @BeforeEach
    void setUp() {
        organizationId = organizationRepository.save(new Organization("Lease overlap test")).getId();
        Long propertyId = propertyRepository.save(
                new Property(organizationId, "Test property", "1 Test Street", "Dublin", null, "Ireland")
        ).getId();
        spaceId = spaceRepository.save(
                new Space(propertyId, "Unit 1", SpaceType.RESIDENTIAL, 1, new BigDecimal("50.00"), SpaceStatus.VACANT)
        ).getId();
        tenantId = tenantRepository.save(
                new Tenant(organizationId, TenantType.INDIVIDUAL, "Test", "Tenant", null, null, null)
        ).getId();
    }

    @Test
    void refusesASecondActiveLeaseOverTheSameDates() {
        leaseRepository.saveAndFlush(lease(JANUARY_1, DECEMBER_31));

        DataIntegrityViolationException exception = assertThrows(
                DataIntegrityViolationException.class,
                () -> leaseRepository.saveAndFlush(lease(LocalDate.of(2030, 6, 1), LocalDate.of(2031, 5, 31)))
        );

        String detail = NestedExceptionUtils.getMostSpecificCause(exception).getMessage();
        assertTrue(detail.contains("\"leases_no_overlapping_active\""), detail);
    }

    // Both dates count, so a lease starting on the day another ends overlaps it.
    @Test
    void refusesALeaseStartingOnTheLastDayOfAnother() {
        leaseRepository.saveAndFlush(lease(JANUARY_1, DECEMBER_31));

        assertThrows(
                DataIntegrityViolationException.class,
                () -> leaseRepository.saveAndFlush(lease(DECEMBER_31, LocalDate.of(2031, 12, 31)))
        );
    }

    @Test
    void allowsALeaseStartingTheDayAfterAnotherEnds() {
        leaseRepository.saveAndFlush(lease(JANUARY_1, DECEMBER_31));

        assertDoesNotThrow(() -> leaseRepository.saveAndFlush(lease(LocalDate.of(2031, 1, 1), LocalDate.of(2031, 12, 31))));
    }

    @Test
    void cancelledLeasesDoNotBlockTheirDates() {
        Lease cancelled = lease(JANUARY_1, DECEMBER_31);
        cancelled.cancel();
        leaseRepository.saveAndFlush(cancelled);

        assertDoesNotThrow(() -> leaseRepository.saveAndFlush(lease(JANUARY_1, DECEMBER_31)));
    }

    private Lease lease(LocalDate startDate, LocalDate endDate) {
        return new Lease(organizationId, tenantId, spaceId, startDate, endDate, 100_000L, 0L);
    }
}
