package com.isabilalli.rentora.property.infrastructure;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.isabilalli.rentora.property.domain.Property;

public interface PropertyRepository extends JpaRepository<Property, Long> {
    List<Property> findAllByOrganizationId(Long organizationId);
}
