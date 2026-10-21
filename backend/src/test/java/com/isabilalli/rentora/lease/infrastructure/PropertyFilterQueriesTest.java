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

// The ?propertyId= filters on the lease and payment lists, checked on the throwaway PostgreSQL from
// TestcontainersConfiguration. @DataJpaTest also rolls each test back.
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import(TestcontainersConfiguration.class)
@ActiveProfiles("test")
class PropertyFilterQueriesTest {

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
    private Long harbourViewId;
    private Long marketSquareId;
    private Long otherOrganizationPropertyId;

    private Lease unitALease;
    private Lease unitBLease;
    private Lease cancelledUnitALease;
    private Lease officeLease;
    private Payment unitAMarch;
    private Payment unitAFebruary;
    private Payment unitBJanuary;

    @BeforeEach
    void setUp() {
        organizationId = organizationRepository.save(new Organization("Property filter test")).getId();
        Long tenantId = tenantRepository.save(new Tenant(organizationId, TenantType.INDIVIDUAL, "Test", "Tenant", null, null, null)).getId();

        harbourViewId = property(organizationId, "Harbour View");
        Long unitA = space(harbourViewId, "Unit A");
        Long unitB = space(harbourViewId, "Unit B");
        marketSquareId = property(organizationId, "Market Square");
        Long office = space(marketSquareId, "Office 1");

        unitBLease = leaseRepository.save(new Lease(organizationId, tenantId, unitB, LocalDate.of(2030, 1, 1), LocalDate.of(2030, 12, 31), 100_00L, 0L));
        unitALease = leaseRepository.save(new Lease(organizationId, tenantId, unitA, LocalDate.of(2030, 2, 1), LocalDate.of(2031, 1, 31), 100_00L, 0L));
        Lease cancelled = new Lease(organizationId, tenantId, unitA, LocalDate.of(2029, 6, 1), LocalDate.of(2029, 12, 31), 100_00L, 0L);
        cancelled.cancel();
        cancelledUnitALease = leaseRepository.save(cancelled);
        officeLease = leaseRepository.save(new Lease(organizationId, tenantId, office, LocalDate.of(2030, 1, 1), LocalDate.of(2030, 12, 31), 200_00L, 0L));

        unitAMarch = payment(organizationId, unitALease, LocalDate.of(2030, 3, 1));
        unitAFebruary = payment(organizationId, unitALease, LocalDate.of(2030, 2, 1));
        unitBJanuary = payment(organizationId, unitBLease, LocalDate.of(2030, 1, 1));
        payment(organizationId, officeLease, LocalDate.of(2030, 1, 1));

        // A second organization with a property, lease and payment of its own.
        Long otherOrganizationId = organizationRepository.save(new Organization("Someone else")).getId();
        Long otherTenantId = tenantRepository.save(new Tenant(otherOrganizationId, TenantType.INDIVIDUAL, "Other", "Tenant", null, null, null)).getId();
        otherOrganizationPropertyId = property(otherOrganizationId, "Their property");
        Lease otherLease = leaseRepository.save(new Lease(otherOrganizationId, otherTenantId, space(otherOrganizationPropertyId, "Their unit"), LocalDate.of(2030, 1, 1), LocalDate.of(2030, 12, 31), 100_00L, 0L));
        payment(otherOrganizationId, otherLease, LocalDate.of(2030, 1, 1));
        leaseRepository.flush();
        paymentRepository.flush();
    }

    // Cancelled leases are history and stay in the list, as in the full list.
    @Test
    void leasesOfOnePropertyIncludeEveryStatusEarliestStartFirst() {
        assertEquals(
                List.of(cancelledUnitALease.getId(), unitBLease.getId(), unitALease.getId()),
                leaseIds(leaseRepository.findAllByOrganizationIdAndPropertyId(organizationId, harbourViewId))
        );
        assertEquals(
                List.of(officeLease.getId()),
                leaseIds(leaseRepository.findAllByOrganizationIdAndPropertyId(organizationId, marketSquareId))
        );
    }

    @Test
    void paymentsOfOnePropertyEarliestDueFirst() {
        assertEquals(
                List.of(unitBJanuary.getId(), unitAFebruary.getId(), unitAMarch.getId()),
                paymentIds(paymentRepository.findAllByOrganizationIdAndPropertyId(organizationId, harbourViewId))
        );
    }

    @Test
    void anotherOrganizationsPropertyMatchesNothing() {
        assertEquals(List.of(), leaseRepository.findAllByOrganizationIdAndPropertyId(organizationId, otherOrganizationPropertyId));
        assertEquals(List.of(), paymentRepository.findAllByOrganizationIdAndPropertyId(organizationId, otherOrganizationPropertyId));
    }

    private Long property(Long ownerId, String name) {
        return propertyRepository.save(new Property(ownerId, name, "1 Test Street", "Dublin", null, "Ireland")).getId();
    }

    private Long space(Long propertyId, String name) {
        return spaceRepository.save(new Space(propertyId, name, SpaceType.RESIDENTIAL, 1, new BigDecimal("50.00"), SpaceStatus.VACANT)).getId();
    }

    private Payment payment(Long ownerId, Lease lease, LocalDate dueDate) {
        return paymentRepository.save(new Payment(ownerId, lease.getId(), dueDate, 100_00L));
    }

    private static List<Long> leaseIds(List<Lease> leases) {
        return leases.stream().map(Lease::getId).toList();
    }

    private static List<Long> paymentIds(List<Payment> payments) {
        return payments.stream().map(Payment::getId).toList();
    }
}
