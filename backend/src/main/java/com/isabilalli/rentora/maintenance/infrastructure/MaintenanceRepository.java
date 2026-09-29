package com.isabilalli.rentora.maintenance.infrastructure;

import com.isabilalli.rentora.maintenance.domain.MaintenancePriority;
import com.isabilalli.rentora.maintenance.domain.MaintenanceRequest;
import com.isabilalli.rentora.maintenance.domain.MaintenanceStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MaintenanceRepository
        extends JpaRepository<MaintenanceRequest, Long> {

    List<MaintenanceRequest> findAllByOrganizationId(
            Long organizationId
    );

    List<MaintenanceRequest> findAllByPropertyId(
            Long propertyId
    );

    List<MaintenanceRequest> findAllBySpaceId(
            Long spaceId
    );

    List<MaintenanceRequest> findAllByOrganizationIdAndStatus(
            Long organizationId,
            MaintenanceStatus status
    );

    List<MaintenanceRequest> findAllByOrganizationIdAndPriority(
            Long organizationId,
            MaintenancePriority priority
    );
}