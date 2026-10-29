package com.isabilalli.rentora.lease.application;

import com.isabilalli.rentora.shared.api.NotFoundException;
import java.time.LocalDate;
import java.util.EnumMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import com.isabilalli.rentora.auth.application.CurrentUserService;
import com.isabilalli.rentora.auth.infrastructure.security.AuthenticatedUser;
import com.isabilalli.rentora.lease.api.LeaseAccess;
import com.isabilalli.rentora.lease.api.dto.CreateLeaseRequest;
import com.isabilalli.rentora.lease.api.dto.LeaseDisplayStatus;
import com.isabilalli.rentora.lease.api.dto.LeaseListItem;
import com.isabilalli.rentora.lease.api.dto.LeaseResponse;
import com.isabilalli.rentora.lease.api.dto.LeaseSortField;
import com.isabilalli.rentora.lease.api.dto.RenewLeaseRequest;
import com.isabilalli.rentora.lease.api.dto.UpdateLeaseRequest;
import com.isabilalli.rentora.lease.api.dto.CurrentSpaceRentSummary;
import com.isabilalli.rentora.lease.api.event.LeaseCancelledEvent;
import com.isabilalli.rentora.lease.api.event.LeaseCreatedEvent;
import com.isabilalli.rentora.lease.api.event.LeaseEndedEvent;
import com.isabilalli.rentora.lease.api.event.LeaseUpdatedEvent;
import com.isabilalli.rentora.lease.infrastructure.LeaseListRow;
import com.isabilalli.rentora.lease.infrastructure.LeaseRepository;
import com.isabilalli.rentora.organization.application.OrganizationAccessService;
import com.isabilalli.rentora.organization.domain.OrganizationRole;
import com.isabilalli.rentora.property.api.SpaceAccess;
import com.isabilalli.rentora.property.domain.SpaceStatus;
import com.isabilalli.rentora.shared.api.BadRequestException;
import com.isabilalli.rentora.shared.api.PageResponse;
import com.isabilalli.rentora.tenant.api.TenantAccess;

import org.springframework.transaction.annotation.Transactional;

import com.isabilalli.rentora.lease.domain.Lease;
import com.isabilalli.rentora.lease.domain.LeaseStatus;

@Service 
public class LeaseService implements LeaseAccess {
    private final LeaseRepository leaseRepository;
    private final TenantAccess tenantAccess;
    private final SpaceAccess spaceAccess;
    private final CurrentUserService currentUserService;
    private final OrganizationAccessService organizationAccessService;
    private final ApplicationEventPublisher eventPublisher;

    public LeaseService(LeaseRepository leaseRepository, TenantAccess tenantAccess, SpaceAccess spaceAccess, CurrentUserService currentUserService, OrganizationAccessService organizationAccessService, ApplicationEventPublisher eventPublisher){
        this.leaseRepository=leaseRepository;
        this.tenantAccess=tenantAccess;
        this.spaceAccess=spaceAccess;
        this.currentUserService=currentUserService;
        this.organizationAccessService=organizationAccessService;
        this.eventPublisher=eventPublisher;
    }

    private void organizationAuthorization(Long organizationId){
        AuthenticatedUser currentUser=currentUserService.getCurrentUser();
        organizationAccessService.requireAccess(currentUser, organizationId);
    }

    private Lease leaseValidation(Long leaseId, Long organizationId){
        Lease lease = leaseRepository.findById(leaseId).orElseThrow(()-> new NotFoundException("Lease not found"));
        if(!lease.getOrganizationId().equals(organizationId)){
            throw new AccessDeniedException("Lease does not belong to this organization");
        }
        return lease;
    }

    @Transactional 
    public LeaseResponse createLease(Long organizationId, CreateLeaseRequest request){
        organizationAuthorization(organizationId);
        tenantAccess.requireBelongsToOrganization(request.tenantId(), organizationId);
        spaceAccess.requireBelongsToOrganization(request.spaceId(), organizationId);

        if(!request.endDate().isAfter(request.startDate())){
            throw new BadRequestException("End date must be after start date");
        }
        if(leaseRepository.existsOverlappingActiveLease(request.spaceId(), request.startDate(), request.endDate(), null)){
            throw new BadRequestException("Space already has an overlapping active lease");
        }   

        Lease lease = new Lease(organizationId, request.tenantId(), request.spaceId(), request.startDate(), request.endDate(), request.monthlyRentCents(), request.securityDepositCents());
        Lease savedLease = leaseRepository.save(lease);
        eventPublisher.publishEvent(new LeaseCreatedEvent(savedLease.getOrganizationId(), savedLease.getId(), savedLease.getStartDate(), savedLease.getEndDate(), savedLease.getMonthlyRentCents()));
        if (request.startDate().isAfter(LocalDate.now())) {
            spaceAccess.prepareForFutureLease(request.spaceId());
        } else {
            spaceAccess.markOccupied(request.spaceId());
        }
        return LeaseResponse.from(savedLease);
    }

