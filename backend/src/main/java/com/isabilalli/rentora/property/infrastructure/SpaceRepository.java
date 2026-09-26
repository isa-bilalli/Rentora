package com.isabilalli.rentora.property.infrastructure;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.isabilalli.rentora.property.domain.Space;

public interface SpaceRepository extends JpaRepository<Space, Long>{
    List<Space> findAllByPropertyId(Long propertyId);   
}
