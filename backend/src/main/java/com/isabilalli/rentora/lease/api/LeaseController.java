package com.isabilalli.rentora.lease.api;

import com.isabilalli.rentora.lease.api.dto.CreateLeaseRequest;
import com.isabilalli.rentora.lease.api.dto.LeaseDisplayStatus;
import com.isabilalli.rentora.lease.api.dto.LeaseListItem;
import com.isabilalli.rentora.lease.api.dto.LeaseResponse;
import com.isabilalli.rentora.lease.api.dto.LeaseSortField;
import com.isabilalli.rentora.lease.api.dto.RenewLeaseRequest;
import com.isabilalli.rentora.lease.api.dto.UpdateLeaseRequest;
import com.isabilalli.rentora.lease.application.LeaseService;
import com.isabilalli.rentora.shared.api.BadRequestException;
import com.isabilalli.rentora.shared.api.PageResponse;
import jakarta.validation.Valid;

import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;


@RestController
@RequestMapping("/api/organizations/{organizationId}/leases")
public class LeaseController {

    private final LeaseService leaseService;

    public LeaseController(LeaseService leaseService) {
        this.leaseService = leaseService;
    }

    @PostMapping
    public ResponseEntity<LeaseResponse> createLease(@PathVariable Long organizationId, @Valid @RequestBody CreateLeaseRequest request) {
        return ResponseEntity.ok(leaseService.createLease(organizationId, request));
    }

    // Every lease, or only one property's (?propertyId=) or one tenant's (?tenantId=).
    @GetMapping
    public ResponseEntity<List<LeaseResponse>> getAllByOrganizationId(@PathVariable Long organizationId, @RequestParam(required = false) Long propertyId, @RequestParam(required = false) Long tenantId) {
        if (propertyId != null && tenantId != null) {
            throw new BadRequestException("Filter by propertyId or by tenantId, not both");
        }
        if (propertyId != null) {
            return ResponseEntity.ok(leaseService.findAllByPropertyId(organizationId, propertyId));
        }
        if (tenantId != null) {
            return ResponseEntity.ok(leaseService.findAllByTenantId(organizationId, tenantId));
        }
        return ResponseEntity.ok(leaseService.findAllByOrganizationId(organizationId));
    }
    
    // One page of the Leases page, e.g. ?status=ACTIVE&search=riverside&page=0&size=25&sort=RENT&direction=DESC.
    // Every filter is optional; without sort, newest start first.
    @GetMapping("/page")
    public ResponseEntity<PageResponse<LeaseListItem>> getLeasePage(
            @PathVariable Long organizationId,
            @RequestParam(required = false) LeaseDisplayStatus status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size,
            @RequestParam(required = false) LeaseSortField sort,
            @RequestParam(defaultValue = "DESC") Sort.Direction direction
    ) {
        return ResponseEntity.ok(leaseService.getLeasePage(organizationId, status, search, page, size, sort, direction));
    }

    // How many leases each status has, for the Leases page's filters.
    @GetMapping("/summary")
    public ResponseEntity<Map<LeaseDisplayStatus, Long>> getLeaseSummary(@PathVariable Long organizationId) {
        return ResponseEntity.ok(leaseService.getLeaseSummary(organizationId));
    }

    @GetMapping("/{leaseId}")
    public ResponseEntity<LeaseResponse> getLease(@PathVariable Long organizationId, @PathVariable Long leaseId) {
        return ResponseEntity.ok(leaseService.getLease(organizationId, leaseId));
    }

    @PatchMapping("/{leaseId}")
    public ResponseEntity<LeaseResponse> updateLease(@PathVariable Long organizationId, @PathVariable Long leaseId, @Valid @RequestBody UpdateLeaseRequest request){
        return ResponseEntity.ok(leaseService.updateLease(organizationId, leaseId, request));
    }

    @PostMapping("/{leaseId}/end")
    public ResponseEntity<LeaseResponse> endLease(@PathVariable Long organizationId, @PathVariable Long leaseId) {
        return ResponseEntity.ok(leaseService.endLease(organizationId, leaseId));
    }

    @PostMapping("/{leaseId}/cancel")
    public ResponseEntity<LeaseResponse> cancelLease(@PathVariable Long organizationId, @PathVariable Long leaseId) {
        return ResponseEntity.ok(leaseService.cancelLease(organizationId, leaseId));
    }
    
    @PostMapping("/{leaseId}/renew")
    public ResponseEntity<LeaseResponse> renewLease(@PathVariable Long organizationId, @PathVariable Long leaseId, @Valid @RequestBody RenewLeaseRequest request) {
        return ResponseEntity.ok(leaseService.renewLease(organizationId, leaseId, request));
    }
    
}