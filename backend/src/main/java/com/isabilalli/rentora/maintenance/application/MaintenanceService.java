package com.isabilalli.rentora.maintenance.application;

import com.isabilalli.rentora.auth.application.CurrentUserService;
import com.isabilalli.rentora.auth.infrastructure.security.AuthenticatedUser;
import com.isabilalli.rentora.maintenance.api.MaintenanceAccess;
import com.isabilalli.rentora.maintenance.api.dto.CreateMaintenanceRequest;
import com.isabilalli.rentora.maintenance.api.dto.MaintenanceResponse;
import com.isabilalli.rentora.maintenance.api.dto.UpdateMaintenanceRequest;
import com.isabilalli.rentora.maintenance.domain.MaintenancePriority;
import com.isabilalli.rentora.maintenance.domain.MaintenanceRequest;
import com.isabilalli.rentora.maintenance.domain.MaintenanceStatus;
import com.isabilalli.rentora.maintenance.infrastructure.MaintenanceRepository;
import com.isabilalli.rentora.organization.application.OrganizationAccessService;
import com.isabilalli.rentora.property.api.PropertyAccess;
import com.isabilalli.rentora.property.api.SpaceAccess;

import java.time.LocalDate;
import java.util.List;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MaintenanceService implements MaintenanceAccess {

    private final MaintenanceRepository maintenanceRepository;
    private final CurrentUserService currentUserService;
    private final OrganizationAccessService organizationAccessService;
    private final PropertyAccess propertyAccess;
    private final SpaceAccess spaceAccess;

    public MaintenanceService( MaintenanceRepository maintenanceRepository, CurrentUserService currentUserService, OrganizationAccessService organizationAccessService, PropertyAccess propertyAccess, SpaceAccess spaceAccess) {
        this.maintenanceRepository = maintenanceRepository;
        this.currentUserService = currentUserService;
        this.organizationAccessService = organizationAccessService;
        this.propertyAccess = propertyAccess;
        this.spaceAccess = spaceAccess;
    }

    private AuthenticatedUser organizationAuthorization(Long organizationId){
        AuthenticatedUser currentUser = currentUserService.getCurrentUser();
        organizationAccessService.requireAccess(currentUser, organizationId);
        return currentUser;
    }

    private MaintenanceRequest validateMaintenanceRequest(Long organizationId, Long maintenanceId){
        MaintenanceRequest request = maintenanceRepository.findById(maintenanceId).orElseThrow(()-> new IllegalArgumentException("Maintenance request not found"));
        if(!request.getOrganizationId().equals(organizationId)){
            throw new AccessDeniedException("Maintenance request does not belong to this organization");
        }
        return request;
    }

    @Transactional 
    public MaintenanceResponse createMaintenanceRequest(Long organizationId, CreateMaintenanceRequest request){
        AuthenticatedUser currentUser = organizationAuthorization(organizationId);
        if(request.spaceId() != null){
            spaceAccess.requireBelongsToProperty(request.spaceId(), request.propertyId());
        }

        MaintenanceRequest maintenanceRequest = new MaintenanceRequest(organizationId, request.propertyId(), request.spaceId(), request.title(), request.description(), request.priority(), currentUser.userId());
        MaintenanceRequest savedRequest = maintenanceRepository.save(maintenanceRequest);
        
        return MaintenanceResponse.from(savedRequest);
    }

    public List<MaintenanceResponse> getAllMaintenanceRequests(Long organizationId){
        organizationAuthorization(organizationId);
        return maintenanceRepository.findAllByOrganizationId(organizationId).stream().map(MaintenanceResponse::from).toList();
    }

    public List<MaintenanceResponse> getMaintenanceByProperty(Long organizationId, Long propertyId){
        organizationAuthorization(organizationId);
        propertyAccess.requireBelongsToOrganization(propertyId, organizationId);
        return maintenanceRepository.findAllByPropertyId(propertyId).stream().map(MaintenanceResponse::from).toList();
    }

    public List<MaintenanceResponse> getMaintenanceBySpace(Long organizationId, Long propertyId, Long spaceId){
        organizationAuthorization(organizationId);
        propertyAccess.requireBelongsToOrganization(propertyId, organizationId);
        spaceAccess.requireBelongsToOrganization(spaceId, organizationId);
        return maintenanceRepository.findAllBySpaceId(spaceId).stream().map(MaintenanceResponse::from).toList();
    }

    public MaintenanceResponse getMaintenanceRequest(Long organizationId, Long maintenanceId){
        organizationAuthorization(organizationId);
        MaintenanceRequest request = validateMaintenanceRequest(organizationId, maintenanceId);
        return MaintenanceResponse.from(request);
    }

    @Transactional 
    public MaintenanceResponse startProgress(Long organizationId, Long maintenanceId){
        organizationAuthorization(organizationId);
        MaintenanceRequest request = validateMaintenanceRequest(organizationId, maintenanceId);
        request.startProgress();
        MaintenanceRequest savedRequest = maintenanceRepository.save(request);
        return MaintenanceResponse.from(savedRequest);
    }

    @Transactional 
    public MaintenanceResponse resolveMaintenance(Long organizationId, Long maintenanceId){
        organizationAuthorization(organizationId);
        MaintenanceRequest request = validateMaintenanceRequest(organizationId, maintenanceId);
        request.resolve();
        MaintenanceRequest savedRequest = maintenanceRepository.save(request);
        return MaintenanceResponse.from(savedRequest);
    }

    @Transactional 
    public MaintenanceResponse cancelMaintenance(Long organizationId, Long maintenanceId){
        organizationAuthorization(organizationId);
        MaintenanceRequest request = validateMaintenanceRequest(organizationId, maintenanceId);
        request.cancel();
        MaintenanceRequest savedRequest = maintenanceRepository.save(request);
        return MaintenanceResponse.from(savedRequest);
    }

    @Transactional 
    public MaintenanceResponse updateMaintenanceRequest(Long organizationId, Long maintenanceId, UpdateMaintenanceRequest request){
        organizationAuthorization(organizationId);
        MaintenanceRequest maintenanceRequest = validateMaintenanceRequest(organizationId, maintenanceId);

        maintenanceRequest.update(request.title(), request.description(), request.priority());
        MaintenanceRequest savedRequest = maintenanceRepository.save(maintenanceRequest);
        return MaintenanceResponse.from(savedRequest);
    }

    public List<MaintenanceResponse> getMaintenanceByStatus(Long organizationId, MaintenanceStatus status){
        organizationAuthorization(organizationId);
        return maintenanceRepository.findAllByOrganizationIdAndStatus(organizationId, status).stream().map(MaintenanceResponse::from).toList();
    }

    public List<MaintenanceResponse> getMaintenanceByPriority(Long organizationId, MaintenancePriority priority){
        organizationAuthorization(organizationId);
        return maintenanceRepository.findAllByOrganizationIdAndPriority(organizationId, priority).stream().map(MaintenanceResponse::from).toList();
    }

    @Override 
    public Long countOpenRequests(Long organizationId){
        return maintenanceRepository.countByOrganizationIdAndStatuses(organizationId, List.of(MaintenanceStatus.OPEN, MaintenanceStatus.IN_PROGRESS));
    }

    @Override
    public Long countOpenedRequests(Long organizationId, LocalDate startDate, LocalDate endDate, Long propertyId) {
        return maintenanceRepository.countOpenedRequests(organizationId, startDate, endDate, propertyId);
    }

    @Override
    public Long countResolvedRequests(Long organizationId, LocalDate startDate, LocalDate endDate, Long propertyId) {
        return maintenanceRepository.countResolvedRequests( organizationId, startDate, endDate, propertyId);
    }

    @Override
    public Long countCancelledRequests(Long organizationId, LocalDate startDate, LocalDate endDate, Long propertyId) {
        return maintenanceRepository.countCancelledRequests(organizationId, startDate, endDate, propertyId);
    }

    @Override
    public double averageResolutionHours(Long organizationId, LocalDate startDate, LocalDate endDate, Long propertyId) {
        return maintenanceRepository.averageResolutionHours(organizationId, startDate, endDate, propertyId);
    }
}