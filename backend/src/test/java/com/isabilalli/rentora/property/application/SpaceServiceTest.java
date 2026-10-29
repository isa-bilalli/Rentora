package com.isabilalli.rentora.property.application;

import com.isabilalli.rentora.auth.application.CurrentUserService;
import com.isabilalli.rentora.auth.infrastructure.security.AuthenticatedUser;
import com.isabilalli.rentora.lease.api.LeaseStatusAccess;
import com.isabilalli.rentora.organization.application.OrganizationAccessService;
import com.isabilalli.rentora.property.api.dto.SpaceResponse;
import com.isabilalli.rentora.property.domain.Property;
import com.isabilalli.rentora.property.domain.Space;
import com.isabilalli.rentora.property.domain.SpaceStatus;
import com.isabilalli.rentora.property.domain.SpaceType;
import com.isabilalli.rentora.property.infrastructure.PropertyRepository;
import com.isabilalli.rentora.property.infrastructure.SpaceRepository;
import com.isabilalli.rentora.shared.api.BadRequestException;
import com.isabilalli.rentora.shared.api.ConflictException;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SpaceServiceTest {

    private static final Long ORGANIZATION_ID = 1L;
    private static final Long PROPERTY_ID = 10L;
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

    @Mock
    private AuthenticatedUser authenticatedUser;

    @Mock
    private Property property;

    private Space space;
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

        space = new Space(
                PROPERTY_ID,
                "Apartment 1",
                SpaceType.RESIDENTIAL,
                2,
                new BigDecimal("75.50"),
                SpaceStatus.VACANT
        );

        when(currentUserService.getCurrentUser())
                .thenReturn(authenticatedUser);

        when(propertyRepository.findById(PROPERTY_ID))
                .thenReturn(Optional.of(property));

        when(property.getOrganizationId()).thenReturn(ORGANIZATION_ID);
        when(property.getOrganizationId()).thenReturn(ORGANIZATION_ID);

        // updateSpace and updateSpaceStatus read the space locked, the rest read it plainly; each test uses one.
        lenient().when(spaceRepository.findById(SPACE_ID))
                .thenReturn(Optional.of(space));
        lenient().when(spaceRepository.findByIdForUpdate(SPACE_ID))
                .thenReturn(Optional.of(space));
    }

    @Test
    void rejectsDeletingSpaceWithLeases() {
        when(leaseStatusAccess.hasLeasesForSpace(SPACE_ID)).thenReturn(true);

        assertThrows(
                ConflictException.class,
                () -> spaceService.deleteSpace(ORGANIZATION_ID, PROPERTY_ID, SPACE_ID)
        );

        verify(spaceRepository, never()).delete(any(Space.class));
    }

    @Test
    void deletesSpaceWithoutLeases() {
        when(leaseStatusAccess.hasLeasesForSpace(SPACE_ID)).thenReturn(false);

        spaceService.deleteSpace(ORGANIZATION_ID, PROPERTY_ID, SPACE_ID);

        verify(spaceRepository).delete(space);
    }

    @Test
    void getsSpaceByIdWithItsProperty() {
        SpaceResponse response = spaceService.getSpace(ORGANIZATION_ID, SPACE_ID);

        assertEquals(PROPERTY_ID, response.propertyId());
        assertEquals("Apartment 1", response.name());
        verify(organizationAccessService).requireAccess(authenticatedUser, ORGANIZATION_ID);
    }

    @Test
    void rejectsGettingSpaceFromAnotherOrganization() {
        assertThrows(
                AccessDeniedException.class,
                () -> spaceService.getSpace(2L, SPACE_ID)
        );
    }

    @Test
    void rejectsVacantWhenCurrentActiveLeaseExists() {
        stubLeaseStatus(true, false);

        assertThrows(
                BadRequestException.class,
                () -> spaceService.updateSpaceStatus(
                        ORGANIZATION_ID,
                        PROPERTY_ID,
                        SPACE_ID,
                        SpaceStatus.VACANT
                )
        );

        assertEquals(SpaceStatus.VACANT, space.getStatus());
        verify(spaceRepository, never()).save(any(Space.class));
    }

    @Test
    void allowsOccupiedWhenCurrentActiveLeaseExists() {
        stubLeaseStatus(true, false);
        stubSavingSpace();

        SpaceResponse response = spaceService.updateSpaceStatus(
                ORGANIZATION_ID,
                PROPERTY_ID,
                SPACE_ID,
                SpaceStatus.OCCUPIED
        );

        assertEquals(SpaceStatus.OCCUPIED, space.getStatus());
        assertEquals(SpaceStatus.OCCUPIED, response.status());
        verify(spaceRepository).save(space);
    }

    @Test
    void rejectsVacantWhenUpcomingActiveLeaseExists() {
        stubLeaseStatus(false, true);

        assertThrows(
                BadRequestException.class,
                () -> spaceService.updateSpaceStatus(
                        ORGANIZATION_ID,
                        PROPERTY_ID,
                        SPACE_ID,
                        SpaceStatus.VACANT
                )
        );

        assertEquals(SpaceStatus.VACANT, space.getStatus());
        verify(spaceRepository, never()).save(any(Space.class));
    }

    @Test
    void allowsReservedWhenUpcomingActiveLeaseExists() {
        stubLeaseStatus(false, true);
        stubSavingSpace();

        SpaceResponse response = spaceService.updateSpaceStatus(
                ORGANIZATION_ID,
                PROPERTY_ID,
                SPACE_ID,
                SpaceStatus.RESERVED
        );

        assertEquals(SpaceStatus.RESERVED, space.getStatus());
        assertEquals(SpaceStatus.RESERVED, response.status());
        verify(spaceRepository).save(space);
    }

    @Test
    void allowsMaintenanceWhenNoCurrentOrUpcomingLeaseExists() {
        stubLeaseStatus(false, false);
        stubSavingSpace();

        SpaceResponse response = spaceService.updateSpaceStatus(
                ORGANIZATION_ID,
                PROPERTY_ID,
                SPACE_ID,
                SpaceStatus.MAINTENANCE
        );

        assertEquals(SpaceStatus.MAINTENANCE, space.getStatus());
        assertEquals(SpaceStatus.MAINTENANCE, response.status());
        verify(spaceRepository).save(space);
    }

    @Test
    void rejectsMaintenanceWhenCurrentActiveLeaseExists() {
        stubLeaseStatus(true, false);

        assertThrows(
                BadRequestException.class,
                () -> spaceService.updateSpaceStatus(
                        ORGANIZATION_ID,
                        PROPERTY_ID,
                        SPACE_ID,
                        SpaceStatus.MAINTENANCE
                )
        );

        assertEquals(SpaceStatus.VACANT, space.getStatus());
        verify(spaceRepository, never()).save(any(Space.class));
    }

    private void stubLeaseStatus(
            boolean hasCurrentLease,
            boolean hasUpcomingLease
    ) {
        LocalDate today = LocalDate.now();

        when(leaseStatusAccess.hasCurrentActiveLease(
                ORGANIZATION_ID,
                SPACE_ID,
                today
        )).thenReturn(hasCurrentLease);

        when(leaseStatusAccess.hasUpcomingActiveLease(
                ORGANIZATION_ID,
                SPACE_ID,
                today
        )).thenReturn(hasUpcomingLease);
    }

    private void stubSavingSpace() {
        when(spaceRepository.save(any(Space.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
    }
}
