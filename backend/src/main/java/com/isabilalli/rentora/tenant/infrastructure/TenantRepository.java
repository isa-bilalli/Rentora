package com.isabilalli.rentora.tenant.infrastructure;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import com.isabilalli.rentora.tenant.domain.Tenant;

public interface TenantRepository extends JpaRepository<Tenant, Long> {
    List<Tenant> findAllByOrganizationId(Long organizationId);
}
