package com.isabilalli.rentora.property.application;

import com.isabilalli.rentora.property.domain.Property;

import java.util.List;

import org.springframework.stereotype.Service;

import com.isabilalli.rentora.auth.application.CurrentUserService;
import com.isabilalli.rentora.auth.infrastructure.security.AuthenticatedUser;
import com.isabilalli.rentora.organization.application.OrganizationAccessService;
import com.isabilalli.rentora.property.api.dto.CreatePropertyRequest;
import com.isabilalli.rentora.property.api.dto.PropertyResponse;
import com.isabilalli.rentora.property.infrastructure.PropertyRepository;

@Service 
public class PropertyService {
    private final PropertyRepository propertyRepository;
    private final CurrentUserService currentUserService;
    private final OrganizationAccessService organizationAccessService;

    public PropertyService(PropertyRepository propertyRepository, CurrentUserService currentUserService, OrganizationAccessService organizationAccessService){
        this.propertyRepository=propertyRepository;
        this.currentUserService=currentUserService;
        this.organizationAccessService=organizationAccessService;
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

}
