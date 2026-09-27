package com.isabilalli.rentora.tenant.application;

import com.isabilalli.rentora.auth.application.CurrentUserService;
import com.isabilalli.rentora.auth.infrastructure.security.AuthenticatedUser;
import com.isabilalli.rentora.organization.application.OrganizationAccessService;
import com.isabilalli.rentora.tenant.api.dto.CreateTenantRequest;
import com.isabilalli.rentora.tenant.api.dto.TenantResponse;
import com.isabilalli.rentora.tenant.api.dto.UpdateTenantRequest;
import com.isabilalli.rentora.tenant.domain.Tenant;
import com.isabilalli.rentora.tenant.domain.TenantType;
import com.isabilalli.rentora.tenant.infrastructure.TenantRepository;
import com.isabilalli.rentora.tenant.api.TenantAccess;


import java.util.List;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

@Service
public class TenantService implements TenantAccess{
    private final TenantRepository tenantRepository;
    private final CurrentUserService currentUserService;
    private final OrganizationAccessService organizationAccessService;

    public TenantService(
            TenantRepository tenantRepository,
            CurrentUserService currentUserService,
            OrganizationAccessService organizationAccessService
    ) {
        this.tenantRepository = tenantRepository;
        this.currentUserService = currentUserService;
        this.organizationAccessService = organizationAccessService;
    }

    private boolean isBlank(String value){
        return value == null || value.isBlank();
    }

    private void validateTenant(CreateTenantRequest request){
        if(request.type() == TenantType.INDIVIDUAL){
            if(isBlank(request.firstName()) || isBlank(request.lastName())){
                throw new IllegalArgumentException("Individual tenant requires first name and last name");
            }
            if(request.companyName() != null){
                throw new IllegalArgumentException("Individual tenant cannot have company name");
            }
        }
    
        if(request.type() == TenantType.COMPANY){
            if(isBlank(request.companyName())){
                throw new IllegalArgumentException("Company tenant requires a company name");
            }
            if(request.firstName() != null || request.lastName() != null){
                throw new IllegalArgumentException("Company tenant cannot have individual name");
            }
        }
    }

    private void organizationAuthorization(Long organizationId){
        AuthenticatedUser currentUser=currentUserService.getCurrentUser();
        organizationAccessService.requireAccess(currentUser, organizationId);
    }

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

    public TenantResponse findTenant(Long organizationId, Long tenantId){
        organizationAuthorization(organizationId);
        Tenant tenant = tenantRepository.findById(tenantId).orElseThrow(()-> new IllegalArgumentException("Tenant not found"));
        if(!tenant.getOrganizationId().equals(organizationId)){
            throw new AccessDeniedException("Tenant does not belong to this organization");
        }
        return TenantResponse.from(tenant);
    }
    
    public TenantResponse updateTenant(Long organizationId, Long tenantId, UpdateTenantRequest request){
        organizationAuthorization(organizationId);
        Tenant tenant = tenantRepository.findById(tenantId).orElseThrow(()-> new IllegalArgumentException("Tenant not found"));
        if(!tenant.getOrganizationId().equals(organizationId)){
            throw new AccessDeniedException("Tenant does not belong to this organization");
        }
        tenant.update(request.type(), request.firstName(), request.lastName(), request.companyName(), request.email(), request.phone());
        return TenantResponse.from(tenantRepository.save(tenant));
    }

    public void deleteTenant(Long organizationId, Long tenantId){
        organizationAuthorization(organizationId);
        Tenant tenant = tenantRepository.findById(tenantId).orElseThrow(()-> new IllegalArgumentException("Tenant not found"));
        if(!tenant.getOrganizationId().equals(organizationId)){
            throw new AccessDeniedException("Tenant does not belong to this organization");
        }

        tenantRepository.delete(tenant);
    }

    //METHOD FOR VERIFIYNG TENANTS, IMPLEMENTED FOR INTERFACE
    @Override 
    public void requireBelongsToOrganization(Long tenantId, Long organizationId){
        Tenant tenant = tenantRepository.findById(tenantId).orElseThrow(()-> new IllegalArgumentException("Tenant not found"));
        if(!tenant.getOrganizationId().equals(organizationId)){
            throw new AccessDeniedException("Tenant does not belong to this organization");
        }
    }
}
