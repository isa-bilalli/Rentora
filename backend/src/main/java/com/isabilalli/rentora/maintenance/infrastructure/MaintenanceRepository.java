package com.isabilalli.rentora.maintenance.infrastructure;

import com.isabilalli.rentora.maintenance.api.dto.MaintenanceCount;
import com.isabilalli.rentora.maintenance.domain.MaintenancePriority;
import com.isabilalli.rentora.maintenance.domain.MaintenanceRequest;
import com.isabilalli.rentora.maintenance.domain.MaintenanceStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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

    // A page of the Maintenance page, with the property's and space's names; status and priority are skipped
    // when null. The Pageable sets the order.
    @Query(value = """
        SELECT new com.isabilalli.rentora.maintenance.infrastructure.MaintenanceListRow(m, p.name, s.name)
        FROM MaintenanceRequest m
        JOIN Property p ON p.id = m.propertyId
        LEFT JOIN Space s ON s.id = m.spaceId
        WHERE m.organizationId = :organizationId
          AND (:status IS NULL OR m.status = :status)
          AND (:priority IS NULL OR m.priority = :priority)
        """, countQuery = """
        SELECT COUNT(m)
        FROM MaintenanceRequest m
        JOIN Property p ON p.id = m.propertyId
        LEFT JOIN Space s ON s.id = m.spaceId
        WHERE m.organizationId = :organizationId
          AND (:status IS NULL OR m.status = :status)
          AND (:priority IS NULL OR m.priority = :priority)
        """)
    Page<MaintenanceListRow> findListPage(
            @Param("organizationId") Long organizationId,
            @Param("status") MaintenanceStatus status,
            @Param("priority") MaintenancePriority priority,
            Pageable pageable);

    // How many requests have each status and priority, for the Maintenance page's filters.
    @Query("""
        SELECT new com.isabilalli.rentora.maintenance.api.dto.MaintenanceCount(m.status, m.priority, COUNT(m))
        FROM MaintenanceRequest m
        WHERE m.organizationId = :organizationId
        GROUP BY m.status, m.priority
        """)
    List<MaintenanceCount> countsByStatusAndPriority(@Param("organizationId") Long organizationId);
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