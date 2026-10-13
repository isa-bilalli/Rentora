package com.isabilalli.rentora.property.application;

import com.isabilalli.rentora.property.domain.Property;
import com.isabilalli.rentora.property.domain.Space;

import java.util.List;
import java.time.LocalDate;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.isabilalli.rentora.property.domain.SpaceType;
import com.isabilalli.rentora.property.domain.SpaceStatus;
import com.isabilalli.rentora.auth.application.CurrentUserService;
import com.isabilalli.rentora.auth.infrastructure.security.AuthenticatedUser;
import com.isabilalli.rentora.lease.api.LeaseAccess;
import com.isabilalli.rentora.lease.api.dto.CurrentSpaceRentSummary;
import com.isabilalli.rentora.organization.application.OrganizationAccessService;
import com.isabilalli.rentora.property.api.PropertyAccess;
import com.isabilalli.rentora.property.api.dto.CreatePropertyRequest;
import com.isabilalli.rentora.property.api.dto.PropertyResponse;
import com.isabilalli.rentora.property.api.dto.PropertySummaryResponse;
import com.isabilalli.rentora.property.infrastructure.PropertyRepository;
import com.isabilalli.rentora.property.infrastructure.SpaceRepository;

@Service 
public class PropertyService implements PropertyAccess{
    private final PropertyRepository propertyRepository;
    private final CurrentUserService currentUserService;
    private final OrganizationAccessService organizationAccessService;
    private final SpaceRepository spaceRepository;
    private final LeaseAccess leaseAccess;

    public PropertyService(PropertyRepository propertyRepository, CurrentUserService currentUserService, OrganizationAccessService organizationAccessService, SpaceRepository spaceRepository, LeaseAccess leaseAccess){
        this.propertyRepository=propertyRepository;
        this.currentUserService=currentUserService;
        this.organizationAccessService=organizationAccessService;
        this.spaceRepository=spaceRepository;
        this.leaseAccess=leaseAccess;
    }

    public PropertyResponse createProperty(Long organizationId, CreatePropertyRequest request){
        AuthenticatedUser currentUser = currentUserService.getCurrentUser();
        organizationAccessService.requireAccess(currentUser, organizationId);

        Property property = new Property(organizationId, request.name(), request.addressLine(), request.city(), request.postalCode(), request.country());
        Property savedProperty = propertyRepository.save(property);
        return PropertyResponse.from(savedProperty);
    }

    public List<PropertyResponse> getProperties(Long organizationId) {
        AuthenticatedUser currentUser = currentUserService.getCurrentUser();
        organizationAccessService.requireAccess(currentUser, organizationId);
        
        return propertyRepository.findAllByOrganizationId(organizationId).stream().map(PropertyResponse::from).toList();
    }

    public PropertyResponse getProperty(Long organizationId, Long propertyId){
        AuthenticatedUser currentUser = currentUserService.getCurrentUser();
        organizationAccessService.requireAccess(currentUser, organizationId);
        Property property = propertyRepository.findById(propertyId).orElseThrow(() -> new IllegalArgumentException("Property not found"));
        if(!property.getOrganizationId().equals(organizationId)){
            throw new AccessDeniedException("Property does not belong to this organization");
        }
        return PropertyResponse.from(property);
    }

    @Override
    public void requireBelongsToOrganization(Long propertyId, Long organizationId){
        Property property = propertyRepository.findById(propertyId).orElseThrow(()-> new IllegalArgumentException("Property not found"));
        if(!property.getOrganizationId().equals(organizationId)){
            throw new AccessDeniedException("Property does not belong to this organization");
        }
    }

    @Override
    public Long countByOrganizationId(Long organizationId){
        return propertyRepository.countByOrganizationId(organizationId);
    }

    @Transactional(readOnly = true)
    public List<PropertySummaryResponse> getPropertySummaries(Long organizationId) {
        AuthenticatedUser currentUser =currentUserService.getCurrentUser();
        organizationAccessService.requireAccess(currentUser, organizationId);
        List<Property> properties =propertyRepository.findAllByOrganizationId(organizationId);

        if (properties.isEmpty()) {
            return List.of();
        }
        List<Long> propertyIds = properties.stream().map(Property::getId).toList();
        Map<Long, List<Space>> spacesByProperty = spaceRepository.findAllByPropertyIdIn(propertyIds).stream().collect(Collectors.groupingBy(Space::getPropertyId));
        LocalDate today = LocalDate.now();
        Map<Long, Long> rentBySpaceId = leaseAccess.getCurrentMonthlyRentBySpace(organizationId, today).stream().collect(Collectors.toMap(CurrentSpaceRentSummary::spaceId, CurrentSpaceRentSummary::monthlyRentCents));
        return properties.stream().map(property -> {
            List<Space> spaces = spacesByProperty.getOrDefault(property.getId(), List.of());
            long occupied = countByStatus(spaces, SpaceStatus.OCCUPIED);
            long reserved = countByStatus(spaces, SpaceStatus.RESERVED);
            long vacant = countByStatus(spaces, SpaceStatus.VACANT);
            long maintenance = countByStatus(spaces, SpaceStatus.MAINTENANCE);
            long expectedRent = spaces.stream().mapToLong(space ->rentBySpaceId.getOrDefault(space.getId(),0L)).sum();
            return new PropertySummaryResponse(
                    property.getId(),
                    property.getName(),
                    property.getAddressLine(),
                    property.getCity(),
                    property.getPostalCode(),
                    property.getCountry(),
                    derivePropertyType(spaces),
                    spaces.size(),
                    occupied,
                    reserved,
                    vacant,
                    maintenance,
                    expectedRent
                );
            }).toList();
    }

    private long countByStatus(List<Space> spaces, SpaceStatus status) {
        return spaces.stream().filter(space -> space.getStatus() == status).count();
    }
    
    private String derivePropertyType(List<Space> spaces) {
        Set<SpaceType> types = spaces.stream().map(Space::getType).collect(Collectors.toSet());
        if (types.isEmpty()) {
            return "NOT_CLASSIFIED";
        }

        if (types.size() > 1) {
            return "MIXED_USE";
        }

        return switch (types.iterator().next()) {
            case RESIDENTIAL -> "RESIDENTIAL";
            case OFFICE -> "OFFICE";
            case RETAIL -> "RETAIL";
            case OTHER -> "OTHER";
        };
    }
}