    public List<LeaseResponse> findAllByOrganizationId(Long organizationId){
        organizationAuthorization(organizationId);
        return leaseRepository.findAllByOrganizationId(organizationId).stream().map(LeaseResponse::from).toList();
    }

    // The organization is part of the query, so a property of another organization matches nothing.
    public List<LeaseResponse> findAllByPropertyId(Long organizationId, Long propertyId){
        organizationAuthorization(organizationId);
        return leaseRepository.findAllByOrganizationIdAndPropertyId(organizationId, propertyId).stream().map(LeaseResponse::from).toList();
    }

    // As with properties, a tenant of another organization matches nothing.
    public List<LeaseResponse> findAllByTenantId(Long organizationId, Long tenantId){
        organizationAuthorization(organizationId);
        return leaseRepository.findAllByOrganizationIdAndTenantIdOrderByStartDateAscIdAsc(organizationId, tenantId).stream().map(LeaseResponse::from).toList();
    }

    public static final int MAX_PAGE_SIZE = 100;

    // One page of the Leases page. status and search narrow it; search matches the tenant's name, the property
    // and the space, ignoring case. Without a sort, newest start first; with one, ties keep that order so rows
    // don't move between pages.
    public PageResponse<LeaseListItem> getLeasePage(Long organizationId, LeaseDisplayStatus status, String search, int page, int size, LeaseSortField sort, Sort.Direction direction) {
        organizationAuthorization(organizationId);
        if (page < 0) {
            throw new BadRequestException("Page must be 0 or more");
        }
        if (size < 1 || size > MAX_PAGE_SIZE) {
            throw new BadRequestException("Page size must be between 1 and " + MAX_PAGE_SIZE);
        }

        LocalDate today = LocalDate.now();
        // UPCOMING and ACTIVE are both ACTIVE in the database; the start date tells them apart.
        LeaseStatus leaseStatus = status == null ? null : switch (status) {
            case UPCOMING, ACTIVE -> LeaseStatus.ACTIVE;
            case ENDED -> LeaseStatus.ENDED;
            case CANCELLED -> LeaseStatus.CANCELLED;
        };

        Sort newestFirst = Sort.by(Lease::getStartDate, Lease::getId).descending();
        Sort order = sort == null ? newestFirst : columnOrder(sort, direction).and(newestFirst);
        Page<LeaseListRow> rows = leaseRepository.findListPage(
                organizationId, leaseStatus, today, status == LeaseDisplayStatus.UPCOMING, status == LeaseDisplayStatus.ACTIVE,
                likePattern(search), PageRequest.of(page, size, order));
        return PageResponse.from(rows, row -> new LeaseListItem(
                LeaseResponse.from(row.lease()),
                LeaseDisplayStatus.of(row.lease(), today),
                tenantName(row),
                row.propertyId(),
                row.propertyName(),
                row.spaceName()));
    }

    // How many leases each status of the Leases page has; a status without leases is 0.
    public Map<LeaseDisplayStatus, Long> getLeaseSummary(Long organizationId) {
        organizationAuthorization(organizationId);
        Map<LeaseDisplayStatus, Long> counts = new EnumMap<>(LeaseDisplayStatus.class);
        for (LeaseDisplayStatus status : LeaseDisplayStatus.values()) {
            counts.put(status, 0L);
        }
        for (LeaseRepository.DisplayStatusCount row : leaseRepository.countsByDisplayStatus(organizationId, LocalDate.now())) {
            counts.put(LeaseDisplayStatus.valueOf(row.getBucket()), row.getLeases());
        }
        return counts;
    }

    private static Sort columnOrder(LeaseSortField sort, Sort.Direction direction) {
        Sort column = switch (sort) {
            case START_DATE -> Sort.by(Lease::getStartDate);
            case RENT -> Sort.by(Lease::getMonthlyRentCents);
        };
        return direction.isAscending() ? column.ascending() : column.descending();
    }

