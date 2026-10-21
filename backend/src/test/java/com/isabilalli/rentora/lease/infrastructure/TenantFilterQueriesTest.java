package com.isabilalli.rentora.lease.infrastructure;

import com.isabilalli.rentora.TestcontainersConfiguration;
import com.isabilalli.rentora.lease.domain.Lease;
import com.isabilalli.rentora.organization.domain.Organization;
import com.isabilalli.rentora.organization.infrastructure.OrganizationRepository;
import com.isabilalli.rentora.payment.domain.Payment;
import com.isabilalli.rentora.payment.infrastructure.PaymentRepository;
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
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

// The ?tenantId= filters on the lease and payment lists, checked on the throwaway PostgreSQL from
// TestcontainersConfiguration. @DataJpaTest also rolls each test back.
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import(TestcontainersConfiguration.class)
@ActiveProfiles("test")
class TenantFilterQueriesTest {

    @Autowired
    private LeaseRepository leaseRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private OrganizationRepository organizationRepository;

    @Autowired
    private PropertyRepository propertyRepository;

    @Autowired
    private SpaceRepository spaceRepository;

    @Autowired
    private TenantRepository tenantRepository;

    private Long organizationId;
    private Long aliceId;
    private Long otherOrganizationTenantId;

    private Lease aliceCurrentLease;
    private Lease aliceCancelledLease;
    private Payment aliceApril;
    private Payment aliceMarch;

    @BeforeEach
    void setUp() {
        organizationId = organizationRepository.save(new Organization("Tenant filter test")).getId();
        Long propertyId = propertyRepository.save(new Property(organizationId, "Test property", "1 Test Street", "Dublin", null, "Ireland")).getId();
        Long unitA = space(propertyId, "Unit A");
        Long unitB = space(propertyId, "Unit B");
        aliceId = tenant(organizationId, "Alice");
        Long bobId = tenant(organizationId, "Bob");

        aliceCurrentLease = leaseRepository.save(new Lease(organizationId, aliceId, unitA, LocalDate.of(2030, 3, 1), LocalDate.of(2031, 2, 28), 100_00L, 0L));
        Lease cancelled = new Lease(organizationId, aliceId, unitB, LocalDate.of(2029, 1, 1), LocalDate.of(2029, 12, 31), 100_00L, 0L);
        cancelled.cancel();
        aliceCancelledLease = leaseRepository.save(cancelled);
        Lease bobLease = leaseRepository.save(new Lease(organizationId, bobId, unitB, LocalDate.of(2030, 1, 1), LocalDate.of(2030, 12, 31), 100_00L, 0L));

        aliceApril = payment(organizationId, aliceCurrentLease, LocalDate.of(2030, 4, 1));
        aliceMarch = payment(organizationId, aliceCurrentLease, LocalDate.of(2030, 3, 1));
        payment(organizationId, bobLease, LocalDate.of(2030, 1, 1));

        // A second organization with a tenant, lease and payment of its own.
        Long otherOrganizationId = organizationRepository.save(new Organization("Someone else")).getId();
        Long otherPropertyId = propertyRepository.save(new Property(otherOrganizationId, "Their property", "2 Test Street", "Dublin", null, "Ireland")).getId();
        otherOrganizationTenantId = tenant(otherOrganizationId, "Carol");
        Lease otherLease = leaseRepository.save(new Lease(otherOrganizationId, otherOrganizationTenantId, space(otherPropertyId, "Their unit"), LocalDate.of(2030, 1, 1), LocalDate.of(2030, 12, 31), 100_00L, 0L));
        payment(otherOrganizationId, otherLease, LocalDate.of(2030, 1, 1));
        leaseRepository.flush();
        paymentRepository.flush();
    }

    // Cancelled leases are history and stay in the list, as in the full list.
    @Test
    void leasesOfOneTenantIncludeEveryStatusEarliestStartFirst() {
        assertEquals(
                List.of(aliceCancelledLease.getId(), aliceCurrentLease.getId()),
                leaseRepository.findAllByOrganizationIdAndTenantIdOrderByStartDateAscIdAsc(organizationId, aliceId).stream().map(Lease::getId).toList()
        );
    }

    @Test
    void paymentsOfOneTenantEarliestDueFirst() {
        assertEquals(
                List.of(aliceMarch.getId(), aliceApril.getId()),
                paymentRepository.findAllByOrganizationIdAndTenantId(organizationId, aliceId).stream().map(Payment::getId).toList()
        );
    }

    @Test
    void anotherOrganizationsTenantMatchesNothing() {
        assertEquals(List.of(), leaseRepository.findAllByOrganizationIdAndTenantIdOrderByStartDateAscIdAsc(organizationId, otherOrganizationTenantId));
        assertEquals(List.of(), paymentRepository.findAllByOrganizationIdAndTenantId(organizationId, otherOrganizationTenantId));
    }

    private Long space(Long propertyId, String name) {
        return spaceRepository.save(new Space(propertyId, name, SpaceType.RESIDENTIAL, 1, new BigDecimal("50.00"), SpaceStatus.VACANT)).getId();
    }

    private Long tenant(Long ownerId, String firstName) {
        return tenantRepository.save(new Tenant(ownerId, TenantType.INDIVIDUAL, firstName, "Tenant", null, null, null)).getId();
    }

    private Payment payment(Long ownerId, Lease lease, LocalDate dueDate) {
        return paymentRepository.save(new Payment(ownerId, lease.getId(), dueDate, 100_00L));
    }
}
