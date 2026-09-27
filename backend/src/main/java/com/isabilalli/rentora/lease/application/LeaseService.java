package com.isabilalli.rentora.lease.application;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import com.isabilalli.rentora.auth.application.CurrentUserService;
import com.isabilalli.rentora.auth.infrastructure.security.AuthenticatedUser;
import com.isabilalli.rentora.lease.api.dto.CreateLeaseRequest;
import com.isabilalli.rentora.lease.api.dto.LeaseResponse;
import com.isabilalli.rentora.lease.api.dto.UpdateLeaseRequest;
import com.isabilalli.rentora.lease.infrastructure.LeaseRepository;
import com.isabilalli.rentora.organization.application.OrganizationAccessService;
import com.isabilalli.rentora.property.api.SpaceAccess;
import com.isabilalli.rentora.shared.api.BadRequestException;
import com.isabilalli.rentora.tenant.api.TenantAccess;

import org.springframework.transaction.annotation.Transactional;

import com.isabilalli.rentora.lease.domain.Lease;
import com.isabilalli.rentora.lease.domain.LeaseStatus;

@Service 
public class LeaseService {
    private final LeaseRepository leaseRepository;
    private final TenantAccess tenantAccess;
    private final SpaceAccess spaceAccess;
    private final CurrentUserService currentUserService;
    private final OrganizationAccessService organizationAccessService;

    public LeaseService(LeaseRepository leaseRepository, TenantAccess tenantAccess, SpaceAccess spaceAccess, CurrentUserService currentUserService, OrganizationAccessService organizationAccessService){
        this.leaseRepository=leaseRepository;
        this.tenantAccess=tenantAccess;
        this.spaceAccess=spaceAccess;
        this.currentUserService=currentUserService;
        this.organizationAccessService=organizationAccessService;
    }

    private void organizationAuthorization(Long organizationId){
        AuthenticatedUser currentUser=currentUserService.getCurrentUser();
        organizationAccessService.requireAccess(currentUser, organizationId);
    }

    private Lease leaseValidation(Long leaseId, Long organizationId){
        Lease lease = leaseRepository.findById(leaseId).orElseThrow(()-> new IllegalArgumentException("Lease not found"));
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
        if(leaseRepository.existsOverlappingActiveLease(organizationId, finalStartDate, finalEndDate, leaseId)){
            throw new BadRequestException("Space already has an overlapping lease");
        }

        lease.update(finalStartDate, finalEndDate, request.monthlyRentCents(), request.securityDepositCents());
        Lease savedLease = leaseRepository.save(lease);
        
        return LeaseResponse.from(savedLease);
    }

    @Transactional 
    public LeaseResponse endLease(Long organizationId, Long leaseId){
        organizationAuthorization(organizationId);
        Lease lease = leaseValidation(leaseId, organizationId);

        lease.end();
        Lease savedLease = leaseRepository.save(lease);

        syncSpaceStatus(lease.getSpaceId(), lease.getId());
        return LeaseResponse.from(savedLease);
    }

    @Transactional 
    public LeaseResponse cancelLease(Long organizationId, Long leaseId){
        organizationAuthorization(organizationId);
        Lease lease = leaseValidation(leaseId, organizationId);
    
        lease.cancel();
        Lease savedLease = leaseRepository.save(lease);

        syncSpaceStatus(lease.getSpaceId(), lease.getId());
        return LeaseResponse.from(savedLease);
    }

    private void syncSpaceStatus(Long spaceId, Long excludedLeaseId) {
        Optional<Lease> otherActiveLease=leaseRepository.findFirstBySpaceIdAndStatusAndIdNotOrderByStartDateAsc(spaceId, LeaseStatus.ACTIVE, excludedLeaseId);
        if (otherActiveLease.isEmpty()) {
            spaceAccess.markVacant(spaceId);
            return;
        }
        Lease lease = otherActiveLease.get();

        if (lease.getStartDate().isAfter(LocalDate.now())) {
            spaceAccess.markReserved(spaceId);
        } else {
            spaceAccess.markOccupied(spaceId);
        }
    }
}