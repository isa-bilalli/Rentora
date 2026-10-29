package com.isabilalli.rentora.payment.infrastructure;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.isabilalli.rentora.payment.domain.Payment;
import com.isabilalli.rentora.payment.domain.PaymentStatus;

public interface PaymentRepository extends JpaRepository<Payment, Long>{
    List<Payment> findAllByOrganizationId(Long organizationId);
    List<Payment> findAllByLeaseId(Long leaseId);
    List<Payment> findAllByLeaseIdAndStatus(Long leaseId, PaymentStatus status);
    List<Payment> findAllByLeaseIdAndStatusAndDueDateAfter(Long leaseId, PaymentStatus status, LocalDate date);
    List<Payment> findAllByOrganizationIdAndStatusAndDueDateBefore(Long organizationId, PaymentStatus status, LocalDate date);
    List<Payment> findAllByOrganizationIdAndStatus(Long organizationId, PaymentStatus status);

    // One property's payments, found through their leases' spaces, in every status; earliest due first.
    @Query(value = """
        SELECT p.*
        FROM payments p
        JOIN leases l ON l.id = p.lease_id
        JOIN spaces s ON s.id = l.space_id
        WHERE p.organization_id = :organizationId
          AND s.property_id = :propertyId
        ORDER BY p.due_date, p.id
        """, nativeQuery = true)
    List<Payment> findAllByOrganizationIdAndPropertyId(@Param("organizationId") Long organizationId, @Param("propertyId") Long propertyId);

    // One tenant's payments, found through their leases, in every status; earliest due first.
    @Query(value = """
        SELECT p.*
        FROM payments p
        JOIN leases l ON l.id = p.lease_id
        WHERE p.organization_id = :organizationId
          AND l.tenant_id = :tenantId
        ORDER BY p.due_date, p.id
        """, nativeQuery = true)
    List<Payment> findAllByOrganizationIdAndTenantId(@Param("organizationId") Long organizationId, @Param("tenantId") Long tenantId);

    // A page of a Payments tab, with the names of each payment's tenant, property and space. onlyOverdue and
    // onlyUpcoming keep payments due before today, or from today on: how the OVERDUE and PENDING tabs split
    // pending payments. The Pageable sets the order.
    @Query(value = """
        SELECT new com.isabilalli.rentora.payment.infrastructure.PaymentListRow(
                   p, t.id, t.firstName, t.lastName, t.companyName, pr.name, s.name)
        FROM Payment p
        JOIN Lease l ON l.id = p.leaseId
        JOIN Tenant t ON t.id = l.tenantId
        JOIN Space s ON s.id = l.spaceId
        JOIN Property pr ON pr.id = s.propertyId
        WHERE p.organizationId = :organizationId
          AND p.status = :status
          AND (:onlyOverdue = false OR p.dueDate < :today)
          AND (:onlyUpcoming = false OR p.dueDate >= :today)
        """, countQuery = """
        SELECT COUNT(p)
        FROM Payment p
        JOIN Lease l ON l.id = p.leaseId
        JOIN Tenant t ON t.id = l.tenantId
        JOIN Space s ON s.id = l.spaceId
        JOIN Property pr ON pr.id = s.propertyId
        WHERE p.organizationId = :organizationId
          AND p.status = :status
          AND (:onlyOverdue = false OR p.dueDate < :today)
          AND (:onlyUpcoming = false OR p.dueDate >= :today)
        """)
    Page<PaymentListRow> findListPage(
            @Param("organizationId") Long organizationId,
            @Param("status") PaymentStatus status,
            @Param("today") LocalDate today,
            @Param("onlyOverdue") boolean onlyOverdue,
            @Param("onlyUpcoming") boolean onlyUpcoming,
            Pageable pageable);

    interface DisplayStatusTotal {
        String getBucket();
        long getPayments();
        long getCents();
    }

