package com.isabilalli.rentora.lease.infrastructure;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.isabilalli.rentora.lease.domain.Lease;
import com.isabilalli.rentora.lease.domain.LeaseStatus;

public interface LeaseRepository extends JpaRepository<Lease, Long> {
    List<Lease> findAllByOrganizationId(Long organizationId);
    
    @Query("""
        SELECT COUNT(l) > 0
        FROM Lease l
        WHERE l.spaceId = :spaceId
        AND l.status = com.isabilalli.rentora.lease.domain.LeaseStatus.ACTIVE
        AND l.startDate <= :endDate
        AND l.endDate >= :startDate
        AND (:excludeLeaseId IS NULL OR l.id <> :excludeLeaseId)
    """)
    boolean existsOverlappingActiveLease(@Param("spaceId") Long spaceId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate, @Param("excludeLeaseId") Long excludeLeaseId);
    Optional<Lease> findFirstBySpaceIdAndStatusAndIdNotOrderByStartDateAsc(Long spaceId, LeaseStatus status, Long leaseId);
    List<Lease> findAllByStatusAndEndDateBefore(LeaseStatus status, LocalDate endDate);
    @Query("""
            SELECT COUNT(l)
            FROM Lease l
            WHERE l.organizationId = :organizationId
                AND l.status = :status
            """)
    Long countByOrganizationIdAndStatus(@Param("organizationId") Long organizationId, @Param("status") LeaseStatus status);
    @Query("""
            SELECT COUNT(l)
            FROM Lease l
            WHERE l.organizationId = :organizationId
                AND l.status = :status
                AND l.endDate >= :startDate
                AND l.endDate <= :endDate
            """)
    Long countExpiringBetween(@Param("organizationId") Long organizationId, @Param("status") LeaseStatus status, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
}