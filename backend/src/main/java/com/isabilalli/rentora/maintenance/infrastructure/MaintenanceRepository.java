package com.isabilalli.rentora.maintenance.infrastructure;

import com.isabilalli.rentora.maintenance.domain.MaintenancePriority;
import com.isabilalli.rentora.maintenance.domain.MaintenanceRequest;
import com.isabilalli.rentora.maintenance.domain.MaintenanceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
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
    @Query(value = """
        SELECT COUNT(m.id)
        FROM maintenance_requests m
        WHERE m.organization_id = :organizationId
          AND CAST(m.reported_at AS date) >= :startDate
          AND CAST(m.reported_at AS date) <= :endDate
          AND (:propertyId IS NULL OR m.property_id = :propertyId)
        """, nativeQuery = true)
    Long countOpenedRequests(@Param("organizationId") Long organizationId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate, @Param("propertyId") Long propertyId);
    @Query(value = """
        SELECT COUNT(m.id)
        FROM maintenance_requests m
        WHERE m.organization_id = :organizationId
          AND CAST(m.resolved_at AS date) >= :startDate
          AND CAST(m.resolved_at AS date) <= :endDate
          AND (:propertyId IS NULL OR m.property_id = :propertyId)
        """, nativeQuery = true)
    Long countResolvedRequests(@Param("organizationId") Long organizationId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate, @Param("propertyId") Long propertyId);
    @Query(value = """
        SELECT COUNT(m.id)
        FROM maintenance_requests m
        WHERE m.organization_id = :organizationId
          AND CAST(m.cancelled_at AS date) >= :startDate
          AND CAST(m.cancelled_at AS date) <= :endDate
          AND (:propertyId IS NULL OR m.property_id = :propertyId)
        """, nativeQuery = true)
    Long countCancelledRequests(@Param("organizationId") Long organizationId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate, @Param("propertyId") Long propertyId);
    @Query(value = """
        SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (m.resolved_at - m.reported_at)) / 3600.0), 0)
        FROM maintenance_requests m
        WHERE m.organization_id = :organizationId
          AND m.resolved_at IS NOT NULL
          AND CAST(m.resolved_at AS date) >= :startDate
          AND CAST(m.resolved_at AS date) <= :endDate
          AND (:propertyId IS NULL OR m.property_id = :propertyId)
        """, nativeQuery = true)
    double averageResolutionHours(@Param("organizationId") Long organizationId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate, @Param("propertyId") Long propertyId);
}