package com.isabilalli.rentora.tenant.api;

import com.isabilalli.rentora.tenant.api.dto.CreateTenantRequest;
import com.isabilalli.rentora.tenant.api.dto.TenantResponse;
import com.isabilalli.rentora.tenant.api.dto.TenantSortField;
import com.isabilalli.rentora.tenant.api.dto.UpdateTenantRequest;
import com.isabilalli.rentora.tenant.application.TenantService;
import com.isabilalli.rentora.tenant.domain.TenantType;
import com.isabilalli.rentora.shared.api.PageResponse;

import jakarta.validation.Valid;

import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.GetMapping;

@RestController
@RequestMapping("/api/organizations/{organizationId}/tenants")
public class TenantController {

    private final TenantService tenantService;

    public TenantController(TenantService tenantService) {
        this.tenantService = tenantService;
    }

    @PostMapping
    public ResponseEntity<TenantResponse> createTenant(
            @PathVariable Long organizationId,
            @Valid @RequestBody CreateTenantRequest request
    ) {
        TenantResponse response =
                tenantService.createTenant(
                        organizationId,
                        request
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @GetMapping
    public ResponseEntity<List<TenantResponse>> getAllTenantsByOrganizationId(@PathVariable Long organizationId) {
        return ResponseEntity.ok(tenantService.findAllByOrganizationId(organizationId));
    }

    // One page of the Tenants page, e.g. ?search=murphy&page=0&size=25&sort=ADDED&direction=ASC.
    // Without sort, newest added first.
    @GetMapping("/page")
    public ResponseEntity<PageResponse<TenantResponse>> getTenantPage(
            @PathVariable Long organizationId,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size,
            @RequestParam(required = false) TenantSortField sort,
            @RequestParam(defaultValue = "DESC") Sort.Direction direction
    ) {
        return ResponseEntity.ok(tenantService.getTenantPage(organizationId, search, page, size, sort, direction));
    }

    // How many individuals and companies there are, for the Tenants page's summary.
    @GetMapping("/summary")
    public ResponseEntity<Map<TenantType, Long>> getTenantSummary(@PathVariable Long organizationId) {
        return ResponseEntity.ok(tenantService.getTenantSummary(organizationId));
    }

    @GetMapping("/{tenantId}")
    public ResponseEntity<TenantResponse> getTenant(@PathVariable Long organizationId, @PathVariable Long tenantId) {
        return ResponseEntity.ok(tenantService.findTenant(organizationId, tenantId));
    }

    @PatchMapping("/{tenantId}")
    public ResponseEntity<TenantResponse> updateTenant(@PathVariable Long organizationId, @PathVariable Long tenantId, @Valid @RequestBody UpdateTenantRequest request){
        return ResponseEntity.ok(tenantService.updateTenant(organizationId, tenantId, request));
    }

    @DeleteMapping("/{tenantId}")
    public ResponseEntity<Void> deleteTenant(@PathVariable Long organizationId, @PathVariable Long tenantId){
        tenantService.deleteTenant(organizationId, tenantId);
        return ResponseEntity.noContent().build();
    }
}