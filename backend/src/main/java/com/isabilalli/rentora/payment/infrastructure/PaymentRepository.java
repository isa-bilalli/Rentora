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
    @Query("""
        SELECT COALESCE(SUM(p.amountCents), 0)
        FROM Payment p
        WHERE p.organizationId = :organizationId
            AND p.dueDate >= :startDate
            AND p.dueDate <= :endDate
            AND p.status <> :voidedStatus
    """)
    Long sumExpectedRent(@Param("organizationId") Long organizationId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate, @Param("voidedStatus") PaymentStatus voidedStatus);
    @Query("""
        SELECT COALESCE(SUM(p.amountCents), 0)
        FROM Payment p
        WHERE p.organizationId = :organizationId
            AND p.dueDate >= :startDate
            AND p.dueDate <= :endDate
            AND p.status = :status
    """)
    Long sumByStatusForPeriod(@Param("organizationId") Long organizationId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate, @Param("status") PaymentStatus status);
    @Query("""
        SELECT COALESCE(SUM(p.amountCents), 0)
        FROM Payment p
            WHERE p.organizationId = :organizationId
            AND p.dueDate >= :startDate
            AND p.dueDate <= :endDate
            AND p.status = :status
    """)
    Long sumOutstandingRent(@Param("organizationId") Long organizationId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate, @Param("status") PaymentStatus status);
    @Query("""
        SELECT COALESCE(SUM(p.amountCents), 0)
        FROM Payment p
        WHERE p.organizationId = :organizationId
            AND p.dueDate < :beforeDate
            AND p.status = :status
    """)
    Long sumOverdueRent(@Param("organizationId") Long organizationId, @Param("beforeDate") LocalDate beforeDate, @Param("status") PaymentStatus status);
    @Query("""
            SELECT COUNT(p)
            FROM Payment p
            WHERE p.organizationId = :organizationId
                AND p.dueDate < :beforeDate
                AND p.status = :status
            """)
    Long countOverduePayments(@Param("organizationId") Long organizationId,@Param("beforeDate") LocalDate beforeDate,@Param("status") PaymentStatus status);

}