package com.isabilalli.rentora.lease.application;

import com.isabilalli.rentora.auth.application.CurrentUserService;
import com.isabilalli.rentora.lease.api.dto.CreateLeaseRequest;
import com.isabilalli.rentora.lease.domain.Lease;
import com.isabilalli.rentora.lease.domain.LeaseStatus;
import com.isabilalli.rentora.lease.infrastructure.LeaseRepository;
import com.isabilalli.rentora.organization.application.OrganizationAccessService;
import com.isabilalli.rentora.organization.domain.OrganizationRole;
import com.isabilalli.rentora.property.api.SpaceAccess;
import com.isabilalli.rentora.property.domain.SpaceStatus;
import com.isabilalli.rentora.tenant.api.TenantAccess;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.access.AccessDeniedException;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LeaseServiceTest {

    private static final Long ORGANIZATION_ID = 1L;
    private static final Long SPACE_ID = 100L;
    private static final Long LEASE_ID = 7L;

    @Mock
    private LeaseRepository leaseRepository;

    @Mock
    private TenantAccess tenantAccess;

    @Mock
    private SpaceAccess spaceAccess;

    @Mock
    private CurrentUserService currentUserService;

    @Mock
    private OrganizationAccessService organizationAccessService;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    private LeaseService leaseService;

    @BeforeEach
    void setUp() {
        leaseService = new LeaseService(leaseRepository, tenantAccess, spaceAccess, currentUserService, organizationAccessService, eventPublisher, Clock.systemDefaultZone());
    }

    // Just after midnight in the app's time zone, a server on UTC still has yesterday's date. A lease starting on
    // the zone's today has started, so its space is occupied now rather than reserved for later. (Far in the
    // future, so the server's real date can't pass for the zone's.)
    @Test
    void aLeaseStartingTodayInTheAppsTimeZoneOccupiesItsSpace() {
        Clock justAfterMidnightInBelgrade = Clock.fixed(Instant.parse("2099-12-31T23:30:00Z"), ZoneId.of("Europe/Belgrade"));
        LocalDate belgradeToday = LocalDate.of(2100, 1, 1);
        LeaseService service = new LeaseService(leaseRepository, tenantAccess, spaceAccess, currentUserService,
                organizationAccessService, eventPublisher, justAfterMidnightInBelgrade);
        stubSaving();

        service.createLease(ORGANIZATION_ID, new CreateLeaseRequest(50L, SPACE_ID, belgradeToday, belgradeToday.plusYears(1), 100_000L, 0L));

        verify(spaceAccess).markOccupied(SPACE_ID);
        verify(spaceAccess, never()).prepareForFutureLease(SPACE_ID);
    }

    // The space is let today and the cancelled lease was due to start later: it stays occupied.
    @Test
    void cancellingAFutureLeaseKeepsTheCurrentTenantsSpaceOccupied() {
        LocalDate today = LocalDate.now();
        Lease futureLease = lease(today.plusMonths(2), today.plusMonths(14));
        Lease currentLease = lease(today.minusMonths(3), today.plusMonths(1));
        when(leaseRepository.findById(LEASE_ID)).thenReturn(Optional.of(futureLease));
        stubSaving();
        when(leaseRepository.findFirstBySpaceIdAndStatusAndIdNotOrderByStartDateAsc(eq(SPACE_ID), eq(LeaseStatus.ACTIVE), any()))
                .thenReturn(Optional.of(currentLease));

        leaseService.cancelLease(ORGANIZATION_ID, LEASE_ID);

        assertEquals(LeaseStatus.CANCELLED, futureLease.getStatus());
        verify(spaceAccess).applyLeaseStatus(SPACE_ID, SpaceStatus.OCCUPIED);
    }

    @Test
    void cancellingTheOnlyLeaseLeavesTheSpaceVacant() {
        LocalDate today = LocalDate.now();
        Lease onlyLease = lease(today.plusMonths(1), today.plusMonths(13));
        when(leaseRepository.findById(LEASE_ID)).thenReturn(Optional.of(onlyLease));
        stubSaving();
        when(leaseRepository.findFirstBySpaceIdAndStatusAndIdNotOrderByStartDateAsc(eq(SPACE_ID), eq(LeaseStatus.ACTIVE), any()))
                .thenReturn(Optional.empty());

        leaseService.cancelLease(ORGANIZATION_ID, LEASE_ID);

        verify(spaceAccess).applyLeaseStatus(SPACE_ID, SpaceStatus.VACANT);
    }

    // Cancelling needs a manager or owner (docs/ROLES.md); a member is stopped before anything changes.
    @Test
    void memberCannotCancelALease() {
        doThrow(new AccessDeniedException("Your role in this organization does not allow this action"))
                .when(organizationAccessService).requireRole(any(), eq(ORGANIZATION_ID), eq(OrganizationRole.MANAGER));

        assertThrows(AccessDeniedException.class, () -> leaseService.cancelLease(ORGANIZATION_ID, LEASE_ID));

        verifyNoInteractions(leaseRepository, spaceAccess, eventPublisher);
    }

    private void stubSaving() {
        when(leaseRepository.save(any(Lease.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    private Lease lease(LocalDate startDate, LocalDate endDate) {
        return new Lease(ORGANIZATION_ID, 50L, SPACE_ID, startDate, endDate, 100_000L, 0L);
    }
}
