package com.isabilalli.rentora.property.application;

import com.isabilalli.rentora.TestcontainersConfiguration;
import com.isabilalli.rentora.auth.application.CurrentUserService;
import com.isabilalli.rentora.lease.domain.Lease;
import com.isabilalli.rentora.lease.infrastructure.LeaseRepository;
import com.isabilalli.rentora.organization.application.OrganizationAccessService;
import com.isabilalli.rentora.organization.domain.Organization;
import com.isabilalli.rentora.organization.infrastructure.OrganizationRepository;
import com.isabilalli.rentora.property.api.dto.SpaceResponse;
import com.isabilalli.rentora.property.domain.Property;
import com.isabilalli.rentora.property.domain.Space;
import com.isabilalli.rentora.property.domain.SpaceStatus;
import com.isabilalli.rentora.property.domain.SpaceType;
import com.isabilalli.rentora.property.infrastructure.PropertyRepository;
import com.isabilalli.rentora.property.infrastructure.SpaceRepository;
import com.isabilalli.rentora.shared.api.BadRequestException;
import com.isabilalli.rentora.tenant.domain.Tenant;
import com.isabilalli.rentora.tenant.domain.TenantType;
import com.isabilalli.rentora.tenant.infrastructure.TenantRepository;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeoutException;

import static java.util.concurrent.TimeUnit.MILLISECONDS;
import static java.util.concurrent.TimeUnit.SECONDS;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

// A space status set by hand while a lease for that space is being written. The two run on separate threads
// and really commit, so there is no test transaction; deleting the organization afterwards removes the rest.
@SpringBootTest
@Import(TestcontainersConfiguration.class)
@ActiveProfiles("test")
class SpaceStatusLockTest {

    private static final LocalDate TODAY = LocalDate.now();

    @Autowired
    private SpaceService spaceService;

    @Autowired
    private OrganizationRepository organizationRepository;

    @Autowired
    private PropertyRepository propertyRepository;

    @Autowired
    private SpaceRepository spaceRepository;

    @Autowired
    private TenantRepository tenantRepository;

    @Autowired
    private LeaseRepository leaseRepository;

    @Autowired
    private PlatformTransactionManager transactionManager;

    // Access checks are covered elsewhere; here they let every call through.
    @MockitoBean
    private CurrentUserService currentUserService;

    @MockitoBean
    private OrganizationAccessService organizationAccessService;

    private final ExecutorService threads = Executors.newFixedThreadPool(2);
    private Long organizationId;
    private Long propertyId;
    private Long spaceId;
    private Long tenantId;

    @BeforeEach
    void setUp() {
        organizationId = organizationRepository.save(new Organization("Space status lock test")).getId();
        propertyId = propertyRepository.save(
                new Property(organizationId, "Test property", "1 Test Street", "Dublin", null, "Ireland")
        ).getId();
        spaceId = spaceRepository.save(
                new Space(propertyId, "Unit 1", SpaceType.RESIDENTIAL, 1, new BigDecimal("50.00"), SpaceStatus.VACANT)
        ).getId();
        tenantId = tenantRepository.save(
                new Tenant(organizationId, TenantType.INDIVIDUAL, "Test", "Tenant", null, null, null)
        ).getId();
    }

    @AfterEach
    void tearDown() {
        threads.shutdownNow();
        organizationRepository.deleteById(organizationId);
    }

    @Test
    void aStatusChangeWaitsForALeaseBeingWrittenAndThenKeepsTheSpaceOccupied() throws Exception {
        CountDownLatch leaseWritten = new CountDownLatch(1);
        CountDownLatch commitLease = new CountDownLatch(1);
        // As LeaseService.createLease does for a lease starting today: the lease, then its space marked
        // occupied, in one transaction that stays open until the test lets it commit.
        Future<?> lease = threads.submit(() -> new TransactionTemplate(transactionManager).executeWithoutResult(status -> {
            leaseRepository.save(new Lease(organizationId, tenantId, spaceId, TODAY, TODAY.plusYears(1), 100_00L, 0L));
            Space space = spaceRepository.findById(spaceId).orElseThrow();
            space.markOccupied();
            spaceRepository.saveAndFlush(space);
            leaseWritten.countDown();
            await(commitLease);
        }));
        assertTrue(leaseWritten.await(10, SECONDS));

        Future<SpaceResponse> statusChange = threads.submit(() ->
                spaceService.updateSpaceStatus(organizationId, propertyId, spaceId, SpaceStatus.MAINTENANCE));

        // While the lease is uncommitted the status change has to wait, rather than check for leases now,
        // find none, and then overwrite the occupied status once the lease commits.
        assertThrows(TimeoutException.class, () -> statusChange.get(500, MILLISECONDS));
        commitLease.countDown();
        lease.get(10, SECONDS);

        ExecutionException refused = assertThrows(ExecutionException.class, () -> statusChange.get(10, SECONDS));
        assertInstanceOf(BadRequestException.class, refused.getCause());
        assertEquals(SpaceStatus.OCCUPIED, spaceRepository.findById(spaceId).orElseThrow().getStatus());
    }

    private static void await(CountDownLatch latch) {
        try {
            if (!latch.await(10, SECONDS)) {
                throw new IllegalStateException("Timed out waiting for the test");
            }
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException(exception);
        }
    }
}
