package com.isabilalli.rentora.payment.infrastructure;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.isabilalli.rentora.payment.domain.Payment;
import com.isabilalli.rentora.payment.domain.PaymentStatus;

public interface PaymentRepository extends JpaRepository<Payment, Long>{
    List<Payment> findAllByOrganizationId(Long organizationId);
    List<Payment> findAllByLeaseId(Long leaseId);
    List<Payment> findAllByStatus(PaymentStatus status);
    List<Payment> findAllByOrganizationIdAndStatusAndDueDateBefore(Long organizationId, PaymentStatus status, LocalDate date);
    List<Payment> findAllByOrganizationIdAndStatus(Long organizationId, PaymentStatus status);
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