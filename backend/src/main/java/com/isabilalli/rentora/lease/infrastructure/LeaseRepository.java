package com.isabilalli.rentora.lease.infrastructure;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.isabilalli.rentora.lease.api.dto.CurrentSpaceRentSummary;
import com.isabilalli.rentora.lease.domain.Lease;
import com.isabilalli.rentora.lease.domain.LeaseStatus;

public interface LeaseRepository extends JpaRepository<Lease, Long> {
    List<Lease> findAllByOrganizationId(Long organizationId);
    boolean existsByTenantId(Long tenantId);
    boolean existsBySpaceId(Long spaceId);

    // One property's leases, found through their spaces, in every status; earliest start first.
    @Query(value = """
        SELECT l.*
        FROM leases l
        JOIN spaces s ON s.id = l.space_id
        WHERE l.organization_id = :organizationId
          AND s.property_id = :propertyId
        ORDER BY l.start_date, l.id
        """, nativeQuery = true)
    List<Lease> findAllByOrganizationIdAndPropertyId(@Param("organizationId") Long organizationId, @Param("propertyId") Long propertyId);

    // A page of the Leases page, with the tenant, property and space names. status and pattern are skipped when
    // null; pattern is a lowercase LIKE matched against the tenant's name, the property and the space.
    // onlyUpcoming and onlyStarted keep leases starting after today, or by today: how UPCOMING and ACTIVE differ.
    // (Flags rather than nullable dates, since PostgreSQL can't tell the type of a null date parameter.)
    // The Pageable sets the order.
    @Query(value = """
        SELECT new com.isabilalli.rentora.lease.infrastructure.LeaseListRow(
                   l, t.firstName, t.lastName, t.companyName, p.id, p.name, s.name)
        FROM Lease l
        JOIN Tenant t ON t.id = l.tenantId
        JOIN Space s ON s.id = l.spaceId
        JOIN Property p ON p.id = s.propertyId
        WHERE l.organizationId = :organizationId
          AND (:status IS NULL OR l.status = :status)
          AND (:onlyUpcoming = false OR l.startDate > :today)
          AND (:onlyStarted = false OR l.startDate <= :today)
          AND (:pattern IS NULL
               OR LOWER(CONCAT(COALESCE(t.firstName, ''), ' ', COALESCE(t.lastName, ''))) LIKE :pattern ESCAPE '!'
               OR LOWER(COALESCE(t.companyName, '')) LIKE :pattern ESCAPE '!'
               OR LOWER(p.name) LIKE :pattern ESCAPE '!'
               OR LOWER(s.name) LIKE :pattern ESCAPE '!')
        """, countQuery = """
        SELECT COUNT(l)
        FROM Lease l
        JOIN Tenant t ON t.id = l.tenantId
        JOIN Space s ON s.id = l.spaceId
        JOIN Property p ON p.id = s.propertyId
        WHERE l.organizationId = :organizationId
          AND (:status IS NULL OR l.status = :status)
          AND (:onlyUpcoming = false OR l.startDate > :today)
          AND (:onlyStarted = false OR l.startDate <= :today)
          AND (:pattern IS NULL
               OR LOWER(CONCAT(COALESCE(t.firstName, ''), ' ', COALESCE(t.lastName, ''))) LIKE :pattern ESCAPE '!'
               OR LOWER(COALESCE(t.companyName, '')) LIKE :pattern ESCAPE '!'
               OR LOWER(p.name) LIKE :pattern ESCAPE '!'
               OR LOWER(s.name) LIKE :pattern ESCAPE '!')
        """)
    Page<LeaseListRow> findListPage(
            @Param("organizationId") Long organizationId,
            @Param("status") LeaseStatus status,
            @Param("today") LocalDate today,
            @Param("onlyUpcoming") boolean onlyUpcoming,
            @Param("onlyStarted") boolean onlyStarted,
            @Param("pattern") String pattern,
            Pageable pageable);

    interface DisplayStatusCount {
        String getBucket();
        long getLeases();
    }

    // How many leases each status of the Leases page has; an active lease starting after today counts as UPCOMING.
    @Query(value = """
        SELECT CASE WHEN l.status = 'ACTIVE' AND l.start_date > :today THEN 'UPCOMING' ELSE l.status END AS bucket,
               COUNT(*) AS leases
        FROM leases l
        WHERE l.organization_id = :organizationId
        GROUP BY 1
        """, nativeQuery = true)
    List<DisplayStatusCount> countsByDisplayStatus(@Param("organizationId") Long organizationId, @Param("today") LocalDate today);