    // A lowercase LIKE pattern, with any % or _ (and the escape character !) in the search taken literally.
    private static String likePattern(String search) {
        if (search == null || search.isBlank()) {
            return null;
        }
        String escaped = search.trim().toLowerCase(Locale.ROOT).replace("!", "!!").replace("%", "!%").replace("_", "!_");
        return "%" + escaped + "%";
    }

    // As the frontend's getTenantDisplayName: the person's name, else the company's, else the tenant's number.
    private static String tenantName(LeaseListRow row) {
        String person = Stream.of(row.tenantFirstName(), row.tenantLastName())
                .filter(part -> part != null && !part.isBlank())
                .map(String::trim)
                .collect(Collectors.joining(" "));
        if (!person.isEmpty()) {
            return person;
        }
        if (row.tenantCompanyName() != null && !row.tenantCompanyName().isBlank()) {
            return row.tenantCompanyName().trim();
        }
        return "Tenant #" + row.lease().getTenantId();
    }

    public LeaseResponse getLease(Long organizationId, Long leaseId){
        organizationAuthorization(organizationId);
        Lease lease = leaseValidation(leaseId, organizationId);
        return LeaseResponse.from(lease);
    }

    @Transactional 
    public LeaseResponse updateLease(Long organizationId, Long leaseId, UpdateLeaseRequest request){
        organizationAuthorization(organizationId);
        Lease lease = leaseValidation(leaseId, organizationId);
        if (lease.getStatus() != LeaseStatus.ACTIVE) {
            throw new BadRequestException("Only active leases can be updated");
        }

        LocalDate finalStartDate = request.startDate() != null ? request.startDate() : lease.getStartDate();
        LocalDate finalEndDate = request.endDate() != null ? request.endDate() :lease.getEndDate();

        if(!finalEndDate.isAfter(finalStartDate)){
            throw new BadRequestException("End date must be after start date");
        }
        if (leaseRepository.existsOverlappingActiveLease(lease.getSpaceId(), finalStartDate, finalEndDate, leaseId)) {
            throw new BadRequestException("Space already has an overlapping active lease");
        }
        lease.update(finalStartDate, finalEndDate, request.monthlyRentCents(), request.securityDepositCents());
        Lease savedLease = leaseRepository.save(lease);
        eventPublisher.publishEvent(new LeaseUpdatedEvent(savedLease.getOrganizationId(), savedLease.getId(), savedLease.getStartDate(), savedLease.getEndDate(), savedLease.getMonthlyRentCents()));
        
        return LeaseResponse.from(savedLease);
    }

    @Transactional 
    public LeaseResponse endLease(Long organizationId, Long leaseId){
        organizationAccessService.requireRole(currentUserService.getCurrentUser(), organizationId, OrganizationRole.MANAGER);
        Lease lease = leaseValidation(leaseId, organizationId);

        lease.end(LocalDate.now());
        Lease savedLease = leaseRepository.save(lease);
        eventPublisher.publishEvent(new LeaseEndedEvent(savedLease.getId(), savedLease.getEndDate()));

        syncSpaceStatus(lease.getSpaceId(), lease.getId());
        return LeaseResponse.from(savedLease);
    }

    @Transactional 
    public LeaseResponse cancelLease(Long organizationId, Long leaseId){
        organizationAccessService.requireRole(currentUserService.getCurrentUser(), organizationId, OrganizationRole.MANAGER);
        Lease lease = leaseValidation(leaseId, organizationId);
    
        lease.cancel();
        Lease savedLease = leaseRepository.save(lease);
        eventPublisher.publishEvent(new LeaseCancelledEvent(savedLease.getId()));

        syncSpaceStatus(lease.getSpaceId(), lease.getId());
        return LeaseResponse.from(savedLease);
    }

    // Gives the space the status its remaining active leases call for. Safe to repeat: a space
    // that already has that status is left as it is.
    private void syncSpaceStatus(Long spaceId, Long excludedLeaseId) {
        Optional<Lease> otherActiveLease=leaseRepository.findFirstBySpaceIdAndStatusAndIdNotOrderByStartDateAsc(spaceId, LeaseStatus.ACTIVE, excludedLeaseId);
        SpaceStatus status;
        if (otherActiveLease.isEmpty()) {
            status = SpaceStatus.VACANT;
        } else if (otherActiveLease.get().getStartDate().isAfter(LocalDate.now())) {
            status = SpaceStatus.RESERVED;
        } else {
            status = SpaceStatus.OCCUPIED;
        }
        spaceAccess.applyLeaseStatus(spaceId, status);
    }

