package com.isabilalli.rentora.tenant.application;

import com.isabilalli.rentora.lease.api.LeaseStatusAccess;
import com.isabilalli.rentora.shared.api.BadRequestException;
import com.isabilalli.rentora.shared.api.ConflictException;
import com.isabilalli.rentora.shared.api.NotFoundException;
import com.isabilalli.rentora.shared.api.PageResponse;
import com.isabilalli.rentora.shared.infrastructure.Paging;
import com.isabilalli.rentora.shared.infrastructure.LikePattern;
import com.isabilalli.rentora.auth.application.CurrentUserService;
import com.isabilalli.rentora.auth.infrastructure.security.AuthenticatedUser;
import com.isabilalli.rentora.organization.application.OrganizationAccessService;
import com.isabilalli.rentora.organization.domain.OrganizationRole;
import com.isabilalli.rentora.tenant.api.dto.CreateTenantRequest;
import com.isabilalli.rentora.tenant.api.dto.TenantResponse;
import com.isabilalli.rentora.tenant.api.dto.TenantSortField;
import com.isabilalli.rentora.tenant.api.dto.UpdateTenantRequest;
import com.isabilalli.rentora.tenant.domain.Tenant;
import com.isabilalli.rentora.tenant.domain.TenantType;
import com.isabilalli.rentora.tenant.infrastructure.TenantRepository;
import com.isabilalli.rentora.tenant.api.TenantAccess;


import java.util.EnumMap;
import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TenantService implements TenantAccess{
    private final TenantRepository tenantRepository;
    private final CurrentUserService currentUserService;
    private final OrganizationAccessService organizationAccessService;
    private final LeaseStatusAccess leaseStatusAccess;

    public TenantService(
            TenantRepository tenantRepository,
            CurrentUserService currentUserService,
            OrganizationAccessService organizationAccessService,
            LeaseStatusAccess leaseStatusAccess
    ) {
        this.tenantRepository = tenantRepository;
        this.currentUserService = currentUserService;
        this.organizationAccessService = organizationAccessService;
        this.leaseStatusAccess = leaseStatusAccess;
    }

    private boolean isBlank(String value){
        return value == null || value.isBlank();
    }

    private void validateTenant(CreateTenantRequest request){
        if(request.type() == TenantType.INDIVIDUAL){
            if(isBlank(request.firstName()) || isBlank(request.lastName())){
                throw new BadRequestException("Individual tenant requires first name and last name");
            }
            if(request.companyName() != null){
                throw new BadRequestException("Individual tenant cannot have company name");
            }
        }
    
        if(request.type() == TenantType.COMPANY){
            if(isBlank(request.companyName())){
                throw new BadRequestException("Company tenant requires a company name");
            }
            if(request.firstName() != null || request.lastName() != null){
                throw new BadRequestException("Company tenant cannot have individual name");
            }
        }
    }

    private void organizationAuthorization(Long organizationId){
        AuthenticatedUser currentUser=currentUserService.getCurrentUser();
        organizationAccessService.requireAccess(currentUser, organizationId);
    }

    @Transactional
    public TenantResponse createTenant(Long organizationId, CreateTenantRequest request){
        organizationAuthorization(organizationId);
        validateTenant(request);

        Tenant tenant = new Tenant(organizationId, request.type(), request.firstName(), request.lastName(), request.companyName(), request.email(), request.phone());
        Tenant savedTenant =  tenantRepository.save(tenant);
        return TenantResponse.from(savedTenant);
    }

    public List<TenantResponse> findAllByOrganizationId(Long organizationId){
        organizationAuthorization(organizationId);
        return tenantRepository.findAllByOrganizationId(organizationId).stream().map(TenantResponse::from).toList();
    }

    // One page of the Tenants page. search matches the name, email, phone, type and number, ignoring case.
    // Newest added first, or oldest first when sorted that way. Tenants added together can share a timestamp,
    // so the ID, which only grows, orders them in the same direction and keeps rows from moving between pages.
    public PageResponse<TenantResponse> getTenantPage(Long organizationId, String search, int page, int size, TenantSortField sort, Sort.Direction direction) {
        organizationAuthorization(organizationId);
        Sort added = Sort.by(Tenant::getCreatedAt, Tenant::getId);
        Sort order = sort == TenantSortField.ADDED && direction.isAscending() ? added.ascending() : added.descending();
        return PageResponse.from(
                tenantRepository.findPage(organizationId, LikePattern.contains(search), Paging.pageRequest(page, size, order)),
                TenantResponse::from);
    }

    // How many individuals and companies the organization has; a type without tenants is 0.
    public Map<TenantType, Long> getTenantSummary(Long organizationId) {
        organizationAuthorization(organizationId);
        Map<TenantType, Long> counts = new EnumMap<>(TenantType.class);
        for (TenantType type : TenantType.values()) {
            counts.put(type, 0L);
        }
        for (TenantRepository.TypeCount row : tenantRepository.countsByType(organizationId)) {
            counts.put(row.getType(), row.getTenants());
        }
        return counts;
    }

    public TenantResponse findTenant(Long organizationId, Long tenantId){
        organizationAuthorization(organizationId);
        Tenant tenant = tenantRepository.findById(tenantId).orElseThrow(()-> new NotFoundException("Tenant not found"));
        if(!tenant.getOrganizationId().equals(organizationId)){
            throw new AccessDeniedException("Tenant does not belong to this organization");
        }
        return TenantResponse.from(tenant);
    }
    
    @Transactional
    public TenantResponse updateTenant(Long organizationId, Long tenantId, UpdateTenantRequest request){
        organizationAuthorization(organizationId);
        Tenant tenant = tenantRepository.findById(tenantId).orElseThrow(()-> new NotFoundException("Tenant not found"));
        if(!tenant.getOrganizationId().equals(organizationId)){
            throw new AccessDeniedException("Tenant does not belong to this organization");
        }
        tenant.update(request.type(), request.firstName(), request.lastName(), request.companyName(), request.email(), request.phone());
        return TenantResponse.from(tenantRepository.save(tenant));
    }

    @Transactional
    public void deleteTenant(Long organizationId, Long tenantId){
        organizationAccessService.requireRole(currentUserService.getCurrentUser(), organizationId, OrganizationRole.MANAGER);
        Tenant tenant = tenantRepository.findById(tenantId).orElseThrow(()-> new NotFoundException("Tenant not found"));
        if(!tenant.getOrganizationId().equals(organizationId)){
            throw new AccessDeniedException("Tenant does not belong to this organization");
        }
        // Leases and their payments are financial history and must outlive the tenant record.
        if(leaseStatusAccess.hasLeasesForTenant(tenantId)){
            throw new ConflictException("This tenant has leases and cannot be deleted");
        }

        tenantRepository.delete(tenant);
    }

    //METHOD FOR VERIFIYNG TENANTS, IMPLEMENTED FOR INTERFACE
    @Override 
    public void requireBelongsToOrganization(Long tenantId, Long organizationId){
        Tenant tenant = tenantRepository.findById(tenantId).orElseThrow(()-> new NotFoundException("Tenant not found"));
        if(!tenant.getOrganizationId().equals(organizationId)){
            throw new AccessDeniedException("Tenant does not belong to this organization");
        }
    }
}
