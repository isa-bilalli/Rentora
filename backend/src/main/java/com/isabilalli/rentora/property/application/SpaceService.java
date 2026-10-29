package com.isabilalli.rentora.property.application;

import com.isabilalli.rentora.shared.api.NotFoundException;
import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDate;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.isabilalli.rentora.auth.application.CurrentUserService;
import com.isabilalli.rentora.auth.infrastructure.security.AuthenticatedUser;
import com.isabilalli.rentora.lease.api.LeaseStatusAccess;
import com.isabilalli.rentora.shared.api.ConflictException;
import com.isabilalli.rentora.organization.application.OrganizationAccessService;
import com.isabilalli.rentora.organization.domain.OrganizationRole;
import com.isabilalli.rentora.property.api.SpaceAccess;
import com.isabilalli.rentora.property.api.dto.CreateSpaceRequest;
import com.isabilalli.rentora.property.api.dto.SpaceResponse;
import com.isabilalli.rentora.property.api.dto.UpdateSpaceRequest;
import com.isabilalli.rentora.property.domain.Property;
import com.isabilalli.rentora.property.domain.Space;
import com.isabilalli.rentora.property.infrastructure.PropertyRepository;
import com.isabilalli.rentora.property.infrastructure.SpaceRepository;
import com.isabilalli.rentora.property.domain.SpaceStatus;
import com.isabilalli.rentora.shared.api.BadRequestException;

@Service 
public class SpaceService implements SpaceAccess{
    private final SpaceRepository spaceRepository;
    private final PropertyRepository propertyRepository;
    private final CurrentUserService currentUserService;
    private final OrganizationAccessService organizationAccessService;
    private final LeaseStatusAccess leaseStatusAccess;

    public SpaceService(
            SpaceRepository spaceRepository,
            PropertyRepository propertyRepository,
            CurrentUserService currentUserService,
            OrganizationAccessService organizationAccessService,
            LeaseStatusAccess leaseStatusAccess
    ) {
        this.spaceRepository = spaceRepository;
        this.propertyRepository = propertyRepository;
        this.currentUserService = currentUserService;
        this.organizationAccessService = organizationAccessService;
        this.leaseStatusAccess = leaseStatusAccess;
    }

    private Property getAuthorizedProperty(Long organizationId, Long propertyId){
        AuthenticatedUser currentUser=currentUserService.getCurrentUser();
        organizationAccessService.requireAccess(currentUser, organizationId);

        Property property = propertyRepository.findById(propertyId).orElseThrow(()-> new NotFoundException("Property not found"));
        if(!property.getOrganizationId().equals(organizationId)){
            throw new AccessDeniedException("Property does not belong to this organization");
        }
        return property;
    }

    private Space validateSpace(Long spaceId, Long propertyId){
        Space space = spaceRepository.findById(spaceId).orElseThrow(()-> new NotFoundException("Space not found"));
        if(!space.getPropertyId().equals(propertyId)){
            throw new AccessDeniedException("Space does not belong to this property");
        }
        return space;
    }

    // As validateSpace, but the space stays locked until the transaction ends. Leases also write a space's
    // status, so a lease created or ended meanwhile waits rather than landing between this method's checks
    // and its write, which would then overwrite the status the lease set.
    private Space lockSpace(Long spaceId, Long propertyId){
        Space space = spaceRepository.findByIdForUpdate(spaceId).orElseThrow(()-> new NotFoundException("Space not found"));
        if(!space.getPropertyId().equals(propertyId)){
            throw new AccessDeniedException("Space does not belong to this property");
        }
        return space;
    }

    @Transactional
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

    // Every space across the organization's properties, for pages that show space names next to leases,
    // payments, expenses or maintenance requests from any property.
    public List<SpaceResponse> getOrganizationSpaces(Long organizationId){
        organizationAccessService.requireAccess(currentUserService.getCurrentUser(), organizationId);
        return spaceRepository.findAllByOrganizationId(organizationId).stream().map(SpaceResponse::from).toList();
    }

    // For pages that know a space but not its property, such as a lease's. The response names the property.
    public SpaceResponse getSpace(Long organizationId, Long spaceId){
        organizationAccessService.requireAccess(currentUserService.getCurrentUser(), organizationId);
        return SpaceResponse.from(findSpaceInOrganization(spaceId, organizationId));
    }

    @Transactional
    public SpaceResponse updateSpace(Long organizationId, Long propertyId, Long spaceId , UpdateSpaceRequest request){
        getAuthorizedProperty(organizationId, propertyId);
        Space space = lockSpace(spaceId, propertyId);
        space.update(request.name(), request.type(), request.floor(), request.area(), request.hasFloor(), request.hasArea());
        Space updatedSpace = spaceRepository.save(space);
        return SpaceResponse.from(updatedSpace);
    }

    @Transactional
    public SpaceResponse updateSpaceStatus(Long organizationId, Long propertyId, Long SpaceId, SpaceStatus status){
        if(status == null){
            throw new BadRequestException("Space status is required");
        }
        getAuthorizedProperty(organizationId, propertyId);
        Space space = lockSpace(SpaceId, propertyId);
        
        LocalDate today = LocalDate.now();
        boolean hasCurrentLease = leaseStatusAccess.hasCurrentActiveLease(organizationId, SpaceId, today);
        boolean hasUpcomingLease = leaseStatusAccess.hasUpcomingActiveLease(organizationId, SpaceId, today);

        if(hasCurrentLease && status != SpaceStatus.OCCUPIED){
            throw new BadRequestException("This space has an active lease covering today and must remain occupied");
        }

        if(!hasCurrentLease && hasUpcomingLease && status != SpaceStatus.RESERVED){
            throw new BadRequestException("This space has an upcoming active lease and must remain reserved");
        }
        
        switch (status) {
            case VACANT -> space.markVacant();
            case OCCUPIED -> space.markOccupied();
            case RESERVED -> space.markReserved();
            case MAINTENANCE -> space.markMaintenance();
        }

        Space updatedSpace = spaceRepository.save(space);
        return SpaceResponse.from(updatedSpace);
    }