    @Transactional
    public void expireLease(Long leaseId){
        Lease lease = leaseRepository.findById(leaseId).orElseThrow(()-> new NotFoundException("Lease not found"));
        if(lease.getStatus() != LeaseStatus.ACTIVE){
            return;
        }

        lease.end(LocalDate.now());
        leaseRepository.save(lease);
        eventPublisher.publishEvent(new LeaseEndedEvent(lease.getId(), lease.getEndDate()));
        syncSpaceStatus(lease.getSpaceId(), lease.getId());
    }

    @Transactional
    public void activateLease(Long leaseId){
        Lease lease = leaseRepository.findById(leaseId).orElseThrow(()-> new NotFoundException("Lease not found"));
        if(lease.getStatus() != LeaseStatus.ACTIVE){
            return;
        }
        spaceAccess.occupyForStartedLease(lease.getSpaceId());
    }

    @Transactional 
    public LeaseResponse renewLease(Long organizationId, Long leaseId, RenewLeaseRequest request){
        organizationAuthorization(organizationId);
        Lease previousLease = leaseValidation(leaseId, organizationId);

        if (previousLease.getStatus() == LeaseStatus.CANCELLED) {
            throw new BadRequestException("Cancelled leases cannot be renewed");
        }

        if (!request.endDate().isAfter(request.startDate())) {
            throw new BadRequestException("End date must be after start date");
        }

        if (!request.startDate().isAfter(previousLease.getEndDate())) {
            throw new BadRequestException("Renewal must start after the previous lease ends");
        }

        CreateLeaseRequest createRequest = new CreateLeaseRequest(previousLease.getTenantId(), previousLease.getSpaceId(), request.startDate(), request.endDate(), request.monthlyRentCents(), request.securityDepositCents());
        LeaseResponse response = createLease(organizationId, createRequest);
        Lease renewedLease = leaseRepository.findById(response.id()).orElseThrow(()-> new IllegalStateException("Created renewal lease could not be found"));
        renewedLease.markAsRenewalOf(previousLease.getId());
        Lease savedLease = leaseRepository.save(renewedLease);
        return LeaseResponse.from(savedLease);
    }

    @Override 
    public void requireBelongsToOrganization(Long leaseId, Long organizationId){
        leaseValidation(leaseId, organizationId);
    }

    @Override 
    public Long countActiveLeases(Long organizationId){
        return leaseRepository.countByOrganizationIdAndStatus(organizationId, LeaseStatus.ACTIVE);
    }

    @Override 
    public Long countLeasesExpiring(Long organizationId, LocalDate startDate, LocalDate endDate){
        return leaseRepository.countExpiringBetween(organizationId, LeaseStatus.ACTIVE, startDate, endDate);
    }

    @Override 
    public Long sumOccupiedSpaceDays(Long organizationId, LocalDate startDate, LocalDate endDate, Long propertyId){
        return leaseRepository.sumOccupiedSpaceDays(organizationId, startDate, endDate, propertyId);
    }

    @Override 
    public Long countStartedLeases(Long organizationId, LocalDate startDate, LocalDate endDate, Long propertyId){
        return leaseRepository.countStartedLeases(organizationId, startDate, endDate, propertyId);
    }

    @Override 
    public Long countEndedLeases(Long organizationId, LocalDate startDate, LocalDate endDate, Long propertyId){
        return leaseRepository.countEndedLeases(organizationId, startDate, endDate, propertyId);
    }

    @Override 
    public Long  countRenewedLeases(Long organizationId, LocalDate startDate, LocalDate endDate, Long propertyId){
        return leaseRepository.countRenewedLeases(organizationId, startDate, endDate, propertyId);
    }

    @Override 
    public Long countLeasesExpiringBetween(Long organizationId, LocalDate startDate, LocalDate endDate, Long propertyId){
        return leaseRepository.countLeasesExpiringBetween(organizationId, startDate, endDate, propertyId);
    }

    @Override 
    public List<CurrentSpaceRentSummary> getCurrentMonthlyRentBySpace(Long organizationId, LocalDate today){
        return leaseRepository.sumCurrentMonthlyRentBySpace(organizationId, LeaseStatus.ACTIVE, today);
    }
}