package com.isabilalli.rentora.tenant.infrastructure;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.isabilalli.rentora.tenant.domain.Tenant;
import com.isabilalli.rentora.tenant.domain.TenantType;

public interface TenantRepository extends JpaRepository<Tenant, Long> {
    List<Tenant> findAllByOrganizationId(Long organizationId);

    // A page of the Tenants page. pattern (a lowercase LIKE, skipped when null) is matched against the person's
    // name, the company's, the email, the phone, the type and the tenant's number. The Pageable sets the order.
    @Query(value = """
        SELECT t
        FROM Tenant t
        WHERE t.organizationId = :organizationId
          AND (:pattern IS NULL
               OR LOWER(CONCAT(COALESCE(t.firstName, ''), ' ', COALESCE(t.lastName, ''))) LIKE :pattern ESCAPE '!'
               OR LOWER(COALESCE(t.companyName, '')) LIKE :pattern ESCAPE '!'
               OR LOWER(COALESCE(t.email, '')) LIKE :pattern ESCAPE '!'
               OR LOWER(COALESCE(t.phone, '')) LIKE :pattern ESCAPE '!'
               OR LOWER(STR(t.type)) LIKE :pattern ESCAPE '!'
               OR STR(t.id) LIKE :pattern ESCAPE '!')
        """, countQuery = """
        SELECT COUNT(t)
        FROM Tenant t
        WHERE t.organizationId = :organizationId
          AND (:pattern IS NULL
               OR LOWER(CONCAT(COALESCE(t.firstName, ''), ' ', COALESCE(t.lastName, ''))) LIKE :pattern ESCAPE '!'
               OR LOWER(COALESCE(t.companyName, '')) LIKE :pattern ESCAPE '!'
               OR LOWER(COALESCE(t.email, '')) LIKE :pattern ESCAPE '!'
               OR LOWER(COALESCE(t.phone, '')) LIKE :pattern ESCAPE '!'
               OR LOWER(STR(t.type)) LIKE :pattern ESCAPE '!'
               OR STR(t.id) LIKE :pattern ESCAPE '!')
        """)
    Page<Tenant> findPage(@Param("organizationId") Long organizationId, @Param("pattern") String pattern, Pageable pageable);

    interface TypeCount {
        TenantType getType();
        long getTenants();
    }

    // How many individuals and companies the organization has.
    @Query("""
        SELECT t.type AS type, COUNT(t) AS tenants
        FROM Tenant t
        WHERE t.organizationId = :organizationId
        GROUP BY t.type
        """)
    List<TypeCount> countsByType(@Param("organizationId") Long organizationId);
}