    @Transactional
    public void deleteSpace(Long organizationId, Long propertyId, Long spaceId){
        organizationAccessService.requireRole(currentUserService.getCurrentUser(), organizationId, OrganizationRole.MANAGER);
        getAuthorizedProperty(organizationId, propertyId);
        Space space = validateSpace(spaceId, propertyId);
        // Leases and their payments are financial history and must outlive the space record.
        if(leaseStatusAccess.hasLeasesForSpace(spaceId)){
            throw new ConflictException("This space has leases and cannot be deleted");
        }

        spaceRepository.delete(space);
    }

    @Override
    public void requireBelongsToOrganization(Long spaceId, Long organizationId){
        findSpaceInOrganization(spaceId, organizationId);
    }

    private Space findSpaceInOrganization(Long spaceId, Long organizationId){
        Space space = spaceRepository.findById(spaceId).orElseThrow(()-> new NotFoundException("Space not found"));
        Property property = propertyRepository.findById(space.getPropertyId()).orElseThrow(()-> new NotFoundException("Property not found"));
        if(!property.getOrganizationId().equals(organizationId)){
            throw new AccessDeniedException("Space does not belong to this organization");
        }
        return space;
    }

    @Override 
    @Transactional
    public void markVacant(Long spaceId){
        Space space = spaceRepository.findById(spaceId).orElseThrow(()-> new NotFoundException("Space not found"));
        space.markVacant();
        spaceRepository.save(space);
    }

    @Override
    @Transactional
    public void markReserved(Long spaceId) {
        Space space = spaceRepository.findById(spaceId).orElseThrow(() -> new NotFoundException("Space not found"));
        space.markReserved();
        spaceRepository.save(space);
    }

    @Override
    @Transactional
    public void markOccupied(Long spaceId) {
        Space space = spaceRepository.findById(spaceId).orElseThrow(() -> new NotFoundException("Space not found"));
        space.markOccupied();
        spaceRepository.save(space);
    }

    @Override 
    @Transactional
    public void markMaintenance(Long spaceId){
        Space space = spaceRepository.findById(spaceId).orElseThrow(() -> new NotFoundException("Space not found"));
        space.markMaintenance();
        spaceRepository.save(space);
    }

    // Idempotent: run daily for every lease covering today, so it only moves spaces that drifted.
    @Override
    @Transactional
    public void occupyForStartedLease(Long spaceId){
        Space space = spaceRepository.findById(spaceId).orElseThrow(() -> new NotFoundException("Space not found"));
        if (space.getStatus() == SpaceStatus.RESERVED || space.getStatus() == SpaceStatus.VACANT) {
            space.markOccupied();
            spaceRepository.save(space);
        }
    }

    // Idempotent: runs whenever a lease ends or is cancelled, and the space may already have the status its leases call for.
    // A space under maintenance stays there; only a person takes it out of maintenance.
    @Override
    @Transactional
    public void applyLeaseStatus(Long spaceId, SpaceStatus status) {
        Space space = spaceRepository.findById(spaceId).orElseThrow(() -> new NotFoundException("Space not found"));
        if (space.getStatus() == status || space.getStatus() == SpaceStatus.MAINTENANCE) {
            return;
        }
        switch (status) {
            case VACANT -> space.markVacant();
            case RESERVED -> space.markReserved();
            case OCCUPIED -> space.markOccupied();
            case MAINTENANCE -> throw new IllegalArgumentException("Leases never put a space into maintenance");
        }
        spaceRepository.save(space);
    }

    @Override 
    @Transactional
    public void prepareForFutureLease(Long spaceId){
        Space space = spaceRepository.findById(spaceId).orElseThrow(() -> new NotFoundException("Space not found"));
        switch (space.getStatus()) {
            case VACANT -> space.markReserved();
            case RESERVED, OCCUPIED -> {
            // Already reserved or currently occupied by another lease.
            }
            case MAINTENANCE -> throw new BadRequestException("Space is under maintenance");
        }

        spaceRepository.save(space);
    }

    @Override 
    public void requireBelongsToProperty(Long spaceId, Long propertyId){
        Space space = spaceRepository.findById(spaceId).orElseThrow(()-> new NotFoundException("Space not found"));
        if(!space.getPropertyId().equals(propertyId)){
            throw new AccessDeniedException("Space does not belong to this property");
        }
    
    }
    @Override 
    public Long countByOrganizationIdAndStatus(Long organizationId, SpaceStatus status){
        return spaceRepository.countByOrganizationIdAndStatus(organizationId, status);
    }

    @Override 
    public Long countByOrganizationId(Long organizationId){
        return spaceRepository.countByOrganizationId(organizationId);
    }
    
    @Override 
    public Long countSpaces(Long organizationId, Long propertyId){
        return spaceRepository.countSpaces(organizationId, propertyId);
    }
}
