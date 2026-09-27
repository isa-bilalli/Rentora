package com.isabilalli.rentora.lease.api;

import com.isabilalli.rentora.lease.api.dto.CreateLeaseRequest;
import com.isabilalli.rentora.lease.api.dto.LeaseResponse;
import com.isabilalli.rentora.lease.api.dto.UpdateLeaseRequest;
import com.isabilalli.rentora.lease.application.LeaseService;
import jakarta.validation.Valid;

import java.util.List;

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

    @GetMapping
    public ResponseEntity<List<LeaseResponse>> getAllByOrganizationId(@PathVariable Long organizationId) {
        return ResponseEntity.ok(leaseService.findAllByOrganizationId(organizationId));
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
    
    
}