    // One tenant's leases, in every status; earliest start first.
    List<Lease> findAllByOrganizationIdAndTenantIdOrderByStartDateAscIdAsc(Long organizationId, Long tenantId);
    
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
    List<Lease> findAllByStatusAndStartDateLessThanEqualAndEndDateGreaterThanEqual(LeaseStatus status, LocalDate startDate, LocalDate endDate);
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
    @Query(value = """
    SELECT COALESCE(
        SUM(LEAST(l.end_date, :endDate) - GREATEST(l.start_date, :startDate) + 1), 0)
        FROM leases l
        JOIN spaces s ON s.id = l.space_id
        WHERE l.organization_id = :organizationId
          AND l.status <> 'CANCELLED'
          AND l.start_date <= :endDate
          AND l.end_date >= :startDate
          AND (:propertyId IS NULL OR s.property_id = :propertyId)
        """, nativeQuery = true)
    Long sumOccupiedSpaceDays( @Param("organizationId") Long organizationId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate, @Param("propertyId") Long propertyId);
    @Query(value = """
        SELECT COUNT(l.id)
        FROM leases l
        JOIN spaces s ON s.id = l.space_id
        WHERE l.organization_id = :organizationId
          AND l.status <> 'CANCELLED'
          AND l.start_date >= :startDate
          AND l.start_date <= :endDate
          AND (:propertyId IS NULL OR s.property_id = :propertyId)
        """, nativeQuery = true)
    Long countStartedLeases(@Param("organizationId") Long organizationId, @Param("startDate") LocalDate startDate,@Param("endDate") LocalDate endDate, @Param("propertyId") Long propertyId);
    @Query(value = """
        SELECT COUNT(l.id)
        FROM leases l
        JOIN spaces s ON s.id = l.space_id
        WHERE l.organization_id = :organizationId
          AND l.status <> 'CANCELLED'
          AND l.end_date >= :startDate
          AND l.end_date <= :endDate
          AND (:propertyId IS NULL OR s.property_id = :propertyId)
        """, nativeQuery = true)
    Long countEndedLeases(@Param("organizationId") Long organizationId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate, @Param("propertyId") Long propertyId);
    @Query(value = """
        SELECT COUNT(l.id)
        FROM leases l
        JOIN spaces s ON s.id = l.space_id
        WHERE l.organization_id = :organizationId
          AND l.status <> 'CANCELLED'
          AND l.renewed_from_lease_id IS NOT NULL
          AND l.start_date >= :startDate
          AND l.start_date <= :endDate
          AND (:propertyId IS NULL OR s.property_id = :propertyId)
    """, nativeQuery = true)
    Long countRenewedLeases(@Param("organizationId") Long organizationId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate, @Param("propertyId") Long propertyId);
    @Query(value = """
        SELECT COUNT(l.id)
        FROM leases l
        JOIN spaces s ON s.id = l.space_id
        WHERE l.organization_id = :organizationId
          AND l.status = 'ACTIVE'
          AND l.end_date >= :startDate
          AND l.end_date <= :endDate
          AND (:propertyId IS NULL OR s.property_id = :propertyId)
    """, nativeQuery = true)
    Long countLeasesExpiringBetween(@Param("organizationId") Long organizationId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate, @Param("propertyId") Long propertyId);
    @Query("""
    SELECT new com.isabilalli.rentora.lease.api.dto.CurrentSpaceRentSummary(l.spaceId,SUM(l.monthlyRentCents))
        FROM Lease l
        WHERE l.organizationId = :organizationId
          AND l.status = :status
          AND l.startDate <= :today
          AND l.endDate >= :today
        GROUP BY l.spaceId
    """)
    List<CurrentSpaceRentSummary> sumCurrentMonthlyRentBySpace(@Param("organizationId") Long organizationId, @Param("status") LeaseStatus status, @Param("today") LocalDate today);
    boolean existsByOrganizationIdAndSpaceIdAndStatusAndStartDateLessThanEqualAndEndDateGreaterThanEqual(Long organizationId, Long spaceId, LeaseStatus status, LocalDate startDate, LocalDate endDate);
    boolean existsByOrganizationIdAndSpaceIdAndStatusAndStartDateGreaterThan(Long organizationId, Long spaceId, LeaseStatus status, LocalDate startDate);
}