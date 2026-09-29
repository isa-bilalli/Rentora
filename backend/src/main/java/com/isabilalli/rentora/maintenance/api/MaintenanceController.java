package com.isabilalli.rentora.maintenance.api;

import com.isabilalli.rentora.maintenance.api.dto.CreateMaintenanceRequest;
import com.isabilalli.rentora.maintenance.api.dto.MaintenanceResponse;
import com.isabilalli.rentora.maintenance.api.dto.UpdateMaintenanceRequest;
import com.isabilalli.rentora.maintenance.application.MaintenanceService;
import com.isabilalli.rentora.maintenance.domain.MaintenancePriority;
import com.isabilalli.rentora.maintenance.domain.MaintenanceStatus;

import jakarta.validation.Valid;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;



@RestController
@RequestMapping("/api/organizations/{organizationId}/maintenance")
public class MaintenanceController {

    private final MaintenanceService maintenanceService;

    public MaintenanceController(
            MaintenanceService maintenanceService
    ) {
        this.maintenanceService = maintenanceService;
    }

    @PostMapping
    public ResponseEntity<MaintenanceResponse> createMaintenanceRequest(@PathVariable Long organizationId, @Valid @RequestBody CreateMaintenanceRequest request) {
        return ResponseEntity.ok(maintenanceService.createMaintenanceRequest( organizationId, request));
    }

    @PostMapping("/{maintenanceId}/start")
    public ResponseEntity<MaintenanceResponse> startProgress(@PathVariable Long organizationId, @PathVariable Long maintenanceId) {
        return ResponseEntity.ok(maintenanceService.startProgress(organizationId, maintenanceId));
    }

    @PostMapping("/{maintenanceId}/resolve")
    public ResponseEntity<MaintenanceResponse> resolveMaintenance(@PathVariable Long organizationId, @PathVariable Long maintenanceId) {
        return ResponseEntity.ok(maintenanceService.resolveMaintenance(organizationId, maintenanceId));
    }

    @PostMapping("/{maintenanceId}/cancel")
    public ResponseEntity<MaintenanceResponse> cancelMaintenance(@PathVariable Long organizationId, @PathVariable Long maintenanceId) {
        return ResponseEntity.ok(maintenanceService.cancelMaintenance(organizationId, maintenanceId));
    }

    @GetMapping
    public ResponseEntity<List<MaintenanceResponse>> getAllMaintenanceRequests(@PathVariable Long organizationId) {
        return ResponseEntity.ok(maintenanceService.getAllMaintenanceRequests(organizationId));
    }
 
    @GetMapping("/properties/{propertyId}")
    public ResponseEntity<List<MaintenanceResponse>> getMaintenanceByProperty(@PathVariable Long organizationId, @PathVariable Long propertyId) {
        return ResponseEntity.ok(maintenanceService.getMaintenanceByProperty(organizationId, propertyId));
    }
    
    @GetMapping("/properties/{propertyId}/spaces/{spaceId}")
    public ResponseEntity<List<MaintenanceResponse>> getMaintenanceByProperty(@PathVariable Long organizationId, @PathVariable Long propertyId, @PathVariable Long spaceId) {
        return ResponseEntity.ok(maintenanceService.getMaintenanceBySpace(organizationId, propertyId, spaceId));
    }

    @GetMapping("/{maintenanceId}")
    public ResponseEntity<MaintenanceResponse> getMaintenanceRequest(@PathVariable Long organizationId, @PathVariable Long maintenanceId) {
        return ResponseEntity.ok(maintenanceService.getMaintenanceRequest(organizationId, maintenanceId));
    }

    @GetMapping("/status")
    public ResponseEntity<List<MaintenanceResponse>> getMaintenanceByStatus(@PathVariable Long organizationId ,@RequestParam MaintenanceStatus status) {
        return ResponseEntity.ok(maintenanceService.getMaintenanceByStatus(organizationId, status));
    }
    
    @GetMapping("/priority")
    public ResponseEntity<List<MaintenanceResponse>> getMaintenanceByPriority(@PathVariable Long organizationId ,@RequestParam MaintenancePriority priority) {
        return ResponseEntity.ok(maintenanceService.getMaintenanceByPriority(organizationId, priority));
    }
    

    @PatchMapping("/{maintenanceId}")
    public ResponseEntity<MaintenanceResponse> updateMaintenanceRequest(@PathVariable Long organizationId, @PathVariable Long maintenanceId, @Valid  @RequestBody UpdateMaintenanceRequest request ){
        return ResponseEntity.ok(maintenanceService.updateMaintenanceRequest(organizationId, maintenanceId, request));
    }
}