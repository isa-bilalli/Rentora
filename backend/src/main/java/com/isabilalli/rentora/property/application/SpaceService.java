package com.isabilalli.rentora.property.application;

import org.springframework.security.access.AccessDeniedException;

import java.lang.IllegalArgumentException;
import java.util.List;

import org.springframework.stereotype.Service;

import com.isabilalli.rentora.auth.application.CurrentUserService;
import com.isabilalli.rentora.auth.infrastructure.security.AuthenticatedUser;
import com.isabilalli.rentora.organization.application.OrganizationAccessService;
import com.isabilalli.rentora.property.api.dto.CreateSpaceRequest;
import com.isabilalli.rentora.property.api.dto.SpaceResponse;
import com.isabilalli.rentora.property.api.dto.UpdateSpaceRequest;
import com.isabilalli.rentora.property.domain.Property;
import com.isabilalli.rentora.property.domain.Space;
import com.isabilalli.rentora.property.infrastructure.PropertyRepository;
import com.isabilalli.rentora.property.infrastructure.SpaceRepository;
import com.isabilalli.rentora.property.domain.SpaceStatus;

@Service 
public class SpaceService {
    private final SpaceRepository spaceRepository;
    private final PropertyRepository propertyRepository;
    private final CurrentUserService currentUserService;
    private final OrganizationAccessService organizationAccessService;

    public SpaceService(
            SpaceRepository spaceRepository,
            PropertyRepository propertyRepository,
            CurrentUserService currentUserService,
            OrganizationAccessService organizationAccessService
    ) {
        this.spaceRepository = spaceRepository;
        this.propertyRepository = propertyRepository;
        this.currentUserService = currentUserService;
        this.organizationAccessService = organizationAccessService;
    }

    private Property getAuthorizedProperty(Long organizationId, Long propertyId){
        AuthenticatedUser currentUser=currentUserService.getCurrentUser();
        organizationAccessService.requireAccess(currentUser, organizationId);

        Property property = propertyRepository.findById(propertyId).orElseThrow(()-> new IllegalArgumentException("Property not found"));
        if(!property.getOrganizationId().equals(organizationId)){
            throw new AccessDeniedException("Property does not belong to this organization");
        }
        return property;
    }

    private Space validateSpace(Long spaceId, Long propertyId){
        Space space = spaceRepository.findById(spaceId).orElseThrow(()-> new IllegalArgumentException("Space not found"));
        if(!space.getPropertyId().equals(propertyId)){
            throw new AccessDeniedException("Space does not belong to this property");
        }
        return space;
    }

    public SpaceResponse createSpace(Long organizationId, Long propertyId, CreateSpaceRequest request){
        Property property = getAuthorizedProperty(organizationId, propertyId);
        Space space = new Space(property.getId(), request.name(), request.type(), request.floor(), request.area(), SpaceStatus.VACANT);
        Space savedSpace = spaceRepository.save(space);
        return SpaceResponse.from(savedSpace);
    }

    public List<SpaceResponse> getSpaces(Long organizationId, Long propertyId){
        getAuthorizedProperty(organizationId, propertyId);
        return spaceRepository.findAllByPropertyId(propertyId).stream().map(SpaceResponse::from).toList();
    }

    public SpaceResponse getSpaceById(Long organizationId, Long propertyId, Long spaceId){
        getAuthorizedProperty(organizationId, propertyId);
        Space space = validateSpace(spaceId, propertyId);
        return SpaceResponse.from(space);
    }

    public SpaceResponse updateSpace(Long organizationId, Long propertyId, Long spaceId , UpdateSpaceRequest request){
        getAuthorizedProperty(organizationId, propertyId);
        Space space = validateSpace(spaceId, propertyId);

        space.update(request.name(), request.type(), request.floor(), request.area());
        Space updatedSpace = spaceRepository.save(space);
        return SpaceResponse.from(updatedSpace);
    }

    public void deleteSpace(Long organizationId, Long propertyId, Long spaceId){
        getAuthorizedProperty(organizationId, propertyId);
        Space space = validateSpace(spaceId, propertyId);

        spaceRepository.delete(space);
    }
}