    // Count and sum per Payments tab, with pending payments due before today counted as OVERDUE.
    @Query(value = """
        SELECT CASE WHEN p.status = 'PENDING' AND p.due_date < :today THEN 'OVERDUE' ELSE p.status END AS bucket,
               COUNT(*) AS payments,
               CAST(COALESCE(SUM(p.amount_cents), 0) AS BIGINT) AS cents
        FROM payments p
        WHERE p.organization_id = :organizationId
        GROUP BY 1
        """, nativeQuery = true)
    List<DisplayStatusTotal> totalsByDisplayStatus(@Param("organizationId") Long organizationId, @Param("today") LocalDate today);
    @Query(value = """
        SELECT COALESCE(SUM(p.amount_cents), 0)
        FROM payments p
        JOIN leases l ON l.id = p.lease_id
        JOIN spaces s ON s.id = l.space_id
        WHERE p.organization_id = :organizationId
          AND p.due_date >= :startDate
          AND p.due_date <= :endDate
          AND p.status <> :voidedStatus
          AND (:propertyId IS NULL OR s.property_id = :propertyId)
        """, nativeQuery = true)
    Long sumExpectedRent(@Param("organizationId") Long organizationId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate, @Param("voidedStatus") String voidedStatus, @Param("propertyId") Long propertyId);
    @Query(value = """
        SELECT COALESCE(SUM(p.amount_cents), 0)
        FROM payments p
        JOIN leases l ON l.id = p.lease_id
        JOIN spaces s ON s.id = l.space_id
        WHERE p.organization_id = :organizationId
          AND p.due_date >= :startDate
          AND p.due_date <= :endDate
          AND p.status = :status
          AND (:propertyId IS NULL OR s.property_id = :propertyId)
        """, nativeQuery = true)
    Long sumByStatusForPeriod(@Param("organizationId") Long organizationId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate, @Param("status") String status, @Param("propertyId") Long propertyId);
    @Query(value = """
        SELECT COALESCE(SUM(p.amount_cents), 0)
        FROM payments p
        JOIN leases l ON l.id = p.lease_id
        JOIN spaces s ON s.id = l.space_id
        WHERE p.organization_id = :organizationId
          AND p.due_date >= :startDate
          AND p.due_date <= :endDate
          AND p.status = :pendingStatus
          AND (:propertyId IS NULL OR s.property_id = :propertyId)
        """, nativeQuery = true)
    Long sumOutstandingRent(@Param("organizationId") Long organizationId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate, @Param("pendingStatus") String pendingStatus, @Param("propertyId") Long propertyId);
    @Query(value = """
        SELECT COALESCE(SUM(p.amount_cents), 0)
        FROM payments p
        JOIN leases l ON l.id = p.lease_id
        JOIN spaces s ON s.id = l.space_id
        WHERE p.organization_id = :organizationId
          AND p.due_date < :beforeDate
          AND p.status = :pendingStatus
          AND (:propertyId IS NULL OR s.property_id = :propertyId)
        """, nativeQuery = true)
    Long sumOverdueRent(@Param("organizationId") Long organizationId, @Param("beforeDate") LocalDate beforeDate, @Param("pendingStatus") String pendingStatus, @Param("propertyId") Long propertyId);
    @Query("""
            SELECT COUNT(p)
            FROM Payment p
            WHERE p.organizationId = :organizationId
                AND p.dueDate < :beforeDate
                AND p.status = :status
            """)
    Long countOverduePayments(@Param("organizationId") Long organizationId,@Param("beforeDate") LocalDate beforeDate,@Param("status") PaymentStatus status);

    @Query(value = """
        SELECT COALESCE(SUM(p.amount_cents), 0)
        FROM payments p
        JOIN leases l ON l.id = p.lease_id
        JOIN spaces s ON s.id = l.space_id
        WHERE p.organization_id = :organizationId
          AND p.due_date >= :startDate
          AND p.due_date <= :endDate
          AND p.status = :paidStatus
          AND (:propertyId IS NULL OR s.property_id = :propertyId)
        """, nativeQuery = true)
    Long sumPaidRent(@Param("organizationId") Long organizationId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate, @Param("paidStatus") String paidStatus, @Param("propertyId") Long propertyId);
}