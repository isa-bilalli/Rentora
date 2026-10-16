
package com.isabilalli.rentora.lease.application;

import java.time.LocalDate;

import org.springframework.stereotype.Service;

import com.isabilalli.rentora.lease.api.LeaseStatusAccess;
import com.isabilalli.rentora.lease.domain.LeaseStatus;
import com.isabilalli.rentora.lease.infrastructure.LeaseRepository;

@Service
public class LeaseStatusQueryService implements LeaseStatusAccess {

    private final LeaseRepository leaseRepository;

    public LeaseStatusQueryService(LeaseRepository leaseRepository) {
        this.leaseRepository = leaseRepository;
    }

    @Override
    public boolean hasCurrentActiveLease(
            Long organizationId,
            Long spaceId,
            LocalDate today
    ) {
        return leaseRepository
                .existsByOrganizationIdAndSpaceIdAndStatusAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
                        organizationId,
                        spaceId,
                        LeaseStatus.ACTIVE,
                        today,
                        today
                );
    }

    @Override
    public boolean hasUpcomingActiveLease(
            Long organizationId,
            Long spaceId,
            LocalDate today
    ) {
        return leaseRepository
                .existsByOrganizationIdAndSpaceIdAndStatusAndStartDateGreaterThan(
                        organizationId,
                        spaceId,
                        LeaseStatus.ACTIVE,
                        today
                );
    }

    @Override
    public boolean hasLeasesForTenant(Long tenantId) {
        return leaseRepository.existsByTenantId(tenantId);
    }

    @Override
    public boolean hasLeasesForSpace(Long spaceId) {
        return leaseRepository.existsBySpaceId(spaceId);
    }
}
