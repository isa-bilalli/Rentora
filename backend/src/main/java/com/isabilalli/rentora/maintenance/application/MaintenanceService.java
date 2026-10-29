package com.isabilalli.rentora.maintenance.application;

import com.isabilalli.rentora.shared.api.NotFoundException;
import com.isabilalli.rentora.auth.application.CurrentUserService;
import com.isabilalli.rentora.auth.infrastructure.security.AuthenticatedUser;
import com.isabilalli.rentora.maintenance.api.MaintenanceAccess;
import com.isabilalli.rentora.maintenance.api.dto.CreateMaintenanceRequest;
import com.isabilalli.rentora.maintenance.api.dto.MaintenanceCount;
import com.isabilalli.rentora.maintenance.api.dto.MaintenanceListItem;
import com.isabilalli.rentora.maintenance.api.dto.MaintenanceSortField;
import com.isabilalli.rentora.maintenance.api.dto.MaintenanceResponse;
import com.isabilalli.rentora.maintenance.api.dto.UpdateMaintenanceRequest;
import com.isabilalli.rentora.maintenance.domain.MaintenancePriority;
import com.isabilalli.rentora.maintenance.domain.MaintenanceRequest;
import com.isabilalli.rentora.maintenance.domain.MaintenanceStatus;
import com.isabilalli.rentora.maintenance.infrastructure.MaintenanceRepository;
import com.isabilalli.rentora.shared.api.PageResponse;
import com.isabilalli.rentora.shared.infrastructure.Paging;
import com.isabilalli.rentora.organization.application.OrganizationAccessService;
import com.isabilalli.rentora.property.api.PropertyAccess;
import com.isabilalli.rentora.property.api.SpaceAccess;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.JpaSort;
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
        MaintenanceRequest request = maintenanceRepository.findById(maintenanceId).orElseThrow(()-> new NotFoundException("Maintenance request not found"));
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

    // What needs attention first: open and in-progress before resolved and cancelled, then by priority (urgent
    // first), then the most recently reported. The Maintenance page's order, and how ties are broken when a
    // column sorts it. The CASE expressions can't go through the typed Sort, so they're passed as JPQL, each in
    // brackets: Spring Data puts the alias ("m.") in front of a sort expression unless it contains a bracket.
    private static final Sort NEEDS_ATTENTION_FIRST = JpaSort.unsafe(Sort.Direction.ASC,
                    "(CASE WHEN m.status IN (com.isabilalli.rentora.maintenance.domain.MaintenanceStatus.OPEN, com.isabilalli.rentora.maintenance.domain.MaintenanceStatus.IN_PROGRESS) THEN 0 ELSE 1 END)",
                    "(CASE WHEN m.priority = com.isabilalli.rentora.maintenance.domain.MaintenancePriority.URGENT THEN 0 "
                            + "WHEN m.priority = com.isabilalli.rentora.maintenance.domain.MaintenancePriority.HIGH THEN 1 "
                            + "WHEN m.priority = com.isabilalli.rentora.maintenance.domain.MaintenancePriority.MEDIUM THEN 2 ELSE 3 END)")
            .and(Sort.by(MaintenanceRequest::getReportedAt, MaintenanceRequest::getId).descending());

    // One page of the Maintenance page. status and priority narrow it. Without a sort, what needs attention
    // first. Sorted by reported, requests reported at the same moment keep the order they were added in, by ID.
    // Sorted by resolved, ties keep the needs-attention order, and requests not yet resolved have no resolved
    // date and come last, whichever way. Either way rows don't move between pages.
    public PageResponse<MaintenanceListItem> getMaintenancePage(Long organizationId, MaintenanceStatus status, MaintenancePriority priority, int page, int size, MaintenanceSortField sort, Sort.Direction direction) {
        organizationAuthorization(organizationId);
        Sort order = NEEDS_ATTENTION_FIRST;
        if (sort != null) {
            order = switch (sort) {
                case REPORTED -> Sort.by(new Sort.Order(direction, "reportedAt"), new Sort.Order(direction, "id"));
                case RESOLVED -> Sort.by(new Sort.Order(direction, "resolvedAt").nullsLast()).and(NEEDS_ATTENTION_FIRST);
            };
        }
        return PageResponse.from(
                maintenanceRepository.findListPage(organizationId, status, priority, Paging.pageRequest(page, size, order)),
                row -> new MaintenanceListItem(MaintenanceResponse.from(row.request()), row.propertyName(), row.spaceName()));
    }

    // How many requests have each status and priority; pairs without requests are left out.
    public List<MaintenanceCount> getMaintenanceSummary(Long organizationId) {
        organizationAuthorization(organizationId);
        return maintenanceRepository.countsByStatusAndPriority(organizationId);
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