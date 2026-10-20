package com.isabilalli.rentora.property.application;

import com.isabilalli.rentora.auth.application.CurrentUserService;
import com.isabilalli.rentora.lease.api.LeaseStatusAccess;
import com.isabilalli.rentora.organization.application.OrganizationAccessService;
import com.isabilalli.rentora.property.domain.Space;
import com.isabilalli.rentora.property.domain.SpaceStatus;
import com.isabilalli.rentora.property.domain.SpaceType;
import com.isabilalli.rentora.property.infrastructure.PropertyRepository;
import com.isabilalli.rentora.property.infrastructure.SpaceRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

// Lease events move spaces between statuses: the nightly job calls occupyForStartedLease for every lease
// covering today, and ending or cancelling a lease calls applyLeaseStatus. Both must be safe to repeat.
@ExtendWith(MockitoExtension.class)
class SpaceOccupancyTest {

    private static final Long SPACE_ID = 100L;

    @Mock
    private SpaceRepository spaceRepository;

    @Mock
    private PropertyRepository propertyRepository;

    @Mock
    private CurrentUserService currentUserService;

    @Mock
    private OrganizationAccessService organizationAccessService;

    @Mock
    private LeaseStatusAccess leaseStatusAccess;

    private SpaceService spaceService;

    @BeforeEach
    void setUp() {
        spaceService = new SpaceService(
                spaceRepository,
                propertyRepository,
                currentUserService,
                organizationAccessService,
                leaseStatusAccess
        );
    }

    @Test
    void reservedSpaceBecomesOccupiedWhenLeaseStarts() {
        Space space = spaceWithStatus(SpaceStatus.RESERVED);

        spaceService.occupyForStartedLease(SPACE_ID);

        assertEquals(SpaceStatus.OCCUPIED, space.getStatus());
        verify(spaceRepository).save(space);
    }

    @Test
    void occupiedSpaceIsLeftAlone() {
        Space space = spaceWithStatus(SpaceStatus.OCCUPIED);

        spaceService.occupyForStartedLease(SPACE_ID);

        assertEquals(SpaceStatus.OCCUPIED, space.getStatus());
        verify(spaceRepository, never()).save(any(Space.class));
    }

    @Test
    void spaceUnderMaintenanceIsLeftAlone() {
        Space space = spaceWithStatus(SpaceStatus.MAINTENANCE);

        spaceService.occupyForStartedLease(SPACE_ID);

        assertEquals(SpaceStatus.MAINTENANCE, space.getStatus());
        verify(spaceRepository, never()).save(any(Space.class));
    }

    @Test
    void spaceWhoseLastLeaseEndsBecomesVacant() {
        Space space = spaceWithStatus(SpaceStatus.OCCUPIED);

        spaceService.applyLeaseStatus(SPACE_ID, SpaceStatus.VACANT);

        assertEquals(SpaceStatus.VACANT, space.getStatus());
        verify(spaceRepository).save(space);
    }

    @Test
    void spaceWithOnlyAFutureLeaseLeftBecomesReserved() {
        Space space = spaceWithStatus(SpaceStatus.OCCUPIED);

        spaceService.applyLeaseStatus(SPACE_ID, SpaceStatus.RESERVED);

        assertEquals(SpaceStatus.RESERVED, space.getStatus());
        verify(spaceRepository).save(space);
    }

    // Used to throw "Space is already vacant".
    @Test
    void vacantSpaceStaysVacantWithoutAnError() {
        Space space = spaceWithStatus(SpaceStatus.VACANT);

        spaceService.applyLeaseStatus(SPACE_ID, SpaceStatus.VACANT);

        assertEquals(SpaceStatus.VACANT, space.getStatus());
        verify(spaceRepository, never()).save(any(Space.class));
    }

    // Used to throw "Space is not available for occupancy", e.g. when cancelling a future lease on a let space.
    @Test
    void occupiedSpaceStaysOccupiedWithoutAnError() {
        Space space = spaceWithStatus(SpaceStatus.OCCUPIED);

        spaceService.applyLeaseStatus(SPACE_ID, SpaceStatus.OCCUPIED);

        assertEquals(SpaceStatus.OCCUPIED, space.getStatus());
        verify(spaceRepository, never()).save(any(Space.class));
    }

    @Test
    void reservedSpaceStaysReservedWithoutAnError() {
        Space space = spaceWithStatus(SpaceStatus.RESERVED);

        spaceService.applyLeaseStatus(SPACE_ID, SpaceStatus.RESERVED);

        assertEquals(SpaceStatus.RESERVED, space.getStatus());
        verify(spaceRepository, never()).save(any(Space.class));
    }

    @Test
    void endingALeaseDoesNotTakeASpaceOutOfMaintenance() {
        Space space = spaceWithStatus(SpaceStatus.MAINTENANCE);

        spaceService.applyLeaseStatus(SPACE_ID, SpaceStatus.VACANT);

        assertEquals(SpaceStatus.MAINTENANCE, space.getStatus());
        verify(spaceRepository, never()).save(any(Space.class));
    }

    private Space spaceWithStatus(SpaceStatus status) {
        Space space = new Space(10L, "Unit 1", SpaceType.RESIDENTIAL, 1, new BigDecimal("50.00"), status);
        when(spaceRepository.findById(SPACE_ID)).thenReturn(Optional.of(space));
        return space;
    }
}
