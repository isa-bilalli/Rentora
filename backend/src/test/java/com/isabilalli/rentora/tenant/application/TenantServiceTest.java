package com.isabilalli.rentora.tenant.application;

import com.isabilalli.rentora.auth.application.CurrentUserService;
import com.isabilalli.rentora.auth.infrastructure.security.AuthenticatedUser;
import com.isabilalli.rentora.lease.api.LeaseStatusAccess;
import com.isabilalli.rentora.organization.application.OrganizationAccessService;
import com.isabilalli.rentora.shared.api.ConflictException;
import com.isabilalli.rentora.tenant.domain.Tenant;
import com.isabilalli.rentora.tenant.infrastructure.TenantRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TenantServiceTest {

    private static final Long ORGANIZATION_ID = 1L;
    private static final Long TENANT_ID = 20L;

    @Mock
    private TenantRepository tenantRepository;

    @Mock
    private CurrentUserService currentUserService;

    @Mock
    private OrganizationAccessService organizationAccessService;

    @Mock
    private LeaseStatusAccess leaseStatusAccess;

    @Mock
    private AuthenticatedUser authenticatedUser;

    @Mock
    private Tenant tenant;

    private TenantService tenantService;

    @BeforeEach
    void setUp() {
        tenantService = new TenantService(
                tenantRepository,
                currentUserService,
                organizationAccessService,
                leaseStatusAccess
        );

        when(currentUserService.getCurrentUser()).thenReturn(authenticatedUser);
        when(tenantRepository.findById(TENANT_ID)).thenReturn(Optional.of(tenant));
        when(tenant.getOrganizationId()).thenReturn(ORGANIZATION_ID);
    }

    @Test
    void rejectsDeletingTenantWithLeases() {
        when(leaseStatusAccess.hasLeasesForTenant(TENANT_ID)).thenReturn(true);

        assertThrows(
                ConflictException.class,
                () -> tenantService.deleteTenant(ORGANIZATION_ID, TENANT_ID)
        );

        verify(tenantRepository, never()).delete(any(Tenant.class));
    }

    @Test
    void deletesTenantWithoutLeases() {
        when(leaseStatusAccess.hasLeasesForTenant(TENANT_ID)).thenReturn(false);

        tenantService.deleteTenant(ORGANIZATION_ID, TENANT_ID);

        verify(tenantRepository).delete(tenant);
    }
}
