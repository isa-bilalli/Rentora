package com.isabilalli.rentora.property.infrastructure;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.isabilalli.rentora.property.domain.Space;
import com.isabilalli.rentora.property.domain.SpaceStatus;

public interface SpaceRepository extends JpaRepository<Space, Long>{
    List<Space> findAllByPropertyId(Long propertyId);   
    @Query("""
        SELECT COUNT(s)
        FROM Space s
        WHERE s.propertyId IN (
            SELECT p.id
            FROM Property p
            WHERE p.organizationId = :organizationId)
    """)
    long countByOrganizationId(@Param("organizationId") Long organizationId);
    @Query("""
        SELECT COUNT(s)
        FROM Space s
        WHERE s.propertyId IN (
            SELECT p.id
            FROM Property p
            WHERE p.organizationId = :organizationId)
            AND s.status = :status
    """)
    long countByOrganizationIdAndStatus(@Param("organizationId") Long organizationId, @Param("status") SpaceStatus status);
    @Query("""
        SELECT COUNT(s)
        FROM Space s
        WHERE s.propertyId IN (
            SELECT p.id
            FROM Property p
            WHERE p.organizationId = :organizationId
        )
        AND (:propertyId IS NULL OR s.propertyId = :propertyId)
        """)
    Long countSpaces(@Param("organizationId") Long organizationId, @Param("propertyId") Long propertyId);
}
