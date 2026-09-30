package com.isabilalli.rentora.maintenance.infrastructure;

import com.isabilalli.rentora.maintenance.domain.MaintenancePriority;
import com.isabilalli.rentora.maintenance.domain.MaintenanceRequest;
import com.isabilalli.rentora.maintenance.domain.MaintenanceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface MaintenanceRepository extends JpaRepository<MaintenanceRequest, Long> {
    List<MaintenanceRequest> findAllByOrganizationId(Long organizationId);
    List<MaintenanceRequest> findAllByPropertyId(Long propertyId);
    List<MaintenanceRequest> findAllBySpaceId(Long spaceId);
    List<MaintenanceRequest> findAllByOrganizationIdAndStatus(Long organizationId, MaintenanceStatus status);
    List<MaintenanceRequest> findAllByOrganizationIdAndPriority(Long organizationId, MaintenancePriority priority);
    @Query("""
            SELECT COUNT(m)
            FROM MaintenanceRequest m
            WHERE m.organizationId = :organizationId
                AND m.status IN :statuses
            """)
    Long countByOrganizationIdAndStatuses(@Param("organizationId") Long organizationId, @Param("statuses") Collection<MaintenanceStatus> statuses);
}